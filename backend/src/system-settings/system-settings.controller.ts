import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('system-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  getAllSettings() {
    return this.systemSettingsService.getAllSettings();
  }

  @Get(':key')
  getSetting(@Param('key') key: string) {
    return this.systemSettingsService.getSetting(key);
  }

  @Post()
  createSetting(
    @Body() createDto: CreateSystemSettingDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.systemSettingsService.createSetting(createDto, currentUser.id);
  }

  @Patch(':key')
  updateSetting(
    @Param('key') key: string,
    @Body() updateDto: UpdateSystemSettingDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.systemSettingsService.updateSetting(key, updateDto, currentUser.id);
  }
}
