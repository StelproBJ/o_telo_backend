import { GraphQLError } from 'graphql';

export interface AuthContext {
  user?: {
    id: string;
    role: 'USER' | 'ADMIN';
    isSuspended: number;
    warningCount: number;
  } | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

/**
 * Vérifier si l'utilisateur est suspendu
 */
export function checkSuspension(context: AuthContext) {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  if (context.user.isSuspended === 1) {
    throw new GraphQLError(
      'Your account is suspended. Please contact an administrator.',
      {
        extensions: { code: 'SUSPENDED' }
      }
    );
  }
}

/**
 * Vérifier si l'utilisateur est admin
 */
export function requireAdmin(context: AuthContext) {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  if (context.user.role !== 'ADMIN') {
    throw new GraphQLError('Admin access required', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
}

/**
 * Vérifier si un hôtel est verrouillé
 */
export function checkHotelLocked(hotel: { locked: number; name: string }) {
  if (hotel.locked === 1) {
    throw new GraphQLError(
      `The submission "${hotel.name}" is locked after 3 rejections. Contact an administrator to unlock it.`,
      {
        extensions: { code: 'LOCKED' }
      }
    );
  }
}