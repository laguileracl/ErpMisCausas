import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users and Roles
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions").notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  roleId: integer("role_id").references(() => roles.id),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Clients (can be individuals or companies)
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'individual' | 'company'
  firstName: text("first_name"), // for individuals
  lastName: text("last_name"), // for individuals
  companyName: text("company_name"), // for companies
  rut: text("rut").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  region: text("region"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Companies/Communities (separate from clients for complex relationships)
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rut: text("rut").notNull().unique(),
  type: text("type").notNull(), // 'company' | 'community' | 'foundation' | etc.
  legalRepresentative: text("legal_representative"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  region: text("region"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Contacts (people linked to companies)
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  position: text("position"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relationship between contacts and companies
export const companyContacts = pgTable("company_contacts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  contactId: integer("contact_id").references(() => contacts.id, { onDelete: "cascade" }).notNull(),
  role: text("role"), // 'manager' | 'representative' | 'accountant' | etc.
  isPrimary: boolean("is_primary").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  notes: text("notes"),
});

// Providers
export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rut: text("rut"),
  type: text("type").notNull(), // 'service' | 'product' | 'expert' | etc.
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  region: text("region"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Courts
export const courts = pgTable("courts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'civil' | 'criminal' | 'labor' | 'family' | 'tax' | etc.
  jurisdiction: text("jurisdiction").notNull(),
  address: text("address"),
  city: text("city").notNull(),
  region: text("region").notNull(),
  phone: text("phone"),
  email: text("email"),
  isActive: boolean("is_active").notNull().default(true),
});

// Case Types
export const caseTypes = pgTable("case_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  workflow: jsonb("workflow").notNull().default([]), // stages and deadlines
  isActive: boolean("is_active").notNull().default(true),
});

// Studio Roles in Cases
export const studioRoles = pgTable("studio_roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // 'plaintiff_representative' | 'liquidator' | 'third_party' | 'own_case' | etc.
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
});

// Legal Cases (called "negocios" in the system)
export const legalCases = pgTable("legal_cases", {
  id: serial("id").primaryKey(),
  rol: text("rol").notNull(), // ROL/RIT number
  title: text("title").notNull(),
  description: text("description"),
  caseTypeId: integer("case_type_id").references(() => caseTypes.id).notNull(),
  studioRoleId: integer("studio_role_id").references(() => studioRoles.id).notNull(),
  status: text("status").notNull().default('active'), // 'active' | 'suspended' | 'closed' | 'archived'
  priority: text("priority").notNull().default('medium'), // 'low' | 'medium' | 'high' | 'urgent'
  estimatedValue: decimal("estimated_value", { precision: 15, scale: 2 }),
  startDate: timestamp("start_date").notNull().defaultNow(),
  expectedEndDate: timestamp("expected_end_date"),
  actualEndDate: timestamp("actual_end_date"),
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relationship between cases and courts
export const caseCourts = pgTable("case_courts", {
  id: serial("id").primaryKey(),
  legalCaseId: integer("legal_case_id").references(() => legalCases.id).notNull(),
  courtId: integer("court_id").references(() => courts.id).notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

// Case Roles (roles of clients/contacts/companies in each case)
export const caseRoles = pgTable("case_roles", {
  id: serial("id").primaryKey(),
  legalCaseId: integer("legal_case_id").references(() => legalCases.id).notNull(),
  entityType: text("entity_type").notNull(), // 'client' | 'contact' | 'company'
  entityId: integer("entity_id").notNull(), // references the appropriate table
  role: text("role").notNull(), // 'plaintiff' | 'defendant' | 'third_party' | 'creditor' | 'lawyer' | 'witness' | etc.
  isActive: boolean("is_active").notNull().default(true),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  notes: text("notes"),
});

// Process Stages
export const processStages = pgTable("process_stages", {
  id: serial("id").primaryKey(),
  legalCaseId: integer("legal_case_id").references(() => legalCases.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default('pending'), // 'pending' | 'in_progress' | 'completed' | 'skipped'
  expectedStartDate: timestamp("expected_start_date"),
  actualStartDate: timestamp("actual_start_date"),
  expectedEndDate: timestamp("expected_end_date"),
  actualEndDate: timestamp("actual_end_date"),
  order: integer("order").notNull(),
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  legalCaseId: integer("legal_case_id").references(() => legalCases.id),
  templateName: text("template_name"),
  title: text("title").notNull(),
  content: text("content"),
  filePath: text("file_path"),
  fileType: text("file_type").notNull(), // 'pdf' | 'doc' | 'docx' | etc.
  fileSize: integer("file_size"),
  parameters: jsonb("parameters").default({}),
  status: text("status").notNull().default('draft'), // 'draft' | 'generated' | 'sent' | 'signed'
  generatedByUserId: integer("generated_by_user_id").references(() => users.id),
  generatedAt: timestamp("generated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Activities/Comments
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  legalCaseId: integer("legal_case_id").references(() => legalCases.id),
  type: text("type").notNull(), // 'call' | 'email' | 'whatsapp' | 'meeting' | 'document' | 'task' | 'note'
  title: text("title").notNull(),
  description: text("description"),
  contactMethod: text("contact_method"), // for communications
  duration: integer("duration"), // in minutes
  outcome: text("outcome"),
  followUpRequired: boolean("follow_up_required").notNull().default(false),
  followUpDate: timestamp("follow_up_date"),
  userId: integer("user_id").references(() => users.id).notNull(),
  activityDate: timestamp("activity_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tasks and Alarms
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  legalCaseId: integer("legal_case_id").references(() => legalCases.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'deadline' | 'hearing' | 'meeting' | 'document' | 'follow_up' | etc.
  priority: text("priority").notNull().default('medium'), // 'low' | 'medium' | 'high' | 'urgent'
  status: text("status").notNull().default('pending'), // 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue'
  assignedUserId: integer("assigned_user_id").references(() => users.id).notNull(),
  createdByUserId: integer("created_by_user_id").references(() => users.id).notNull(),
  dueDate: timestamp("due_date").notNull(),
  reminderDate: timestamp("reminder_date"),
  completedAt: timestamp("completed_at"),
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Audit Log
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout'
  entityType: text("entity_type"), // 'case' | 'client' | 'document' | etc.
  entityId: integer("entity_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Schema exports for forms
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastLogin: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });
export const insertCompanyContactSchema = createInsertSchema(companyContacts).omit({ id: true, startDate: true });
export const insertCaseCourtSchema = createInsertSchema(caseCourts).omit({ id: true, addedAt: true });
export const insertProviderSchema = createInsertSchema(providers).omit({ id: true, createdAt: true });
export const insertCourtSchema = createInsertSchema(courts).omit({ id: true });
export const insertCaseTypeSchema = createInsertSchema(caseTypes).omit({ id: true });
export const insertStudioRoleSchema = createInsertSchema(studioRoles).omit({ id: true });
export const insertLegalCaseSchema = createInsertSchema(legalCases).omit({ id: true, createdAt: true });
export const insertCaseRoleSchema = createInsertSchema(caseRoles).omit({ id: true, startDate: true });
export const insertProcessStageSchema = createInsertSchema(processStages).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, generatedAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, timestamp: true });

// Type exports
export type Role = typeof roles.$inferSelect;
export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type CompanyContact = typeof companyContacts.$inferSelect;
export type CaseCourt = typeof caseCourts.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type Court = typeof courts.$inferSelect;
export type CaseType = typeof caseTypes.$inferSelect;
export type StudioRole = typeof studioRoles.$inferSelect;
export type LegalCase = typeof legalCases.$inferSelect;
export type CaseRole = typeof caseRoles.$inferSelect;
export type ProcessStage = typeof processStages.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertCompanyContact = z.infer<typeof insertCompanyContactSchema>;
export type InsertCaseCourt = z.infer<typeof insertCaseCourtSchema>;
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type InsertCourt = z.infer<typeof insertCourtSchema>;
export type InsertCaseType = z.infer<typeof insertCaseTypeSchema>;
export type InsertStudioRole = z.infer<typeof insertStudioRoleSchema>;
export type InsertLegalCase = z.infer<typeof insertLegalCaseSchema>;
export type InsertCaseRole = z.infer<typeof insertCaseRoleSchema>;
export type InsertProcessStage = z.infer<typeof insertProcessStageSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Authentication schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginSchema>;
