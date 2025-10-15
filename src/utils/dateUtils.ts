import { HolidayUtils } from './holidayUtils';

export class DateUtils {
  private static readonly COLOMBIA_OFFSET_MINUTES = -5 * 60; 

  static utcToColombia(utcDate: Date): Date {
    const utcTime = utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000);
    return new Date(utcTime + (this.COLOMBIA_OFFSET_MINUTES * 60000));
  }

  static colombiaToUtc(colombiaDate: Date): Date {
    const localTime = colombiaDate.getTime();
    const utcTime = localTime - (this.COLOMBIA_OFFSET_MINUTES * 60000);
    return new Date(utcTime);
  }

  static getCurrentColombiaTime(): Date {
    return this.utcToColombia(new Date());
  }

  static isWeekday(date: Date): boolean {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  }

  static toISOStringZ(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  static async adjustToNearestWorkingTime(date: Date): Promise<Date> {
    let adjusted = new Date(date);
    
    if (!(await HolidayUtils.isBusinessDay(adjusted))) {
      while (!(await HolidayUtils.isBusinessDay(adjusted))) {
        adjusted.setDate(adjusted.getDate() - 1);
      }
      adjusted.setHours(17, 0, 0, 0);
      return adjusted;
    }

    const hour = adjusted.getHours();

    if (hour < 8) {
      adjusted.setDate(adjusted.getDate() - 1);
      while (!(await HolidayUtils.isBusinessDay(adjusted))) {
        adjusted.setDate(adjusted.getDate() - 1);
      }
      adjusted.setHours(17, 0, 0, 0);
    } else if (hour >= 17) {
      adjusted.setHours(17, 0, 0, 0);
    } else if (hour >= 12 && hour < 13) {
      adjusted.setHours(12, 0, 0, 0);
    }

    return adjusted;
  }

  static isWorkingHour(date: Date): boolean {
    const hour = date.getHours();
    return (hour >= 8 && hour < 12) || (hour >= 13 && hour < 17);
  }

  static getAvailableHoursInDay(date: Date): number {
    if (!this.isWeekday(date) || !this.isWorkingHour(date)) {
      return 0;
    }

    const hour = date.getHours();
    const minute = date.getMinutes();
    
    if (hour < 12) {
      return 12 - hour - (minute / 60);
    } else if (hour >= 13 && hour < 17) {
      return 17 - hour - (minute / 60);
    }
    
    return 0;
  }
}
