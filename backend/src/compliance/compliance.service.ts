import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateDriverComplianceDto } from './dto/create-driver-compliance.dto';
import { UpdateDriverComplianceDto } from './dto/update-driver-compliance.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class ComplianceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createDto: CreateDriverComplianceDto, currentUser: CurrentUserPayload) {
    // Verify driver profile exists and user has access
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

    // Apply depot filter for Depot Managers
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (driverProfile.depotId !== currentUser.depotId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Verify compliance type exists
    const complianceType = await this.prisma.complianceType.findFirst({
      where: {
        id: createDto.complianceTypeId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!complianceType) {
      throw new NotFoundException('Compliance type not found');
    }

    return this.prisma.driverCompliance.create({
      data: {
        driverProfileId: createDto.driverProfileId,
        complianceTypeId: createDto.complianceTypeId,
        doneDate: new Date(createDto.doneDate),
        dueDate: new Date(createDto.dueDate),
        frequencyMonths: createDto.frequencyMonths,
        notes: createDto.notes,
      },
      include: {
        complianceType: true,
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

  async findAll(currentUser: CurrentUserPayload, driverProfileId?: string) {
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

    // Drivers can only see their own compliances
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

    return this.prisma.driverCompliance.findMany({
      where,
      include: {
        complianceType: true,
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
        dueDate: 'asc',
      },
    });
  }

  async findOne(id: string, currentUser: CurrentUserPayload) {
    const compliance = await this.prisma.driverCompliance.findFirst({
      where: {
        id,
        isActive: true,
        deletedAt: null,
      },
      include: {
        complianceType: true,
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

    if (!compliance) {
      throw new NotFoundException('Compliance not found');
    }

    // Apply access control
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (compliance.driverProfile.depotId !== currentUser.depotId) {
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

      if (!driverProfile || driverProfile.id !== compliance.driverProfileId) {
        throw new ForbiddenException('Access denied');
      }
    }

    return compliance;
  }

  async update(
    id: string,
    updateDto: UpdateDriverComplianceDto,
    currentUser: CurrentUserPayload,
  ) {
    const existingCompliance = await this.findOne(id, currentUser);

    // Check if this is an override operation (changing doneDate, dueDate, or frequencyMonths)
    const isOverride =
      (updateDto.doneDate !== undefined && updateDto.doneDate !== existingCompliance.doneDate.toISOString().split('T')[0]) ||
      (updateDto.dueDate !== undefined && updateDto.dueDate !== existingCompliance.dueDate.toISOString().split('T')[0]) ||
      (updateDto.frequencyMonths !== undefined && updateDto.frequencyMonths !== existingCompliance.frequencyMonths);

    // Super Admin override requires reason and justification
    if (isOverride && currentUser.role === UserRole.SUPER_ADMIN) {
      if (!updateDto.overrideReason || !updateDto.overrideJustification) {
        throw new ForbiddenException('Override requires reason and justification');
      }
    }

    const updateData: any = {};

    if (updateDto.doneDate !== undefined) {
      updateData.doneDate = new Date(updateDto.doneDate);
    }
    if (updateDto.dueDate !== undefined) {
      updateData.dueDate = new Date(updateDto.dueDate);
    }
    if (updateDto.frequencyMonths !== undefined) {
      updateData.frequencyMonths = updateDto.frequencyMonths;
    }
    if (updateDto.notes !== undefined) {
      updateData.notes = updateDto.notes;
    }

    const updatedCompliance = await this.prisma.driverCompliance.update({
      where: { id },
      data: updateData,
      include: {
        complianceType: true,
        driverProfile: {
          select: {
            id: true,
            driverName: true,
            pfNumber: true,
            depotId: true,
          },
        },
      },
    });

    // Audit log with override details
    await this.auditService.log(
      {
        userId: currentUser.id,
        depotId: currentUser.depotId || updatedCompliance.driverProfile.depotId,
      },
      'DriverCompliance',
      id,
      'UPDATE',
      {
        ...existingCompliance,
        overrideReason: updateDto.overrideReason,
        overrideJustification: updateDto.overrideJustification,
      },
      updatedCompliance,
    );

    return updatedCompliance;
  }

  async remove(id: string, currentUser: CurrentUserPayload) {
    await this.findOne(id, currentUser);

    return this.prisma.driverCompliance.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  async getTypes() {
    return this.prisma.complianceType.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
