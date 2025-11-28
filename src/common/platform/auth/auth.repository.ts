import { prisma } from '../../../common';
import { getModuleLogger, hashPassword } from '../../../utils';
import { redisCacheHelper } from '../../../utils/redisCacheHelper';
import { RefreshTokenData, UpdateSessionInput } from './auth.type';

const logger = getModuleLogger('auth-repository');

/**
 * Repository layer for Auth related database operations.
 */
export const AuthRepository = {
  async findUserByIdentifier(identifier: string) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { emailId: identifier },
          { userId: identifier },
          { mobileNumber: identifier },
        ],
      },
      include: {
        person: {
          select: {
            id: true,
            nameInEnglish: true,
            photoURL: true,
            email: true,
            aadhaarMasked: true, // Add this line
          },
        },
        UserRole: {
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

  async findUserByIdentifierWithRoles(identifier: string) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { emailId: identifier },
          { userId: identifier },
          { mobileNumber: identifier },
        ],
      },
      include: {
        person: {
          select: {
            id: true,
            nameInEnglish: true,
            photoURL: true,
            email: true,
            aadhaarMasked: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        clinics: {
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
                clinicType: true,
                tenantId: true,
              },
            },
          },
        },
        UserRole: {
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

  async createUserSession(data: {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: string;
  }) {
    return prisma.userSession.create({
      data: {
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        // deviceInfo: data.deviceInfo,
        loginTime: new Date(),
      },
    });
  },

  async updateUserSession(lastSession: UpdateSessionInput) {
    const now = new Date();

    const totalTime = Math.floor(
      (now.getTime() - new Date(lastSession.loginTime).getTime()) / 1000,
    ); // in seconds

    return prisma.userSession.update({
      where: { id: lastSession.id },
      data: {
        logoutTime: now,
        totalTime: totalTime,
      },
    });
  },

  async getLastUserSession(userId: string) {
    return prisma.userSession.findFirst({
      where: { userId },
      orderBy: { loginTime: 'desc' },
    });
  },

  async updateUserPassword(userId: string, newPassword: string) {
    try {
      // ✅ No validation - just hash and update
      const hashedPassword = await hashPassword(newPassword);

      return await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    } catch (error) {
      logger.error('Password update error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw error;
    }
  },

  // async invalidateAllUserSessions(userId: string) {
  //   // Delete all active sessions for the user
  //   const redisKey = `user:session:${userId}`;
  //   await redisCacheHelper.delete(redisKey);
  // },

  async invalidateAllUserSessions(userId: string) {
    try {
      // Update all active sessions in database
      const activeSessions = await prisma.userSession.findMany({
        where: {
          userId,
          logoutTime: null,
        },
      });

      const logoutTime = new Date();
      for (const session of activeSessions) {
        const totalTime = Math.floor(
          (logoutTime.getTime() - session.loginTime.getTime()) / 1000,
        );

        await prisma.userSession.update({
          where: { id: session.id },
          data: { logoutTime, totalTime },
        });

        // Blacklist each session in Redis
        await redisCacheHelper.set(
          `blacklist:session:${session.id}`,
          'true',
          3600, // 1 hour TTL for blacklist
        );
      }

      // Delete from Redis
      const redisKey = `user:session:${userId}`;
      await redisCacheHelper.delete(redisKey);

      logger.info('All user sessions invalidated', { userId });
    } catch (error) {
      logger.error('Failed to invalidate all user sessions', { error, userId });
      throw error;
    }
  },

  async findSHGMembershipByPersonId(personId: string) {
    return prisma.sHGMembership.findMany({
      where: {
        memberPersonId: personId,
        isActive: true,
      },
      include: {
        organization: {
          select: {
            id: true,
            organizationName: true,
            organizationCode: true,
          },
        },
      },
    });
  },
  async storeRefreshToken(
    jti: string,
    userId: string,
    expiresIn: number,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await redisCacheHelper.set(
      `refresh_token:${jti}`,
      JSON.stringify({
        jti,
        userId,
        expiresAt: expiresAt.toISOString(),
        isRevoked: false,
        createdAt: new Date().toISOString(),
      }),
      expiresIn,
    );
  },

  async getRefreshToken(jti: string): Promise<RefreshTokenData | null> {
    const tokenData = await redisCacheHelper.get<string>(
      `refresh_token:${jti}`,
    );
    if (!tokenData) return null;

    try {
      const data = JSON.parse(tokenData);
      return {
        jti: data.jti,
        userId: data.userId,
        expiresAt: new Date(data.expiresAt),
        isRevoked: data.isRevoked,
        createdAt: new Date(data.createdAt),
      };
    } catch (error) {
      logger.error('Failed to parse refresh token data', { error, jti });
      return null;
    }
  },

  async revokeRefreshToken(jti: string): Promise<void> {
    const tokenData = await this.getRefreshToken(jti);
    if (tokenData) {
      await redisCacheHelper.set(
        `refresh_token:${jti}`,
        JSON.stringify({
          jti: tokenData.jti,
          userId: tokenData.userId,
          expiresAt: tokenData.expiresAt.toISOString(),
          isRevoked: true,
          createdAt: tokenData.createdAt.toISOString(),
        }),
        Math.floor((tokenData.expiresAt.getTime() - Date.now()) / 1000),
      );
    }
  },

  async isRefreshTokenValid(jti: string): Promise<boolean> {
    const tokenData = await this.getRefreshToken(jti);
    if (!tokenData) return false;

    return !tokenData.isRevoked && tokenData.expiresAt > new Date();
  },

  async storeRefreshTokenAtomic(
    newJti: string,
    userId: string,
    expiresIn: number,
    oldJti?: string,
  ): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + expiresIn * 1000);
      const newTokenData = {
        jti: newJti,
        userId,
        expiresAt: expiresAt.toISOString(),
        isRevoked: false,
        createdAt: new Date().toISOString(),
      };

      // Store new token
      await redisCacheHelper.set(
        `refresh_token:${newJti}`,
        JSON.stringify(newTokenData),
        expiresIn,
      );

      // Revoke old token if provided
      if (oldJti) {
        const oldTokenData = await this.getRefreshToken(oldJti);
        if (oldTokenData) {
          await redisCacheHelper.set(
            `refresh_token:${oldJti}`,
            JSON.stringify({
              ...oldTokenData,
              isRevoked: true,
            }),
            Math.floor((oldTokenData.expiresAt.getTime() - Date.now()) / 1000),
          );
        }
      }

      return true;
    } catch (error) {
      logger.error('Atomic refresh token operation failed', {
        error,
        newJti,
        oldJti,
      });
      return false;
    }
  },

  async getSessionById(sessionId: string) {
    return prisma.userSession.findUnique({
      where: { id: sessionId },
    });
  },

  async findRootOrganization() {
    return prisma.organization.findFirst({
      where: {
        promoterOrganizationId: null,
      },
      select: {
        id: true,
      },
    });
  },
};
