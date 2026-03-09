import { GraphQLError } from 'graphql';
import { db } from '../db/client';
import { hotels, reviews, adminNotifications, users } from '../db/schema';
import { eq, and, ilike, sql, avg, count } from 'drizzle-orm';
import { AddHotelInput, UpdateHotelInput, HotelFilters, Location, addHotelSchema, updateHotelSchema } from '../utils/validation';
import { sortByDistance } from '../utils/distance';

export class HotelService {
  async addHotel(input: AddHotelInput, userId: string) {
    // Vérifier si l'utilisateur est suspendu
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user && user.isSuspended === 1) {
      throw new GraphQLError(
        'Your account is suspended. You cannot submit hotels. Please contact an administrator.',
        { extensions: { code: 'SUSPENDED' } }
      );
    }

    // Validate input
    const validatedInput = addHotelSchema.parse(input);

    // Create hotel
    const [newHotel] = await db
      .insert(hotels)
      .values({
        name: validatedInput.name,
        description: validatedInput.description,
        latitude: validatedInput.latitude.toString(),
        longitude: validatedInput.longitude.toString(),
        priceRange: validatedInput.priceRange,
        phoneContact: validatedInput.phoneContact,
        emailContact: validatedInput.emailContact,
        websiteLink: validatedInput.websiteLink,
        whatsappLink: validatedInput.whatsappLink,
        images: validatedInput.images || [],
        videos: validatedInput.videos || [],
        createdBy: userId,
        status: 'PENDING'
      })
      .returning();

    // Create admin notification
    await this.createAdminNotification('HOTEL_ADDED', newHotel.id, userId, 
      `New hotel "${newHotel.name}" added by user and needs approval`);

