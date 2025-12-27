import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceScheduleDto } from './dto/create-maintenance-schedule.dto';
import { UpdateMaintenanceScheduleDto } from './dto/update-maintenance-schedule.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateMaintenanceScheduleDto, currentUser: CurrentUserPayload) {
    // Verify asset exists and user has access
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: createDto.assetId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // Apply depot filter for Depot Managers
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (asset.depotId !== currentUser.depotId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Verify maintenance type exists
    const maintenanceType = await this.prisma.maintenanceType.findFirst({
      where: {
        id: createDto.maintenanceTypeId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!maintenanceType) {
      throw new NotFoundException('Maintenance type not found');
    }

    return this.prisma.maintenanceSchedule.create({
      data: {
        assetId: createDto.assetId,
        maintenanceTypeId: createDto.maintenanceTypeId,
        lastCompletedDate: createDto.lastCompletedDate
          ? new Date(createDto.lastCompletedDate)
          : null,
        nextDueDate: createDto.nextDueDate ? new Date(createDto.nextDueDate) : null,
        lastCompletedHours: createDto.lastCompletedHours,
        nextDueHours: createDto.nextDueHours,
        notes: createDto.notes,
      },
      include: {
        asset: {
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
        maintenanceType: true,
      },
    });
  }

  async findAll(currentUser: CurrentUserPayload, assetId?: string) {
    let where: any = {
      isActive: true,
      deletedAt: null,
    };

    if (assetId) {
      where.assetId = assetId;
    }

    // Apply depot filter via asset
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (!currentUser.depotId) {
        throw new ForbiddenException('Depot Manager must have depotId assigned');
      }
      where.asset = {
        depotId: currentUser.depotId,
        isActive: true,
        deletedAt: null,
      };
    }

    return this.prisma.maintenanceSchedule.findMany({
      where,
      include: {
        asset: {
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
        maintenanceType: true,
      },
      orderBy: {
        nextDueDate: 'asc',
      },
    });
  }

  async findOne(id: string, currentUser: CurrentUserPayload) {
    const schedule = await this.prisma.maintenanceSchedule.findFirst({
      where: {
        id,
        isActive: true,
        deletedAt: null,
      },
      include: {
        asset: {
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
        maintenanceType: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Maintenance schedule not found');
    }

    // Apply access control
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (schedule.asset.depotId !== currentUser.depotId) {
        throw new ForbiddenException('Access denied');
      }
    }

    return schedule;
  }

  async update(
    id: string,
    updateDto: UpdateMaintenanceScheduleDto,
    currentUser: CurrentUserPayload,
  ) {
    await this.findOne(id, currentUser);

    const updateData: any = {};

    if (updateDto.lastCompletedDate !== undefined) {
      updateData.lastCompletedDate = updateDto.lastCompletedDate
        ? new Date(updateDto.lastCompletedDate)
        : null;
    }
    if (updateDto.nextDueDate !== undefined) {
      updateData.nextDueDate = updateDto.nextDueDate ? new Date(updateDto.nextDueDate) : null;
    }
    if (updateDto.lastCompletedHours !== undefined) {
      updateData.lastCompletedHours = updateDto.lastCompletedHours;
    }
    if (updateDto.nextDueHours !== undefined) {
      updateData.nextDueHours = updateDto.nextDueHours;
    }
    if (updateDto.notes !== undefined) {
      updateData.notes = updateDto.notes;
    }

    return this.prisma.maintenanceSchedule.update({
      where: { id },
      data: updateData,
      include: {
        asset: {
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
        maintenanceType: true,
      },
    });
  }

  async remove(id: string, currentUser: CurrentUserPayload) {
    await this.findOne(id, currentUser);

    return this.prisma.maintenanceSchedule.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  async getTypes() {
    return this.prisma.maintenanceType.findMany({
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
