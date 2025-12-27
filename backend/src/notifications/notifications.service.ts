import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { EmailService } from './email.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private systemSettings: SystemSettingsService,
    private emailService: EmailService,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    relatedEntityType?: string,
    relatedEntityId?: string,
  ) {
    try {
      return await this.prisma.notification.create({
        data: {
          userId,
          title,
          message,
          relatedEntityType,
          relatedEntityId,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create notification for user ${userId}:`, error);
      throw error;
    }
  }

  async sendComplianceDueSoonNotification(
    driverProfileId: string,
    complianceId: string,
    complianceType: string,
    dueDate: Date,
  ) {
    const driverProfile = await this.prisma.driverProfile.findUnique({
      where: { id: driverProfileId },
      include: {
        user: true,
        depot: {
          include: {
            users: {
              where: {
                role: UserRole.DEPOT_MANAGER,
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!driverProfile) {
      return;
    }

    const title = `${complianceType} Due Soon`;
    const message = `Your ${complianceType} compliance is due on ${dueDate.toLocaleDateString()}. Please ensure it is completed on time.`;

    // Notify driver
    try {
      await this.createNotification(
        driverProfile.userId,
        title,
        message,
        'DriverCompliance',
        complianceId,
      );
      await this.emailService.sendEmail(
        driverProfile.user.email,
        title,
        message,
      );
    } catch (error) {
      this.logger.error(`Failed to notify driver ${driverProfile.userId}:`, error);
      // Continue even if email fails - in-app notification must succeed
    }

    // Notify depot manager
    for (const manager of driverProfile.depot.users) {
      try {
        await this.createNotification(
          manager.id,
          `Driver ${driverProfile.driverName} - ${title}`,
          `Driver ${driverProfile.driverName} (PF: ${driverProfile.pfNumber}) has ${complianceType} due on ${dueDate.toLocaleDateString()}.`,
          'DriverCompliance',
          complianceId,
        );
        await this.emailService.sendEmail(manager.email, title, message);
      } catch (error) {
        this.logger.error(`Failed to notify manager ${manager.id}:`, error);
      }
    }
  }

  async sendComplianceOverdueNotification(
    driverProfileId: string,
    complianceId: string,
    complianceType: string,
    dueDate: Date,
  ) {
    const driverProfile = await this.prisma.driverProfile.findUnique({
      where: { id: driverProfileId },
      include: {
        user: true,
        depot: {
          include: {
            users: {
              where: {
                role: UserRole.DEPOT_MANAGER,
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!driverProfile) {
      return;
    }

    const title = `${complianceType} Overdue`;
    const message = `Your ${complianceType} compliance was due on ${dueDate.toLocaleDateString()} and is now overdue. Please complete it immediately.`;

    // Notify driver
    try {
      await this.createNotification(
        driverProfile.userId,
        title,
        message,
        'DriverCompliance',
        complianceId,
      );
      await this.emailService.sendEmail(
        driverProfile.user.email,
        title,
        message,
      );
    } catch (error) {
      this.logger.error(`Failed to notify driver ${driverProfile.userId}:`, error);
    }

    // Notify depot manager
    for (const manager of driverProfile.depot.users) {
      try {
        await this.createNotification(
          manager.id,
          `URGENT: Driver ${driverProfile.driverName} - ${title}`,
          `Driver ${driverProfile.driverName} (PF: ${driverProfile.pfNumber}) has ${complianceType} that was due on ${dueDate.toLocaleDateString()} and is now OVERDUE.`,
          'DriverCompliance',
          complianceId,
        );
        await this.emailService.sendEmail(manager.email, title, message);
      } catch (error) {
        this.logger.error(`Failed to notify manager ${manager.id}:`, error);
      }
    }

    // Notify Super Admin (escalation)
    const superAdmins = await this.prisma.user.findMany({
      where: {
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        deletedAt: null,
      },
    });

    for (const admin of superAdmins) {
      try {
        await this.createNotification(
          admin.id,
          `ESCALATION: ${driverProfile.driverName} - ${title}`,
          `Driver ${driverProfile.driverName} (PF: ${driverProfile.pfNumber}) from ${driverProfile.depot.name} has ${complianceType} that is OVERDUE since ${dueDate.toLocaleDateString()}.`,
          'DriverCompliance',
          complianceId,
        );
        await this.emailService.sendEmail(admin.email, title, message);
      } catch (error) {
        this.logger.error(`Failed to notify super admin ${admin.id}:`, error);
      }
    }
  }

  async getUserNotifications(userId: string, isRead?: boolean) {
    const where: any = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }
}
