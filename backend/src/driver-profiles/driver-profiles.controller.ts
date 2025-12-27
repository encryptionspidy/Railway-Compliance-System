import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DriverProfilesService } from './driver-profiles.service';
import { CreateDriverProfileDto } from './dto/create-driver-profile.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('driver-profiles')
@UseGuards(JwtAuthGuard)
export class DriverProfilesController {
  constructor(private readonly driverProfilesService: DriverProfilesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  create(
    @Body() createDto: CreateDriverProfileDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.driverProfilesService.create(createDto, currentUser);
  }

  @Get()
  findAll(@CurrentUser() currentUser: any) {
    return this.driverProfilesService.findAll(currentUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.driverProfilesService.findOne(id, currentUser);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDriverProfileDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.driverProfilesService.update(id, updateDto, currentUser);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  remove(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.driverProfilesService.remove(id, currentUser);
  }

  @Get(':id/compliance')
  getCompliances(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.driverProfilesService.getCompliances(id, currentUser);
  }

  @Get(':id/route-auth')
  getRouteAuthorizations(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.driverProfilesService.getRouteAuthorizations(id, currentUser);
  }
}
