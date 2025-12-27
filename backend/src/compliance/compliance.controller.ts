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
import { ComplianceService } from './compliance.service';
import { CreateDriverComplianceDto } from './dto/create-driver-compliance.dto';
import { UpdateDriverComplianceDto } from './dto/update-driver-compliance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('driver-compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  create(
    @Body() createDto: CreateDriverComplianceDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.complianceService.create(createDto, currentUser);
  }

  @Get()
  findAll(
    @Query('driverProfileId') driverProfileId: string | undefined,
    @CurrentUser() currentUser: any,
  ) {
    return this.complianceService.findAll(currentUser, driverProfileId);
  }

  @Get('types')
  getTypes() {
    return this.complianceService.getTypes();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.complianceService.findOne(id, currentUser);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDriverComplianceDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.complianceService.update(id, updateDto, currentUser);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  remove(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.complianceService.remove(id, currentUser);
  }
}
