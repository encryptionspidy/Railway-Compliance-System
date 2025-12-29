import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DriverProfilesModule } from './driver-profiles/driver-profiles.module';
import { DepotsModule } from './depots/depots.module';
import { ComplianceModule } from './compliance/compliance.module';
import { RoutesModule } from './routes/routes.module';
import { AssetsModule } from './assets/assets.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { TimezoneModule } from './common/timezone/timezone.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DriverProfilesModule,
    DepotsModule,
    ComplianceModule,
    RoutesModule,
    AssetsModule,
    MaintenanceModule,
    SystemSettingsModule,
    NotificationsModule,
    AuditModule,
    TimezoneModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
