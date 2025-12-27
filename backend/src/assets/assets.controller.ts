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
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  create(@Body() createDto: CreateAssetDto, @CurrentUser() currentUser: any) {
    return this.assetsService.create(createDto, currentUser);
  }

  @Get()
  findAll(@CurrentUser() currentUser: any) {
    return this.assetsService.findAll(currentUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.assetsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAssetDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.assetsService.update(id, updateDto, currentUser);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPOT_MANAGER)
  remove(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.assetsService.remove(id, currentUser);
  }
}
