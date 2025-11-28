import { AuthRepository } from './auth.repository';
import { comparePassword, hashPassword } from '../../../utils/securityHelper';
import {
  generateToken,
  generateRefreshToken,
  generateTokenWithJti,
  verifyToken,
  decodeToken,
} from '../../../utils/jwtHelper';
import jwt from 'jsonwebtoken';
import { redisCacheHelper } from '../../../utils/redisCacheHelper';
import { env } from '../../../utils/envHelper';
import { getModuleLogger } from '../../../utils';
import {
  LogoutResponse,
  MobileAppSettingsInput,
  OtpResponse,
  PasswordOtpResponse,
  TokenRefreshResponse,
} from './auth.type';
import ms, { StringValue } from 'ms';
import { OtpHelper } from '../../../utils/otpHelper';
import { prisma } from '../../../common';
import { MobileSettingsRepository } from '../mobile-settings/mobile-settings.repository';
import { Roles } from '../../accounts/enums/RoleName';

const logger = getModuleLogger('auth-service');

const FIXED_OTP_IDENTIFIERS = ['9921125771', '9822459068'];
const FIXED_OTP_VALUE = '1234';

// Helper function to check if identifier is a fixed OTP identifier
function isFixedOtpIdentifier(identifier: string): boolean {
  return FIXED_OTP_IDENTIFIERS.includes(identifier);
}

/**
 * Business logic layer for Auth operations.
 */

