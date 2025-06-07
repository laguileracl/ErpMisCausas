import { db } from "./db";
import { 
  notifications, 
  userNotificationPreferences, 
  tasks, 
  users, 
  legalCases,
  activities,
  type InsertNotification,
  type Notification,
  type UserNotificationPreference
} from "@shared/schema";
import { eq, and, lte, gte, isNull, or } from "drizzle-orm";
import nodemailer from "nodemailer";

export class NotificationService {
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Create notification in database
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return created;
  }

  // Get user notification preferences
  async getUserPreferences(userId: number): Promise<UserNotificationPreference[]> {
    return await db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, userId));
  }

  // Set default preferences for new user
  async setDefaultPreferences(userId: number): Promise<void> {
    const defaultPreferences = [
      {
        userId,
        notificationType: "task_due",
        inAppEnabled: true,
        emailEnabled: true,
        daysBeforeDue: 3,
      },
      {
        userId,
        notificationType: "case_update",
        inAppEnabled: true,
        emailEnabled: false,
        daysBeforeDue: null,
      },
      {
        userId,
        notificationType: "activity_added",
        inAppEnabled: true,
        emailEnabled: false,
        daysBeforeDue: null,
      },
      {
        userId,
        notificationType: "document_uploaded",
        inAppEnabled: true,
        emailEnabled: false,
        daysBeforeDue: null,
      },
    ];

    await db.insert(userNotificationPreferences).values(defaultPreferences);
  }

  // Update user preferences
  async updatePreferences(
    userId: number,
    notificationType: string,
    preferences: Partial<UserNotificationPreference>
  ): Promise<void> {
    await db
      .update(userNotificationPreferences)
      .set(preferences)
      .where(
        and(
          eq(userNotificationPreferences.userId, userId),
          eq(userNotificationPreferences.notificationType, notificationType)
        )
      );
  }

  // Check for tasks due soon and create notifications
  async checkTasksDueSoon(): Promise<void> {
    console.log("Checking for tasks due soon...");

    // Get all users with task_due preferences
    const preferences = await db
      .select()
      .from(userNotificationPreferences)
      .where(
        and(
          eq(userNotificationPreferences.notificationType, "task_due"),
          eq(userNotificationPreferences.inAppEnabled, true)
        )
      );

    for (const pref of preferences) {
      const daysBeforeDue = pref.daysBeforeDue || 3;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysBeforeDue);

      // Find tasks due within the specified days
      const dueTasks = await db
        .select({
          task: tasks,
          user: users,
          legalCase: legalCases,
        })
        .from(tasks)
        .leftJoin(users, eq(tasks.assignedUserId, users.id))
        .leftJoin(legalCases, eq(tasks.legalCaseId, legalCases.id))
        .where(
          and(
            eq(tasks.assignedUserId, pref.userId),
            lte(tasks.dueDate, dueDate),
            gte(tasks.dueDate, new Date()),
            eq(tasks.status, "pending")
          )
        );

      for (const { task, user, legalCase } of dueTasks) {
        // Check if notification already exists for this task
        const existingNotification = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, pref.userId),
              eq(notifications.type, "task_due"),
              eq(notifications.entityType, "task"),
              eq(notifications.entityId, task.id)
            )
          )
          .limit(1);

        if (existingNotification.length === 0) {
          const daysUntilDue = Math.ceil(
            (new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );

          const notification: InsertNotification = {
            userId: pref.userId,
            type: "task_due",
            title: `Tarea próxima a vencer: ${task.name}`,
            message: `La tarea "${task.name}" en la causa "${legalCase?.name || 'Sin causa'}" vence en ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''}`,
            entityType: "task",
            entityId: task.id,
            priority: daysUntilDue <= 1 ? "urgent" : daysUntilDue <= 2 ? "high" : "normal",
          };

          const created = await this.createNotification(notification);

          // Send email if enabled
          if (pref.emailEnabled && user?.email) {
            await this.sendTaskDueEmail(user.email, task, legalCase, daysUntilDue);
            await db
              .update(notifications)
              .set({ isEmailSent: true })
              .where(eq(notifications.id, created.id));
          }
        }
      }
    }
  }

  // Create notification for case update
  async notifyCaseUpdate(
    legalCaseId: number,
    updateType: string,
    message: string,
    priority: "low" | "normal" | "high" | "urgent" = "normal"
  ): Promise<void> {
    // Get case details
    const [legalCase] = await db
      .select()
      .from(legalCases)
      .where(eq(legalCases.id, legalCaseId))
      .limit(1);

    if (!legalCase) return;

    // Get users involved in this case (assignees, responsible users, etc.)
    const involvedUsers = await db
      .select({ userId: tasks.assignedUserId })
      .from(tasks)
      .where(
        and(
          eq(tasks.legalCaseId, legalCaseId),
          isNull(tasks.assignedUserId) === false
        )
      );

    const uniqueUserIds = [...new Set(involvedUsers.map(u => u.userId).filter(Boolean))];

    for (const userId of uniqueUserIds) {
      if (!userId) continue;

      // Check user preferences
      const [pref] = await db
        .select()
        .from(userNotificationPreferences)
        .where(
          and(
            eq(userNotificationPreferences.userId, userId),
            eq(userNotificationPreferences.notificationType, "case_update"),
            eq(userNotificationPreferences.inAppEnabled, true)
          )
        )
        .limit(1);

      if (pref) {
        const notification: InsertNotification = {
          userId,
          type: "case_update",
          title: `Actualización en causa: ${legalCase.name}`,
          message: message,
          entityType: "legal_case",
          entityId: legalCaseId,
          priority,
        };

        const created = await this.createNotification(notification);

        // Send email if enabled
        if (pref.emailEnabled) {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (user?.email) {
            await this.sendCaseUpdateEmail(user.email, legalCase, message);
            await db
              .update(notifications)
              .set({ isEmailSent: true })
              .where(eq(notifications.id, created.id));
          }
        }
      }
    }
  }

  // Create notification for new activity
  async notifyActivityAdded(
    activityId: number,
    legalCaseId: number
  ): Promise<void> {
    // Get activity and case details
    const [activity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);

    const [legalCase] = await db
      .select()
      .from(legalCases)
      .where(eq(legalCases.id, legalCaseId))
      .limit(1);

    if (!activity || !legalCase) return;

    // Get users involved in this case
    const involvedUsers = await db
      .select({ userId: tasks.assignedUserId })
      .from(tasks)
      .where(
        and(
          eq(tasks.legalCaseId, legalCaseId),
          isNull(tasks.assignedUserId) === false
        )
      );

    const uniqueUserIds = [...new Set(involvedUsers.map(u => u.userId).filter(Boolean))];

    for (const userId of uniqueUserIds) {
      if (!userId) continue;

      // Check user preferences
      const [pref] = await db
        .select()
        .from(userNotificationPreferences)
        .where(
          and(
            eq(userNotificationPreferences.userId, userId),
            eq(userNotificationPreferences.notificationType, "activity_added"),
            eq(userNotificationPreferences.inAppEnabled, true)
          )
        )
        .limit(1);

      if (pref) {
        const notification: InsertNotification = {
          userId,
          type: "activity_added",
          title: `Nueva actividad en causa: ${legalCase.name}`,
          message: `Se ha registrado una nueva actividad: ${activity.description}`,
          entityType: "activity",
          entityId: activityId,
          priority: "normal",
        };

        await this.createNotification(notification);
      }
    }
  }

  // Get user notifications
  async getUserNotifications(
    userId: number,
    options: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Notification[]> {
    const { unreadOnly = false, limit = 50, offset = 0 } = options;

    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt)
      .limit(limit)
      .offset(offset);

    if (unreadOnly) {
      query = query.where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    }

    return await query;
  }

  // Mark notification as read
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
  }

  // Email sending functions
  private async sendTaskDueEmail(
    email: string,
    task: any,
    legalCase: any,
    daysUntilDue: number
  ): Promise<void> {
    const subject = `Tarea próxima a vencer: ${task.name}`;
    const html = `
      <h2>MisCausas.cl - Recordatorio de Tarea</h2>
      <p>Estimado/a usuario/a,</p>
      <p>Le recordamos que tiene una tarea próxima a vencer:</p>
      <ul>
        <li><strong>Tarea:</strong> ${task.name}</li>
        <li><strong>Causa:</strong> ${legalCase?.name || 'Sin causa'}</li>
        <li><strong>Fecha de vencimiento:</strong> ${new Date(task.dueDate).toLocaleDateString()}</li>
        <li><strong>Días restantes:</strong> ${daysUntilDue}</li>
      </ul>
      <p>Por favor, ingrese al sistema para revisar los detalles de la tarea.</p>
      <p>Saludos cordiales,<br>Equipo MisCausas.cl</p>
    `;

    await this.emailTransporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@miscausas.cl",
      to: email,
      subject,
      html,
    });
  }

  private async sendCaseUpdateEmail(
    email: string,
    legalCase: any,
    message: string
  ): Promise<void> {
    const subject = `Actualización en causa: ${legalCase.name}`;
    const html = `
      <h2>MisCausas.cl - Actualización de Causa</h2>
      <p>Estimado/a usuario/a,</p>
      <p>Se ha registrado una actualización en la siguiente causa:</p>
      <ul>
        <li><strong>Causa:</strong> ${legalCase.name}</li>
        <li><strong>RIT:</strong> ${legalCase.rit || 'N/A'}</li>
        <li><strong>Actualización:</strong> ${message}</li>
      </ul>
      <p>Por favor, ingrese al sistema para revisar los detalles.</p>
      <p>Saludos cordiales,<br>Equipo MisCausas.cl</p>
    `;

    await this.emailTransporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@miscausas.cl",
      to: email,
      subject,
      html,
    });
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Scheduled function to check for notifications
export async function runNotificationCheck(): Promise<void> {
  try {
    console.log("Running notification check...");
    await notificationService.checkTasksDueSoon();
    console.log("Notification check completed");
  } catch (error) {
    console.error("Error running notification check:", error);
  }
}