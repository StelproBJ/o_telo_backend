import { GraphQLError } from 'graphql';
import { db } from '../db/client';
import { users, hotels, adminLogs } from '../db/schema';
import { notificationService } from './notification.service';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export class AdminService {
  /**
   * Vérifier le mot de passe admin
   */
  async verifyAdminPassword(userId: string, adminPassword: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.role !== 'ADMIN' || !user.adminPassword) {
      return false;
    }

    return await bcrypt.compare(adminPassword, user.adminPassword);
  }

  /**
   * Approuver un hôtel
   */
  async approveHotel(adminId: string, hotelId: string) {
    const [hotel] = await db
      .select()
      .from(hotels)
      .where(eq(hotels.id, hotelId))
      .limit(1);

    if (!hotel) {
      throw new GraphQLError('Hotel not found');
    }

    if (hotel.status === 'APPROVED') {
      throw new GraphQLError('Hotel already approved');
    }

    await db
      .update(hotels)
      .set({
        status: 'APPROVED',
        updatedAt: new Date()
      })
      .where(eq(hotels.id, hotelId));

    // Log action
    await this.logAction(adminId, 'APPROVE_HOTEL', undefined, hotelId, `Approved hotel: ${hotel.name}`);

    // Notification positive
    await notificationService.create(
      hotel.createdBy,
      'INFO',
      `🎉 Félicitations! Votre soumission "${hotel.name}" a été approuvée et est maintenant visible publiquement.`
    );

    console.log(`✅ Hotel ${hotel.name} approved by admin ${adminId}`);
  }

  /**
   * Rejeter un hôtel avec gestion des warnings et suspensions
   */
  async rejectHotel(adminId: string, hotelId: string, reason: string) {
    const [hotel] = await db
      .select()
      .from(hotels)
      .where(eq(hotels.id, hotelId))
      .limit(1);

    if (!hotel) {
      throw new GraphQLError('Hotel not found');
    }

    if (hotel.locked === 1) {
      throw new GraphQLError('This hotel submission is locked and cannot be modified');
    }

    const newRejectionCount = hotel.rejectionCount + 1;
    const isLocked = newRejectionCount >= 3;

    // Mettre à jour l'hôtel
    await db
      .update(hotels)
      .set({
        status: 'REJECTED',
        rejectionReason: reason,
        rejectionCount: newRejectionCount,
        locked: isLocked ? 1 : 0,
        updatedAt: new Date()
      })
      .where(eq(hotels.id, hotelId));

    // Notification de rejet
    await notificationService.create(
      hotel.createdBy,
      'REJECTION',
      `❌ Votre soumission "${hotel.name}" a été rejetée. Raison: ${reason}`
    );

    // Si c'est le 3ème rejet → verrouillage et warning
    if (isLocked) {
      await notificationService.create(
        hotel.createdBy,
        'WARNING',
        `⚠️ Votre soumission "${hotel.name}" a été verrouillée après 3 rejets. Contactez un administrateur si vous pensez qu'il s'agit d'une erreur.`
      );

      // Augmenter warning_count
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, hotel.createdBy))
        .limit(1);

      const newWarningCount = user.warningCount + 1;

      await db
        .update(users)
        .set({ warningCount: newWarningCount })
        .where(eq(users.id, hotel.createdBy));

      console.log(`⚠️ User ${user.username} warning count: ${newWarningCount}`);

      // Si warning_count >= 3 → notification d'avertissement
      if (newWarningCount >= 3 && newWarningCount < 5) {
        await notificationService.create(
          hotel.createdBy,
          'WARNING',
          `⚠️ Attention: vous avez reçu ${newWarningCount} avertissements. À 5 avertissements, votre compte sera suspendu.`
        );
      }

      // Si warning_count >= 5 → suspension automatique
      if (newWarningCount >= 5) {
        await db
          .update(users)
          .set({ isSuspended: 1 })
          .where(eq(users.id, hotel.createdBy));

        await notificationService.create(
          hotel.createdBy,
          'SUSPENSION',
          `🚫 Votre compte a été suspendu suite à de multiples rejets de soumissions. Veuillez contacter un administrateur pour plus d'informations.`
        );

        console.log(`🚫 User ${user.username} SUSPENDED after ${newWarningCount} warnings`);
      }
    }

    // Log action
    await this.logAction(adminId, 'REJECT_HOTEL', undefined, hotelId, `Rejected hotel: ${hotel.name}. Reason: ${reason}`);

    console.log(`❌ Hotel ${hotel.name} rejected by admin ${adminId}. Count: ${newRejectionCount}`);
  }

  /**
   * Réinitialiser les warnings d'un utilisateur
   */
  async resetUserWarnings(adminId: string, targetUserId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!user) {
      throw new GraphQLError('User not found');
    }

    await db
      .update(users)
      .set({
        warningCount: 0,
        isSuspended: 0,
        resetCount: user.resetCount + 1
      })
      .where(eq(users.id, targetUserId));

    await notificationService.create(
      targetUserId,
      'INFO',
      `✅ Vos avertissements ont été réinitialisés par un administrateur. Vous pouvez à nouveau soumettre des hôtels.`
    );

    await this.logAction(adminId, 'RESET_WARNINGS', targetUserId, undefined, `Reset warnings for user: ${user.username}`);

    console.log(`✅ Warnings reset for user ${user.username} by admin ${adminId}`);
  }

  /**
   * Déverrouiller une soumission d'hôtel
   */
  async unlockHotel(adminId: string, hotelId: string) {
    const [hotel] = await db
      .select()
      .from(hotels)
      .where(eq(hotels.id, hotelId))
      .limit(1);

    if (!hotel) {
      throw new GraphQLError('Hotel not found');
    }

    await db
      .update(hotels)
      .set({
        locked: 0,
        rejectionCount: 0,
        status: 'PENDING'
      })
      .where(eq(hotels.id, hotelId));

    await notificationService.create(
      hotel.createdBy,
      'INFO',
      `🔓 Votre soumission "${hotel.name}" a été déverrouillée par un administrateur. Vous pouvez la modifier.`
    );

    await this.logAction(adminId, 'UNLOCK_HOTEL', undefined, hotelId, `Unlocked hotel: ${hotel.name}`);

    console.log(`🔓 Hotel ${hotel.name} unlocked by admin ${adminId}`);
  }

  /**
   * Logger une action admin
   */
  async logAction(
    adminId: string,
    action: string,
    targetUserId?: string,
    targetHotelId?: string,
    details?: string
  ) {
    await db.insert(adminLogs).values({
      adminId,
      action,
      targetUserId: targetUserId || null,
      targetHotelId: targetHotelId || null,
      details: details || null
    });
  }

  /**
   * Statistiques pour le dashboard admin
   */
  async getDashboardStats() {
    // Hotels en attente
    const pendingHotelsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(hotels)
      .where(eq(hotels.status, 'PENDING'));

    // Utilisateurs suspendus
    const suspendedUsersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isSuspended, 1));

    // Soumissions verrouillées
    const lockedHotelsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(hotels)
      .where(eq(hotels.locked, 1));

    // Total des hotels
    const totalHotelsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(hotels);

    // Total des utilisateurs
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);

    return {
      pendingHotels: pendingHotelsResult[0]?.count || 0,
      suspendedUsers: suspendedUsersResult[0]?.count || 0,
      lockedSubmissions: lockedHotelsResult[0]?.count || 0,
      totalHotels: totalHotelsResult[0]?.count || 0,
      totalUsers: totalUsersResult[0]?.count || 0
    };
  }

  /**
   * Récupérer tous les hotels avec filtres admin
   */
  async getAllHotels(status?: string, locked?: boolean) {
    let query = db.select().from(hotels);

    // Pas de filtre de status car admin voit tout
    return await query;
  }

  /**
   * Récupérer tous les utilisateurs avec warnings
   */
  async getAllUsers() {
    return await db.select().from(users);
  }

  /**
   * Récupérer les logs admin récents
   */
  async getAdminLogs(limit: number = 50) {
    return await db
      .select()
      .from(adminLogs)
      .orderBy(sql`created_at DESC`)
      .limit(limit);
  }
}

export const adminService = new AdminService();