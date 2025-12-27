import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteSectionDto } from './dto/create-route-section.dto';
import { UpdateRouteSectionDto } from './dto/update-route-section.dto';
import { CreateDriverRouteAuthDto } from './dto/create-driver-route-auth.dto';
import { UpdateDriverRouteAuthDto } from './dto/update-driver-route-auth.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  // Route Sections
  async createSection(createDto: CreateRouteSectionDto, currentUser: CurrentUserPayload) {
    // Depot Manager can only create sections for their depot
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (!currentUser.depotId) {
        throw new ForbiddenException('Depot Manager must have depotId assigned');
      }
      createDto.depotId = currentUser.depotId;
    }

    return this.prisma.routeSection.create({
      data: {
        code: createDto.code,
        name: createDto.name,
        description: createDto.description,
        isPredefined: false,
        depotId: createDto.depotId,
      },
    });
  }

  async findAllSections(currentUser: CurrentUserPayload) {
    let where: any = {
      isActive: true,
      deletedAt: null,
    };

    // Depot Managers see predefined + their custom sections
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (!currentUser.depotId) {
        throw new ForbiddenException('Depot Manager must have depotId assigned');
      }
      where = {
        OR: [
          { isPredefined: true, depotId: null },
          { depotId: currentUser.depotId },
        ],
        isActive: true,
        deletedAt: null,
      };
    }

    return this.prisma.routeSection.findMany({
      where,
      orderBy: {
        code: 'asc',
      },
    });
  }

  async updateSection(
    id: string,
    updateDto: UpdateRouteSectionDto,
    currentUser: CurrentUserPayload,
  ) {
    const section = await this.prisma.routeSection.findFirst({
      where: {
        id,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!section) {
      throw new NotFoundException('Route section not found');
    }

    // Predefined sections cannot be edited
    if (section.isPredefined) {
      throw new ForbiddenException('Predefined route sections cannot be edited');
    }

    // Depot Managers can only edit their own sections
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (section.depotId !== currentUser.depotId) {
        throw new ForbiddenException('Access denied');
      }
    }

    return this.prisma.routeSection.update({
      where: { id },
      data: updateDto,
    });
  }

  async removeSection(id: string, currentUser: CurrentUserPayload) {
    const section = await this.prisma.routeSection.findFirst({
      where: {
        id,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!section) {
      throw new NotFoundException('Route section not found');
    }

    // Predefined sections cannot be deleted
    if (section.isPredefined) {
      throw new ForbiddenException('Predefined route sections cannot be deleted');
    }

    // Depot Managers can only delete their own sections
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (section.depotId !== currentUser.depotId) {
        throw new ForbiddenException('Access denied');
      }
    }

    return this.prisma.routeSection.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  // Driver Route Authorizations
  async createRouteAuth(createDto: CreateDriverRouteAuthDto, currentUser: CurrentUserPayload) {
    // Verify driver profile
    const driverProfile = await this.prisma.driverProfile.findFirst({
      where: {
        id: createDto.driverProfileId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!driverProfile) {
      throw new NotFoundException('Driver profile not found');
    }

    // Apply depot filter
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (driverProfile.depotId !== currentUser.depotId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Verify route section
    const routeSection = await this.prisma.routeSection.findFirst({
      where: {
        id: createDto.routeSectionId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!routeSection) {
      throw new NotFoundException('Route section not found');
    }

    if (new Date(createDto.expiryDate) <= new Date(createDto.authorizedDate)) {
      throw new BadRequestException('Expiry date must be after authorized date');
    }

    return this.prisma.driverRouteAuth.create({
      data: {
        driverProfileId: createDto.driverProfileId,
        routeSectionId: createDto.routeSectionId,
        authorizedDate: new Date(createDto.authorizedDate),
        expiryDate: new Date(createDto.expiryDate),
      },
      include: {
        routeSection: true,
        driverProfile: {
          select: {
            id: true,
            driverName: true,
            pfNumber: true,
          },
        },
      },
    });
  }

  async findAllRouteAuths(currentUser: CurrentUserPayload, driverProfileId?: string) {
    let where: any = {
      isActive: true,
      deletedAt: null,
    };

    if (driverProfileId) {
      where.driverProfileId = driverProfileId;
    }

    // Apply depot filter via driver profile
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (!currentUser.depotId) {
        throw new ForbiddenException('Depot Manager must have depotId assigned');
      }
      where.driverProfile = {
        depotId: currentUser.depotId,
        isActive: true,
        deletedAt: null,
      };
    }

    // Drivers can only see their own authorizations
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

      where.driverProfileId = driverProfile.id;
    }

    return this.prisma.driverRouteAuth.findMany({
      where,
      include: {
        routeSection: true,
        driverProfile: {
          select: {
            id: true,
            driverName: true,
            pfNumber: true,
            depot: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });
  }

  async findOneRouteAuth(id: string, currentUser: CurrentUserPayload) {
    const routeAuth = await this.prisma.driverRouteAuth.findFirst({
      where: {
        id,
        isActive: true,
        deletedAt: null,
      },
      include: {
        routeSection: true,
        driverProfile: {
          include: {
            depot: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!routeAuth) {
      throw new NotFoundException('Route authorization not found');
    }

    // Apply access control
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (routeAuth.driverProfile.depotId !== currentUser.depotId) {
        throw new ForbiddenException('Access denied');
      }
    }

    if (currentUser.role === UserRole.DRIVER) {
      const driverProfile = await this.prisma.driverProfile.findFirst({
        where: {
          userId: currentUser.id,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!driverProfile || driverProfile.id !== routeAuth.driverProfileId) {
        throw new ForbiddenException('Access denied');
      }
    }

    return routeAuth;
  }

  async updateRouteAuth(
    id: string,
    updateDto: UpdateDriverRouteAuthDto,
    currentUser: CurrentUserPayload,
  ) {
    await this.findOneRouteAuth(id, currentUser);

    const updateData: any = {};

    if (updateDto.authorizedDate !== undefined) {
      updateData.authorizedDate = new Date(updateDto.authorizedDate);
    }
    if (updateDto.expiryDate !== undefined) {
      updateData.expiryDate = new Date(updateDto.expiryDate);
    }

    if (updateData.expiryDate && updateData.authorizedDate) {
      if (updateData.expiryDate <= updateData.authorizedDate) {
        throw new BadRequestException('Expiry date must be after authorized date');
      }
    }

    return this.prisma.driverRouteAuth.update({
      where: { id },
      data: updateData,
      include: {
        routeSection: true,
        driverProfile: {
          select: {
            id: true,
            driverName: true,
            pfNumber: true,
          },
        },
      },
    });
  }

  async removeRouteAuth(id: string, currentUser: CurrentUserPayload) {
    await this.findOneRouteAuth(id, currentUser);

    return this.prisma.driverRouteAuth.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  async getExpiring() {
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);

    return this.prisma.driverRouteAuth.findMany({
      where: {
        expiryDate: {
          gte: now,
          lte: threeMonthsFromNow,
        },
        isActive: true,
        deletedAt: null,
      },
      include: {
        routeSection: true,
        driverProfile: {
          include: {
            depot: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });
  }
}
