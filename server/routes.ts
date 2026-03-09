import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./image";
import { setupAdminRoutes } from "./admin";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);
  setupAdminRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);
  await import("./seed").then((m) => m.seedDatabase());
  return httpServer;
}
