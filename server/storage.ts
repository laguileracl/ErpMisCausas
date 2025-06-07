import {
  Role, User, Client, Company, Contact, Provider, Court, CaseType, StudioRole, LegalCase,
  CaseRole, ProcessStage, Document, Activity, Task, AuditLog,
  InsertRole, InsertUser, InsertClient, InsertCompany, InsertContact, InsertProvider,
  InsertCourt, InsertCaseType, InsertStudioRole, InsertLegalCase, InsertCaseRole,
  InsertProcessStage, InsertDocument, InsertActivity, InsertTask, InsertAuditLog
} from "@shared/schema";

export interface IStorage {
  // Users and Authentication
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Roles
  getRole(id: number): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;
  getAllRoles(): Promise<Role[]>;

  // Clients
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  getAllClients(): Promise<Client[]>;
  getClientByRut(rut: string): Promise<Client | undefined>;

  // Companies
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<boolean>;
  getAllCompanies(): Promise<Company[]>;
  getCompanyByRut(rut: string): Promise<Company | undefined>;

  // Contacts
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  getAllContacts(): Promise<Contact[]>;
  getContactsByCompany(companyId: number): Promise<Contact[]>;

  // Providers
  getProvider(id: number): Promise<Provider | undefined>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  updateProvider(id: number, provider: Partial<InsertProvider>): Promise<Provider | undefined>;
  deleteProvider(id: number): Promise<boolean>;
  getAllProviders(): Promise<Provider[]>;

  // Courts
  getCourt(id: number): Promise<Court | undefined>;
  createCourt(court: InsertCourt): Promise<Court>;
  updateCourt(id: number, court: Partial<InsertCourt>): Promise<Court | undefined>;
  deleteCourt(id: number): Promise<boolean>;
  getAllCourts(): Promise<Court[]>;

  // Case Types
  getCaseType(id: number): Promise<CaseType | undefined>;
  createCaseType(caseType: InsertCaseType): Promise<CaseType>;
  updateCaseType(id: number, caseType: Partial<InsertCaseType>): Promise<CaseType | undefined>;
  deleteCaseType(id: number): Promise<boolean>;
  getAllCaseTypes(): Promise<CaseType[]>;

  // Studio Roles
  getStudioRole(id: number): Promise<StudioRole | undefined>;
  createStudioRole(studioRole: InsertStudioRole): Promise<StudioRole>;
  updateStudioRole(id: number, studioRole: Partial<InsertStudioRole>): Promise<StudioRole | undefined>;
  deleteStudioRole(id: number): Promise<boolean>;
  getAllStudioRoles(): Promise<StudioRole[]>;

  // Legal Cases
  getLegalCase(id: number): Promise<LegalCase | undefined>;
  createLegalCase(legalCase: InsertLegalCase): Promise<LegalCase>;
  updateLegalCase(id: number, legalCase: Partial<InsertLegalCase>): Promise<LegalCase | undefined>;
  deleteLegalCase(id: number): Promise<boolean>;
  getAllLegalCases(): Promise<LegalCase[]>;
  getLegalCaseByRol(rol: string): Promise<LegalCase | undefined>;

  // Case Roles
  getCaseRole(id: number): Promise<CaseRole | undefined>;
  createCaseRole(caseRole: InsertCaseRole): Promise<CaseRole>;
  updateCaseRole(id: number, caseRole: Partial<InsertCaseRole>): Promise<CaseRole | undefined>;
  deleteCaseRole(id: number): Promise<boolean>;
  getCaseRolesByCase(legalCaseId: number): Promise<CaseRole[]>;

  // Process Stages
  getProcessStage(id: number): Promise<ProcessStage | undefined>;
  createProcessStage(processStage: InsertProcessStage): Promise<ProcessStage>;
  updateProcessStage(id: number, processStage: Partial<InsertProcessStage>): Promise<ProcessStage | undefined>;
  deleteProcessStage(id: number): Promise<boolean>;
  getProcessStagesByCase(legalCaseId: number): Promise<ProcessStage[]>;

