import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.health.path, async (req, res) => {
    const status = await storage.getHealth();
    res.json({ status });
  });

  return httpServer;
}
