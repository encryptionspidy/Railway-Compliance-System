import {
  Injectable,
  UnauthorizedException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { JwtService } from './jwt.service';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.createSuperAdminIfNotExists();
  }

  private async createSuperAdminIfNotExists() {
    const superAdminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const superAdminPassword = this.configService.get<string>('SUPER_ADMIN_PASSWORD');

    if (!superAdminEmail || !superAdminPassword) {
      this.logger.warn('Super Admin credentials not provided in environment variables');
      return;
    }

    const existingAdmin = await this.prisma.user.findUnique({
      where: { email: superAdminEmail },
    });

    if (!existingAdmin) {
      const passwordHash = await this.passwordService.hashPassword(superAdminPassword);
      await this.prisma.user.create({
        data: {
          email: superAdminEmail,
          passwordHash,
          role: UserRole.SUPER_ADMIN,
          depotId: null,
        },
      });
      this.logger.log(`Super Admin created: ${superAdminEmail}`);
    }
  }

  async login(loginDto: LoginDto) {
    this.logger.debug(`Login attempt for email: ${loginDto.email}`);

    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      this.logger.warn(`Login failed: User not found for email ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive || user.deletedAt) {
      this.logger.warn(`Login failed: User ${loginDto.email} is inactive or deleted`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      loginDto.password.trim(),
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password for user ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug(`Login successful for user: ${loginDto.email}`);

    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      depotId: user.depotId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.generateAccessToken(userPayload),
      this.jwtService.generateRefreshToken(userPayload),
    ]);

    return {
      accessToken,
      refreshToken,
      user: userPayload,
    };
  }

  async refreshToken(refreshToken: string) {
    const payload = await this.jwtService.verifyRefreshToken(refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        depotId: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      depotId: user.depotId,
    };

    const accessToken = await this.jwtService.generateAccessToken(userPayload);

    return {
      accessToken,
      user: userPayload,
    };
  }
}