  // Documents
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  getDocumentsByCase(legalCaseId: number): Promise<Document[]>;

  // Activities
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;
  getActivitiesByCase(legalCaseId: number): Promise<Activity[]>;

  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getTasksByCase(legalCaseId: number): Promise<Task[]>;
  getTasksByUser(userId: number): Promise<Task[]>;
  getOverdueTasks(): Promise<Task[]>;
  getUrgentTasks(): Promise<Task[]>;

  // Audit Logs
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: {
    userId?: number;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: number): Promise<AuditLog[]>;
  getAuditLogsByEntity(entityType: string, entityId: number): Promise<AuditLog[]>;
  getAuditLogCount(filters?: {
    userId?: number;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    activeCases: number;
    pendingTasks: number;
    overdueTasks: number;
    activeClients: number;
    documentsThisMonth: number;
    newClientsThisMonth: number;
  }>;
}

export class MemStorage implements IStorage {
  private roles: Map<number, Role> = new Map();
  private users: Map<number, User> = new Map();
  private clients: Map<number, Client> = new Map();
  private companies: Map<number, Company> = new Map();
  private contacts: Map<number, Contact> = new Map();
  private providers: Map<number, Provider> = new Map();
  private courts: Map<number, Court> = new Map();
  private caseTypes: Map<number, CaseType> = new Map();
  private studioRoles: Map<number, StudioRole> = new Map();
  private legalCases: Map<number, LegalCase> = new Map();
  private caseRoles: Map<number, CaseRole> = new Map();
  private processStages: Map<number, ProcessStage> = new Map();
  private documents: Map<number, Document> = new Map();
  private activities: Map<number, Activity> = new Map();
  private tasks: Map<number, Task> = new Map();
  private auditLogs: Map<number, AuditLog> = new Map();

  private currentId: number = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize default roles
    this.createRole({
      name: "Administrador",
      description: "Acceso completo al sistema",
      permissions: ["*"],
      isActive: true
    });

    this.createRole({
      name: "Abogado Senior",
      description: "Acceso completo a casos y clientes",
      permissions: ["cases:*", "clients:*", "documents:*"],
      isActive: true
    });

    this.createRole({
      name: "Abogado Junior",
      description: "Acceso limitado a casos asignados",
      permissions: ["cases:read", "cases:update", "clients:read", "documents:read"],
      isActive: true
    });

    this.createRole({
      name: "Asistente Legal",
      description: "Acceso de solo lectura y tareas",
      permissions: ["cases:read", "clients:read", "tasks:*"],
      isActive: true
    });

    // Initialize default admin user
    this.createUser({
      username: "admin",
      email: "admin@miscausas.cl",
      password: "admin123", // In production, this should be hashed
      firstName: "Administrador",
      lastName: "Sistema",
      roleId: 1,
      isActive: true
    });

    // Initialize default case types
    this.createCaseType({
      name: "Civil",
      description: "Casos de derecho civil",
      workflow: [
        { stage: "Demanda", days: 30 },
        { stage: "Contestación", days: 15 },
        { stage: "Audiencia Preparatoria", days: 45 },
        { stage: "Prueba", days: 60 },
        { stage: "Sentencia", days: 30 }
      ],
      isActive: true
    });

    this.createCaseType({
      name: "Laboral",
      description: "Casos de derecho laboral",
      workflow: [
        { stage: "Demanda", days: 15 },
        { stage: "Audiencia Preparatoria", days: 30 },
        { stage: "Audiencia de Juicio", days: 30 },
        { stage: "Sentencia", days: 15 }
      ],
      isActive: true
    });

    this.createCaseType({
      name: "Tributario",
      description: "Casos de derecho tributario",
      workflow: [
        { stage: "Reclamo", days: 60 },
        { stage: "Respuesta SII", days: 90 },
        { stage: "Audiencia", days: 45 },
        { stage: "Resolución", days: 60 }
      ],
      isActive: true
    });

    // Initialize studio roles
    this.createStudioRole({
      name: "Representante Demandante",
      description: "Representación legal del demandante",
      isActive: true
    });

