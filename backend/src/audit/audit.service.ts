import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

export interface AuditContext {
  userId: string;
  depotId: string | null;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    context: AuditContext,
    entityType: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValue?: any,
    newValue?: any,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: context.userId,
          depotId: context.depotId,
          entityType,
          entityId,
          action,
          oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
      });
    } catch (error) {
      // Don't throw - audit logging should not break the main flow
      console.error('Failed to log audit:', error);
    }
  }

  async getAuditLogs(
    currentUser: CurrentUserPayload,
    filters?: {
      entityType?: string;
      entityId?: string;
      depotId?: string;
      userId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: any = {};

    // Super Admin can see all, Depot Managers only their depot
    if (currentUser.role !== 'SUPER_ADMIN') {
      if (currentUser.depotId) {
        where.depotId = currentUser.depotId;
      } else {
        // Depot Manager without depotId can't see any audit logs
        return [];
      }
    }

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters?.entityId) {
      where.entityId = filters.entityId;
    }
    if (filters?.depotId) {
      where.depotId = filters.depotId;
    }
    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.action) {
      where.action = filters.action;
    }
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.auditLog.findMany({
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
        createdAt: 'desc',
      },
      take: 1000,
    });
  }
}
