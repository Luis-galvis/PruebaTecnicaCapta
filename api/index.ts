import { WorkingDaysHandler } from '../src/utils/core/workingDaysHandler';
import type { QueryParameters } from '../src/types';

export default async function handler(req: any, res: any): Promise<void> {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Query params:', req.query);

  const corsHeaders = WorkingDaysHandler.getCorsHeaders();
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({
      error: "MethodNotAllowed",
      message: "Solo se permiten los métodos GET y POST"
    });
    return;
  }

  try {
    const params: QueryParameters = req.method === 'POST'
      ? typeof req.body === 'string'
        ? JSON.parse(req.body)
        : (req.body ?? {})
      : (req.query as QueryParameters);

    const result = await WorkingDaysHandler.processRequest(params);
    const statusCode = WorkingDaysHandler.getHttpStatusCode(result);

    res.status(statusCode).json(result);

  } catch (error) {
    console.error('Error inesperado en Vercel handler:', error);

    res.status(500).json({
      error: "InternalServerError",
      message: "Error interno del servidor"
    });
  }
}

export const config = {
  api: {
    bodyParser: true, 
  },
  maxDuration: 10,
};
