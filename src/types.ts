export interface ApiResponse {
  date: string;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface QueryParameters {
  days?: string;
  hours?: string;
  date?: string;
}

export interface ValidatedParameters {
  days: number;
  hours: number;
  startDate: Date;
}

export interface WorkingHours {
  start: number;      // 8am
  lunchStart: number; // 12pm
  lunchEnd: number;   // 1pm
  end: number;        // 5pm
}

export interface TimeCalculation {
  date: Date;
  isWorkingDay: boolean;
  isWorkingHour: boolean;
}

export interface HolidayCache {
  holidays: string[];
  lastFetch: number;
  isValid: boolean;
}

export type BusinessDayResult = {
  resultDate: Date;
  adjustedStartDate: Date;
  daysProcessed: number;
  hoursProcessed: number;
};