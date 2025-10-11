import axios from 'axios';
import type { HolidayCache } from '../types';
export class HolidayUtils {
  private static cache: HolidayCache = {
    holidays: [],
    lastFetch: 0,
    isValid: false
  };
  
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
  private static readonly HOLIDAYS_URL = 'https://content.capta.co/Recruitment/WorkingDays.json';
  private static readonly REQUEST_TIMEOUT = 5000; // 5 segundos

  // Fallback con festivos 2025-2026
  private static readonly FALLBACK_HOLIDAYS: string[] = [
    "2025-01-01", "2025-01-06", "2025-03-24", "2025-04-17", "2025-04-18",
    "2025-05-01", "2025-06-02", "2025-06-23", "2025-06-30", "2025-08-07", 
    "2025-08-18", "2025-10-13", "2025-11-03", "2025-11-17", "2025-12-08", 
    "2025-12-25", "2026-01-01", "2026-01-12", "2026-03-23", "2026-04-02", 
    "2026-04-03", "2026-05-01", "2026-05-18", "2026-06-08", "2026-06-15", 
    "2026-06-29", "2026-07-20", "2026-08-07", "2026-08-17", "2026-10-12", 
    "2026-11-02", "2026-11-16", "2026-12-08", "2026-12-25"
  ];


  static async getHolidays(): Promise<string[]> {
    const now = Date.now();
    
    if (this.cache.isValid && (now - this.cache.lastFetch) < this.CACHE_DURATION) {
      return this.cache.holidays;
    }

    try {
      console.log('Obteniendo festivos desde API externa...');
      const response = await axios.get<string[]>(this.HOLIDAYS_URL, {
        timeout: this.REQUEST_TIMEOUT,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WorkingDaysAPI/1.0'
        }
      });
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        this.cache.holidays = response.data;
        this.cache.lastFetch = now;
        this.cache.isValid = true;
        console.log(`Festivos cargados: ${response.data.length} fechas`);
        return this.cache.holidays;
      } else {
        throw new Error('Respuesta inválida de la API de festivos');
      }
      
    } catch (error) {
      console.warn('Error al obtener festivos, usando fallback:', error instanceof Error ? error.message : 'Error desconocido');
      
      // Usar fallback si no tenemos cache o si es muy antiguo
      if (!this.cache.isValid) {
        this.cache.holidays = this.FALLBACK_HOLIDAYS;
        this.cache.lastFetch = now;
        this.cache.isValid = true;
      }
      
      return this.cache.holidays;
    }
  }

  static async isHoliday(date: Date): Promise<boolean> {
    const holidays = await this.getHolidays();
    const dateString = date.toISOString().substring(0, 10); // YYYY-MM-DD
    return holidays.includes(dateString);
  }

  static async isBusinessDay(date: Date): Promise<boolean> {
    if (!this.isWeekday(date)) {
      return false;
    }
    
    return !(await this.isHoliday(date));
  }


  private static isWeekday(date: Date): boolean {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  }


  static async getNextBusinessDay(date: Date): Promise<Date> {
    let nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (!(await this.isBusinessDay(nextDay))) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  }


  static clearCache(): void {
    this.cache = {
      holidays: [],
      lastFetch: 0,
      isValid: false
    };
  }
}