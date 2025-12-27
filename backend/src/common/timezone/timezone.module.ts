import { Module } from '@nestjs/common';
import { TimezoneService } from './timezone.service';
import { DueDateService } from './due-date.service';
import { SystemSettingsModule } from '../../system-settings/system-settings.module';

@Module({
  imports: [SystemSettingsModule],
  providers: [TimezoneService, DueDateService],
  exports: [TimezoneService, DueDateService],
})
export class TimezoneModule {}
