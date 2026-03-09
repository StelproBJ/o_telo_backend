import { db } from '../db/client';
import { notifications } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';

type NotificationType = 'REJECTION' | 'WARNING' | 'SUSPENSION' | 'INFO';

export class NotificationService {
  /**
   * Créer une notification
   */
  async create(userId: string, type: NotificationType, message: string) {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        message,
        isRead: 0
      })
      .returning();

    console.log(`✅ Notification créée: ${type} pour user ${userId}`);
    return notification;
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  async getUserNotifications(userId: string, limit: number = 50) {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  /**
   * Compter les notifications non lues
   */
  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, 0)
        )
      );

    return result.length;
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string) {
    await db
      .update(notifications)
      .set({ isRead: 1 })
      .where(eq(notifications.id, notificationId));
  }

  /**
   * Marquer toutes les notifications d'un user comme lues
   */
  async markAllAsRead(userId: string) {
    await db
      .update(notifications)
      .set({ isRead: 1 })
      .where(eq(notifications.userId, userId));
  }

  /**
   * Supprimer une notification
   */
  async delete(notificationId: string) {
    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));
  }
}

export const notificationService = new NotificationService();