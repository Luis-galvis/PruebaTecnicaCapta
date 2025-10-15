import { DateUtils } from '../dateUtils';
import { BusinessDayCalculator } from '../businessDayCalculator';
import type { QueryParameters, ValidatedParameters, ApiResponse, ApiError } from '../../types';

export class WorkingDaysHandler {

  static validateParameters(query: QueryParameters): ValidatedParameters | ApiError {
    const { days, hours, date } = query;

    if (!days && !hours) {
      return {
        error: "InvalidParameters",
        message: "Al menos uno de los parámetros 'days' o 'hours' debe estar presente"
      };
    }

    let parsedDays = 0;
    let parsedHours = 0;

    if (days !== undefined && days !== null && days !== '') {
      parsedDays = parseInt(String(days), 10);
      if (isNaN(parsedDays) || parsedDays < 0) {
        return {
          error: "InvalidParameters", 
          message: "El parámetro 'days' debe ser un número entero positivo o cero"
        };
      }
    }

    if (hours !== undefined && hours !== null && hours !== '') {
      parsedHours = parseInt(String(hours), 10);
      if (isNaN(parsedHours) || parsedHours < 0) {
        return {
          error: "InvalidParameters",
          message: "El parámetro 'hours' debe ser un número entero positivo o cero"
        };
      }
    }

    if (parsedDays === 0 && parsedHours === 0) {
      return {
        error: "InvalidParameters",
        message: "Al menos uno de los parámetros debe ser mayor que cero"
      };
    }

    let startDate: Date;
    
    if (date) {
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
      if (!isoRegex.test(String(date))) {
        return {
          error: "InvalidParameters",
          message: "El parámetro 'date' debe estar en formato ISO 8601 con sufijo Z (ejemplo: 2025-01-01T10:00:00Z)"
        };
      }
      
      try {
        const utcDate = new Date(String(date));
        if (isNaN(utcDate.getTime())) {
          throw new Error("Fecha inválida");
        }
        startDate = DateUtils.utcToColombia(utcDate);
      } catch (error) {
        return {
          error: "InvalidParameters", 
          message: "La fecha proporcionada es inválida"
        };
      }
    } else {
      startDate = DateUtils.getCurrentColombiaTime();
    }

    return {
      days: parsedDays,
      hours: parsedHours, 
      startDate
    };
  }

  
  static async processRequest(query: QueryParameters): Promise<ApiResponse | ApiError> {
    try {
      const validation = this.validateParameters(query);
      
      if ('error' in validation) {
        return validation;
      }

      const { days, hours, startDate } = validation;

      console.log(`Procesando: days=${days}, hours=${hours}, startDate=${startDate.toISOString()}`);

      const result = await BusinessDayCalculator.calculateBusinessDate(
        startDate,
        days, 
        hours
      );

      const utcResult = DateUtils.colombiaToUtc(result.resultDate);

      console.log(`Resultado: ${utcResult.toISOString()}`);

      const response: ApiResponse = {
        date: DateUtils.toISOStringZ(utcResult)
      };

      return response;

    } catch (error) {
      console.error('Error procesando solicitud:', error);
      
      const errorResponse: ApiError = {
        error: "InternalServerError",
        message: "Error interno del servidor"
      };
      
      return errorResponse;
    }
  }

  static getHttpStatusCode(response: ApiResponse | ApiError): number {
    if ('error' in response) {
      switch (response.error) {
        case 'InvalidParameters':
          return 400;
        case 'MethodNotAllowed':
          return 405;
        case 'InternalServerError':
        default:
          return 500;
      }
    }
    return 200;
  }

  static getCorsHeaders(): Record<string, string> {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };
  }
}
