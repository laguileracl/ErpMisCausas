import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-full";
import { 
  insertUserSchema, insertClientSchema, insertCompanySchema, insertContactSchema,
  insertCompanyContactSchema, insertProviderSchema, insertCourtSchema, insertCaseTypeSchema, 
  insertStudioRoleSchema, insertLegalCaseSchema, insertCaseRoleSchema, insertProcessStageSchema, 
  insertDocumentSchema, insertActivitySchema, insertTaskSchema, insertAuditLogSchema
} from "../shared/schema";

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

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: "login",
        entityType: "user",
        entityId: user.id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || null
      });

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

  // Clients routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      console.error("Clients error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Get client error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      console.error("Create client error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, clientData);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Update client error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClient(id);
      if (!success) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete client error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Companies routes
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Companies error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Get company error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/companies/:id/contacts", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const companiesWithContacts = await storage.getCompaniesWithContacts(id);
      if (companiesWithContacts.length === 0) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(companiesWithContacts[0].contacts);
    } catch (error) {
      console.error("Get company contacts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      console.error("Create company error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const companyData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(id, companyData);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Update company error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCompany(id);
      if (!success) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete company error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Contacts routes
  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Contacts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getContact(id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Get contact error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/contacts/:id/companies", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contactsWithCompanies = await storage.getContactsWithCompanies(id);
      if (contactsWithCompanies.length === 0) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contactsWithCompanies[0].companies);
    } catch (error) {
      console.error("Get contact companies error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Create contact error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contactData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, contactData);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Update contact error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteContact(id);
      if (!success) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete contact error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Company-Contact relationships routes
  app.get("/api/company-contacts", async (req, res) => {
    try {
      const { companyId, contactId } = req.query;
      
      if (companyId) {
        const relationships = await storage.getCompanyContactsByCompany(parseInt(companyId as string));
        res.json(relationships);
      } else if (contactId) {
        const relationships = await storage.getCompanyContactsByContact(parseInt(contactId as string));
        res.json(relationships);
      } else {
        res.status(400).json({ error: "Either companyId or contactId required" });
      }
    } catch (error) {
      console.error("Company contacts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/company-contacts", async (req, res) => {
    try {
      const relationshipData = insertCompanyContactSchema.parse(req.body);
      const relationship = await storage.createCompanyContact(relationshipData);
      res.status(201).json(relationship);
    } catch (error) {
      console.error("Create company contact error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/company-contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const relationshipData = insertCompanyContactSchema.partial().parse(req.body);
      const relationship = await storage.updateCompanyContact(id, relationshipData);
      if (!relationship) {
        return res.status(404).json({ error: "Relationship not found" });
      }
      res.json(relationship);
    } catch (error) {
      console.error("Update company contact error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/company-contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCompanyContact(id);
      if (!success) {
        return res.status(404).json({ error: "Relationship not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete company contact error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Providers routes
  app.get("/api/providers", async (req, res) => {
    try {
      const providers = await storage.getAllProviders();
      res.json(providers);
    } catch (error) {
      console.error("Providers error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/providers", async (req, res) => {
    try {
      const providerData = insertProviderSchema.parse(req.body);
      const provider = await storage.createProvider(providerData);
      res.status(201).json(provider);
    } catch (error) {
      console.error("Create provider error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Courts routes
  app.get("/api/courts", async (req, res) => {
    try {
      const courts = await storage.getAllCourts();
      res.json(courts);
    } catch (error) {
      console.error("Courts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/courts", async (req, res) => {
    try {
      const courtData = insertCourtSchema.parse(req.body);
      const court = await storage.createCourt(courtData);
      res.status(201).json(court);
    } catch (error) {
      console.error("Create court error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Case Types routes
  app.get("/api/case-types", async (req, res) => {
    try {
      const caseTypes = await storage.getAllCaseTypes();
      res.json(caseTypes);
    } catch (error) {
      console.error("Case types error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Studio Roles routes
  app.get("/api/studio-roles", async (req, res) => {
    try {
      const studioRoles = await storage.getAllStudioRoles();
      res.json(studioRoles);
    } catch (error) {
      console.error("Studio roles error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Legal Cases routes
  app.get("/api/legal-cases", async (req, res) => {
    try {
      const legalCases = await storage.getAllLegalCases();
      res.json(legalCases);
    } catch (error) {
      console.error("Legal cases error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/legal-cases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const legalCase = await storage.getLegalCase(id);
      if (!legalCase) {
        return res.status(404).json({ error: "Legal case not found" });
      }
      res.json(legalCase);
    } catch (error) {
      console.error("Get legal case error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/legal-cases", async (req, res) => {
    try {
      const legalCaseData = insertLegalCaseSchema.parse(req.body);
      const legalCase = await storage.createLegalCase(legalCaseData);
      res.status(201).json(legalCase);
    } catch (error) {
      console.error("Create legal case error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/legal-cases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const legalCaseData = insertLegalCaseSchema.partial().parse(req.body);
      const legalCase = await storage.updateLegalCase(id, legalCaseData);
      if (!legalCase) {
        return res.status(404).json({ error: "Legal case not found" });
      }
      res.json(legalCase);
    } catch (error) {
      console.error("Update legal case error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const { userId, legalCaseId, urgent } = req.query;
      let tasks;

      if (userId) {
        tasks = await storage.getTasksByUser(parseInt(userId as string));
      } else if (legalCaseId) {
        tasks = await storage.getTasksByCase(parseInt(legalCaseId as string));
      } else if (urgent === 'true') {
        tasks = await storage.getUrgentTasks();
      } else {
        tasks = await storage.getOverdueTasks();
      }

      res.json(tasks);
    } catch (error) {
      console.error("Tasks error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const taskData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(id, taskData);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    try {
      const { legalCaseId } = req.query;
      let activities;

      if (legalCaseId) {
        activities = await storage.getActivitiesByCase(parseInt(legalCaseId as string));
      } else {
        activities = [];
      }

      res.json(activities);
    } catch (error) {
      console.error("Activities error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      console.error("Create activity error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Documents routes
  app.get("/api/documents", async (req, res) => {
    try {
      const { legalCaseId } = req.query;
      let documents: any[] = [];

      if (legalCaseId) {
        documents = await storage.getDocumentsByCase(parseInt(legalCaseId as string));
      }

      res.json(documents);
    } catch (error) {
      console.error("Documents error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Create document error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Audit Logs routes
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const { 
        userId, 
        action, 
        entityType, 
        startDate, 
        endDate, 
        limit = "50", 
        offset = "0" 
      } = req.query;

      const filters: any = {};
      if (userId) filters.userId = parseInt(userId as string);
      if (action) filters.action = action as string;
      if (entityType) filters.entityType = entityType as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const auditLogs = await storage.getAuditLogs(filters);
      const totalCount = await storage.getAuditLogCount(filters);
      
      res.json({ auditLogs, totalCount });
    } catch (error) {
      console.error("Error getting audit logs:", error);
      res.status(500).json({ error: "Failed to get audit logs" });
    }
  });

  app.get("/api/audit-logs/entity/:entityType/:entityId", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const auditLogs = await storage.getAuditLogsByEntity(entityType, parseInt(entityId));
      res.json(auditLogs);
    } catch (error) {
      console.error("Error getting audit logs by entity:", error);
      res.status(500).json({ error: "Failed to get audit logs by entity" });
    }
  });

  app.get("/api/audit-logs/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const auditLogs = await storage.getAuditLogsByUser(parseInt(userId));
      res.json(auditLogs);
    } catch (error) {
      console.error("Error getting audit logs by user:", error);
      res.status(500).json({ error: "Failed to get audit logs by user" });
    }
  });

  // Helper function to create audit log
  const createAuditLog = async (
    userId: number | null,
    action: string,
    entityType: string | null,
    entityId: number | null,
    oldValues: any = null,
    newValues: any = null,
    ipAddress: string | null = null,
    userAgent: string | null = null
  ) => {
    try {
      await storage.createAuditLog({
        userId,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        ipAddress,
        userAgent
      });
    } catch (error) {
      console.error("Error creating audit log:", error);
    }
  };

  return httpServer;
}