    return newHotel;
  }

  async updateHotel(hotelId: string, input: UpdateHotelInput, userId: string, isAdmin: boolean) {
    // Validate input
    const validatedInput = updateHotelSchema.parse(input);

    // Get hotel
    const [hotel] = await db
      .select()
      .from(hotels)
      .where(eq(hotels.id, hotelId))
      .limit(1);

    if (!hotel) {
      throw new GraphQLError('Hotel not found', {
        extensions: { code: 'NOT_FOUND' }
      });
    }

    // Check permissions
    if (!isAdmin) {
      // Users can only edit their own hotels
      if (hotel.createdBy !== userId) {
        throw new GraphQLError('You can only edit hotels you created', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
      // Users can't edit approved hotels
      if (hotel.status === 'APPROVED') {
        throw new GraphQLError('Cannot edit approved hotels', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
    }

    // Prepare update data
    const updateData: any = {
      ...validatedInput,
      updatedAt: new Date()
    };

    // Convert numbers to strings for decimal fields
    if (validatedInput.latitude !== undefined) {
      updateData.latitude = validatedInput.latitude.toString();
    }
    if (validatedInput.longitude !== undefined) {
      updateData.longitude = validatedInput.longitude.toString();
    }

    // If hotel was rejected, reset to pending on update
    if (hotel.status === 'REJECTED' && !isAdmin) {
      updateData.status = 'PENDING';
      updateData.rejectionReason = null;
    }

    // Update hotel
    const [updatedHotel] = await db
      .update(hotels)
      .set(updateData)
      .where(eq(hotels.id, hotelId))
      .returning();

    // Notify admin if non-admin updated
    if (!isAdmin) {
      await this.createAdminNotification('HOTEL_UPDATED', hotelId, userId,
        `Hotel "${updatedHotel.name}" was updated and needs review`);
    }

    return updatedHotel;
  }

  async approveHotel(hotelId: string) {
    const [hotel] = await db
      .select()
      .from(hotels)
      .where(eq(hotels.id, hotelId))
      .limit(1);

    if (!hotel) {
      throw new GraphQLError('Hotel not found', {
        extensions: { code: 'NOT_FOUND' }
      });
    }

    const [updatedHotel] = await db
      .update(hotels)
      .set({
        status: 'APPROVED',
        rejectionReason: null,
        updatedAt: new Date()
      })
      .where(eq(hotels.id, hotelId))
      .returning();

    return updatedHotel;
  }

  async rejectHotel(hotelId: string, reason: string) {
    const [hotel] = await db
      .select()
      .from(hotels)
      .where(eq(hotels.id, hotelId))
      .limit(1);

    if (!hotel) {
      throw new GraphQLError('Hotel not found', {
        extensions: { code: 'NOT_FOUND' }
      });
    }

    const [updatedHotel] = await db
      .update(hotels)
      .set({
        status: 'REJECTED',
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(hotels.id, hotelId))
      .returning();

    return updatedHotel;
  }

  async getHotels(filters: HotelFilters, location?: Location, isAdmin: boolean = false) {
    let query = db
      .select({
        hotel: hotels,
        avgRating: avg(reviews.rating),
        reviewCount: count(reviews.id),
        creator: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(hotels)
      .leftJoin(reviews, eq(hotels.id, reviews.hotelId))
      .leftJoin(users, eq(hotels.createdBy, users.id))
      .$dynamic();

    // Apply filters
    const conditions: any[] = [];

    // Non-admin users only see approved hotels
    if (!isAdmin) {
      conditions.push(eq(hotels.status, 'APPROVED'));
    }

    if (filters.priceRange) {
      conditions.push(eq(hotels.priceRange, filters.priceRange));
    }

    if (filters.search) {
      conditions.push(ilike(hotels.name, `%${filters.search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.groupBy(hotels.id, users.id);

    // Execute query
    const results = await query;

    // Filter by minimum rating if specified
    let filteredResults = results;
    if (filters.minRating) {
      filteredResults = results.filter(r => {
        const rating = r.avgRating ? parseFloat(r.avgRating as string) : 0;
        return rating >= filters.minRating!;
      });
    }

    // Sort by distance if location provided
    let sortedResults = filteredResults;
    if (location) {
      sortedResults = sortByDistance(
        filteredResults.map(r => r.hotel),
        location.latitude,
        location.longitude
      ).map(hotelWithDistance => {
        const original = filteredResults.find(r => r.hotel.id === hotelWithDistance.id);
        return {
          ...original!,
          hotel: hotelWithDistance
        };
      });
    }

    // Apply pagination
    const paginatedResults = sortedResults.slice(
      filters.offset || 0,
      (filters.offset || 0) + (filters.limit || 20)
    );

    return paginatedResults.map(r => ({
      ...r.hotel,
      distance: (r.hotel as any).distance,
      avgRating: r.avgRating ? parseFloat(r.avgRating as string) : null,
      reviewCount: r.reviewCount ? parseInt(r.reviewCount as unknown as string) : 0,
      creator: r.creator
    }));
  }

  async getHotelById(hotelId: string, isAdmin: boolean = false) {
    const [result] = await db
      .select({
        hotel: hotels,
        avgRating: avg(reviews.rating),
        reviewCount: count(reviews.id),
        creator: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(hotels)
      .leftJoin(reviews, eq(hotels.id, reviews.hotelId))
      .leftJoin(users, eq(hotels.createdBy, users.id))
      .where(eq(hotels.id, hotelId))
      .groupBy(hotels.id, users.id)
      .limit(1);

    if (!result) {
      throw new GraphQLError('Hotel not found', {
        extensions: { code: 'NOT_FOUND' }
      });
    }

    // Non-admin users can't see non-approved hotels
    if (!isAdmin && result.hotel.status !== 'APPROVED') {
      throw new GraphQLError('Hotel not found', {
        extensions: { code: 'NOT_FOUND' }
      });
    }

    return {
      ...result.hotel,
      avgRating: result.avgRating ? parseFloat(result.avgRating as string) : null,
      reviewCount: result.reviewCount ? parseInt(result.reviewCount as unknown as string) : 0,
      creator: result.creator
    };
  }

  async getPendingHotels() {
    const results = await db
      .select({
        hotel: hotels,
        creator: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(hotels)
      .leftJoin(users, eq(hotels.createdBy, users.id))
      .where(eq(hotels.status, 'PENDING'))
      .orderBy(hotels.createdAt);

    return results.map(r => ({
      ...r.hotel,
      creator: r.creator
    }));
  }

  private async createAdminNotification(
    type: string,
    hotelId: string,
    userId: string,
    message: string
  ) {
    await db.insert(adminNotifications).values({
      type,
      hotelId,
      userId,
      message,
      isRead: 0
    });
  }
}

export const hotelService = new HotelService();