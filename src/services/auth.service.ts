import { GraphQLError } from 'graphql';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { SignupUserInput, signupUserSchema } from '../utils/validation';

export class AuthService {
  async signupUser(input: SignupUserInput) {
    // Validate input
    const validatedInput = signupUserSchema.parse(input);

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, validatedInput.firebaseUid))
      .limit(1);

    if (existingUser) {
      throw new GraphQLError('User already exists', {
        extensions: { code: 'BAD_USER_INPUT' }
      });
    }

    // Check username uniqueness
    const [usernameExists] = await db
      .select()
      .from(users)
      .where(eq(users.username, validatedInput.username))
      .limit(1);

    if (usernameExists) {
      throw new GraphQLError('Username already taken', {
        extensions: { code: 'BAD_USER_INPUT' }
      });
    }

    // Check phone number uniqueness
    const [phoneExists] = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, validatedInput.phoneNumber))
      .limit(1);

    if (phoneExists) {
      throw new GraphQLError('Phone number already registered', {
        extensions: { code: 'BAD_USER_INPUT' }
      });
    }

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        firebaseUid: validatedInput.firebaseUid,
        phoneNumber: validatedInput.phoneNumber,
        username: validatedInput.username,
        firstName: validatedInput.firstName,
        lastName: validatedInput.lastName,
        gender: validatedInput.gender,
        birthDate: validatedInput.birthDate ? new Date(validatedInput.birthDate) : null,
        role: 'USER'
      })
      .returning();

    return newUser;
  }

  async getUserById(userId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new GraphQLError('User not found', {
        extensions: { code: 'NOT_FOUND' }
      });
    }

    return user;
  }

  async getUserByFirebaseUid(firebaseUid: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);

    return user || null;
  }
}

export const authService = new AuthService();