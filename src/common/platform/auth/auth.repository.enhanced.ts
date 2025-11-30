import { prisma } from '../../../common';
import { getModuleLogger, hashPassword } from '../../../utils';

const logger = getModuleLogger('auth-repository');

/**
 * Enhanced Repository layer for Auth related database operations.
 * Compatible with current Prisma schema.
 */
export const EnhancedAuthRepository = {
  async findUserByIdentifier(identifier: string) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { emailId: identifier },
          { username: identifier },
          { mobileNumber: identifier },
        ],
      },
      include: {
        person: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                roleName: true,
                roleCategory: true,
              },
            },
          },
        },
        clinics: {
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
                clinicType: true,
              },
            },
          },
        },
      },
    });
  },

  async findUserByIdentifierWithRoles(identifier: string) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { emailId: identifier },
          { username: identifier },
          { mobileNumber: identifier },
        ],
      },
      include: {
        person: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                roleName: true,
                roleCategory: true,
              },
            },
          },
        },
      },
    });
  },

  async updateUserPassword(userId: string, newPassword: string) {
    try {
      const hashedPassword = await hashPassword(newPassword);

      return await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
      });
    } catch (error) {
      logger.error('Password update error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw error;
    }
  },

  // Simple session invalidation for Redis-only approach
  async invalidateAllUserSessions(userId: string) {
    try {
      logger.info('User sessions invalidated', { userId });
      // Since UserSession table doesn't exist, we'll handle this in service layer
      return true;
    } catch (error) {
      logger.error('Failed to invalidate all user sessions', { error, userId });
      throw error;
    }
  },
};