import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertClientSchema, insertCompanySchema, insertContactSchema,
  insertProviderSchema, insertCourtSchema, insertCaseTypeSchema, insertStudioRoleSchema,
  insertLegalCaseSchema, insertCaseRoleSchema, insertProcessStageSchema, insertDocumentSchema,
  insertActivitySchema, insertTaskSchema, insertAuditLogSchema, loginSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication middleware
  const authenticateUser = async (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "No autorizado" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }
    
    req.user = user;
    next();
  };

  // Helper function to log actions
  const logAction = async (userId: number, action: string, entityType?: string, entityId?: number, oldValues?: any, newValues?: any) => {
    await storage.createAuditLog({
      userId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress: "127.0.0.1", // In production, get from request
      userAgent: "MisCausas Client"
    });
  };

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }
      
      if (!user.isActive) {
        return res.status(401).json({ message: "Usuario desactivado" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });
      
      // Create session
      req.session.userId = user.id;
      
      await logAction(user.id, "login");
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: "Error en el inicio de sesión", error });
    }
  });

  app.post("/api/auth/logout", authenticateUser, async (req: any, res) => {
    try {
      await logAction(req.user.id, "logout");
      req.session.destroy();
      res.json({ message: "Sesión cerrada exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al cerrar sesión", error });
    }
  });

  app.get("/api/auth/me", authenticateUser, async (req: any, res) => {
    res.json({ user: { ...req.user, password: undefined } });
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", authenticateUser, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener estadísticas", error });
    }
  });

  app.get("/api/dashboard/urgent-tasks", authenticateUser, async (req: any, res) => {
    try {
      const urgentTasks = await storage.getUrgentTasks();
      res.json(urgentTasks);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener tareas urgentes", error });
    }
  });

  app.get("/api/dashboard/recent-cases", authenticateUser, async (req: any, res) => {
    try {
      const cases = await storage.getAllLegalCases();
      const recentCases = cases
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);
      res.json(recentCases);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener casos recientes", error });
    }
  });

  // Users routes
  app.get("/api/users", authenticateUser, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(user => ({ ...user, password: undefined }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener usuarios", error });
    }
  });

  app.get("/api/users/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Error al obtener usuario", error });
    }
  });

  app.post("/api/users", authenticateUser, async (req: any, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      await logAction(req.user.id, "create", "user", user.id, null, userData);
      res.status(201).json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Error al crear usuario", error });
    }
  });

  app.put("/api/users/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const oldUser = await storage.getUser(id);
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      await logAction(req.user.id, "update", "user", id, oldUser, userData);
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar usuario", error });
    }
  });

  app.delete("/api/users/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const oldUser = await storage.getUser(id);
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      await logAction(req.user.id, "delete", "user", id, oldUser, null);
      res.json({ message: "Usuario eliminado exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar usuario", error });
    }
  });

  // Roles routes
  app.get("/api/roles", authenticateUser, async (req: any, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener roles", error });
    }
  });

  // Clients routes
  app.get("/api/clients", authenticateUser, async (req: any, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener clientes", error });
    }
  });

  app.get("/api/clients/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener cliente", error });
    }
  });

  app.post("/api/clients", authenticateUser, async (req: any, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      await logAction(req.user.id, "create", "client", client.id, null, clientData);
      res.status(201).json(client);
    } catch (error) {
      res.status(400).json({ message: "Error al crear cliente", error });
    }
  });

  app.put("/api/clients/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.partial().parse(req.body);
      const oldClient = await storage.getClient(id);
      const client = await storage.updateClient(id, clientData);
      
      if (!client) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
      
      await logAction(req.user.id, "update", "client", id, oldClient, clientData);
      res.json(client);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar cliente", error });
    }
  });

  app.delete("/api/clients/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const oldClient = await storage.getClient(id);
      const deleted = await storage.deleteClient(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
      
      await logAction(req.user.id, "delete", "client", id, oldClient, null);
      res.json({ message: "Cliente eliminado exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar cliente", error });
    }
  });

  // Companies routes
  app.get("/api/companies", authenticateUser, async (req: any, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener empresas", error });
    }
  });

  app.post("/api/companies", authenticateUser, async (req: any, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      await logAction(req.user.id, "create", "company", company.id, null, companyData);
      res.status(201).json(company);
    } catch (error) {
      res.status(400).json({ message: "Error al crear empresa", error });
    }
  });

  // Contacts routes
  app.get("/api/contacts", authenticateUser, async (req: any, res) => {
    try {
      const contacts = await storage.getAllContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener contactos", error });
    }
  });

  app.post("/api/contacts", authenticateUser, async (req: any, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      await logAction(req.user.id, "create", "contact", contact.id, null, contactData);
      res.status(201).json(contact);
    } catch (error) {
      res.status(400).json({ message: "Error al crear contacto", error });
    }
  });

  // Providers routes
  app.get("/api/providers", authenticateUser, async (req: any, res) => {
    try {
      const providers = await storage.getAllProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener proveedores", error });
    }
  });

  app.post("/api/providers", authenticateUser, async (req: any, res) => {
    try {
      const providerData = insertProviderSchema.parse(req.body);
      const provider = await storage.createProvider(providerData);
      await logAction(req.user.id, "create", "provider", provider.id, null, providerData);
      res.status(201).json(provider);
    } catch (error) {
      res.status(400).json({ message: "Error al crear proveedor", error });
    }
  });

  // Courts routes
  app.get("/api/courts", authenticateUser, async (req: any, res) => {
    try {
      const courts = await storage.getAllCourts();
      res.json(courts);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener tribunales", error });
    }
  });

  app.post("/api/courts", authenticateUser, async (req: any, res) => {
    try {
      const courtData = insertCourtSchema.parse(req.body);
      const court = await storage.createCourt(courtData);
      await logAction(req.user.id, "create", "court", court.id, null, courtData);
      res.status(201).json(court);
    } catch (error) {
      res.status(400).json({ message: "Error al crear tribunal", error });
    }
  });

  // Case Types routes
  app.get("/api/case-types", authenticateUser, async (req: any, res) => {
    try {
      const caseTypes = await storage.getAllCaseTypes();
      res.json(caseTypes);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener tipos de causa", error });
    }
  });

  // Studio Roles routes
  app.get("/api/studio-roles", authenticateUser, async (req: any, res) => {
    try {
      const studioRoles = await storage.getAllStudioRoles();
      res.json(studioRoles);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener roles del estudio", error });
    }
  });

  // Legal Cases routes
  app.get("/api/legal-cases", authenticateUser, async (req: any, res) => {
    try {
      const legalCases = await storage.getAllLegalCases();
      res.json(legalCases);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener causas", error });
    }
  });

  app.get("/api/legal-cases/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const legalCase = await storage.getLegalCase(id);
      if (!legalCase) {
        return res.status(404).json({ message: "Causa no encontrada" });
      }
      res.json(legalCase);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener causa", error });
    }
  });

  app.post("/api/legal-cases", authenticateUser, async (req: any, res) => {
    try {
      const caseData = insertLegalCaseSchema.parse(req.body);
      const legalCase = await storage.createLegalCase(caseData);
      await logAction(req.user.id, "create", "legal_case", legalCase.id, null, caseData);
      res.status(201).json(legalCase);
    } catch (error) {
      res.status(400).json({ message: "Error al crear causa", error });
    }
  });

  app.put("/api/legal-cases/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const caseData = insertLegalCaseSchema.partial().parse(req.body);
      const oldCase = await storage.getLegalCase(id);
      const legalCase = await storage.updateLegalCase(id, caseData);
      
      if (!legalCase) {
        return res.status(404).json({ message: "Causa no encontrada" });
      }
      
      await logAction(req.user.id, "update", "legal_case", id, oldCase, caseData);
      res.json(legalCase);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar causa", error });
    }
  });

  // Tasks routes
  app.get("/api/tasks", authenticateUser, async (req: any, res) => {
    try {
      const { userId, caseId } = req.query;
      let tasks;
      
      if (userId) {
        tasks = await storage.getTasksByUser(parseInt(userId as string));
      } else if (caseId) {
        tasks = await storage.getTasksByCase(parseInt(caseId as string));
      } else {
        tasks = await storage.getTasksByUser(req.user.id);
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener tareas", error });
    }
  });

  app.post("/api/tasks", authenticateUser, async (req: any, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask({
        ...taskData,
        createdByUserId: req.user.id
      });
      await logAction(req.user.id, "create", "task", task.id, null, taskData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: "Error al crear tarea", error });
    }
  });

  app.put("/api/tasks/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const taskData = insertTaskSchema.partial().parse(req.body);
      const oldTask = await storage.getTask(id);
      const task = await storage.updateTask(id, taskData);
      
      if (!task) {
        return res.status(404).json({ message: "Tarea no encontrada" });
      }
      
      await logAction(req.user.id, "update", "task", id, oldTask, taskData);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar tarea", error });
    }
  });

  // Activities routes
  app.get("/api/activities", authenticateUser, async (req: any, res) => {
    try {
      const { caseId } = req.query;
      let activities;
      
      if (caseId) {
        activities = await storage.getActivitiesByCase(parseInt(caseId as string));
      } else {
        // Return recent activities for dashboard
        activities = (await storage.getAuditLogs(50)).slice(0, 10);
      }
      
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener actividades", error });
    }
  });

  app.post("/api/activities", authenticateUser, async (req: any, res) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity({
        ...activityData,
        userId: req.user.id
      });
      await logAction(req.user.id, "create", "activity", activity.id, null, activityData);
      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ message: "Error al crear actividad", error });
    }
  });

  // Documents routes
  app.get("/api/documents", authenticateUser, async (req: any, res) => {
    try {
      const { caseId } = req.query;
      let documents;
      
      if (caseId) {
        documents = await storage.getDocumentsByCase(parseInt(caseId as string));
      } else {
        documents = [];
      }
      
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener documentos", error });
    }
  });

  app.post("/api/documents", authenticateUser, async (req: any, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument({
        ...documentData,
        generatedByUserId: req.user.id
      });
      await logAction(req.user.id, "create", "document", document.id, null, documentData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ message: "Error al crear documento", error });
    }
  });

  // Audit logs routes
  app.get("/api/audit-logs", authenticateUser, async (req: any, res) => {
    try {
      const { limit } = req.query;
      const logs = await storage.getAuditLogs(limit ? parseInt(limit as string) : undefined);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener logs de auditoría", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
