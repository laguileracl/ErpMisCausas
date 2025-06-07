import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-minimal";
import { insertUserSchema } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: "Account disabled" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

      res.json({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: user.roleId
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req, res) => {
    // For now, return null (not authenticated)
    res.json({ user: null });
  });

  // Dashboard route
  app.get("/api/dashboard", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Users routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        roleId: user.roleId,
        createdAt: user.createdAt
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        roleId: user.roleId,
        createdAt: user.createdAt
      };
      
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Placeholder routes for other entities
  app.get("/api/clients", (req, res) => res.json([]));
  app.get("/api/companies", (req, res) => res.json([]));
  app.get("/api/contacts", (req, res) => res.json([]));
  app.get("/api/providers", (req, res) => res.json([]));
  app.get("/api/courts", (req, res) => res.json([]));
  app.get("/api/case-types", (req, res) => res.json([]));
  app.get("/api/studio-roles", (req, res) => res.json([]));
  app.get("/api/legal-cases", (req, res) => res.json([]));
  app.get("/api/tasks", (req, res) => res.json([]));
  app.get("/api/activities", (req, res) => res.json([]));
  app.get("/api/documents", (req, res) => res.json([]));
  app.get("/api/audit-logs", (req, res) => res.json([]));

  return httpServer;
}