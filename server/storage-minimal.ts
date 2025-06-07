import type { 
  User, Role, Client, Company, Contact, Provider, Court, CaseType, StudioRole,
  LegalCase, CaseRole, ProcessStage, Document, Activity, Task, AuditLog,
  InsertUser, InsertRole, InsertClient, InsertCompany, InsertContact, InsertProvider,
  InsertCourt, InsertCaseType, InsertStudioRole, InsertLegalCase, InsertCaseRole,
  InsertProcessStage, InsertDocument, InsertActivity, InsertTask, InsertAuditLog
} from "../shared/schema";

export interface IStorage {
  // Users and Authentication
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

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
  private users: Map<number, User> = new Map();
  private currentId: number = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Create default admin user
    const adminUser: User = {
      id: 1,
      username: "admin",
      email: "admin@miscausas.cl",
      password: "admin123", // In production, this should be hashed
      firstName: "Admin",
      lastName: "Usuario",
      isActive: true,
      createdAt: new Date(),
      roleId: 1,
      lastLogin: null
    };
    this.users.set(1, adminUser);
    this.currentId = 2;
  }

  private getNextId(): number {
    return this.currentId++;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const [id, user] of this.users.entries()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const [id, user] of this.users.entries()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.getNextId();
    const user: User = {
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
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

    const updatedUser: User = {
      ...user,
      ...updateData,
      id // Ensure ID doesn't change
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getDashboardStats(): Promise<{
    activeCases: number;
    pendingTasks: number;
    overdueTasks: number;
    activeClients: number;
    documentsThisMonth: number;
    newClientsThisMonth: number;
  }> {
    // Return mock stats for now
    return {
      activeCases: 15,
      pendingTasks: 8,
      overdueTasks: 3,
      activeClients: 25,
      documentsThisMonth: 12,
      newClientsThisMonth: 4
    };
  }
}

export const storage = new MemStorage();