    this.createStudioRole({
      name: "Representante Demandado",
      description: "Representación legal del demandado",
      isActive: true
    });

    this.createStudioRole({
      name: "Liquidador",
      description: "Liquidador en proceso concursal",
      isActive: true
    });

    this.createStudioRole({
      name: "Tercero",
      description: "Participación como tercero",
      isActive: true
    });

    this.createStudioRole({
      name: "Causa Propia",
      description: "Causa del propio estudio",
      isActive: true
    });

    // Initialize sample courts
    this.createCourt({
      name: "1er Juzgado Civil de Santiago",
      type: "civil",
      jurisdiction: "Santiago",
      address: "Compañía 1140",
      city: "Santiago",
      region: "Metropolitana",
      phone: "+56 2 2753 0000",
      isActive: true
    });

    this.createCourt({
      name: "2do Juzgado Civil de Santiago",
      type: "civil",
      jurisdiction: "Santiago",
      address: "Compañía 1140",
      city: "Santiago",
      region: "Metropolitana",
      phone: "+56 2 2753 0100",
      isActive: true
    });

    this.createCourt({
      name: "1er Juzgado del Trabajo de Santiago",
      type: "labor",
      jurisdiction: "Santiago",
      address: "Pedro Montt 1606",
      city: "Santiago",
      region: "Metropolitana",
      phone: "+56 2 2753 0200",
      isActive: true
    });

    this.createCourt({
      name: "Tribunal Tributario y Aduanero RM",
      type: "tax",
      jurisdiction: "Metropolitana",
      address: "Teatinos 120",
      city: "Santiago",
      region: "Metropolitana",
      phone: "+56 2 2753 0300",
      isActive: true
    });
  }

