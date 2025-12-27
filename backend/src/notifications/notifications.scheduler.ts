import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { TimezoneService } from '../common/timezone/timezone.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private systemSettings: SystemSettingsService,
    private timezoneService: TimezoneService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleComplianceDueSoonNotifications() {
    this.logger.log('Running daily compliance due soon check...');

    try {
      const notificationDays = await this.systemSettings.getSettingAsNumber(
        'NOTIFICATION_BEFORE_DAYS',
      );

      const now = this.timezoneService.getCurrentUtc();
      const notificationDate = new Date(now);
      notificationDate.setDate(now.getDate() + notificationDays);

      // Find compliances due within notification window
      const compliances = await this.prisma.driverCompliance.findMany({
        where: {
          dueDate: {
            gte: now,
            lte: notificationDate,
          },
          isActive: true,
          deletedAt: null,
        },
        include: {
          complianceType: true,
          driverProfile: true,
        },
      });

      this.logger.log(`Found ${compliances.length} compliances due soon`);

      for (const compliance of compliances) {
        await this.notificationsService.sendComplianceDueSoonNotification(
          compliance.driverProfileId,
          compliance.id,
          compliance.complianceType.name,
          compliance.dueDate,
        );
      }

      this.logger.log('Compliance due soon notifications sent');
    } catch (error) {
      this.logger.error('Error in compliance due soon scheduler:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleComplianceOverdueNotifications() {
    this.logger.log('Running daily compliance overdue check...');

    try {
      const now = this.timezoneService.getCurrentUtc();

      // Find overdue compliances
      const compliances = await this.prisma.driverCompliance.findMany({
        where: {
          dueDate: {
            lt: now,
          },
          isActive: true,
          deletedAt: null,
        },
        include: {
          complianceType: true,
          driverProfile: true,
        },
      });

      this.logger.log(`Found ${compliances.length} overdue compliances`);

      for (const compliance of compliances) {
        await this.notificationsService.sendComplianceOverdueNotification(
          compliance.driverProfileId,
          compliance.id,
          compliance.complianceType.name,
          compliance.dueDate,
        );
      }

      this.logger.log('Compliance overdue notifications sent');
    } catch (error) {
      this.logger.error('Error in compliance overdue scheduler:', error);
    }
  }
}
