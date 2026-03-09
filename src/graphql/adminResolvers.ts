import { GraphQLError } from 'graphql';
import { adminService } from '../services/admin.service';
import { notificationService } from '../services/notification.service';
import { requireAdmin, checkSuspension } from '../middleware/suspension';
import { db } from '../db/client';
import { users, hotels, adminLogs, notifications } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export const adminResolvers = {
  Query: {
    // ===== NOTIFICATIONS =====
    myNotifications: async (_: any, { limit = 50 }: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required');
      }

      const notifs = await notificationService.getUserNotifications(context.user.id, limit);
      
      return notifs.map(n => ({
        ...n,
        isRead: n.isRead === 1
      }));
    },

    unreadNotificationsCount: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required');
      }

      return await notificationService.getUnreadCount(context.user.id);
    },

    // ===== ADMIN QUERIES =====
    adminStats: async (_: any, __: any, context: any) => {
      requireAdmin(context);
      return await adminService.getDashboardStats();
    },

    adminAllHotels: async (_: any, __: any, context: any) => {
      requireAdmin(context);
      
      const allHotels = await db
        .select()
        .from(hotels)
        .orderBy(desc(hotels.createdAt));

      return allHotels.map(h => ({
        ...h,
        locked: h.locked === 1
      }));
    },

    adminAllUsers: async (_: any, __: any, context: any) => {
      requireAdmin(context);
      
      const allUsers = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt));

      return allUsers.map(u => ({
        ...u,
        isSuspended: u.isSuspended === 1
      }));
    },

    adminLogs: async (_: any, { limit = 50 }: any, context: any) => {
      requireAdmin(context);
      
      return await db
        .select()
        .from(adminLogs)
        .orderBy(desc(adminLogs.createdAt))
        .limit(limit);
    },
  },

  Mutation: {
    // ===== NOTIFICATIONS =====
    markNotificationAsRead: async (_: any, { id }: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required');
      }

      await notificationService.markAsRead(id);
      return true;
    },

    markAllNotificationsAsRead: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required');
      }

      await notificationService.markAllAsRead(context.user.id);
      return true;
    },

    deleteNotification: async (_: any, { id }: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required');
      }

      await notificationService.delete(id);
      return true;
    },

    // ===== ADMIN MUTATIONS =====
    verifyAdminPassword: async (_: any, { password }: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required');
      }

      const isValid = await adminService.verifyAdminPassword(context.user.id, password);

      if (!isValid) {
        return {
          success: false,
          message: 'Invalid admin password'
        };
      }

      return {
        success: true,
        message: 'Admin password verified'
      };
    },

    adminApproveHotel: async (_: any, { hotelId }: any, context: any) => {
      requireAdmin(context);
      
      await adminService.approveHotel(context.user.id, hotelId);
      
      const [hotel] = await db
        .select()
        .from(hotels)
        .where(eq(hotels.id, hotelId))
        .limit(1);

      return {
        ...hotel,
        locked: hotel.locked === 1
      };
    },

    adminRejectHotel: async (_: any, { hotelId, reason }: any, context: any) => {
      requireAdmin(context);
      
      await adminService.rejectHotel(context.user.id, hotelId, reason);
      
      const [hotel] = await db
        .select()
        .from(hotels)
        .where(eq(hotels.id, hotelId))
        .limit(1);

      return {
        ...hotel,
        locked: hotel.locked === 1
      };
    },

    adminResetUserWarnings: async (_: any, { userId }: any, context: any) => {
      requireAdmin(context);
      
      await adminService.resetUserWarnings(context.user.id, userId);
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return {
        ...user,
        isSuspended: user.isSuspended === 1
      };
    },

    adminUnlockHotel: async (_: any, { hotelId }: any, context: any) => {
      requireAdmin(context);
      
      await adminService.unlockHotel(context.user.id, hotelId);
      
      const [hotel] = await db
        .select()
        .from(hotels)
        .where(eq(hotels.id, hotelId))
        .limit(1);

      return {
        ...hotel,
        locked: hotel.locked === 1
      };
    },
  },

  // ===== FIELD RESOLVERS =====
  AdminLog: {
    admin: async (parent: any) => {
      const [admin] = await db
        .select()
        .from(users)
        .where(eq(users.id, parent.adminId))
        .limit(1);
      
      return {
        ...admin,
        isSuspended: admin.isSuspended === 1
      };
    },

    targetUser: async (parent: any) => {
      if (!parent.targetUserId) return null;
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, parent.targetUserId))
        .limit(1);
      
      return user ? {
        ...user,
        isSuspended: user.isSuspended === 1
      } : null;
    },

    targetHotel: async (parent: any) => {
      if (!parent.targetHotelId) return null;
      
      const [hotel] = await db
        .select()
        .from(hotels)
        .where(eq(hotels.id, parent.targetHotelId))
        .limit(1);
      
      return hotel ? {
        ...hotel,
        locked: hotel.locked === 1
      } : null;
    },
  },
};