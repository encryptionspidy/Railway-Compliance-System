import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';

@Injectable()
export class SystemSettingsService implements OnModuleInit {
  private settingsCache: Map<string, { value: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.initializeDefaultSettings();
  }

  private async initializeDefaultSettings() {
    const defaults = [
      {
        key: 'DUE_SOON_THRESHOLD_DAYS',
        value: '7',
        description: 'Number of days before due date to show amber warning',
      },
      {
        key: 'NOTIFICATION_BEFORE_DAYS',
        value: '2',
        description: 'Number of days before due date to send notification',
      },
      {
        key: 'TIMEZONE',
        value: 'Asia/Kolkata',
        description: 'Default timezone for date display',
      },
    ];

    for (const setting of defaults) {
      await this.prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting,
      });
    }
  }

  private async getSettingFromDb(key: string): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    return setting?.value || null;
  }

  async getSetting(key: string): Promise<string> {
    const cached = this.settingsCache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    const value = await this.getSettingFromDb(key);
    if (value === null) {
      throw new NotFoundException(`Setting ${key} not found`);
    }

    this.settingsCache.set(key, { value, timestamp: now });
    return value;
  }

  async getSettingAsNumber(key: string): Promise<number> {
    const value = await this.getSetting(key);
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(`Setting ${key} is not a valid number`);
    }
    return num;
  }

  async getAllSettings() {
    return this.prisma.systemSetting.findMany({
      orderBy: {
        key: 'asc',
      },
    });
  }

  async updateSetting(
    key: string,
    updateDto: UpdateSystemSettingDto,
    updatedBy: string,
  ) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting ${key} not found`);
    }

    const updated = await this.prisma.systemSetting.update({
      where: { key },
      data: {
        value: updateDto.value,
        description: updateDto.description,
        updatedBy,
      },
    });

    // Invalidate cache
    this.settingsCache.delete(key);

    return updated;
  }

  async createSetting(createDto: CreateSystemSettingDto, createdBy: string) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key: createDto.key },
    });

    if (existing) {
      throw new Error(`Setting ${createDto.key} already exists`);
    }

    return this.prisma.systemSetting.create({
      data: {
        key: createDto.key,
        value: createDto.value,
        description: createDto.description,
        updatedBy: createdBy,
      },
    });
  }
}
