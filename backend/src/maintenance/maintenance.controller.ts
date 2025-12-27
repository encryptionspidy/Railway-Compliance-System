import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceScheduleDto } from './dto/create-maintenance-schedule.dto';
import { UpdateMaintenanceScheduleDto } from './dto/update-maintenance-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  create(
    @Body() createDto: CreateMaintenanceScheduleDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.maintenanceService.create(createDto, currentUser);
  }

  @Get()
  findAll(
    @Query('assetId') assetId: string | undefined,
    @CurrentUser() currentUser: any,
  ) {
    return this.maintenanceService.findAll(currentUser, assetId);
  }

  @Get('types')
  getTypes() {
    return this.maintenanceService.getTypes();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.maintenanceService.findOne(id, currentUser);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMaintenanceScheduleDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.maintenanceService.update(id, updateDto, currentUser);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  remove(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.maintenanceService.remove(id, currentUser);
  }
}
