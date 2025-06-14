import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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

// Notifications system
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // 'task_due', 'case_update', 'activity_added', etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  entityType: varchar("entity_type", { length: 50 }), // 'task', 'legal_case', 'activity'
  entityId: integer("entity_id"),
  isRead: boolean("is_read").default(false).notNull(),
  isEmailSent: boolean("is_email_sent").default(false).notNull(),
  priority: varchar("priority", { length: 20 }).default("normal").notNull(), // 'low', 'normal', 'high', 'urgent'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

// User notification preferences
export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  notificationType: varchar("notification_type", { length: 50 }).notNull(),
  inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  daysBeforeDue: integer("days_before_due").default(3), // For task due notifications
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Security logs for login attempts and security events
export const securityLogs = pgTable("security_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  eventType: varchar("event_type", { length: 50 }).notNull(), // 'login_success', 'login_failed', 'password_change', 'session_timeout'
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  details: jsonb("details"), // Additional event details
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// User sessions for better session management
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Update users table to include security fields
export const usersSecurityUpdate = pgTable("users_security", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  passwordSalt: varchar("password_salt", { length: 255 }).notNull(),
  lastPasswordChange: timestamp("last_password_change").defaultNow().notNull(),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: varchar("last_login_ip", { length: 45 }),
  sessionTimeout: integer("session_timeout").default(3600).notNull(), // seconds
  requirePasswordChange: boolean("require_password_change").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas for new tables
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertUserNotificationPreferenceSchema = createInsertSchema(userNotificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSecurityLogSchema = createInsertSchema(securityLogs).omit({
  id: true,
  timestamp: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
  lastActivityAt: true,
});

export const insertUsersSecuritySchema = createInsertSchema(usersSecurityUpdate).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new tables
export type Notification = typeof notifications.$inferSelect;
export type UserNotificationPreference = typeof userNotificationPreferences.$inferSelect;
export type SecurityLog = typeof securityLogs.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;
export type UsersSecurity = typeof usersSecurityUpdate.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertUserNotificationPreference = z.infer<typeof insertUserNotificationPreferenceSchema>;
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type InsertUsersSecurity = z.infer<typeof insertUsersSecuritySchema>;

// Authentication schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginSchema>;

// Accounting Module Tables
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // asset, liability, equity, income, expense
  category: text("category").notNull(),
  parentId: integer("parent_id"),
  level: integer("level").notNull().default(1), // 1=Mayor, 2=Submayores, 3=Analíticas
  isActive: boolean("is_active").default(true),
  allowsMovement: boolean("allows_movement").default(true), // Si permite asientos directos
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vouchers = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  voucherNumber: text("voucher_number").notNull().unique(),
  legalCaseId: integer("legal_case_id"),
  contactId: integer("contact_id"),
  companyId: integer("company_id"),
  documentType: text("document_type").notNull(),
  folioNumber: text("folio_number").notNull(),
  issueDate: text("issue_date").notNull(),
  description: text("description").notNull(),
  comments: text("comments"),
  status: text("status").notNull().default("pending"),
  subtotal: integer("subtotal").notNull(),
  taxAmount: integer("tax_amount").notNull().default(0),
  total: integer("total").notNull(),
  attachments: text("attachments").array(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const voucherLines = pgTable("voucher_lines", {
  id: serial("id").primaryKey(),
  voucherId: integer("voucher_id").notNull(),
  accountId: integer("account_id").notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  totalAmount: integer("total_amount").notNull(),
  isTaxable: boolean("is_taxable").default(true),
  debitAmount: integer("debit_amount").notNull().default(0),
  creditAmount: integer("credit_amount").notNull().default(0),
  lineOrder: integer("line_order").notNull(),
});

// Cuenta Provisoria - Tabla específica para reportes tribunales
export const cuentaProvisoria = pgTable("cuenta_provisoria", {
  id: serial("id").primaryKey(),
  legalCaseId: integer("legal_case_id").notNull(),
  rol: text("rol").notNull(), // ROL del tribunal
  debtorName: text("debtor_name").notNull(),
  period: text("period").notNull(), // YYYY-MM format
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  totalIngresos: integer("total_ingresos").notNull().default(0),
  totalEgresos: integer("total_egresos").notNull().default(0),
  saldoAnterior: integer("saldo_anterior").notNull().default(0),
  saldoFinal: integer("saldo_final").notNull().default(0),
  observations: text("observations"),
  status: text("status").notNull().default("draft"), // draft, approved, submitted
  generatedAt: timestamp("generated_at").defaultNow(),
  createdBy: integer("created_by").notNull(),
});

// Detalle de movimientos para Cuenta Provisoria
export const cuentaProvisoriaMovements = pgTable("cuenta_provisoria_movements", {
  id: serial("id").primaryKey(),
  cuentaProvisoriaId: integer("cuenta_provisoria_id").notNull(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  documentType: text("document_type"), // boleta, factura, recibo, etc.
  documentNumber: text("document_number"),
  tipo: text("tipo").notNull(), // ingreso, egreso
  amount: integer("amount").notNull(),
  balance: integer("balance").notNull(), // saldo acumulado
  accountId: integer("account_id"), // relación con plan de cuentas
  voucherId: integer("voucher_id"), // relación con comprobante origen
  orderIndex: integer("order_index").notNull(),
});

// Insert schemas for accounting tables
export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVoucherSchema = createInsertSchema(vouchers).omit({
  id: true,
  voucherNumber: true, // Auto-generated
  createdAt: true,
  updatedAt: true,
});

export const insertVoucherLineSchema = createInsertSchema(voucherLines).omit({
  id: true,
});

export const insertCuentaProvisoriaSchema = createInsertSchema(cuentaProvisoria).omit({
  id: true,
  generatedAt: true,
});

export const insertCuentaProvisoriaMovementSchema = createInsertSchema(cuentaProvisoriaMovements).omit({
  id: true,
});

// Types for accounting tables
export type Account = typeof accounts.$inferSelect;
export type Voucher = typeof vouchers.$inferSelect;
export type VoucherLine = typeof voucherLines.$inferSelect;
export type CuentaProvisoria = typeof cuentaProvisoria.$inferSelect;
export type CuentaProvisoriaMovement = typeof cuentaProvisoriaMovements.$inferSelect;

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type InsertVoucherLine = z.infer<typeof insertVoucherLineSchema>;
export type InsertCuentaProvisoria = z.infer<typeof insertCuentaProvisoriaSchema>;
export type InsertCuentaProvisoriaMovement = z.infer<typeof insertCuentaProvisoriaMovementSchema>;