  private getNextId(): number {
    return this.currentId++;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.getNextId();
    const user: User = {
      ...insertUser,
      id,
      isActive: insertUser.isActive ?? true,
      roleId: insertUser.roleId ?? null,
      lastLogin: null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Roles
  async getRole(id: number): Promise<Role | undefined> {
    return this.roles.get(id);
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const id = this.getNextId();
    const role: Role = {
      ...insertRole,
      id,
      description: insertRole.description ?? null,
      permissions: insertRole.permissions ?? {},
      isActive: insertRole.isActive ?? true,
      createdAt: new Date()
    };
    this.roles.set(id, role);
    return role;
  }

  async updateRole(id: number, updateData: Partial<InsertRole>): Promise<Role | undefined> {
    const role = this.roles.get(id);
    if (!role) return undefined;
    
    const updatedRole = { ...role, ...updateData };
    this.roles.set(id, updatedRole);
    return updatedRole;
  }

  async deleteRole(id: number): Promise<boolean> {
    return this.roles.delete(id);
  }

  async getAllRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  // Clients
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.getNextId();
    const client: Client = {
      ...insertClient,
      id,
      email: insertClient.email ?? null,
      firstName: insertClient.firstName ?? null,
      lastName: insertClient.lastName ?? null,
      isActive: insertClient.isActive ?? true,
      companyName: insertClient.companyName ?? null,
      phone: insertClient.phone ?? null,
      address: insertClient.address ?? null,
      city: insertClient.city ?? null,
      region: insertClient.region ?? null,
      notes: insertClient.notes ?? null,
      createdAt: new Date()
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...updateData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClientByRut(rut: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(client => client.rut === rut);
  }

  // Companies
  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = this.getNextId();
    const company: Company = {
      ...insertCompany,
      id,
      createdAt: new Date()
    };
    this.companies.set(id, company);
    return company;
  }

  async updateCompany(id: number, updateData: Partial<InsertCompany>): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (!company) return undefined;
    
    const updatedCompany = { ...company, ...updateData };
    this.companies.set(id, updatedCompany);
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<boolean> {
    return this.companies.delete(id);
  }

  async getAllCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async getCompanyByRut(rut: string): Promise<Company | undefined> {
    return Array.from(this.companies.values()).find(company => company.rut === rut);
  }

  // Contacts
  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.getNextId();
    const contact: Contact = {
      ...insertContact,
      id,
      createdAt: new Date()
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(id: number, updateData: Partial<InsertContact>): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;
    
    const updatedContact = { ...contact, ...updateData };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }

  async getAllContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }

  async getContactsByCompany(companyId: number): Promise<Contact[]> {
    // This would need company_contacts relationship in full implementation
    return Array.from(this.contacts.values()).filter(contact => contact.isActive);
  }

  // Providers
  async getProvider(id: number): Promise<Provider | undefined> {
    return this.providers.get(id);
  }

  async createProvider(insertProvider: InsertProvider): Promise<Provider> {
    const id = this.getNextId();
    const provider: Provider = {
      ...insertProvider,
      id,
      createdAt: new Date()
    };
    this.providers.set(id, provider);
    return provider;
  }

  async updateProvider(id: number, updateData: Partial<InsertProvider>): Promise<Provider | undefined> {
    const provider = this.providers.get(id);
    if (!provider) return undefined;
    
    const updatedProvider = { ...provider, ...updateData };
    this.providers.set(id, updatedProvider);
    return updatedProvider;
  }

  async deleteProvider(id: number): Promise<boolean> {
    return this.providers.delete(id);
  }

  async getAllProviders(): Promise<Provider[]> {
    return Array.from(this.providers.values());
  }

  // Courts
  async getCourt(id: number): Promise<Court | undefined> {
    return this.courts.get(id);
  }

  async createCourt(insertCourt: InsertCourt): Promise<Court> {
    const id = this.getNextId();
    const court: Court = {
      ...insertCourt,
      id
    };
    this.courts.set(id, court);
    return court;
  }

  async updateCourt(id: number, updateData: Partial<InsertCourt>): Promise<Court | undefined> {
    const court = this.courts.get(id);
    if (!court) return undefined;
    
    const updatedCourt = { ...court, ...updateData };
    this.courts.set(id, updatedCourt);
    return updatedCourt;
  }

  async deleteCourt(id: number): Promise<boolean> {
    return this.courts.delete(id);
  }

  async getAllCourts(): Promise<Court[]> {
    return Array.from(this.courts.values());
  }

  // Case Types
  async getCaseType(id: number): Promise<CaseType | undefined> {
    return this.caseTypes.get(id);
  }

  async createCaseType(insertCaseType: InsertCaseType): Promise<CaseType> {
    const id = this.getNextId();
    const caseType: CaseType = {
      ...insertCaseType,
      id
    };
    this.caseTypes.set(id, caseType);
    return caseType;
  }

  async updateCaseType(id: number, updateData: Partial<InsertCaseType>): Promise<CaseType | undefined> {
    const caseType = this.caseTypes.get(id);
    if (!caseType) return undefined;
    
    const updatedCaseType = { ...caseType, ...updateData };
    this.caseTypes.set(id, updatedCaseType);
    return updatedCaseType;
  }

  async deleteCaseType(id: number): Promise<boolean> {
    return this.caseTypes.delete(id);
  }

  async getAllCaseTypes(): Promise<CaseType[]> {
    return Array.from(this.caseTypes.values());
  }

  // Studio Roles
  async getStudioRole(id: number): Promise<StudioRole | undefined> {
    return this.studioRoles.get(id);
  }

  async createStudioRole(insertStudioRole: InsertStudioRole): Promise<StudioRole> {
    const id = this.getNextId();
    const studioRole: StudioRole = {
      ...insertStudioRole,
      id
    };
    this.studioRoles.set(id, studioRole);
    return studioRole;
  }

  async updateStudioRole(id: number, updateData: Partial<InsertStudioRole>): Promise<StudioRole | undefined> {
    const studioRole = this.studioRoles.get(id);
    if (!studioRole) return undefined;
    
    const updatedStudioRole = { ...studioRole, ...updateData };
    this.studioRoles.set(id, updatedStudioRole);
    return updatedStudioRole;
  }

  async deleteStudioRole(id: number): Promise<boolean> {
    return this.studioRoles.delete(id);
  }

  async getAllStudioRoles(): Promise<StudioRole[]> {
    return Array.from(this.studioRoles.values());
  }

  // Legal Cases
  async getLegalCase(id: number): Promise<LegalCase | undefined> {
    return this.legalCases.get(id);
  }

  async createLegalCase(insertLegalCase: InsertLegalCase): Promise<LegalCase> {
    const id = this.getNextId();
    const legalCase: LegalCase = {
      ...insertLegalCase,
      id,
      createdAt: new Date()
    };
    this.legalCases.set(id, legalCase);
    return legalCase;
  }

  async updateLegalCase(id: number, updateData: Partial<InsertLegalCase>): Promise<LegalCase | undefined> {
    const legalCase = this.legalCases.get(id);
    if (!legalCase) return undefined;
    
    const updatedLegalCase = { ...legalCase, ...updateData };
    this.legalCases.set(id, updatedLegalCase);
    return updatedLegalCase;
  }

  async deleteLegalCase(id: number): Promise<boolean> {
    return this.legalCases.delete(id);
  }

  async getAllLegalCases(): Promise<LegalCase[]> {
    return Array.from(this.legalCases.values());
  }

  async getLegalCaseByRol(rol: string): Promise<LegalCase | undefined> {
    return Array.from(this.legalCases.values()).find(legalCase => legalCase.rol === rol);
  }

  // Case Roles
  async getCaseRole(id: number): Promise<CaseRole | undefined> {
    return this.caseRoles.get(id);
  }

  async createCaseRole(insertCaseRole: InsertCaseRole): Promise<CaseRole> {
    const id = this.getNextId();
    const caseRole: CaseRole = {
      ...insertCaseRole,
      id,
      startDate: new Date()
    };
    this.caseRoles.set(id, caseRole);
    return caseRole;
  }

  async updateCaseRole(id: number, updateData: Partial<InsertCaseRole>): Promise<CaseRole | undefined> {
    const caseRole = this.caseRoles.get(id);
    if (!caseRole) return undefined;
    
    const updatedCaseRole = { ...caseRole, ...updateData };
    this.caseRoles.set(id, updatedCaseRole);
    return updatedCaseRole;
  }

  async deleteCaseRole(id: number): Promise<boolean> {
    return this.caseRoles.delete(id);
  }

  async getCaseRolesByCase(legalCaseId: number): Promise<CaseRole[]> {
    return Array.from(this.caseRoles.values()).filter(role => role.legalCaseId === legalCaseId);
  }

  // Process Stages
  async getProcessStage(id: number): Promise<ProcessStage | undefined> {
    return this.processStages.get(id);
  }

  async createProcessStage(insertProcessStage: InsertProcessStage): Promise<ProcessStage> {
    const id = this.getNextId();
    const processStage: ProcessStage = {
      ...insertProcessStage,
      id,
      createdAt: new Date()
    };
    this.processStages.set(id, processStage);
    return processStage;
  }

  async updateProcessStage(id: number, updateData: Partial<InsertProcessStage>): Promise<ProcessStage | undefined> {
    const processStage = this.processStages.get(id);
    if (!processStage) return undefined;
    
    const updatedProcessStage = { ...processStage, ...updateData };
    this.processStages.set(id, updatedProcessStage);
    return updatedProcessStage;
  }

  async deleteProcessStage(id: number): Promise<boolean> {
    return this.processStages.delete(id);
  }

  async getProcessStagesByCase(legalCaseId: number): Promise<ProcessStage[]> {
    return Array.from(this.processStages.values()).filter(stage => stage.legalCaseId === legalCaseId);
  }

  // Documents
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.getNextId();
    const document: Document = {
      ...insertDocument,
      id,
      generatedAt: new Date(),
      createdAt: new Date()
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, updateData: Partial<InsertDocument>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { ...document, ...updateData };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  async getDocumentsByCase(legalCaseId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.legalCaseId === legalCaseId);
  }

  // Activities
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.getNextId();
    const activity: Activity = {
      ...insertActivity,
      id,
      createdAt: new Date()
    };
    this.activities.set(id, activity);
    return activity;
  }

