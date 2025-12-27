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
import { RoutesService } from './routes.service';
import { CreateRouteSectionDto } from './dto/create-route-section.dto';
import { UpdateRouteSectionDto } from './dto/update-route-section.dto';
import { CreateDriverRouteAuthDto } from './dto/create-driver-route-auth.dto';
import { UpdateDriverRouteAuthDto } from './dto/update-driver-route-auth.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('route-auth')
@UseGuards(JwtAuthGuard)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  // Route Sections
  @Post('sections')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  createSection(
    @Body() createDto: CreateRouteSectionDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.routesService.createSection(createDto, currentUser);
  }

  @Get('sections')
  findAllSections(@CurrentUser() currentUser: any) {
    return this.routesService.findAllSections(currentUser);
  }

  @Patch('sections/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  updateSection(
    @Param('id') id: string,
    @Body() updateDto: UpdateRouteSectionDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.routesService.updateSection(id, updateDto, currentUser);
  }

  @Delete('sections/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  removeSection(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.routesService.removeSection(id, currentUser);
  }

  // Driver Route Authorizations
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  createRouteAuth(
    @Body() createDto: CreateDriverRouteAuthDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.routesService.createRouteAuth(createDto, currentUser);
  }

  @Get()
  findAllRouteAuths(
    @Query('driverProfileId') driverProfileId: string | undefined,
    @CurrentUser() currentUser: any,
  ) {
    return this.routesService.findAllRouteAuths(currentUser, driverProfileId);
  }

  @Get('expiring')
  getExpiring() {
    return this.routesService.getExpiring();
  }

  @Get(':id')
  findOneRouteAuth(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.routesService.findOneRouteAuth(id, currentUser);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  updateRouteAuth(
    @Param('id') id: string,
    @Body() updateDto: UpdateDriverRouteAuthDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.routesService.updateRouteAuth(id, updateDto, currentUser);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  removeRouteAuth(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.routesService.removeRouteAuth(id, currentUser);
  }
}
