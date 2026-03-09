import type { Express } from "express";
import { db } from "./db";
import { users, conversations, messages } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const isAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated() || req.user.isAdmin !== "true") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export function setupAdminRoutes(app: Express) {
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      }).from(users).orderBy(desc(users.createdAt));
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/conversations", isAdmin, async (req, res) => {
    try {
      const allConversations = await db
        .select({
          id: conversations.id,
          userId: conversations.userId,
          title: conversations.title,
          createdAt: conversations.createdAt,
          userEmail: users.email,
          userName: users.firstName,
        })
        .from(conversations)
        .leftJoin(users, eq(conversations.userId, users.id))
        .orderBy(desc(conversations.createdAt));
      res.json(allConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/admin/conversations/:id/messages", isAdmin, async (req, res) => {
    try {
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, parseInt(req.params.id)))
        .orderBy(messages.createdAt);
      res.json(conversationMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.delete("/api/admin/conversations/:id", isAdmin, async (req, res) => {
    try {
      await db.delete(conversations).where(eq(conversations.id, parseInt(req.params.id)));
      res.json({ message: "Conversation deleted" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      await db.delete(users).where(eq(users.id, req.params.id));
      res.json({ message: "User deleted" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.patch("/api/admin/users/:id/toggle-admin", isAdmin, async (req, res) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.params.id));
      const newAdminStatus = user.isAdmin === "true" ? "false" : "true";
      await db.update(users).set({ isAdmin: newAdminStatus }).where(eq(users.id, req.params.id));
      res.json({ message: "User admin status updated" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
}
