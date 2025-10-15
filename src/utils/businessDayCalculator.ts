import { DateUtils } from './dateUtils';
import { HolidayUtils } from './holidayUtils';
import type { BusinessDayResult } from '../types';

export class BusinessDayCalculator {

  static async addBusinessDays(startDate: Date, days: number): Promise<Date> {
    if (days === 0) return new Date(startDate);
    
    let current = new Date(startDate);
    let daysAdded = 0;

    while (daysAdded < days) {
      current.setDate(current.getDate() + 1);
      if (await HolidayUtils.isBusinessDay(current)) {
        daysAdded++;
      }
    }

    const [h, m, s] = [startDate.getHours(), startDate.getMinutes(), startDate.getSeconds()];
    current.setHours(h, m, s, 0);
    
    return current;
  }

  static async addBusinessHours(startDate: Date, hours: number): Promise<Date> {
    if (hours === 0) return new Date(startDate);

    let current = new Date(startDate);
    let hoursRemaining = hours;

    current = await DateUtils.adjustToNearestWorkingTime(current);

    while (hoursRemaining > 0) {
      if (!(await HolidayUtils.isBusinessDay(current))) {
        current = await this.moveToNextBusinessDay(current);
        continue;
      }

      const hour = current.getHours();
      const minute = current.getMinutes();
      let availableHours = 0;

      if (hour < 12) {
        availableHours = 12 - hour - (minute / 60);
      }
      else if (hour >= 13 && hour < 17) {
        availableHours = 17 - hour - (minute / 60);
      }
      else if (hour >= 12 && hour < 13) {
        current.setHours(13, 0, 0, 0);
        continue;
      }
      else {
        current = await this.moveToNextBusinessDay(current);
        continue;
      }

      if (hoursRemaining <= availableHours) {
        const minutesToAdd = Math.round(hoursRemaining * 60);
        current.setTime(current.getTime() + minutesToAdd * 60 * 1000);
        hoursRemaining = 0;
      } else {
        hoursRemaining -= availableHours;

        if (hour < 12) {
          current.setHours(13, 0, 0, 0);
        } else {
          current = await this.moveToNextBusinessDay(current);
        }
      }
    }

    return current;
  }

  private static async moveToNextBusinessDay(date: Date): Promise<Date> {
    let next = new Date(date);
    next.setDate(next.getDate() + 1);
    next.setHours(8, 0, 0, 0);

    while (!(await HolidayUtils.isBusinessDay(next))) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  static async calculateBusinessDate(
    startDate: Date, 
    days: number, 
    hours: number
  ): Promise<BusinessDayResult> {
    const adjustedStartDate = await DateUtils.adjustToNearestWorkingTime(startDate);
    let result = new Date(adjustedStartDate);

    if (days > 0) result = await this.addBusinessDays(result, days);
    if (hours > 0) result = await this.addBusinessHours(result, hours);

    return {
      resultDate: result,
      adjustedStartDate,
      daysProcessed: days,
      hoursProcessed: hours
    };
  }

  static validateBusinessParameters(days: number, hours: number): string | null {
    if (days < 0) return "El parámetro 'days' debe ser un número entero positivo o cero";
    if (hours < 0) return "El parámetro 'hours' debe ser un número entero positivo o cero";
    if (days === 0 && hours === 0)
      return "Al menos uno de los parámetros 'days' o 'hours' debe ser mayor que cero";
    return null; 
  }
}
