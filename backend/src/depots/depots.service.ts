import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepotDto } from './dto/create-depot.dto';
import { UpdateDepotDto } from './dto/update-depot.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class DepotsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateDepotDto, currentUser: CurrentUserPayload) {
    return this.prisma.depot.create({
      data: {
        name: createDto.name,
        code: createDto.code,
        address: createDto.address,
      },
    });
  }

  async findAll(currentUser: CurrentUserPayload) {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return this.prisma.depot.findMany({
        where: {
          isActive: true,
          deletedAt: null,
        },
        orderBy: {
          name: 'asc',
        },
      });
    }

    // Depot Manager can only see their own depot
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (!currentUser.depotId) {
        throw new ForbiddenException('Depot Manager must have depotId assigned');
      }
      return this.prisma.depot.findMany({
        where: {
          id: currentUser.depotId,
          isActive: true,
          deletedAt: null,
        },
      });
    }

    return [];
  }

  async findOne(id: string, currentUser: CurrentUserPayload) {
    if (currentUser.role === UserRole.DEPOT_MANAGER) {
      if (currentUser.depotId !== id) {
        throw new ForbiddenException('Access denied');
      }
    }

    const depot = await this.prisma.depot.findFirst({
      where: {
        id,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!depot) {
      throw new NotFoundException('Depot not found');
    }

    return depot;
  }

  async update(
    id: string,
    updateDto: UpdateDepotDto,
    currentUser: CurrentUserPayload,
  ) {
    await this.findOne(id, currentUser);

    return this.prisma.depot.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string, currentUser: CurrentUserPayload) {
    await this.findOne(id, currentUser);

    return this.prisma.depot.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }
}
