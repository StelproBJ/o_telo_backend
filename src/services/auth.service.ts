import { GraphQLError } from 'graphql';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { SignupUserInput, signupUserSchema } from '../utils/validation';

export class AuthService {
  async signupUser(input: SignupUserInput) {
    try {
      // Validate input
      const validatedInput = signupUserSchema.parse(input);
      console.log('✅ Input validé:', validatedInput);

      // Check if user already exists
      console.log('🔍 Vérification existence firebaseUid...');
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, validatedInput.firebaseUid))
        .limit(1);
      console.log('⚡ existingUser:', existingUser);
      if (existingUser) throw new GraphQLError('User already exists', { extensions: { code: 'BAD_USER_INPUT' } });

      // Check username uniqueness
      console.log('🔍 Vérification unicité username...');
      const [usernameExists] = await db
        .select()
        .from(users)
        .where(eq(users.username, validatedInput.username))
        .limit(1);
      console.log('⚡ usernameExists:', usernameExists);
      if (usernameExists) throw new GraphQLError('Username already taken', { extensions: { code: 'BAD_USER_INPUT' } });

      // Check phone number uniqueness
      console.log('🔍 Vérification unicité phoneNumber...');
      const [phoneExists] = await db
        .select()
        .from(users)
        .where(eq(users.phoneNumber, validatedInput.phoneNumber))
        .limit(1);
      console.log('⚡ phoneExists:', phoneExists);
      if (phoneExists) throw new GraphQLError('Phone number already registered', { extensions: { code: 'BAD_USER_INPUT' } });

      // Create user
      console.log('✍️ Création utilisateur...');
      const [newUser] = await db
        .insert(users)
        .values({
          firebaseUid: validatedInput.firebaseUid,
          phoneNumber: validatedInput.phoneNumber,
          username: validatedInput.username,
          firstName: validatedInput.firstName,
          lastName: validatedInput.lastName,
          gender: validatedInput.gender,
          birthDate: validatedInput.birthDate ? validatedInput.birthDate : null,
          role: 'USER',
        })
        .returning();
      console.log('✅ Utilisateur créé:', newUser);

      return newUser;

    } catch (err) {
      console.error('❌ ERREUR signupUser:', err);
      throw err; // on remonte l'erreur vers GraphQL
    }
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