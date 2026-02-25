import { GraphQLError } from 'graphql';
import { DateTimeResolver } from 'graphql-scalars';
import { AuthContext, requireAuth, requireAdmin } from '../middleware/auth';
import { authService } from '../services/auth.service';
import { hotelService } from '../services/hotel.service';
import { reviewService } from '../services/review.service';
import { adminResolvers } from './adminResolvers';

export const resolvers = {
  DateTime: DateTimeResolver,

  Query: {
    me: async (_: any, __: any, context: AuthContext) => {
      const user = requireAuth(context);
      return authService.getUserById(user.id);
    },

    hotels: async (
      _: any,
      args: { filters?: any; location?: any },
      context: AuthContext
    ) => {
      const filters = {
        priceRange: args.filters?.priceRange,
        minRating: args.filters?.minRating,
        search: args.filters?.search,
        limit: args.filters?.limit || 20,
        offset: args.filters?.offset || 0
      };

      return hotelService.getHotels(filters, args.location, context.isAdmin);
    },

    hotel: async (_: any, args: { id: string }, context: AuthContext) => {
      return hotelService.getHotelById(args.id, context.isAdmin);
    },

    pendingHotels: async (_: any, __: any, context: AuthContext) => {
      requireAdmin(context);
      return hotelService.getPendingHotels();
    },

    hotelReviews: async (
      _: any,
      args: { hotelId: string; limit?: number; offset?: number }
    ) => {
      return reviewService.getHotelReviews(
        args.hotelId,
        args.limit || 20,
        args.offset || 0
      );
    },

    myReviewForHotel: async (
      _: any,
      args: { hotelId: string },
      context: AuthContext
    ) => {
      const user = requireAuth(context);
      return reviewService.getUserReviewForHotel(args.hotelId, user.id);
    },

    // ===== ADMIN QUERIES (from adminResolvers) =====
    ...adminResolvers.Query
  },

  Mutation: {
    signupUser: async (_: any, args: { input: any }) => {
      return authService.signupUser(args.input);
    },

    addHotel: async (_: any, args: { input: any }, context: AuthContext) => {
      const user = requireAuth(context);
      return hotelService.addHotel(args.input, user.id);
    },

    updateHotel: async (
      _: any,
      args: { id: string; input: any },
      context: AuthContext
    ) => {
      const user = requireAuth(context);
      return hotelService.updateHotel(args.id, args.input, user.id, context.isAdmin);
    },

    approveHotel: async (_: any, args: { id: string }, context: AuthContext) => {
      requireAdmin(context);
      return hotelService.approveHotel(args.id);
    },

    rejectHotel: async (
      _: any,
      args: { id: string; reason: string },
      context: AuthContext
    ) => {
      requireAdmin(context);
      return hotelService.rejectHotel(args.id, args.reason);
    },

    addOrUpdateReview: async (
      _: any,
      args: { input: any },
      context: AuthContext
    ) => {
      const user = requireAuth(context);
      return reviewService.addOrUpdateReview(args.input, user.id);
    },

    deleteReview: async (
      _: any,
      args: { id: string },
      context: AuthContext
    ) => {
      const user = requireAuth(context);
      return reviewService.deleteReview(args.id, user.id, context.isAdmin);
    },

    // ===== NOTIFICATIONS (from adminResolvers) =====
    ...adminResolvers.Mutation
  },

  Hotel: {
    latitude: (parent: any) => parseFloat(parent.latitude),
    longitude: (parent: any) => parseFloat(parent.longitude),
    images: (parent: any) => parent.images || [],
    videos: (parent: any) => parent.videos || [],
    locked: (parent: any) => parent.locked === 1
  },

  Review: {
    hotel: async (parent: any) => {
      return hotelService.getHotelById(parent.hotelId, true);
    },
    user: async (parent: any) => {
      return authService.getUserById(parent.userId);
    }
  },

  User: {
    isSuspended: (parent: any) => parent.isSuspended === 1
  },

  // ===== ADMIN TYPES (from adminResolvers) =====
  AdminLog: adminResolvers.AdminLog
};