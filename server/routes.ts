import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-minimal";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { 
  insertUserSchema, insertClientSchema, insertCompanySchema, insertContactSchema,
  insertProviderSchema, insertCourtSchema, insertCaseTypeSchema, insertStudioRoleSchema,
  insertLegalCaseSchema, insertCaseRoleSchema, insertProcessStageSchema, insertDocumentSchema,
  insertActivitySchema, insertTaskSchema, insertAuditLogSchema, loginSchema,
  insertNotificationSchema, insertUserNotificationPreferenceSchema
} from "@shared/schema";
import { notificationService } from "./notification-service";
import { securityService } from "./security-service";
import { accountingService } from "./accounting-service";
import { cuentaProvisoriaService } from "./cuenta-provisoria-service";
import { pdfGeneratorService } from "./pdf-generator-service";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Configure multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });
  
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

  // CSV Import/Export routes
  app.post("/api/import/clients", authenticateUser, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No se encontró archivo CSV" });
      }

      const csvData = req.file.buffer.toString('utf-8');
      const records = parse(csvData, { columns: true, skip_empty_lines: true });
      
      const results = { success: 0, errors: [] as any[] };
      
      for (const record of records) {
        try {
          const clientData = {
            name: record.name || record.nombre,
            type: record.type || record.tipo || 'individual',
            rut: record.rut,
            email: record.email || null,
            phone: record.phone || record.telefono || null,
            address: record.address || record.direccion || null,
            city: record.city || record.ciudad || null,
            region: record.region || null,
            notes: record.notes || record.notas || null,
            legalRepresentative: record.legalRepresentative || record.representanteLegal || null,
            isActive: record.isActive !== 'false' && record.activo !== 'false'
          };

          const client = await storage.createClient(clientData);
          await logAction(req.user.id, 'create', 'client', client.id, null, client);
          results.success++;
        } catch (error: any) {
          results.errors.push({ 
            row: record, 
            error: error.message 
          });
        }
      }

      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Error al procesar archivo CSV", error });
    }
  });

  app.post("/api/import/companies", authenticateUser, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No se encontró archivo CSV" });
      }

      const csvData = req.file.buffer.toString('utf-8');
      const records = parse(csvData, { columns: true, skip_empty_lines: true });
      
      const results = { success: 0, errors: [] as any[] };
      
      for (const record of records) {
        try {
          const companyData = {
            name: record.name || record.nombre,
            type: record.type || record.tipo || 'empresa',
            rut: record.rut,
            email: record.email || null,
            phone: record.phone || record.telefono || null,
            address: record.address || record.direccion || null,
            city: record.city || record.ciudad || null,
            region: record.region || null,
            notes: record.notes || record.notas || null,
            legalRepresentative: record.legalRepresentative || record.representanteLegal || null,
            isActive: record.isActive !== 'false' && record.activo !== 'false'
          };

          const company = await storage.createCompany(companyData);
          await logAction(req.user.id, 'create', 'company', company.id, null, company);
          results.success++;
        } catch (error: any) {
          results.errors.push({ 
            row: record, 
            error: error.message 
          });
        }
      }

      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Error al procesar archivo CSV", error });
    }
  });

  app.post("/api/import/contacts", authenticateUser, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No se encontró archivo CSV" });
      }

      const csvData = req.file.buffer.toString('utf-8');
      const records = parse(csvData, { columns: true, skip_empty_lines: true });
      
      const results = { success: 0, errors: [] as any[] };
      
      for (const record of records) {
        try {
          const contactData = {
            firstName: record.firstName || record.nombre,
            lastName: record.lastName || record.apellido,
            email: record.email || null,
            phone: record.phone || record.telefono || null,
            position: record.position || record.cargo || null,
            notes: record.notes || record.notas || null,
            companyId: record.companyId ? parseInt(record.companyId) : null,
            isActive: record.isActive !== 'false' && record.activo !== 'false'
          };

          const contact = await storage.createContact(contactData);
          await logAction(req.user.id, 'create', 'contact', contact.id, null, contact);
          results.success++;
        } catch (error: any) {
          results.errors.push({ 
            row: record, 
            error: error.message 
          });
        }
      }

      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Error al procesar archivo CSV", error });
    }
  });

  // CSV Template downloads
  app.get("/api/templates/clients", authenticateUser, async (req: any, res) => {
    const template = [
      ['name', 'type', 'rut', 'email', 'phone', 'address', 'city', 'region', 'notes', 'legalRepresentative', 'isActive'],
      ['Juan Pérez', 'individual', '12345678-9', 'juan@email.com', '+56912345678', 'Av. Principal 123', 'Santiago', 'Metropolitana', 'Cliente VIP', 'Juan Pérez', 'true'],
      ['María García', 'individual', '98765432-1', 'maria@email.com', '+56987654321', 'Calle Secundaria 456', 'Valparaíso', 'Valparaíso', '', 'María García', 'true']
    ];
    
    const csv = stringify(template);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla_clientes.csv"');
    res.send(csv);
  });

  app.get("/api/templates/companies", authenticateUser, async (req: any, res) => {
    const template = [
      ['name', 'type', 'rut', 'email', 'phone', 'address', 'city', 'region', 'notes', 'legalRepresentative', 'isActive'],
      ['Empresa ABC Ltda.', 'empresa', '76123456-7', 'contacto@abc.cl', '+56222345678', 'Av. Empresarial 789', 'Santiago', 'Metropolitana', 'Cliente corporativo', 'Carlos López', 'true'],
      ['Constructora XYZ S.A.', 'constructora', '96234567-8', 'info@xyz.cl', '+56233456789', 'Calle Industrial 321', 'Concepción', 'Biobío', 'Sector construcción', 'Ana Martínez', 'true']
    ];
    
    const csv = stringify(template);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla_empresas.csv"');
    res.send(csv);
  });

  app.get("/api/templates/contacts", authenticateUser, async (req: any, res) => {
    const template = [
      ['firstName', 'lastName', 'email', 'phone', 'position', 'notes', 'companyId', 'isActive'],
      ['Pedro', 'Rodríguez', 'pedro@abc.cl', '+56912345678', 'Gerente General', 'Contacto principal', '1', 'true'],
      ['Carmen', 'Silva', 'carmen@xyz.cl', '+56987654321', 'Jefa de Proyectos', 'Contacto técnico', '2', 'true']
    ];
    
    const csv = stringify(template);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla_contactos.csv"');
    res.send(csv);
  });

  // Reports and Analytics routes
  app.get("/api/reports/cases-by-type", authenticateUser, async (req: any, res) => {
    try {
      const cases = await storage.getAllLegalCases();
      const caseTypes = await storage.getAllCaseTypes();
      
      const typeCount = cases.reduce((acc: any, legalCase: any) => {
        const typeId = legalCase.caseTypeId;
        const type = caseTypes.find((t: any) => t.id === typeId);
        const typeName = type ? type.name : 'Sin tipo';
        acc[typeName] = (acc[typeName] || 0) + 1;
        return acc;
      }, {});

      res.json(typeCount);
    } catch (error) {
      res.status(500).json({ message: "Error al generar reporte", error });
    }
  });

  app.get("/api/reports/cases-by-court", authenticateUser, async (req: any, res) => {
    try {
      const cases = await storage.getAllLegalCases();
      const courts = await storage.getAllCourts();
      
      const courtCount = cases.reduce((acc: any, legalCase: any) => {
        const courtId = legalCase.courtId;
        const court = courts.find((c: any) => c.id === courtId);
        const courtName = court ? court.name : 'Sin tribunal';
        acc[courtName] = (acc[courtName] || 0) + 1;
        return acc;
      }, {});

      res.json(courtCount);
    } catch (error) {
      res.status(500).json({ message: "Error al generar reporte", error });
    }
  });

  app.get("/api/reports/upcoming-tasks", authenticateUser, async (req: any, res) => {
    try {
      const tasks = await storage.getUrgentTasks();
      const overdueTasks = await storage.getOverdueTasks();
      
      res.json({
        urgent: tasks,
        overdue: overdueTasks,
        total: tasks.length + overdueTasks.length
      });
    } catch (error) {
      res.status(500).json({ message: "Error al generar reporte", error });
    }
  });

  app.get("/api/reports/documents-by-month", authenticateUser, async (req: any, res) => {
    try {
      const documents = await storage.getAllDocuments();
      
      const monthCount = documents.reduce((acc: any, doc: any) => {
        const date = new Date(doc.createdAt);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
      }, {});

      res.json(monthCount);
    } catch (error) {
      res.status(500).json({ message: "Error al generar reporte", error });
    }
  });

  app.get("/api/reports/dashboard-stats", authenticateUser, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener estadísticas", error });
    }
  });

  // ===== NOTIFICATION ROUTES =====
  
  // Get user notifications
  app.get("/api/notifications", authenticateUser, async (req: any, res) => {
    try {
      const { unreadOnly, limit = 50, offset = 0 } = req.query;
      const notifications = await notificationService.getUserNotifications(req.user.id, {
        unreadOnly: unreadOnly === "true",
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener notificaciones", error });
    }
  });

  // Mark notification as read
  app.put("/api/notifications/:id/read", authenticateUser, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await notificationService.markAsRead(notificationId, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error al marcar notificación como leída", error });
    }
  });

  // Mark all notifications as read
  app.put("/api/notifications/read-all", authenticateUser, async (req: any, res) => {
    try {
      await notificationService.markAllAsRead(req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error al marcar todas las notificaciones como leídas", error });
    }
  });

  // Get user notification preferences
  app.get("/api/notification-preferences", authenticateUser, async (req: any, res) => {
    try {
      const preferences = await notificationService.getUserPreferences(req.user.id);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener preferencias de notificación", error });
    }
  });

  // Update notification preferences
  app.put("/api/notification-preferences/:type", authenticateUser, async (req: any, res) => {
    try {
      const notificationType = req.params.type;
      const preferences = insertUserNotificationPreferenceSchema.partial().parse(req.body);
      await notificationService.updatePreferences(req.user.id, notificationType, preferences);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar preferencias", error });
    }
  });

  // Create notification (for manual triggers)
  app.post("/api/notifications", authenticateUser, async (req: any, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await notificationService.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      res.status(400).json({ message: "Error al crear notificación", error });
    }
  });

  // ===== SECURITY ROUTES =====

  // Enhanced login with security features
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get("User-Agent");

      const authResult = await securityService.authenticateUser(username, password, ipAddress, userAgent);

      if (!authResult.success) {
        return res.status(401).json({ 
          message: authResult.error,
          lockoutUntil: authResult.lockoutUntil 
        });
      }

      // Set session
      req.session.userId = authResult.user!.id;
      req.session.sessionToken = authResult.session!.sessionToken;

      res.json({ 
        message: "Inicio de sesión exitoso", 
        user: authResult.user,
        sessionToken: authResult.session!.sessionToken
      });
    } catch (error) {
      res.status(400).json({ message: "Error en el inicio de sesión", error });
    }
  });

  // Change password
  app.post("/api/auth/change-password", authenticateUser, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get("User-Agent");

      const result = await securityService.changePassword(
        req.user.id, 
        currentPassword, 
        newPassword, 
        ipAddress, 
        userAgent
      );

      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }

      res.json({ message: "Contraseña cambiada exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al cambiar contraseña", error });
    }
  });

  // Get user security logs
  app.get("/api/security/logs", authenticateUser, async (req: any, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const logs = await securityService.getUserSecurityLogs(
        req.user.id, 
        parseInt(limit as string), 
        parseInt(offset as string)
      );
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener logs de seguridad", error });
    }
  });

  // Get security stats (admin only)
  app.get("/api/security/stats", authenticateUser, async (req: any, res) => {
    try {
      // Check if user is admin (you may need to adjust this based on your role system)
      if (req.user.roleId !== 1) {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      const stats = await securityService.getSecurityStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener estadísticas de seguridad", error });
    }
  });

  // Validate session endpoint
  app.get("/api/auth/validate-session", async (req, res) => {
    try {
      const sessionToken = req.session?.sessionToken;
      if (!sessionToken) {
        return res.status(401).json({ message: "No hay sesión activa" });
      }

      // Check session timeout
      const isTimedOut = await securityService.checkSessionTimeout(sessionToken);
      if (isTimedOut) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Sesión expirada por inactividad" });
      }

      const authResult = await securityService.validateSession(sessionToken);
      if (!authResult.success) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: authResult.error });
      }

      res.json({ 
        message: "Sesión válida", 
        user: authResult.user 
      });
    } catch (error) {
      res.status(500).json({ message: "Error al validar sesión", error });
    }
  });

  // Logout with session cleanup
  app.post("/api/auth/logout", authenticateUser, async (req: any, res) => {
    try {
      const sessionToken = req.session?.sessionToken;
      if (sessionToken) {
        await securityService.invalidateSession(sessionToken);
      }

      req.session.destroy(() => {
        res.json({ message: "Sesión cerrada exitosamente" });
      });
    } catch (error) {
      res.status(500).json({ message: "Error al cerrar sesión", error });
    }
  });

  // Accounting Routes
  // Accounts
  app.get("/api/accounts", authenticateUser, async (req, res) => {
    try {
      const accounts = await accountingService.getAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener cuentas", error });
    }
  });

  app.post("/api/accounts", authenticateUser, async (req, res) => {
    try {
      const account = await accountingService.createAccount(req.body);
      res.status(201).json(account);
    } catch (error) {
      res.status(500).json({ message: "Error al crear cuenta", error });
    }
  });

  app.put("/api/accounts/:id", authenticateUser, async (req, res) => {
    try {
      const account = await accountingService.updateAccount(parseInt(req.params.id), req.body);
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar cuenta", error });
    }
  });

  // Vouchers
  app.get("/api/vouchers", authenticateUser, async (req, res) => {
    try {
      const vouchers = await accountingService.getVouchers();
      res.json(vouchers);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener comprobantes", error });
    }
  });

  app.get("/api/vouchers/:id", authenticateUser, async (req, res) => {
    try {
      const voucher = await accountingService.getVoucherById(parseInt(req.params.id));
      if (!voucher) {
        return res.status(404).json({ message: "Comprobante no encontrado" });
      }
      res.json(voucher);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener comprobante", error });
    }
  });

  app.post("/api/vouchers", authenticateUser, async (req: any, res) => {
    try {
      const voucherData = { ...req.body, createdBy: req.user.id };
      const voucher = await accountingService.createVoucher(voucherData);
      res.status(201).json(voucher);
    } catch (error) {
      res.status(500).json({ message: "Error al crear comprobante", error });
    }
  });

  app.put("/api/vouchers/:id", authenticateUser, async (req, res) => {
    try {
      const voucher = await accountingService.updateVoucher(parseInt(req.params.id), req.body);
      res.json(voucher);
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar comprobante", error });
    }
  });

  app.delete("/api/vouchers/:id", authenticateUser, async (req, res) => {
    try {
      await accountingService.deleteVoucher(parseInt(req.params.id));
      res.json({ message: "Comprobante eliminado exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar comprobante", error });
    }
  });

  // Voucher Lines
  app.get("/api/vouchers/:id/lines", authenticateUser, async (req, res) => {
    try {
      const lines = await accountingService.getVoucherLines(parseInt(req.params.id));
      res.json(lines);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener líneas del comprobante", error });
    }
  });

  app.post("/api/vouchers/:id/lines", authenticateUser, async (req, res) => {
    try {
      const lineData = { ...req.body, voucherId: parseInt(req.params.id) };
      const line = await accountingService.createVoucherLine(lineData);
      res.status(201).json(line);
    } catch (error) {
      res.status(500).json({ message: "Error al crear línea del comprobante", error });
    }
  });

  app.put("/api/voucher-lines/:id", authenticateUser, async (req, res) => {
    try {
      const line = await accountingService.updateVoucherLine(parseInt(req.params.id), req.body);
      res.json(line);
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar línea del comprobante", error });
    }
  });

  app.delete("/api/voucher-lines/:id", authenticateUser, async (req, res) => {
    try {
      await accountingService.deleteVoucherLine(parseInt(req.params.id));
      res.json({ message: "Línea del comprobante eliminada exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar línea del comprobante", error });
    }
  });

  // ===== CUENTA PROVISORIA ROUTES =====

  // Get cuentas provisorias by legal case
  app.get("/api/legal-cases/:caseId/cuenta-provisoria", authenticateUser, async (req, res) => {
    try {
      const caseId = parseInt(req.params.caseId);
      const cuentas = await cuentaProvisoriaService.getCuentasProvisoriasByCaseId(caseId);
      res.json(cuentas);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener cuentas provisorias", error });
    }
  });

  // Create new cuenta provisoria
  app.post("/api/cuenta-provisoria", authenticateUser, async (req: any, res) => {
    try {
      const cuentaData = { ...req.body, createdBy: req.user.id };
      const cuenta = await cuentaProvisoriaService.createCuentaProvisoria(cuentaData);
      res.status(201).json(cuenta);
    } catch (error) {
      res.status(500).json({ message: "Error al crear cuenta provisoria", error });
    }
  });

  // Get cuenta provisoria by ID
  app.get("/api/cuenta-provisoria/:id", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cuenta = await cuentaProvisoriaService.getCuentaProvisoriaById(id);
      if (!cuenta) {
        return res.status(404).json({ message: "Cuenta provisoria no encontrada" });
      }
      res.json(cuenta);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener cuenta provisoria", error });
    }
  });

  // Get movements for cuenta provisoria
  app.get("/api/cuenta-provisoria/:id/movements", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const movements = await cuentaProvisoriaService.getMovements(id);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener movimientos", error });
    }
  });

  // Regenerate movements from vouchers
  app.post("/api/cuenta-provisoria/:id/regenerate-movements", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cuenta = await cuentaProvisoriaService.getCuentaProvisoriaById(id);
      if (!cuenta) {
        return res.status(404).json({ message: "Cuenta provisoria no encontrada" });
      }
      
      await cuentaProvisoriaService.generateMovementsFromVouchers(
        id, cuenta.legalCaseId, cuenta.year, cuenta.month
      );
      res.json({ message: "Movimientos regenerados exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al regenerar movimientos", error });
    }
  });

  // Update cuenta provisoria status
  app.put("/api/cuenta-provisoria/:id/status", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      await cuentaProvisoriaService.updateStatus(id, status);
      res.json({ message: "Estado actualizado exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar estado", error });
    }
  });

  // Validate cuenta provisoria data
  app.get("/api/cuenta-provisoria/:id/validate", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = await cuentaProvisoriaService.validateCuentaProvisoria(id);
      res.json(validation);
    } catch (error) {
      res.status(500).json({ message: "Error al validar cuenta provisoria", error });
    }
  });

  // Generate PDF data for preview
  app.get("/api/cuenta-provisoria/:id/pdf-data", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pdfData = await cuentaProvisoriaService.generatePDFData(id);
      res.json(pdfData);
    } catch (error) {
      res.status(500).json({ message: "Error al generar datos para PDF", error });
    }
  });

  // Generate PDF preview (HTML)
  app.get("/api/cuenta-provisoria/:id/preview", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const html = await pdfGeneratorService.generateCuentaProvisoriaPreview(id);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      res.status(500).json({ message: "Error al generar vista previa", error });
    }
  });

  // Generate single PDF
  app.get("/api/cuenta-provisoria/:id/pdf", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { buffer, filename } = await pdfGeneratorService.generateCuentaProvisoriaPDF(id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: "Error al generar PDF", error });
    }
  });

  // Generate multiple PDFs as ZIP
  app.post("/api/cuenta-provisoria/bulk-pdf", authenticateUser, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Se requiere un array de IDs" });
      }

      const { buffer, filename } = await pdfGeneratorService.generateMultipleCuentaProvisoriaPDFs(ids);
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: "Error al generar PDFs múltiples", error });
    }
  });

  // Get financial summary
  app.get("/api/legal-cases/:caseId/financial-summary", authenticateUser, async (req, res) => {
    try {
      const caseId = parseInt(req.params.caseId);
      const { year, month } = req.query;
      
      const summary = await cuentaProvisoriaService.getFinancialSummary(
        caseId, 
        parseInt(year as string),
        month ? parseInt(month as string) : undefined
      );
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener resumen financiero", error });
    }
  });

  // Health check endpoint for deployment platforms
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      database: process.env.DATABASE_URL ? "connected" : "not configured"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
