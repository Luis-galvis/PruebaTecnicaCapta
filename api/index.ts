import express from "express";
import cors from "cors";
import { WorkingDaysHandler } from "../src/utils/core/workingDaysHandler";
import type { QueryParameters } from "../src/types";

// --- handler original de Vercel ---
export default async function handler(req: any, res: any): Promise<void> {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("Query params:", req.query);

  const corsHeaders = WorkingDaysHandler.getCorsHeaders();
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({
      error: "MethodNotAllowed",
      message: "Solo se permite el método GET",
    });
    return;
  }

  try {
    const params: QueryParameters = req.query as QueryParameters;

    const result = await WorkingDaysHandler.processRequest(params);
    const statusCode = WorkingDaysHandler.getHttpStatusCode(result);

    res.status(statusCode).json(result);
  } catch (error) {
    console.error("Error inesperado en handler:", error);

    res.status(500).json({
      error: "InternalServerError",
      message: "Error interno del servidor",
    });
  }
}

// --- configuración de vercel ---
export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 30,
};

// --- modo local (Express) ---
if (require.main === module) {
  const app = express();
  const port = 3000;

  app.use(cors());

  app.get("/", async (req: express.Request, res: express.Response) => {
    await handler(req, res);
  });

  app.listen(port, () => {
    console.log(`🌸 Servidor local corriendo en http://localhost:${port}`);
  });
}
