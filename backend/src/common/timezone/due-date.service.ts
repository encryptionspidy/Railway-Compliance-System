import { Injectable } from '@nestjs/common';
import { addMonths, addDays, addHours } from 'date-fns';

@Injectable()
export class DueDateService {
  /**
   * Calculate next due date based on done date and frequency in months
   */
  calculateNextDueDate(doneDate: Date, frequencyMonths: number): Date {
    return addMonths(doneDate, frequencyMonths);
  }

  /**
   * Calculate next due date based on done date and frequency in days
   */
  calculateNextDueDateDays(doneDate: Date, frequencyDays: number): Date {
    return addDays(doneDate, frequencyDays);
  }

  /**
   * Calculate next due hours based on completed hours and frequency
   */
  calculateNextDueHours(completedHours: number, frequencyHours: number): number {
    return completedHours + frequencyHours;
  }

  /**
   * Calculate next due date for usage-based maintenance
   */
  calculateNextDueDateFromHours(
    lastCompletedHours: number,
    nextDueHours: number,
    currentHours: number,
  ): Date | null {
    if (currentHours >= nextDueHours) {
      // Already due
      return new Date();
    }

    // Estimate date based on usage rate (this is approximate)
    // In real implementation, you might want to track usage rate
    return null;
  }
}
