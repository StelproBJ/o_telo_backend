import { z } from 'zod';

// User validation
export const signupUserSchema = z.object({
  firebaseUid: z.string().min(1, 'Firebase UID is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  birthDate: z.string().datetime().optional()
});

// Hotel validation
export const addHotelSchema = z.object({
  name: z.string().min(1, 'Hotel name is required').max(255),
  description: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  priceRange: z.enum(['LOW', 'MID', 'HIGH']).optional(),
  minPrice: z.number().int().positive().optional(),
  phoneContact: z.string().max(20).optional(),
  emailContact: z.string().email().optional().or(z.literal('')),
  websiteLink: z.string().url().optional().or(z.literal('')),
  whatsappLink: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  roomPrices: z.array(z.object({
    roomType: z.string().min(1, 'Room type is required'),
    price: z.number().int().positive(),
    image: z.string().url().optional(),
    description: z.string().optional()
  })).optional()
});

export const updateHotelSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  priceRange: z.enum(['LOW', 'MID', 'HIGH']).optional(),
  phoneContact: z.string().max(20).optional(),
  emailContact: z.string().email().optional(),
  websiteLink: z.string().url().optional(),
  whatsappLink: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional()
});

// Review validation
export const addReviewSchema = z.object({
  hotelId: z.string().uuid('Invalid hotel ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().optional()
});

// Filter validation
export const hotelFiltersSchema = z.object({
  priceRange: z.enum(['LOW', 'MID', 'HIGH']).optional(),
  minRating: z.number().min(1).max(5).optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0)
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export type SignupUserInput = z.infer<typeof signupUserSchema>;
export type AddHotelInput = z.infer<typeof addHotelSchema>;
export type UpdateHotelInput = z.infer<typeof updateHotelSchema>;
export type AddReviewInput = z.infer<typeof addReviewSchema>;
export type HotelFilters = z.infer<typeof hotelFiltersSchema>;
export type Location = z.infer<typeof locationSchema>;