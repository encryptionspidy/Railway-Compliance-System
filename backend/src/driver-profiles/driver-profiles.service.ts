import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { CreateDriverProfileDto } from './dto/create-driver-profile.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class DriverProfilesService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
  ) {}

  async create(
    createDto: CreateDriverProfileDto,
    currentUser: CurrentUserPayload,
  ) {
    // Check if pfNumber already exists (only active profiles)
    const existingProfile = await this.prisma.driverProfile.findFirst({
      where: {
        pfNumber: createDto.pfNumber,
        isActive: true,
        deletedAt: null,
      },
    });

    if (existingProfile) {
      throw new ConflictException('Driver profile with this PF number already exists');
    }

    // Check if email already exists (only active users)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: createDto.email,
        isActive: true,
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check for soft-deleted user with same email - we need to handle this
    const deletedUser = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });

    // Check for soft-deleted profile with same PF number
    const deletedProfile = await this.prisma.driverProfile.findUnique({
      where: { pfNumber: createDto.pfNumber },
    });

    // Depot Manager can only create drivers in their depot
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (createDto.depotId !== currentUser.depotId) {
        throw new ForbiddenException('Cannot create driver in another depot');
      }
    }

    // Verify depot exists
    const depot = await this.prisma.depot.findUnique({
      where: { id: createDto.depotId },
    });

    if (!depot || !depot.isActive || depot.deletedAt) {
      throw new NotFoundException('Depot not found');
    }

    // Hash the password
    const passwordHash = await this.passwordService.hashPassword(createDto.password.trim());

    let user;
    let driverProfile;

    // If there's a deleted user with same email, reactivate it
    if (deletedUser && !deletedUser.isActive) {
      user = await this.prisma.user.update({
        where: { id: deletedUser.id },
        data: {
          passwordHash,
          role: UserRole.DRIVER,
          depotId: createDto.depotId,
          isActive: true,
          deletedAt: null,
        },
      });

      // Check if there's a deleted profile linked to this user or with same PF
      if (deletedProfile && !deletedProfile.isActive) {
        // Reactivate the profile
        driverProfile = await this.prisma.driverProfile.update({
          where: { id: deletedProfile.id },
          data: {
            userId: user.id,
            driverName: createDto.driverName,
            designation: createDto.designation,
            basicPay: createDto.basicPay,
            dateOfAppointment: new Date(createDto.dateOfAppointment),
            dateOfEntry: new Date(createDto.dateOfEntry),
            depotId: createDto.depotId,
            isActive: true,
            deletedAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
            depot: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        });
      } else {
        // Create new profile for reactivated user
        driverProfile = await this.prisma.driverProfile.create({
          data: {
            userId: user.id,
            pfNumber: createDto.pfNumber,
            driverName: createDto.driverName,
            designation: createDto.designation,
            basicPay: createDto.basicPay,
            dateOfAppointment: new Date(createDto.dateOfAppointment),
            dateOfEntry: new Date(createDto.dateOfEntry),
            depotId: createDto.depotId,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
            depot: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        });
      }
    } else if (deletedProfile && !deletedProfile.isActive) {
      // Profile exists but was deleted, user might be different - create new user
      user = await this.prisma.user.create({
        data: {
          email: createDto.email,
          passwordHash,
          role: UserRole.DRIVER,
          depotId: createDto.depotId,
        },
      });

      // Reactivate the profile with new user
      driverProfile = await this.prisma.driverProfile.update({
        where: { id: deletedProfile.id },
        data: {
          userId: user.id,
          driverName: createDto.driverName,
          designation: createDto.designation,
          basicPay: createDto.basicPay,
          dateOfAppointment: new Date(createDto.dateOfAppointment),
          dateOfEntry: new Date(createDto.dateOfEntry),
          depotId: createDto.depotId,
          isActive: true,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          depot: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });
    } else {
      // No deleted records, create fresh
      user = await this.prisma.user.create({
        data: {
          email: createDto.email,
          passwordHash,
          role: UserRole.DRIVER,
          depotId: createDto.depotId,
        },
      });

      driverProfile = await this.prisma.driverProfile.create({
        data: {
          userId: user.id,
          pfNumber: createDto.pfNumber,
          driverName: createDto.driverName,
          designation: createDto.designation,
          basicPay: createDto.basicPay,
          dateOfAppointment: new Date(createDto.dateOfAppointment),
          dateOfEntry: new Date(createDto.dateOfEntry),
          depotId: createDto.depotId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          depot: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });
    }

    return driverProfile;
  }

  async findAll(currentUser: CurrentUserPayload) {
    let where: any = {
      isActive: true,
      deletedAt: null,
    };

    // Apply depot filter for Depot Managers
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (!currentUser.depotId) {
        throw new ForbiddenException('Depot Manager must have depotId assigned');
      }
      where.depotId = currentUser.depotId;
    }

    // Drivers can only see their own profile
    if (currentUser.role === UserRole.DRIVER) {
      const driverProfile = await this.prisma.driverProfile.findFirst({
        where: {
          userId: currentUser.id,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!driverProfile) {
        return [];
      }

      where.id = driverProfile.id;
    }

    return this.prisma.driverProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        depot: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        driverName: 'asc',
      },
    });
  }

  async findOne(id: string, currentUser: CurrentUserPayload) {
    let where: any = {
      id,
      isActive: true,
      deletedAt: null,
    };

    // Apply depot filter for Depot Managers
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (!currentUser.depotId) {
        throw new ForbiddenException('Depot Manager must have depotId assigned');
      }
      where.depotId = currentUser.depotId;
    }

    // Drivers can only see their own profile
    if (currentUser.role === UserRole.DRIVER) {
      const driverProfile = await this.prisma.driverProfile.findFirst({
        where: {
          userId: currentUser.id,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!driverProfile || driverProfile.id !== id) {
        throw new ForbiddenException('Access denied');
      }
    }

    const driverProfile = await this.prisma.driverProfile.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        depot: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!driverProfile) {
      throw new NotFoundException('Driver profile not found');
    }

    return driverProfile;
  }

  async update(
    id: string,
    updateDto: UpdateDriverProfileDto,
    currentUser: CurrentUserPayload,
  ) {
    // First verify access
    await this.findOne(id, currentUser);

    const updateData: any = {};

    if (updateDto.driverName !== undefined) {
      updateData.driverName = updateDto.driverName;
    }
    if (updateDto.designation !== undefined) {
      updateData.designation = updateDto.designation;
    }
    if (updateDto.basicPay !== undefined) {
      updateData.basicPay = updateDto.basicPay;
    }
    if (updateDto.dateOfAppointment !== undefined) {
      updateData.dateOfAppointment = new Date(updateDto.dateOfAppointment);
    }
    if (updateDto.dateOfEntry !== undefined) {
      updateData.dateOfEntry = new Date(updateDto.dateOfEntry);
    }

    return this.prisma.driverProfile.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        depot: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async remove(id: string, currentUser: CurrentUserPayload) {
    // First verify access
    await this.findOne(id, currentUser);

    // Soft delete
    return this.prisma.driverProfile.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  async getCompliances(id: string, currentUser: CurrentUserPayload) {
    await this.findOne(id, currentUser);

    return this.prisma.driverCompliance.findMany({
      where: {
        driverProfileId: id,
        isActive: true,
        deletedAt: null,
      },
      include: {
        complianceType: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async getRouteAuthorizations(id: string, currentUser: CurrentUserPayload) {
    await this.findOne(id, currentUser);

    return this.prisma.driverRouteAuth.findMany({
      where: {
        driverProfileId: id,
        isActive: true,
        deletedAt: null,
      },
      include: {
        routeSection: true,
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });
  }
}
