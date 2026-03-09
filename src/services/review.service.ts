import { GraphQLError } from 'graphql';
import { db } from '../db/client';
import { reviews, hotels, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AddReviewInput, addReviewSchema } from '../utils/validation';

export class ReviewService {
  async addOrUpdateReview(input: AddReviewInput, userId: string) {
    // Validate input
    const validatedInput = addReviewSchema.parse(input);

    // Check if hotel exists and is approved
    const [hotel] = await db
      .select()
      .from(hotels)
      .where(eq(hotels.id, validatedInput.hotelId))
      .limit(1);

    if (!hotel) {
      throw new GraphQLError('Hotel not found', {
        extensions: { code: 'NOT_FOUND' }
      });
    }

    if (hotel.status !== 'APPROVED') {
      throw new GraphQLError('You can only review approved hotels', {
        extensions: { code: 'BAD_USER_INPUT' }
      });
    }

    // Check if user already has a review for this hotel
    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.hotelId, validatedInput.hotelId),
          eq(reviews.userId, userId)
        )
      )
      .limit(1);

    if (existingReview) {
      // Update existing review
      const [updatedReview] = await db
        .update(reviews)
        .set({
          rating: validatedInput.rating,
          comment: validatedInput.comment,
          updatedAt: new Date()
        })
        .where(eq(reviews.id, existingReview.id))
        .returning();

      return updatedReview;
    } else {
      // Create new review
      const [newReview] = await db
        .insert(reviews)
        .values({
          hotelId: validatedInput.hotelId,
          userId,
          rating: validatedInput.rating,
          comment: validatedInput.comment
        })
        .returning();

      return newReview;
    }
  }

  async getHotelReviews(hotelId: string, limit: number = 20, offset: number = 0) {
    // Check if hotel exists
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

    const results = await db
      .select({
        review: reviews,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.hotelId, hotelId))
      .orderBy(reviews.createdAt)
      .limit(limit)
      .offset(offset);

    return results.map(r => ({
      ...r.review,
      user: r.user
    }));
  }

  async getUserReviewForHotel(hotelId: string, userId: string) {
    const [review] = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.hotelId, hotelId),
          eq(reviews.userId, userId)
        )
      )
      .limit(1);

    return review || null;
  }

  async deleteReview(reviewId: string, userId: string, isAdmin: boolean) {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!review) {
      throw new GraphQLError('Review not found', {
        extensions: { code: 'NOT_FOUND' }
      });
    }

    // Only admin or review owner can delete
    if (!isAdmin && review.userId !== userId) {
      throw new GraphQLError('You can only delete your own reviews', {
        extensions: { code: 'FORBIDDEN' }
      });
    }

    await db.delete(reviews).where(eq(reviews.id, reviewId));

    return true;
  }
}

export const reviewService = new ReviewService();