export const AuthService = {
  async login(
    identifier: string,
    password: string,
    requestId: string,
    ipAddress?: string,
    userAgent?: string,
    deviceInfo?: string,
  ) {
    try {
      logger.debug('Attempting login', { identifier, requestId });

      const user = await AuthRepository.findUserByIdentifier(identifier);
      if (!user) {
        logger.warn('User not found', { identifier, requestId });
        return { error: 'Invalid credentials', status: 401 };
      }

      if (user.isLocked) {
        logger.warn('User account is locked', { userId: user.id, requestId });
        return {
          error: 'Your account is Inactive. Please contact support.',
          status: 403,
        };
      }

      // If user has no password set
      if (!user.password) {
        logger.warn('User has no password set', { identifier, requestId });
        return { error: 'Invalid credentials', status: 401 };
      }

      const passwordMatch = await comparePassword(password, user.password);
      if (!passwordMatch) {
        logger.warn('Invalid password', { identifier, requestId });
        return { error: 'Invalid credentials', status: 401 };
      }

      // Check for existing session if multi-session is not allowed
      if (!env.MULTI_LOGIN_SESSION_ALLOWED) {
        const redisKey = `user:session:${user.id}`;
        const existingSession = await redisCacheHelper.has(redisKey);
        if (existingSession) {
          logger.warn('User already has an active session', {
            userId: user.id,
            requestId,
          });

          // Invalidate the existing session
          const existingSessionData =
            await redisCacheHelper.get<string>(redisKey);
          if (existingSessionData) {
            const existingSession = JSON.parse(existingSessionData);
            if (existingSession.sessionId) {
              await redisCacheHelper.set(
                `blacklist:session:${existingSession.sessionId}`,
                'true',
                3600,
              );
            }
          }

          await redisCacheHelper.delete(redisKey);
        }
      }

      return this._createUserSession(
        user,
        requestId,
        ipAddress,
        userAgent,
        deviceInfo,
      );
    } catch (error) {
      logger.error('Login error', { error, requestId });
      throw error;
    }
  },

  async logout(
    userId: string,
    token: string,
    requestId: string,
    isExpiredToken: boolean = false,
  ): Promise<LogoutResponse | { error: string; status: number }> {
    try {
      let sessionId: string;
      let expiresIn: number = 3600; // Default TTL

      if (isExpiredToken) {
        // For expired tokens, decode without verification
        const decodedToken = jwt.decode(token) as any;
        if (!decodedToken || !decodedToken.sessionId) {
          return { error: 'Invalid token structure', status: 401 };
        }
        sessionId = decodedToken.sessionId;

        // Calculate remaining blacklist time based on original expiry
        if (decodedToken.exp) {
          const now = Math.floor(Date.now() / 1000);
          expiresIn = Math.max(0, decodedToken.exp - now);
        }
      } else {
        // For valid tokens, verify normally
        const decodedToken = jwt.verify(token, env.JWT_SECRET) as any;
        if (!decodedToken || !decodedToken.sessionId) {
          return { error: 'Invalid token', status: 401 };
        }
        sessionId = decodedToken.sessionId;

        // Calculate remaining token life for blacklist
        if (decodedToken.exp) {
          const now = Math.floor(Date.now() / 1000);
          expiresIn = Math.max(0, decodedToken.exp - now);
        }
      }

      // Blacklist the specific session
      await redisCacheHelper.set(
        `blacklist:session:${sessionId}`,
        'true',
        expiresIn,
      );

      // For multi-session, only remove this specific session from Redis
      if (env.MULTI_LOGIN_SESSION_ALLOWED) {
        const redisKey = `user:session:${userId}:${sessionId}`;
        await redisCacheHelper.delete(redisKey);
      } else {
        // For single session, remove the main user session
        const redisKey = `user:session:${userId}`;
        await redisCacheHelper.delete(redisKey);
      }

      // Update UserSession table - this works regardless of token expiry
      if (env.RECORD_USER_SESSION) {
        try {
          const logoutTime = new Date();
          const sessionRecord = await prisma.userSession.findUnique({
            where: { id: sessionId },
          });

          if (sessionRecord) {
            const totalTime = Math.floor(
              (logoutTime.getTime() - sessionRecord.loginTime.getTime()) / 1000,
            );

            await prisma.userSession.update({
              where: { id: sessionId },
              data: {
                logoutTime,
                totalTime,
              },
            });
          }
        } catch (error) {
          logger.error('Failed to update UserSession', {
            error,
            userId,
            requestId,
          });
          // Don't fail the logout if session update fails
        }
      }

      // Also revoke any associated refresh tokens
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded?.jti) {
          await AuthRepository.revokeRefreshToken(decoded.jti);
        }
      } catch (refreshError) {
        logger.warn('Failed to revoke refresh token during logout', {
          error: refreshError,
          userId,
          requestId,
        });
        // Continue with logout even if refresh token revocation fails
      }

      logger.info('Logout successful', {
        userId,
        sessionId,
        requestId,
        wasExpired: isExpiredToken,
      });

      return { message: 'Logout successful' };
    } catch (error) {
      logger.error('Unexpected logout error', { error, userId, requestId });
      return { error: 'Logout failed', status: 500 };
    }
  },

  async generateOtp(
    identifier: string,
    channel?: string,
    requestId?: string,
  ): Promise<OtpResponse> {
    try {
      // Check if the identifier exists in the database
      const user = await AuthRepository.findUserByIdentifier(identifier);

      // For fixed OTP identifiers, return success response immediately
      if (isFixedOtpIdentifier(identifier)) {
        logger.info('Using fixed OTP for predefined identifier', {
          identifier,
          requestId,
        });
        return {
          success: true,
          message: 'OTP sent successfully',
          otpExpiry: env.OTP_EXPIRY_SEC,
        };
      }

      if (!user) {
        logger.warn('User not found for OTP generation', {
          identifier,
          requestId,
        });
        // Return a generic response without otpExpiry to prevent user enumeration
        return {
          success: false,
          message: 'If the account exists, an OTP has been sent',
        };
      }

      // ✅ NEW: Check if user account is locked
      if (user.isLocked) {
        logger.warn('OTP generation attempted for locked account', {
          identifier,
          userId: user.id,
          requestId,
        });
        return {
          success: false,
          message: 'Your account is Inactive. Please contact support.',
        };
      }

      // Proceed with OTP generation and sending for regular users
      const otp = await OtpHelper.generateOtp(identifier);
      await OtpHelper.storeOtp(identifier, otp, 'login');
      await OtpHelper.sendOtp(identifier, otp, channel);

      logger.info('OTP generated and sent', { identifier, requestId });
      return {
        success: true,
        message: 'OTP sent successfully',
        otpExpiry: env.OTP_EXPIRY_SEC,
      };
    } catch (error) {
      // Improved error logging
      logger.error('Generate OTP error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        identifier,
        requestId,
      });
      throw error; // Re-throw to let controller handle it
    }
  },

  async _createUserSession(
    user: {
      id: string;
      userId: string;
      profilePictureUrl?: string | null;
      tenantId?: string | null;
      person?: {
        id: string;
        nameInEnglish?: string | null;
        photoURL?: string | null;
        email?: string | null;
      } | null;
      tenant?: {
        id: string;
        name: string;
        slug: string;
      } | null;
      clinics?: Array<{
        clinic: {
          id: string;
          name: string;
          clinicType: string;
          tenantId: string;
        };
      }>;
      UserRole: Array<{
        role: {
          id: string;
          roleName: string;
          roleCategory?: string | null;
        };
      }>;
    },
    requestId: string,
    ipAddress?: string,
    userAgent?: string,
    deviceInfo?: string,
    appInstanceId?: string,
  ) {
    // Extract only role IDs for the token
    const roleIds = user.UserRole.map((userRole) => userRole.role.id);

    // Extract role names for promoterOrganizationId logic
    const userRoles = user.UserRole.map((userRole) => userRole.role.roleName);

    // Check if user has Admin or Co-ordinator role
    const hasAdminOrCoordinatorRole = userRoles.some(
      (role) => role === Roles.Admin || role === Roles.Coordinator,
    );

    let promoterOrganizationId: string | undefined;

    // Fetch promoterOrganizationId only for Admin or Co-ordinator roles
    if (hasAdminOrCoordinatorRole) {
      try {
        const rootOrganization = await AuthRepository.findRootOrganization();
        promoterOrganizationId = rootOrganization?.id;

        logger.debug('Promoter organization fetched for admin/coordinator', {
          userId: user.id,
          promoterOrganizationId,
          requestId,
        });
      } catch (error) {
        logger.error('Failed to fetch promoter organization', {
          error,
          userId: user.id,
          requestId,
        });
        // Continue without promoterOrganizationId if there's an error
      }
    }

    // Fetch SHGMembership data ONLY for non-Admin/Co-ordinator users
    let shgMemberships: any[] = [];
    if (!hasAdminOrCoordinatorRole && user.person?.id) {
      shgMemberships = await AuthRepository.findSHGMembershipByPersonId(
        user.person.id,
      );

      logger.debug('SHG memberships fetched for user', {
        userId: user.id,
        membershipCount: shgMemberships.length,
        requestId,
      });
    } else {
      logger.debug(
        'Skipping SHG memberships fetch for admin/coordinator user',
        {
          userId: user.id,
          requestId,
        },
      );
    }

    const formattedMemberships = shgMemberships.map((membership) => ({
      id: membership.id,
      shgId: membership.shgId,
      organizationName: membership.organization.organizationName,
      organizationCode: membership.organization.organizationCode,
      memberPersonId: membership.memberPersonId,
      membershipRole: membership.membershipRole,
      memberFromDate: membership.memberFromDate,
      memberValidTillDate: membership.memberValidTillDate,
      isActive: membership.isActive,
    }));

    // Create user session in database
    let userSession;
    if (env.RECORD_USER_SESSION) {
      userSession = await AuthRepository.createUserSession({
        userId: user.id,
        ipAddress,
        userAgent,
        deviceInfo,
      });
    }

    // Generate tokens with only role IDs
    const accessToken = generateToken(
      {
        userId: user.id,
        userIdentifier: user.userId,
        roleIds,
        userRoles,
        sessionId: userSession?.id,
        appInstanceId,
        promoterOrganizationId, // Include in token if needed
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as import('ms').StringValue },
    );

    // Generate refresh token with JWT_REFRESH_SECRET
    const refreshTokenResult = generateTokenWithJti(
      {
        userId: user.id,
        sessionId: userSession?.id,
        appInstanceId,
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRY as import('ms').StringValue },
    );

    const refreshToken = refreshTokenResult.token;
    const refreshJti = refreshTokenResult.jti;

    // Store the refresh token in Redis
    const refreshExpiryMs = ms(env.JWT_REFRESH_EXPIRY as ms.StringValue);
    await AuthRepository.storeRefreshToken(
      refreshJti,
      user.id,
      Math.floor(refreshExpiryMs / 1000),
    );

    const redisKey = env.MULTI_LOGIN_SESSION_ALLOWED
      ? `user:session:${user.id}:${userSession?.id}`
      : `user:session:${user.id}`;

    const sessionData = {
      accessToken,
      refreshToken,
      sessionId: userSession?.id,
      appInstanceId,
      expiresAt: new Date(Date.now() + refreshExpiryMs).toISOString(),
    };

    await redisCacheHelper.set(
      redisKey,
      JSON.stringify(sessionData),
      Math.floor(refreshExpiryMs / 1000),
    );

    // Return full user info in response
    const userResponse = {
      id: user.id,
      userId: user.userId,
      avatar: user.profilePictureUrl || user.person?.photoURL || '',
      userName: user.person?.nameInEnglish || '',
      email: user.person?.email || '',
      authority: user.UserRole[0]?.role.roleCategory || '',
      tenantId: user.tenantId || user.tenant?.id || '',
      clinicId: user.clinics?.[0]?.clinic?.id || '',
      roles: user.UserRole.map((userRole) => ({
        roleId: userRole.role.id,
        roleName: userRole.role.roleName,
        roleCategory: userRole.role.roleCategory,
      })),
      // Include tenant and clinic information when available
      ...(user.tenant && {
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
        },
      }),
      ...(user.clinics && user.clinics.length > 0 && {
        clinics: user.clinics.map((userClinic) => ({
          id: userClinic.clinic.id,
          name: userClinic.clinic.name,
          clinicType: userClinic.clinic.clinicType,
        })),
      }),
      // Only include shgMemberships for non-Admin/Co-ordinator users
      ...(!hasAdminOrCoordinatorRole && {
        shgMemberships: formattedMemberships,
      }),
    };

    return {
      accessToken,
      refreshToken,
      appInstanceId,
      promoterOrganizationId, // Include in login response for Admin/Co-ordinator
      user: userResponse,
    };
  },

  async verifyOtpAndLogin(
    identifier: string,
    otp: string,
    requestId: string,
    ipAddress?: string,
    userAgent?: string,
    deviceInfo?: string,
    mobileAppSettings?: MobileAppSettingsInput,
  ) {
    try {
      const otpResult = await OtpHelper.verifyOtp(identifier, otp, 'login');

      if (!otpResult.isValid) {
        let errorMessage = 'Invalid OTP';
        let statusCode = 400;

        if (otpResult.errorType === 'EXPIRED') {
          errorMessage = 'OTP has expired. Please request a new one.';
          statusCode = 410; // Gone - resource expired
        } else if (otpResult.errorType === 'INVALID') {
          errorMessage = 'Invalid OTP. Please check and try again.';
          statusCode = 400;
        } else if (otpResult.errorType === 'NOT_FOUND') {
          errorMessage = 'OTP not found. Please request a new OTP.';
          statusCode = 404;
        }

        return { error: errorMessage, status: statusCode };
      }

      const user = await AuthRepository.findUserByIdentifier(identifier);
      if (!user) {
        return { error: 'User not found', status: 404 };
      }

      // ✅ NEW: Check if user account is locked
      if (user.isLocked) {
        logger.warn('Login attempted for locked account via OTP', {
          userId: user.id,
          requestId,
        });
        return {
          error: 'Your account is Inactive. Please contact support.',
          status: 403,
        };
      }

      let appInstanceId: string | undefined;

      // Store mobile app settings if provided
      if (mobileAppSettings) {
        try {
          // This will block all previous instances and create a new one
          const newSettings =
            await MobileSettingsRepository.upsertMobileAppSettings(
              user.id,
              mobileAppSettings,
            );
          appInstanceId = newSettings.appInstanceId;

          logger.info('Mobile app settings updated with new app instance', {
            userId: user.id,
            appInstanceId,
            requestId,
          });
        } catch (error) {
          logger.error('Failed to update mobile app settings', {
            error,
            userId: user.id,
            requestId,
          });
          // Continue with login even if mobile settings update fails
        }
      }

      // Check for existing session if multi-session is not allowed
      const redisKey = `user:session:${user.id}`;
      if (!env.MULTI_LOGIN_SESSION_ALLOWED) {
        const existingSession = await redisCacheHelper.has(redisKey);
        if (existingSession) {
          logger.warn('User already has an active session', {
            userId: user.id,
            requestId,
          });
          return { error: 'User already logged in elsewhere', status: 403 };
        }
      }

      // Call _createUserSession with proper parameters including appInstanceId
      const sessionResult = await this._createUserSession(
        user,
        requestId,
        ipAddress,
        userAgent,
        deviceInfo,
        appInstanceId, // Pass the appInstanceId here
      );

      // Return the appInstanceId in the response
      return {
        ...sessionResult,
        appInstanceId, // Include appInstanceId in the response
      };
    } catch (error) {
      logger.error('Login error', { error, requestId });
      throw error;
    }
  },

  async forgotPassword(
    identifier: string,
    channel: string | undefined,
    requestId: string,
  ): Promise<PasswordOtpResponse> {
    try {
      logger.debug('Forgot password request', { identifier, requestId });

      // Check if user exists with role filtering
      const user =
        await AuthRepository.findUserByIdentifierWithRoles(identifier);

      if (!user) {
        logger.warn('Forgot password attempted for non-existent user', {
          identifier,
          requestId,
        });
        // Return error for non-existent user
        return {
          message: 'No account found with this identifier',
          success: false,
        };
      }

      // Check if user has allowed roles (Admin or Co-ordinator)
      const allowedRoles = ['Admin', 'Co-ordinator'];
      const userRoles = user.UserRole.map((userRole) => userRole.role.roleName);
      const hasAllowedRole = userRoles.some((role) =>
        allowedRoles.includes(role),
      );

      if (!hasAllowedRole) {
        logger.warn('Forgot password attempted for user without allowed role', {
          identifier,
          userId: user.id,
          userRoles,
          requestId,
        });
        return {
          message: 'Password reset is not allowed for your account type',
          success: false,
        };
      }

      // Check if user account is active and not locked
      if (user.isLocked) {
        logger.warn('Forgot password attempted for locked account', {
          identifier,
          userId: user.id,
          requestId,
        });
        return {
          message: 'Account is Inactive. Please contact support.',
          success: false,
        };
      }

      // Generate and send OTP
      const otp = await OtpHelper.generateOtp();
      await OtpHelper.storeOtp(identifier, otp, 'password_reset');
      await OtpHelper.sendOtp(identifier, otp, channel, 'password_reset');

      logger.info('OTP sent for password reset', {
        userId: user.id,
        identifier,
        requestId,
      });

      return {
        message: 'OTP has been sent to your registered email/mobile',
        otpExpiry: env.OTP_EXPIRY_SEC,
        success: true,
      };
    } catch (error) {
      logger.error('Forgot password error', { error, requestId });
      throw new Error('Failed to process forgot password request');
    }
  },

  async resetPassword(
    identifier: string,
    token: string,
    newPassword: string,
    requestId: string,
  ) {
    try {
      logger.debug('Reset password attempt', {
        identifier,
        tokenLength: token?.length,
        requestId,
      });

      const user = await AuthRepository.findUserByIdentifier(identifier);
      if (!user) {
        logger.warn('User not found for password reset', {
          identifier,
          requestId,
        });
        return { message: 'Password reset successful' };
      }

      if (user.isLocked) {
        logger.warn('Password reset attempted for locked account', {
          userId: user.id,
          requestId,
        });
        return {
          error: 'Your account is Inactive. Please contact support.',
          status: 403,
        };
      }

      // Verify OTP with detailed result
      const otpResult = await OtpHelper.verifyOtp(
        identifier,
        token,
        'password_reset',
      );

      if (!otpResult.isValid) {
        let errorMessage = 'Invalid or expired OTP';
        let statusCode = 401;

        if (otpResult.errorType === 'EXPIRED') {
          errorMessage = 'OTP has expired. Please request a new one.';
          statusCode = 410;
        } else if (otpResult.errorType === 'INVALID') {
          errorMessage = 'Invalid OTP. Please check and try again.';
          statusCode = 400;
        }

        logger.warn('OTP verification failed for password reset', {
          identifier,
          requestId,
          errorType: otpResult.errorType,
        });
        return { error: errorMessage, status: statusCode };
      }

      // Continue with password reset...
      await AuthRepository.updateUserPassword(user.id, newPassword);
      await AuthRepository.invalidateAllUserSessions(user.id);

      logger.info('Password reset successful', {
        userId: user.id,
        identifier,
        requestId,
      });

      return { message: 'Password reset successful' };
    } catch (error) {
      logger.error('Reset password error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        identifier,
        requestId,
      });
      return { error: 'Password reset failed', status: 500 };
    }
  },
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    requestId: string,
  ) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        logger.warn('User not found for password change', {
          userId,
          requestId,
        });
        return { error: 'User not found', status: 404 };
      }

      // Verify user is not locked before allowing password change
      if (user.isLocked) {
        logger.warn('Locked user attempted password change', {
          userId,
          requestId,
        });
        return {
          error: 'Your account is Inactive. Please contact support.',
          status: 403,
        };
      }

      // If user has no password set yet (first-time setup)
      if (!user.password) {
        logger.info(
          'User has no existing password, skipping current password check',
          {
            userId,
            requestId,
          },
        );

        // ✅ allow directly setting the new password here
      } else {
        // Compare current password
        const passwordMatch = await comparePassword(
          currentPassword,
          user.password,
        );
        if (!passwordMatch) {
          logger.warn('Incorrect current password', { userId, requestId });
          // Return 400 instead of 401 to prevent automatic logout
          return { error: 'Current password is incorrect', status: 400 };
        }

        // Prevent using the same password
        const isSamePassword = await comparePassword(
          newPassword,
          user.password,
        );
        if (isSamePassword) {
          logger.warn('New password same as current', { userId, requestId });
          return {
            error: 'New password must be different from current password',
            status: 400, // Use 400 instead of 401
          };
        }
      }

      // Update password
      await AuthRepository.updateUserPassword(userId, newPassword);

      // Invalidate all active sessions to force logout everywhere
      await AuthRepository.invalidateAllUserSessions(userId);

      logger.info('Password changed successfully, all sessions invalidated', {
        userId,
        requestId,
      });

      return { message: 'Password changed successfully. Please log in again.' };
    } catch (error) {
      logger.error('Change password error', { error, requestId });
      return {
        error: 'An unexpected error occurred during password change',
        status: 500,
      };
    }
  },

  async verifyOtpForPasswordReset(
    identifier: string,
    otp: string,
    requestId: string,
  ): Promise<{ isValid: boolean; errorType?: string }> {
    try {
      logger.debug('Verifying OTP for password reset', {
        identifier,
        requestId,
      });
      const result = await OtpHelper.verifyOtp(
        identifier,
        otp,
        'password_reset',
      );
      return {
        isValid: result.isValid,
        errorType: result.errorType,
      };
    } catch (error) {
      logger.error('Verify OTP for password reset error', {
        error,
        requestId,
      });
      throw error;
    }
  },

  async resendOtp(
    identifier: string,
    channel: string | undefined,
    purpose: 'login' | 'password_reset',
    requestId: string,
  ): Promise<PasswordOtpResponse> {
    try {
      logger.debug('Resending OTP', {
        identifier,
        purpose,
        requestId,
      });

      // ✅ NEW: Check if user exists and is not locked (for non-fixed identifiers)
      if (!isFixedOtpIdentifier(identifier)) {
        const user = await AuthRepository.findUserByIdentifier(identifier);
        if (!user) {
          logger.warn('User not found for OTP resend', {
            identifier,
            requestId,
          });
          return {
            success: false,
            message: 'If the account exists, an OTP has been sent',
          };
        }

        if (user.isLocked) {
          logger.warn('OTP resend attempted for locked account', {
            userId: user.id,
            requestId,
          });
          return {
            success: false,
            message: 'Your account is Inactive. Please contact support.',
          };
        }
      }

      // Clear any existing OTP first
      await OtpHelper.clearOtp(identifier, purpose);

      const otp = await OtpHelper.generateOtp();
      await OtpHelper.storeOtp(identifier, otp, purpose);
      await OtpHelper.sendOtp(identifier, otp, channel);

      return {
        message: 'OTP resent successfully',
        otpExpiry: env.OTP_EXPIRY_SEC,
        success: true,
      };
    } catch (error) {
      logger.error('Resend OTP error', {
        error,
        requestId,
      });
      throw error;
    }
  },

  async refreshTokens(
    refreshToken: string,
    requestId: string,
  ): Promise<TokenRefreshResponse | { error: string; status: number }> {
    try {
      // Use JWT_REFRESH_SECRET for verifying refresh tokens
      const decoded = verifyToken(refreshToken, env.JWT_REFRESH_SECRET);

      if (!decoded || !decoded.jti || !decoded.userId || !decoded.sessionId) {
        logger.warn('Invalid refresh token structure', {
          hasJti: !!decoded?.jti,
          hasUserId: !!decoded?.userId,
          hasSessionId: !!decoded?.sessionId,
          requestId,
        });
        return { error: 'Invalid refresh token', status: 401 };
      }

      // Check if refresh token is valid in Redis
      const isValid = await AuthRepository.isRefreshTokenValid(decoded.jti);
      if (!isValid) {
        logger.warn('Refresh token invalid or revoked', {
          jti: decoded.jti,
          userId: decoded.userId,
          requestId,
        });
        return { error: 'Refresh token revoked or expired', status: 401 };
      }

      // Get user information with roles
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          UserRole: {
            include: {
              role: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return { error: 'User not found', status: 404 };
      }

      // Extract only role IDs
      const roleIds = user.UserRole.map((userRole) => userRole.role.id);

      // Generate new access token with JWT_SECRET
      const accessTokenResult = generateTokenWithJti(
        {
          userId: user.id,
          userIdentifier: user.userId,
          roleIds,
          appInstanceId: decoded.appInstanceId,
          sessionId: decoded.sessionId,
        },
        env.JWT_SECRET, // Use JWT_SECRET for access token
        { expiresIn: env.JWT_EXPIRES_IN as StringValue },
      );

      // Generate new refresh token with JWT_REFRESH_SECRET
      const refreshTokenResult = generateTokenWithJti(
        {
          userId: user.id,
          sessionId: decoded.sessionId,
          appInstanceId: decoded.appInstanceId,
        },
        env.JWT_REFRESH_SECRET, // Use JWT_REFRESH_SECRET for refresh token
        { expiresIn: env.JWT_REFRESH_EXPIRY as StringValue },
      );

      // Store new refresh token and revoke old one
      const refreshExpiryMs = ms(env.JWT_REFRESH_EXPIRY as StringValue);
      const stored = await AuthRepository.storeRefreshTokenAtomic(
        refreshTokenResult.jti,
        user.id,
        Math.floor(refreshExpiryMs / 1000),
        decoded.jti,
      );

      if (!stored) {
        return { error: 'Failed to store refresh token', status: 500 };
      }

      // Update session in Redis
      const redisKey = env.MULTI_LOGIN_SESSION_ALLOWED
        ? `user:session:${user.id}:${decoded.sessionId}`
        : `user:session:${user.id}`;

      const sessionData = {
        accessToken: accessTokenResult.token,
        refreshToken: refreshTokenResult.token,
        sessionId: decoded.sessionId,
        appInstanceId: decoded.appInstanceId,
        expiresAt: new Date(Date.now() + refreshExpiryMs).toISOString(),
      };

      await redisCacheHelper.set(
        redisKey,
        JSON.stringify(sessionData),
        Math.floor(refreshExpiryMs / 1000),
      );

      return {
        accessToken: accessTokenResult.token,
        refreshToken: refreshTokenResult.token,
        expiresIn: Math.floor(ms(env.JWT_EXPIRES_IN as StringValue) / 1000),
      };
    } catch (error) {
      logger.error('Token refresh error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        requestId,
      });

      if (error instanceof jwt.JsonWebTokenError) {
        return { error: 'Invalid refresh token', status: 401 };
      }
      if (error instanceof jwt.TokenExpiredError) {
        return { error: 'Refresh token expired', status: 401 };
      }

      return { error: 'Failed to refresh tokens', status: 500 };
    }
  },

  // async refreshAccessTokenIfNeeded(
  //   accessToken: string,
  //   requestId: string,
  // ): Promise<{ newAccessToken?: string; newRefreshToken?: string } | null> {
  //   try {
  //     // Check if sliding window is enabled
  //     if (!env.SLIDING_WINDOW_ENABLED) {
  //       return null;
  //     }

  //     const decoded = decodeToken(accessToken);
  //     if (!decoded || !decoded.userId) return null;

  //     // Check if token is near expiry
  //     const thresholdMs = ms(env.SLIDING_WINDOW_THRESHOLD as StringValue);
  //     const threshold = thresholdMs / 1000; // Convert to seconds
  //     const now = Math.floor(Date.now() / 1000);

  //     if (decoded.exp && decoded.exp - now > threshold) {
  //       return null; // Token not near expiry
  //     }

  //     // Get user session
  //     const redisKey = `user:session:${decoded.userId}`;
  //     const userSession = await redisCacheHelper.get<string>(redisKey);
  //     if (!userSession) return null;

  //     const session = JSON.parse(userSession);
  //     if (!session.refreshToken) return null;

  //     // Verify refresh token is still valid
  //     const refreshValid = await AuthRepository.isRefreshTokenValid(
  //       session.refreshJti,
  //     );
  //     if (!refreshValid) return null;

  //     // Refresh tokens
  //     const result = await this.refreshTokens(session.refreshToken, requestId);
  //     if ('error' in result) return null;

  //     return {
  //       newAccessToken: result.accessToken,
  //       newRefreshToken: result.refreshToken,
  //     };
  //   } catch (error) {
  //     logger.error('Access token refresh check error', { error, requestId });
  //     return null;
  //   }
  // },
};
