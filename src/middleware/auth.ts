import { GraphQLError } from 'graphql';
import { firebaseAuth } from '../config/firebase';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthContext {
  user: {
    id: string;
    firebaseUid: string;
    phoneNumber: string;
    username: string;
    firstName: string;
    lastName: string;
    role: 'USER' | 'ADMIN';
  } | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export async function authenticateUser(authToken?: string): Promise<AuthContext> {
  if (!authToken) {
    return {
      user: null,
      isAuthenticated: false,
      isAdmin: false
    };
  }

  try {
    // Verify Firebase token
    const decodedToken = await firebaseAuth.verifyIdToken(authToken);
    
    // Get user from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    // ✅ CORRECTION ICI
    if (!dbUser) {
      // Token Firebase valide mais user pas encore dans PostgreSQL
      // C'est normal pour signupUser - on retourne un contexte non-authentifié
      console.log('⚠️ Token Firebase valide mais utilisateur pas encore dans la BD');
      return {
        user: null,
        isAuthenticated: false,
        isAdmin: false
      };
    }

    return {
      user: {
        id: dbUser.id,
        firebaseUid: dbUser.firebaseUid,
        phoneNumber: dbUser.phoneNumber,
        username: dbUser.username,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role
      },
      isAuthenticated: true,
      isAdmin: dbUser.role === 'ADMIN'
    };
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Invalid authentication token', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
}

export function requireAuth(context: AuthContext) {
  if (!context.isAuthenticated || !context.user) {
    throw new GraphQLError('You must be authenticated to perform this action', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  return context.user;
}

export function requireAdmin(context: AuthContext) {
  const user = requireAuth(context);
  if (!context.isAdmin) {
    throw new GraphQLError('You must be an admin to perform this action', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
  return user;
}