import bcrypt from "bcrypt";
import crypto from "crypto-js";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { 
  users, 
  userSessions, 
  securityLogs, 
  usersSecurityUpdate,
  type InsertSecurityLog,
  type InsertUserSession,
  type InsertUsersSecurity,
  type UserSession,
  type UsersSecurity
} from "@shared/schema";
import { eq, and, gte, lt, or, isNull } from "drizzle-orm";

export interface AuthResult {
  success: boolean;
  user?: any;
  session?: UserSession;
  error?: string;
  lockoutUntil?: Date;
}

export class SecurityService {
  private readonly SALT_ROUNDS = 12;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

  // Hash password with salt
  async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return { hash, salt };
  }

  // Verify password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Generate secure session token
  generateSessionToken(): string {
    return crypto.lib.WordArray.random(32).toString();
  }

  // Generate JWT token
  generateJWT(userId: number, sessionId: number): string {
    return jwt.sign(
      { userId, sessionId },
      this.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  // Verify JWT token
  verifyJWT(token: string): { userId: number; sessionId: number } | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as { userId: number; sessionId: number };
    } catch {
      return null;
    }
  }

  // Log security event
  async logSecurityEvent(event: InsertSecurityLog): Promise<void> {
    try {
      await db.insert(securityLogs).values(event);
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }

  // Check if user is locked out
  async isUserLockedOut(userId: number): Promise<boolean> {
    const [userSecurity] = await db
      .select()
      .from(usersSecurityUpdate)
      .where(eq(usersSecurityUpdate.userId, userId))
      .limit(1);

    if (!userSecurity) return false;

    if (userSecurity.lockedUntil && new Date() < userSecurity.lockedUntil) {
      return true;
    }

    // Clear lockout if expired
    if (userSecurity.lockedUntil && new Date() >= userSecurity.lockedUntil) {
      await db
        .update(usersSecurityUpdate)
        .set({ 
          lockedUntil: null, 
          failedLoginAttempts: 0 
        })
        .where(eq(usersSecurityUpdate.userId, userId));
    }

    return false;
  }

  // Authenticate user
  async authenticateUser(
    username: string, 
    password: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<AuthResult> {
    // Find user by username
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      await this.logSecurityEvent({
        eventType: "login_failed",
        ipAddress,
        userAgent,
        details: { username, reason: "user_not_found" }
      });
      return { success: false, error: "Credenciales inválidas" };
    }

    // Check if user is locked out
    if (await this.isUserLockedOut(user.id)) {
      const [userSecurity] = await db
        .select()
        .from(usersSecurityUpdate)
        .where(eq(usersSecurityUpdate.userId, user.id))
        .limit(1);

      await this.logSecurityEvent({
        userId: user.id,
        eventType: "login_failed",
        ipAddress,
        userAgent,
        details: { username, reason: "account_locked" }
      });

      return { 
        success: false, 
        error: "Cuenta bloqueada por múltiples intentos fallidos",
        lockoutUntil: userSecurity?.lockedUntil || undefined
      };
    }

    // Get user security info
    let [userSecurity] = await db
      .select()
      .from(usersSecurityUpdate)
      .where(eq(usersSecurityUpdate.userId, user.id))
      .limit(1);

    // Create security record if doesn't exist (for existing users)
    if (!userSecurity) {
      const { hash, salt } = await this.hashPassword(user.password);
      const securityData: InsertUsersSecurity = {
        userId: user.id,
        passwordHash: hash,
        passwordSalt: salt,
        lastPasswordChange: new Date(),
        failedLoginAttempts: 0,
      };

      await db.insert(usersSecurityUpdate).values(securityData);
      
      [userSecurity] = await db
        .select()
        .from(usersSecurityUpdate)
        .where(eq(usersSecurityUpdate.userId, user.id))
        .limit(1);
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, userSecurity!.passwordHash);

    if (!isValidPassword) {
      // Increment failed attempts
      const newFailedAttempts = (userSecurity!.failedLoginAttempts || 0) + 1;
      
      let updateData: any = {
        failedLoginAttempts: newFailedAttempts
      };

      // Lock account if max attempts reached
      if (newFailedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
      }

      await db
        .update(usersSecurityUpdate)
        .set(updateData)
        .where(eq(usersSecurityUpdate.userId, user.id));

      await this.logSecurityEvent({
        userId: user.id,
        eventType: "login_failed",
        ipAddress,
        userAgent,
        details: { 
          username, 
          reason: "invalid_password",
          failedAttempts: newFailedAttempts 
        }
      });

      return { success: false, error: "Credenciales inválidas" };
    }

    // Reset failed attempts on successful login
    await db
      .update(usersSecurityUpdate)
      .set({ 
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress 
      })
      .where(eq(usersSecurityUpdate.userId, user.id));

    // Create session
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

    const sessionData: InsertUserSession = {
      userId: user.id,
      sessionToken,
      ipAddress,
      userAgent,
      expiresAt
    };

    const [session] = await db
      .insert(userSessions)
      .values(sessionData)
      .returning();

    await this.logSecurityEvent({
      userId: user.id,
      eventType: "login_success",
      ipAddress,
      userAgent,
      details: { username }
    });

    return { 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        roleId: user.roleId
      }, 
      session 
    };
  }

  // Validate session
  async validateSession(sessionToken: string): Promise<AuthResult> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.sessionToken, sessionToken),
          eq(userSessions.isActive, true),
          gte(userSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      return { success: false, error: "Sesión inválida o expirada" };
    }

    // Update last activity
    await db
      .update(userSessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(userSessions.id, session.id));

    // Get user info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user || !user.isActive) {
      await this.invalidateSession(sessionToken);
      return { success: false, error: "Usuario inactivo" };
    }

    return { 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        roleId: user.roleId
      }, 
      session 
    };
  }

  // Check for session timeout
  async checkSessionTimeout(sessionToken: string): Promise<boolean> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken))
      .limit(1);

    if (!session) return true;

    // Get user timeout setting
    const [userSecurity] = await db
      .select()
      .from(usersSecurityUpdate)
      .where(eq(usersSecurityUpdate.userId, session.userId))
      .limit(1);

    const timeoutSeconds = userSecurity?.sessionTimeout || 3600; // Default 1 hour
    const timeoutMs = timeoutSeconds * 1000;
    const lastActivity = session.lastActivityAt.getTime();
    const now = Date.now();

    if (now - lastActivity > timeoutMs) {
      await this.invalidateSession(sessionToken);
      
      await this.logSecurityEvent({
        userId: session.userId,
        eventType: "session_timeout",
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        details: { sessionId: session.id }
      });

      return true;
    }

    return false;
  }

  // Invalidate session
  async invalidateSession(sessionToken: string): Promise<void> {
    await db
      .update(userSessions)
      .set({ isActive: false })
      .where(eq(userSessions.sessionToken, sessionToken));
  }

  // Invalidate all user sessions
  async invalidateAllUserSessions(userId: number): Promise<void> {
    await db
      .update(userSessions)
      .set({ isActive: false })
      .where(eq(userSessions.userId, userId));
  }

  // Change password
  async changePassword(
    userId: number, 
    currentPassword: string, 
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Get current user security info
    const [userSecurity] = await db
      .select()
      .from(usersSecurityUpdate)
      .where(eq(usersSecurityUpdate.userId, userId))
      .limit(1);

    if (!userSecurity) {
      return { success: false, error: "Usuario no encontrado" };
    }

    // Verify current password
    const isValidPassword = await this.verifyPassword(currentPassword, userSecurity.passwordHash);
    if (!isValidPassword) {
      await this.logSecurityEvent({
        userId,
        eventType: "password_change_failed",
        ipAddress,
        userAgent,
        details: { reason: "invalid_current_password" }
      });
      return { success: false, error: "Contraseña actual incorrecta" };
    }

    // Hash new password
    const { hash, salt } = await this.hashPassword(newPassword);

    // Update password
    await db
      .update(usersSecurityUpdate)
      .set({
        passwordHash: hash,
        passwordSalt: salt,
        lastPasswordChange: new Date(),
        requirePasswordChange: false
      })
      .where(eq(usersSecurityUpdate.userId, userId));

    // Update user table
    await db
      .update(users)
      .set({ password: hash })
      .where(eq(users.id, userId));

    // Invalidate all sessions except current one
    await this.invalidateAllUserSessions(userId);

    await this.logSecurityEvent({
      userId,
      eventType: "password_change",
      ipAddress,
      userAgent,
      details: { success: true }
    });

    return { success: true };
  }

  // Clean expired sessions
  async cleanExpiredSessions(): Promise<number> {
    const result = await db
      .update(userSessions)
      .set({ isActive: false })
      .where(
        and(
          eq(userSessions.isActive, true),
          lt(userSessions.expiresAt, new Date())
        )
      );

    return result.rowCount || 0;
  }

  // Get user security logs
  async getUserSecurityLogs(
    userId: number, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<any[]> {
    return await db
      .select()
      .from(securityLogs)
      .where(eq(securityLogs.userId, userId))
      .orderBy(securityLogs.timestamp)
      .limit(limit)
      .offset(offset);
  }

  // Get security statistics
  async getSecurityStats(): Promise<{
    totalLoginAttempts: number;
    failedLoginAttempts: number;
    activeSessions: number;
    lockedAccounts: number;
  }> {
    // This would need proper aggregation queries
    // For now, returning basic counts
    const activeSessions = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.isActive, true),
          gte(userSessions.expiresAt, new Date())
        )
      );

    const lockedAccounts = await db
      .select()
      .from(usersSecurityUpdate)
      .where(
        and(
          isNull(usersSecurityUpdate.lockedUntil) === false,
          gte(usersSecurityUpdate.lockedUntil, new Date())
        )
      );

    return {
      totalLoginAttempts: 0, // Would need aggregation
      failedLoginAttempts: 0, // Would need aggregation
      activeSessions: activeSessions.length,
      lockedAccounts: lockedAccounts.length
    };
  }
}

// Singleton instance
export const securityService = new SecurityService();

// Scheduled cleanup function
export async function runSecurityCleanup(): Promise<void> {
  try {
    console.log("Running security cleanup...");
    const cleanedSessions = await securityService.cleanExpiredSessions();
    console.log(`Cleaned up ${cleanedSessions} expired sessions`);
  } catch (error) {
    console.error("Error running security cleanup:", error);
  }
}