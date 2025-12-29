import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private auditService: AuditService,
  ) {}

  async create(createDto: CreateUserDto, currentUser: any) {
    // Check for existing ACTIVE user
    const existingActiveUser = await this.prisma.user.findFirst({
      where: {
        email: createDto.email,
        isActive: true,
        deletedAt: null,
      }
    });
    if (existingActiveUser) throw new ConflictException('User with this email already exists');

    // Check for soft-deleted user with same email
    const deletedUser = await this.prisma.user.findUnique({ where: { email: createDto.email } });

    const hashedPassword = await this.passwordService.hashPassword(createDto.password.trim());

    let user;
    if (deletedUser && !deletedUser.isActive) {
      // Reactivate the deleted user
      user = await this.prisma.user.update({
        where: { id: deletedUser.id },
        data: {
          passwordHash: hashedPassword,
          role: createDto.role,
          depotId: createDto.depotId,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true, email: true, role: true, depotId: true, isActive: true, createdAt: true, depot: { select: { id: true, name: true, code: true } } },
      });
    } else {
      // Create new user
      user = await this.prisma.user.create({
        data: { email: createDto.email, passwordHash: hashedPassword, role: createDto.role, depotId: createDto.depotId },
        select: { id: true, email: true, role: true, depotId: true, isActive: true, createdAt: true, depot: { select: { id: true, name: true, code: true } } },
      });
    }

    await this.auditService.log({ userId: currentUser.id, depotId: currentUser.depotId }, 'User', user.id, 'CREATE', null, user);
    return user;
  }

  async findAll(currentUser: any, role?: UserRole) {
    const where: any = { isActive: true };
    if (role) where.role = role;
    if (currentUser.role === UserRole.DEPOT_MANAGER) where.depotId = currentUser.depotId;

    return this.prisma.user.findMany({
      where,
      select: { id: true, email: true, role: true, depotId: true, isActive: true, createdAt: true, depot: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, depotId: true, isActive: true, createdAt: true, depot: { select: { id: true, name: true, code: true } }, driverProfile: true },
    });
    if (!user || !user.isActive) throw new NotFoundException('User not found');
    if (currentUser.role === UserRole.DEPOT_MANAGER && user.depotId !== currentUser.depotId) throw new ForbiddenException('Access denied');
    return user;
  }

  async getCurrentUserProfile(currentUser: any) {
    return this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, email: true, role: true, depotId: true, isActive: true, createdAt: true, depot: { select: { id: true, name: true, code: true } }, driverProfile: true },
    });
  }

  async getDepotAdmins(currentUser: any) {
    return this.prisma.user.findMany({
      where: { role: UserRole.DEPOT_MANAGER, isActive: true },
      select: { id: true, email: true, role: true, depotId: true, isActive: true, createdAt: true, depot: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, updateDto: UpdateUserDto, currentUser: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !user.isActive) throw new NotFoundException('User not found');

    const data: any = {};
    if (updateDto.email) data.email = updateDto.email;
    if (updateDto.role) data.role = updateDto.role;
    if (updateDto.depotId !== undefined) data.depotId = updateDto.depotId;
    if (updateDto.password) data.passwordHash = await this.passwordService.hashPassword(updateDto.password);

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, depotId: true, isActive: true, createdAt: true, depot: { select: { id: true, name: true, code: true } } },
    });

    await this.auditService.log({ userId: currentUser.id, depotId: currentUser.depotId }, 'User', id, 'UPDATE', user, updated);
    return updated;
  }

  async remove(id: string, currentUser: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !user.isActive) throw new NotFoundException('User not found');

    const deleted = await this.prisma.user.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
    await this.auditService.log({ userId: currentUser.id, depotId: currentUser.depotId }, 'User', id, 'DELETE', user, null);
    return { message: 'User deleted successfully' };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email }, include: { depot: true } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { depot: true, driverProfile: true } });
  }
}
