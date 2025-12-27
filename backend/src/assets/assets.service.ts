import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateAssetDto, currentUser: CurrentUserPayload) {
    // Depot Manager can only create assets in their depot
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (createDto.depotId !== currentUser.depotId) {
        throw new ForbiddenException('Cannot create asset in another depot');
      }
    }

    // Verify depot exists
    const depot = await this.prisma.depot.findFirst({
      where: {
        id: createDto.depotId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!depot) {
      throw new NotFoundException('Depot not found');
    }

    return this.prisma.asset.create({
      data: {
        assetNumber: createDto.assetNumber,
        assetType: createDto.assetType,
        depotId: createDto.depotId,
        currentHours: createDto.currentHours,
        lastServiceDate: createDto.lastServiceDate
          ? new Date(createDto.lastServiceDate)
          : null,
      },
      include: {
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

    return this.prisma.asset.findMany({
      where,
      include: {
        depot: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        assetNumber: 'asc',
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

    const asset = await this.prisma.asset.findFirst({
      where,
      include: {
        depot: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  async update(
    id: string,
    updateDto: UpdateAssetDto,
    currentUser: CurrentUserPayload,
  ) {
    await this.findOne(id, currentUser);

    const updateData: any = {};

    if (updateDto.assetNumber !== undefined) {
      updateData.assetNumber = updateDto.assetNumber;
    }
    if (updateDto.currentHours !== undefined) {
      updateData.currentHours = updateDto.currentHours;
    }
    if (updateDto.lastServiceDate !== undefined) {
      updateData.lastServiceDate = updateDto.lastServiceDate
        ? new Date(updateDto.lastServiceDate)
        : null;
    }

    return this.prisma.asset.update({
      where: { id },
      data: updateData,
      include: {
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
    await this.findOne(id, currentUser);

    return this.prisma.asset.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }
}