  async updateActivity(id: number, updateData: Partial<InsertActivity>): Promise<Activity | undefined> {
    const activity = this.activities.get(id);
    if (!activity) return undefined;
    
    const updatedActivity = { ...activity, ...updateData };
    this.activities.set(id, updatedActivity);
    return updatedActivity;
  }

  async deleteActivity(id: number): Promise<boolean> {
    return this.activities.delete(id);
  }

  async getActivitiesByCase(legalCaseId: number): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(activity => activity.legalCaseId === legalCaseId);
  }

  // Tasks
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.getNextId();
    const task: Task = {
      ...insertTask,
      id,
      createdAt: new Date()
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updateData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getTasksByCase(legalCaseId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.legalCaseId === legalCaseId);
  }

  async getTasksByUser(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.assignedUserId === userId);
  }

  async getOverdueTasks(): Promise<Task[]> {
    const now = new Date();
    return Array.from(this.tasks.values()).filter(task => 
      task.status === 'pending' && task.dueDate < now
    );
  }

  async getUrgentTasks(): Promise<Task[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return Array.from(this.tasks.values())
      .filter(task => 
        task.status === 'pending' && 
        task.dueDate <= tomorrow &&
        (task.priority === 'high' || task.priority === 'urgent')
      )
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  // Audit Logs
  async createAuditLog(insertAuditLog: InsertAuditLog): Promise<AuditLog> {
    const id = this.getNextId();
    const auditLog: AuditLog = {
      ...insertAuditLog,
      id,
      timestamp: new Date()
    };
    this.auditLogs.set(id, auditLog);
    return auditLog;
  }

  async getAuditLogs(filters?: {
    userId?: number;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    let logs = Array.from(this.auditLogs.values());

    if (filters) {
      if (filters.userId) logs = logs.filter(log => log.userId === filters.userId);
      if (filters.action) logs = logs.filter(log => log.action === filters.action);
      if (filters.entityType) logs = logs.filter(log => log.entityType === filters.entityType);
      if (filters.startDate) logs = logs.filter(log => log.timestamp >= filters.startDate!);
      if (filters.endDate) logs = logs.filter(log => log.timestamp <= filters.endDate!);
    }

    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filters?.limit) {
      const start = filters.offset || 0;
      return logs.slice(start, start + filters.limit);
    }

    return logs;
  }

  async getAuditLogCount(filters?: {
    userId?: number;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    let logs = Array.from(this.auditLogs.values());

    if (filters) {
      if (filters.userId) logs = logs.filter(log => log.userId === filters.userId);
      if (filters.action) logs = logs.filter(log => log.action === filters.action);
      if (filters.entityType) logs = logs.filter(log => log.entityType === filters.entityType);
      if (filters.startDate) logs = logs.filter(log => log.timestamp >= filters.startDate!);
      if (filters.endDate) logs = logs.filter(log => log.timestamp <= filters.endDate!);
    }

    return logs.length;
  }

  async getAuditLogsByUser(userId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getAuditLogsByEntity(entityType: string, entityId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.entityType === entityType && log.entityId === entityId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    activeCases: number;
    pendingTasks: number;
    overdueTasks: number;
    activeClients: number;
    documentsThisMonth: number;
    newClientsThisMonth: number;
  }> {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const activeCases = Array.from(this.legalCases.values())
      .filter(c => c.status === 'active').length;
    
    const pendingTasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'pending').length;
    
    const overdueTasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'pending' && t.dueDate < now).length;
    
    const activeClients = Array.from(this.clients.values())
      .filter(c => c.isActive).length;
    
    const documentsThisMonth = Array.from(this.documents.values())
      .filter(d => d.createdAt && d.createdAt >= thisMonth).length;
    
    const newClientsThisMonth = Array.from(this.clients.values())
      .filter(c => c.createdAt && c.createdAt >= thisMonth).length;

    return {
      activeCases,
      pendingTasks,
      overdueTasks,
      activeClients,
      documentsThisMonth,
      newClientsThisMonth
    };
  }
}

export const storage = new DatabaseStorage();
