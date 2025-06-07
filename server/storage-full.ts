import type { 
  User, Role, Client, Company, Contact, CompanyContact, Provider, Court, CaseType, StudioRole,
  LegalCase, CaseRole, ProcessStage, Document, Activity, Task, AuditLog,
  InsertUser, InsertRole, InsertClient, InsertCompany, InsertContact, InsertCompanyContact,
  InsertProvider, InsertCourt, InsertCaseType, InsertStudioRole, InsertLegalCase, InsertCaseRole,
  InsertProcessStage, InsertDocument, InsertActivity, InsertTask, InsertAuditLog
} from "../shared/schema";
import { 
  users, roles, clients, companies, contacts, companyContacts, providers, courts, 
  caseTypes, studioRoles, legalCases, caseRoles, processStages, documents, 
  activities, tasks, auditLogs 
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, isNull, isNotNull } from "drizzle-orm";

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

  // Company-Contact Relationships
  getCompanyContact(id: number): Promise<CompanyContact | undefined>;
  createCompanyContact(companyContact: InsertCompanyContact): Promise<CompanyContact>;
  updateCompanyContact(id: number, companyContact: Partial<InsertCompanyContact>): Promise<CompanyContact | undefined>;
  deleteCompanyContact(id: number): Promise<boolean>;
  getCompanyContactsByCompany(companyId: number): Promise<CompanyContact[]>;
  getCompanyContactsByContact(contactId: number): Promise<CompanyContact[]>;
  getContactsWithCompanies(contactId: number): Promise<Array<Contact & { companies: Array<Company & { relationship: CompanyContact }> }>>;
  getCompaniesWithContacts(companyId: number): Promise<Array<Company & { contacts: Array<Contact & { relationship: CompanyContact }> }>>;

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
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: number): Promise<AuditLog[]>;
  getAuditLogsByEntity(entityType: string, entityId: number): Promise<AuditLog[]>;

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

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Roles
  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db
      .insert(roles)
      .values(insertRole)
      .returning();
    return role;
  }

  async updateRole(id: number, updateData: Partial<InsertRole>): Promise<Role | undefined> {
    const [role] = await db
      .update(roles)
      .set(updateData)
      .where(eq(roles.id, id))
      .returning();
    return role || undefined;
  }

  async deleteRole(id: number): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id));
    return result.rowCount > 0;
  }

  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.name);
  }

  // Clients
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: number, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set(updateData)
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.rowCount > 0;
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClientByRut(rut: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.rut, rut));
    return client || undefined;
  }

  // Companies
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(id: number, updateData: Partial<InsertCompany>): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.id, id))
      .returning();
    return company || undefined;
  }

  async deleteCompany(id: number): Promise<boolean> {
    const result = await db.delete(companies).where(eq(companies.id, id));
    return result.rowCount > 0;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  async getCompanyByRut(rut: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.rut, rut));
    return company || undefined;
  }

  // Contacts
  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(insertContact)
      .returning();
    return contact;
  }

  async updateContact(id: number, updateData: Partial<InsertContact>): Promise<Contact | undefined> {
    const [contact] = await db
      .update(contacts)
      .set(updateData)
      .where(eq(contacts.id, id))
      .returning();
    return contact || undefined;
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return result.rowCount > 0;
  }

  async getAllContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  async getContactsByCompany(companyId: number): Promise<Contact[]> {
    const result = await db
      .select({ contact: contacts })
      .from(contacts)
      .innerJoin(companyContacts, eq(contacts.id, companyContacts.contactId))
      .where(and(eq(companyContacts.companyId, companyId), eq(companyContacts.isActive, true)));
    
    return result.map(r => r.contact);
  }

  // Company-Contact Relationships
  async getCompanyContact(id: number): Promise<CompanyContact | undefined> {
    const [companyContact] = await db.select().from(companyContacts).where(eq(companyContacts.id, id));
    return companyContact || undefined;
  }

  async createCompanyContact(insertCompanyContact: InsertCompanyContact): Promise<CompanyContact> {
    const [companyContact] = await db
      .insert(companyContacts)
      .values(insertCompanyContact)
      .returning();
    return companyContact;
  }

  async updateCompanyContact(id: number, updateData: Partial<InsertCompanyContact>): Promise<CompanyContact | undefined> {
    const [companyContact] = await db
      .update(companyContacts)
      .set(updateData)
      .where(eq(companyContacts.id, id))
      .returning();
    return companyContact || undefined;
  }

  async deleteCompanyContact(id: number): Promise<boolean> {
    const result = await db.delete(companyContacts).where(eq(companyContacts.id, id));
    return result.rowCount > 0;
  }

  async getCompanyContactsByCompany(companyId: number): Promise<CompanyContact[]> {
    return await db.select().from(companyContacts).where(eq(companyContacts.companyId, companyId));
  }

  async getCompanyContactsByContact(contactId: number): Promise<CompanyContact[]> {
    return await db.select().from(companyContacts).where(eq(companyContacts.contactId, contactId));
  }

  async getContactsWithCompanies(contactId: number): Promise<Array<Contact & { companies: Array<Company & { relationship: CompanyContact }> }>> {
    // Get contact
    const contact = await this.getContact(contactId);
    if (!contact) return [];

    // Get companies for this contact
    const result = await db
      .select({
        company: companies,
        relationship: companyContacts
      })
      .from(companies)
      .innerJoin(companyContacts, eq(companies.id, companyContacts.companyId))
      .where(eq(companyContacts.contactId, contactId));

    const companiesWithRelationship = result.map(r => ({
      ...r.company,
      relationship: r.relationship
    }));

    return [{
      ...contact,
      companies: companiesWithRelationship
    }];
  }

  async getCompaniesWithContacts(companyId: number): Promise<Array<Company & { contacts: Array<Contact & { relationship: CompanyContact }> }>> {
    // Get company
    const company = await this.getCompany(companyId);
    if (!company) return [];

    // Get contacts for this company
    const result = await db
      .select({
        contact: contacts,
        relationship: companyContacts
      })
      .from(contacts)
      .innerJoin(companyContacts, eq(contacts.id, companyContacts.contactId))
      .where(eq(companyContacts.companyId, companyId));

    const contactsWithRelationship = result.map(r => ({
      ...r.contact,
      relationship: r.relationship
    }));

    return [{
      ...company,
      contacts: contactsWithRelationship
    }];
  }

  // Providers
  async getProvider(id: number): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.id, id));
    return provider || undefined;
  }

  async createProvider(insertProvider: InsertProvider): Promise<Provider> {
    const [provider] = await db
      .insert(providers)
      .values(insertProvider)
      .returning();
    return provider;
  }

  async updateProvider(id: number, updateData: Partial<InsertProvider>): Promise<Provider | undefined> {
    const [provider] = await db
      .update(providers)
      .set(updateData)
      .where(eq(providers.id, id))
      .returning();
    return provider || undefined;
  }

  async deleteProvider(id: number): Promise<boolean> {
    const result = await db.delete(providers).where(eq(providers.id, id));
    return result.rowCount > 0;
  }

  async getAllProviders(): Promise<Provider[]> {
    return await db.select().from(providers).orderBy(desc(providers.createdAt));
  }

  // Courts
  async getCourt(id: number): Promise<Court | undefined> {
    const [court] = await db.select().from(courts).where(eq(courts.id, id));
    return court || undefined;
  }

  async createCourt(insertCourt: InsertCourt): Promise<Court> {
    const [court] = await db
      .insert(courts)
      .values(insertCourt)
      .returning();
    return court;
  }

  async updateCourt(id: number, updateData: Partial<InsertCourt>): Promise<Court | undefined> {
    const [court] = await db
      .update(courts)
      .set(updateData)
      .where(eq(courts.id, id))
      .returning();
    return court || undefined;
  }

  async deleteCourt(id: number): Promise<boolean> {
    const result = await db.delete(courts).where(eq(courts.id, id));
    return result.rowCount > 0;
  }

  async getAllCourts(): Promise<Court[]> {
    return await db.select().from(courts).orderBy(courts.name);
  }

  // Case Types
  async getCaseType(id: number): Promise<CaseType | undefined> {
    const [caseType] = await db.select().from(caseTypes).where(eq(caseTypes.id, id));
    return caseType || undefined;
  }

  async createCaseType(insertCaseType: InsertCaseType): Promise<CaseType> {
    const [caseType] = await db
      .insert(caseTypes)
      .values(insertCaseType)
      .returning();
    return caseType;
  }

  async updateCaseType(id: number, updateData: Partial<InsertCaseType>): Promise<CaseType | undefined> {
    const [caseType] = await db
      .update(caseTypes)
      .set(updateData)
      .where(eq(caseTypes.id, id))
      .returning();
    return caseType || undefined;
  }

  async deleteCaseType(id: number): Promise<boolean> {
    const result = await db.delete(caseTypes).where(eq(caseTypes.id, id));
    return result.rowCount > 0;
  }

  async getAllCaseTypes(): Promise<CaseType[]> {
    return await db.select().from(caseTypes).orderBy(caseTypes.name);
  }

  // Studio Roles
  async getStudioRole(id: number): Promise<StudioRole | undefined> {
    const [studioRole] = await db.select().from(studioRoles).where(eq(studioRoles.id, id));
    return studioRole || undefined;
  }

  async createStudioRole(insertStudioRole: InsertStudioRole): Promise<StudioRole> {
    const [studioRole] = await db
      .insert(studioRoles)
      .values(insertStudioRole)
      .returning();
    return studioRole;
  }

  async updateStudioRole(id: number, updateData: Partial<InsertStudioRole>): Promise<StudioRole | undefined> {
    const [studioRole] = await db
      .update(studioRoles)
      .set(updateData)
      .where(eq(studioRoles.id, id))
      .returning();
    return studioRole || undefined;
  }

  async deleteStudioRole(id: number): Promise<boolean> {
    const result = await db.delete(studioRoles).where(eq(studioRoles.id, id));
    return result.rowCount > 0;
  }

  async getAllStudioRoles(): Promise<StudioRole[]> {
    return await db.select().from(studioRoles).orderBy(studioRoles.name);
  }

  // Legal Cases
  async getLegalCase(id: number): Promise<LegalCase | undefined> {
    const [legalCase] = await db.select().from(legalCases).where(eq(legalCases.id, id));
    return legalCase || undefined;
  }

  async createLegalCase(insertLegalCase: InsertLegalCase): Promise<LegalCase> {
    const [legalCase] = await db
      .insert(legalCases)
      .values(insertLegalCase)
      .returning();
    return legalCase;
  }

  async updateLegalCase(id: number, updateData: Partial<InsertLegalCase>): Promise<LegalCase | undefined> {
    const [legalCase] = await db
      .update(legalCases)
      .set(updateData)
      .where(eq(legalCases.id, id))
      .returning();
    return legalCase || undefined;
  }

  async deleteLegalCase(id: number): Promise<boolean> {
    const result = await db.delete(legalCases).where(eq(legalCases.id, id));
    return result.rowCount > 0;
  }

  async getAllLegalCases(): Promise<LegalCase[]> {
    return await db.select().from(legalCases).orderBy(desc(legalCases.createdAt));
  }

  async getLegalCaseByRol(rol: string): Promise<LegalCase | undefined> {
    const [legalCase] = await db.select().from(legalCases).where(eq(legalCases.rol, rol));
    return legalCase || undefined;
  }

  // Case Roles
  async getCaseRole(id: number): Promise<CaseRole | undefined> {
    const [caseRole] = await db.select().from(caseRoles).where(eq(caseRoles.id, id));
    return caseRole || undefined;
  }

  async createCaseRole(insertCaseRole: InsertCaseRole): Promise<CaseRole> {
    const [caseRole] = await db
      .insert(caseRoles)
      .values(insertCaseRole)
      .returning();
    return caseRole;
  }

  async updateCaseRole(id: number, updateData: Partial<InsertCaseRole>): Promise<CaseRole | undefined> {
    const [caseRole] = await db
      .update(caseRoles)
      .set(updateData)
      .where(eq(caseRoles.id, id))
      .returning();
    return caseRole || undefined;
  }

  async deleteCaseRole(id: number): Promise<boolean> {
    const result = await db.delete(caseRoles).where(eq(caseRoles.id, id));
    return result.rowCount > 0;
  }

  async getCaseRolesByCase(legalCaseId: number): Promise<CaseRole[]> {
    return await db.select().from(caseRoles).where(eq(caseRoles.legalCaseId, legalCaseId));
  }

  // Process Stages
  async getProcessStage(id: number): Promise<ProcessStage | undefined> {
    const [processStage] = await db.select().from(processStages).where(eq(processStages.id, id));
    return processStage || undefined;
  }

  async createProcessStage(insertProcessStage: InsertProcessStage): Promise<ProcessStage> {
    const [processStage] = await db
      .insert(processStages)
      .values(insertProcessStage)
      .returning();
    return processStage;
  }

  async updateProcessStage(id: number, updateData: Partial<InsertProcessStage>): Promise<ProcessStage | undefined> {
    const [processStage] = await db
      .update(processStages)
      .set(updateData)
      .where(eq(processStages.id, id))
      .returning();
    return processStage || undefined;
  }

  async deleteProcessStage(id: number): Promise<boolean> {
    const result = await db.delete(processStages).where(eq(processStages.id, id));
    return result.rowCount > 0;
  }

  async getProcessStagesByCase(legalCaseId: number): Promise<ProcessStage[]> {
    return await db.select().from(processStages).where(eq(processStages.legalCaseId, legalCaseId)).orderBy(processStages.order);
  }

  // Documents
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateDocument(id: number, updateData: Partial<InsertDocument>): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, id))
      .returning();
    return document || undefined;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return result.rowCount > 0;
  }

  async getDocumentsByCase(legalCaseId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.legalCaseId, legalCaseId)).orderBy(desc(documents.generatedAt));
  }

  // Activities
  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async updateActivity(id: number, updateData: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [activity] = await db
      .update(activities)
      .set(updateData)
      .where(eq(activities.id, id))
      .returning();
    return activity || undefined;
  }

  async deleteActivity(id: number): Promise<boolean> {
    const result = await db.delete(activities).where(eq(activities.id, id));
    return result.rowCount > 0;
  }

  async getActivitiesByCase(legalCaseId: number): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.legalCaseId, legalCaseId)).orderBy(desc(activities.activityDate));
  }

  // Tasks
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateTask(id: number, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount > 0;
  }

  async getTasksByCase(legalCaseId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.legalCaseId, legalCaseId)).orderBy(tasks.dueDate);
  }

  async getTasksByUser(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.assignedUserId, userId)).orderBy(tasks.dueDate);
  }

  async getOverdueTasks(): Promise<Task[]> {
    const now = new Date();
    return await db.select().from(tasks).where(
      and(
        isNull(tasks.completedAt),
        eq(tasks.status, 'pending')
      )
    ).orderBy(tasks.dueDate);
  }

  async getUrgentTasks(): Promise<Task[]> {
    return await db.select().from(tasks).where(
      and(
        isNull(tasks.completedAt),
        eq(tasks.priority, 'urgent')
      )
    ).orderBy(tasks.dueDate);
  }

  // Audit Logs
  async createAuditLog(insertAuditLog: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db
      .insert(auditLogs)
      .values(insertAuditLog)
      .returning();
    return auditLog;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(limit);
  }

  async getAuditLogsByUser(userId: number): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.timestamp));
  }

  async getAuditLogsByEntity(entityType: string, entityId: number): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).where(
      and(
        eq(auditLogs.entityType, entityType),
        eq(auditLogs.entityId, entityId)
      )
    ).orderBy(desc(auditLogs.timestamp));
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
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count active cases
    const activeCasesResult = await db.select({count: legalCases.id}).from(legalCases).where(eq(legalCases.status, 'active'));
    const activeCases = activeCasesResult.length;

    // Count pending tasks
    const pendingTasksResult = await db.select({count: tasks.id}).from(tasks).where(
      and(isNull(tasks.completedAt), eq(tasks.status, 'pending'))
    );
    const pendingTasks = pendingTasksResult.length;

    // Count overdue tasks
    const overdueTasksResult = await db.select({count: tasks.id}).from(tasks).where(
      and(
        isNull(tasks.completedAt),
        eq(tasks.status, 'pending')
      )
    );
    const overdueTasks = overdueTasksResult.length;

    // Count active clients
    const activeClientsResult = await db.select({count: clients.id}).from(clients).where(eq(clients.isActive, true));
    const activeClients = activeClientsResult.length;

    // Count documents this month
    const documentsThisMonthResult = await db.select({count: documents.id}).from(documents);
    const documentsThisMonth = documentsThisMonthResult.length;

    // Count new clients this month
    const newClientsThisMonthResult = await db.select({count: clients.id}).from(clients);
    const newClientsThisMonth = newClientsThisMonthResult.length;

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