import { Injectable } from '@nestjs/common';
import { SystemSettingsService } from '../../system-settings/system-settings.service';
import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

@Injectable()
export class TimezoneService {
  constructor(private systemSettings: SystemSettingsService) {}

  /**
   * Get the configured timezone from system settings
   */
  async getTimezone(): Promise<string> {
    try {
      return await this.systemSettings.getSetting('TIMEZONE');
    } catch {
      return 'Asia/Kolkata'; // Default fallback
    }
  }

  /**
   * Convert UTC date to local timezone string for display
   */
  async formatForDisplay(date: Date): Promise<string> {
    const timezone = await this.getTimezone();
    return formatInTimeZone(date, timezone, 'yyyy-MM-dd HH:mm:ss');
  }

  /**
   * Convert local date string to UTC Date object
   */
  async parseFromLocal(dateString: string): Promise<Date> {
    const timezone = await this.getTimezone();
    const localDate = new Date(dateString);
    return zonedTimeToUtc(localDate, timezone);
  }

  /**
   * Get current date in UTC
   */
  getCurrentUtc(): Date {
    return new Date();
  }

  /**
   * Check if a date is overdue (in UTC)
   */
  isOverdue(dueDate: Date): boolean {
    const now = this.getCurrentUtc();
    return dueDate < now;
  }

  /**
   * Check if a date is due soon (in UTC)
   */
  async isDueSoon(dueDate: Date): Promise<boolean> {
    const thresholdDays = await this.systemSettings.getSettingAsNumber('DUE_SOON_THRESHOLD_DAYS');
    const now = this.getCurrentUtc();
    const thresholdDate = new Date(now);
    thresholdDate.setDate(now.getDate() + thresholdDays);
    return dueDate <= thresholdDate;
  }

  /**
   * Get status color for a due date
   */
  async getStatusColor(dueDate: Date): Promise<'green' | 'amber' | 'red'> {
    if (this.isOverdue(dueDate)) {
      return 'red';
    }
    if (await this.isDueSoon(dueDate)) {
      return 'amber';
    }
    return 'green';
  }
}
