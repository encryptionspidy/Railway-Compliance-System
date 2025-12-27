import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsScheduler } from './notifications.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { TimezoneModule } from '../common/timezone/timezone.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    SystemSettingsModule,
    TimezoneModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, NotificationsScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
