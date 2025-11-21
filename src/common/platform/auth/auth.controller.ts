import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  successResponse,
  errorResponse,
  getModuleLogger,
} from '../../../utils';

const logger = getModuleLogger('auth-controller');

export const AuthController = {
  /**
   * @swagger
   * /platform/auth/o/login:
   *   post:
   *     summary: User login with identifier and password
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - identifier
   *               - password
   *             properties:
   *               identifier:
   *                 type: string
   *                 description: Email, userId, or mobile number
   *               password:
   *                 type: string
   *                 description: User's password
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 accessToken:
   *                   type: string
   *                 refreshToken:
   *                   type: string
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     userId:
   *                       type: string
   *                     avatar:
   *                       type: string
   *                     userName:
   *                       type: string
   *                     email:
   *                       type: string
   *                     authority:
   *                       type: string
   *                     roles:
   *                       type: array
   *                       items:
   *                         type: object
   *       401:
   *         description: Invalid credentials
   *       403:
   *         description: Account locked or already logged in
   *       500:
   *         description: Server error
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, password } = req.body;
      const result = await AuthService.login(
        identifier,
        password,
        (req as any).requestId,
        req.ip,
        req.headers['user-agent'],
        req.headers['device-info'] as string | undefined,
      );

      if ('error' in result) {
        errorResponse(res, result.error, result.status);
        return;
      }

      successResponse(res, result);
    } catch (error) {
      logger.error('Login error', { error, requestId: (req as any).requestId });
      errorResponse(res, 'Login failed', 500);
    }
  },

  /**
   * @swagger
   * /platform/auth/r/logout:
   *   post:
   *     summary: Log out a user
   *     description: Invalidates the user's current session by clearing the JWT token.
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Logout successful
   *       401:
   *         description: Missing or invalid JWT token
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: Token missing or invalid
   *       404:
   *         description: No active session found for the user
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: No active session
   *       500:
   *         description: Server error during logout
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: Logout failed
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const isExpiredToken = (req as any).user?.isExpired;
      const token =
        (req as any).expiredToken || req.headers.authorization?.split(' ')[1];

      if (!userId || !token) {
        errorResponse(res, 'Token missing or invalid', 401);
        return;
      }

      const result = await AuthService.logout(
        userId,
        token,
        (req as any).requestId,
        isExpiredToken, // Pass the expired flag to service
      );

      if ('error' in result) {
        errorResponse(res, result.error, result.status);
        return;
      }

      successResponse(res, result);
    } catch (error) {
      logger.error('Logout error', {
        error,
        requestId: (req as any).requestId,
      });
      errorResponse(res, 'Logout failed', 500);
    }
  },
  /**
   * @swagger
   * /platform/auth/o/otp:
   *   post:
   *     summary: Generate OTP for login
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - identifier
   *             properties:
   *               identifier:
   *                 type: string
   *               channel:
   *                 type: string
   *                 description: Optional channel (e.g., email, sms)
   *     responses:
   *       200:
   *         description: OTP sent if the account exists
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: If the account exists, an OTP has been sent
   *                 otpExpiry:
   *                   type: number
   *       500:
   *         description: Server error
   */
  async generateOtp(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, channel } = req.body;
      const result = await AuthService.generateOtp(
        identifier,
        channel,
        (req as any).requestId,
      );
      successResponse(res, result);
    } catch (error) {
      // Improved error logging
      logger.error('Generate OTP controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        requestId: (req as any).requestId,
      });
      errorResponse(res, 'Failed to generate OTP', 500);
    }
  },

  /**
   * @swagger
   * /platform/auth/o/otp/verify/login:
   *   post:
   *     summary: Verify OTP and login
   *     description: |
   *       Verify OTP and complete login process. Optionally provide mobile app settings
   *       to register a new app instance. If mobile settings are provided, all previous
   *       app instances for this user will be automatically blocked.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - identifier
   *               - otp
   *             properties:
   *               identifier:
   *                 type: string
   *                 description: User identifier (email, userId, or mobile number)
   *                 example: "user@example.com"
   *               otp:
   *                 type: string
   *                 description: One-time password received by user
   *                 example: "123456"
   *               mobileAppSettings:
   *                 type: object
   *                 description: Optional mobile application settings (creates new app instance)
   *                 properties:
   *                   appName:
   *                     type: string
   *                     description: Name of the mobile application (required if mobileAppSettings provided)
   *                     example: "MyApp"
   *                   platform:
   *                     type: string
   *                     enum: [ANDROID, IOS]
   *                     description: Mobile platform (required if mobileAppSettings provided)
   *                     example: "ANDROID"
   *                   fcmId:
   *                     type: string
   *                     description: Firebase Cloud Messaging ID for push notifications (required if mobileAppSettings provided)
   *                     example: "fcm-token-123"
   *                   version:
   *                     type: string
   *                     description: Application version (required if mobileAppSettings provided)
   *                     example: "1.0.0"
   *                   deviceInfo:
   *                     type: object
   *                     description: Device information (optional)
   *                     example: { "model": "Pixel 6", "osVersion": "Android 13" }
   *                   metaData:
   *                     type: object
   *                     description: Additional metadata (optional)
   *                     example: { "location": "New York", "timezone": "UTC-5" }
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 accessToken:
   *                   type: string
   *                   description: JWT access token for authentication
   *                 refreshToken:
   *                   type: string
   *                   description: JWT refresh token for obtaining new access tokens
   *                 appInstanceId:
   *                   type: string
   *                   description: Unique identifier for the mobile app instance (returned if mobileAppSettings was provided)
   *                 user:
   *                   type: object
   *                   description: User information
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: User ID
   *                     userId:
   *                       type: string
   *                       description: User identifier
   *                     avatar:
   *                       type: string
   *                       description: Profile picture URL
   *                     userName:
   *                       type: string
   *                       description: User's name
   *                     email:
   *                       type: string
   *                       description: User's email address
   *                     authority:
   *                       type: string
   *                       description: User's authority/role category
   *                     roles:
   *                       type: array
   *                       description: User roles
   *                       items:
   *                         type: object
   *                         properties:
   *                           roleId:
   *                             type: string
   *                           roleName:
   *                             type: string
   *                           roleCategory:
   *                             type: string
   *                     shgMemberships:
   *                       type: array
   *                       description: Self-help group memberships
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           shgId:
   *                             type: string
   *                           organizationName:
   *                             type: string
   *                           organizationCode:
   *                             type: string
   *                           membershipRole:
   *                             type: string
   *                           memberFromDate:
   *                             type: string
   *                             format: date-time
   *                           memberValidTillDate:
   *                             type: string
   *                             format: date-time
   *                           isActive:
   *                             type: boolean
   *       400:
   *         description: Bad request - invalid input parameters
   *       401:
   *         description: Invalid or expired OTP
   *       403:
   *         description: Already logged in elsewhere (when multi-session is disabled)
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  async verifyOtpAndLogin(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, otp, mobileAppSettings } = req.body;
      const result = await AuthService.verifyOtpAndLogin(
        identifier,
        otp,
        (req as any).requestId,
        req.ip,
        req.headers['user-agent'],
        req.headers['device-info'] as string | undefined,
        mobileAppSettings,
      );

      if ('error' in result) {
        errorResponse(res, result.error, result.status);
        return;
      }

      successResponse(res, result);
    } catch (error) {
      logger.error('Verify OTP error', {
        error,
        requestId: (req as any).requestId,
      });
      errorResponse(res, 'Failed to verify OTP', 500);
    }
  },
  /**
   * @swagger
   * /platform/auth/o/forgot-password:
   *   post:
   *     summary: Initiate password reset
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - identifier
   *             properties:
   *               identifier:
   *                 type: string
   *               channel:
   *                 type: string
   *     responses:
   *       200:
   *         description: Password reset initiated if account exists
   *       400:
   *         description: Invalid request
   *       500:
   *         description: Server error
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, channel } = req.body;
      const result = await AuthService.forgotPassword(
        identifier,
        channel,
        (req as any).requestId,
      );

      if (!result.success) {
        // Return appropriate error status based on the message
        let statusCode = 404;
        if (result.message.includes('locked')) statusCode = 403;
        if (result.message.includes('inactive')) statusCode = 403;

        errorResponse(res, result.message, statusCode);
        return;
      }

      successResponse(res, result);
    } catch (error) {
      logger.error('Forgot password controller error', {
        error,
        requestId: (req as any).requestId,
      });
      errorResponse(res, 'Failed to process forgot password', 500);
    }
  },

  /**
   * @swagger
   * /platform/auth/o/reset-password:
   *   post:
   *     summary: Reset password with token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - identifier
   *               - token
   *               - newPassword
   *             properties:
   *               identifier:
   *                 type: string
   *               token:
   *                 type: string
   *               newPassword:
   *                 type: string
   *     responses:
   *       200:
   *         description: Password reset successful
   *       401:
   *         description: Invalid token
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, token, newPassword } = req.body;
      const result = await AuthService.resetPassword(
        identifier,
        token,
        newPassword,
        (req as any).requestId,
      );

      if (result.error) {
        errorResponse(res, result.error, result.status);
        return;
      }

      successResponse(res, result);
    } catch (error) {
      logger.error('Reset password error', {
        error,
        requestId: (req as any).requestId,
      });
      errorResponse(res, 'Failed to reset password', 500);
    }
  },

  /**
   * @swagger
   * /platform/auth/r/change-password:
   *   post:
   *     summary: Change password (requires authentication)
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *     responses:
   *       200:
   *         description: Password changed
   *       401:
   *         description: Incorrect current password or unauthorized
   *       400:
   *         description: New password same as old
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { currentPassword, newPassword } = req.body;
      const requestId = (req as any).requestId;

      const result = await AuthService.changePassword(
        userId,
        currentPassword,
        newPassword,
        requestId,
      );

      if ('error' in result) {
        // For change password, don't return 401 status as it triggers logout
        // Instead return 400 for validation errors
        const statusCode = result.status === 401 ? 400 : result.status;
        errorResponse(res, result.error, statusCode);
        return;
      }

      // Only logout and return success if password change was successful
      const token = req.headers.authorization?.split(' ')[1] || '';
      await AuthService.logout(userId, token, requestId);

      successResponse(res, result);
    } catch (error) {
      logger.error('Change password controller error', {
        error,
        requestId: (req as any).requestId,
      });
      errorResponse(res, 'Failed to change password', 500);
    }
  },

  /**
   * @swagger
   * /platform/auth/o/otp/verify-password-reset:
   *   post:
   *     summary: Verify OTP for password reset
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - identifier
   *               - otp
   *             properties:
   *               identifier:
   *                 type: string
   *               otp:
   *                 type: string
   *     responses:
   *       200:
   *         description: OTP valid
   *       401:
   *         description: Invalid or expired OTP
   *       500:
   *         description: Server error
   */
  async verifyOtpForPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, otp } = req.body;
      const result = await AuthService.verifyOtpForPasswordReset(
        identifier,
        otp,
        (req as any).requestId,
      );

      if (!result.isValid) {
        let errorMessage = 'Invalid OTP';
        let statusCode = 401;

        if (result.errorType === 'EXPIRED') {
          errorMessage = 'OTP has expired';
          statusCode = 410;
        }

        errorResponse(res, errorMessage, statusCode);
        return;
      }

      successResponse(res, { valid: true });
    } catch (error) {
      logger.error('Verify OTP for password reset error', {
        error,
        requestId: (req as any).requestId,
      });
      errorResponse(res, 'Failed to verify OTP', 500);
    }
  },

  /**
   * @swagger
   * /platform/auth/o/otp/resend:
   *   post:
   *     summary: Resend OTP for login or reset
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - identifier
   *               - purpose
   *             properties:
   *               identifier:
   *                 type: string
   *               channel:
   *                 type: string
   *               purpose:
   *                 type: string
   *                 enum: [login, password_reset]
   *     responses:
   *       200:
   *         description: OTP resent
   *       500:
   *         description: Server error
   */
  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, channel, purpose } = req.body;
      const result = await AuthService.resendOtp(
        identifier,
        channel,
        purpose,
        (req as any).requestId,
      );

      successResponse(res, result);
    } catch (error) {
      logger.error('Resend OTP error', {
        error,
        requestId: (req as any).requestId,
      });
      errorResponse(res, 'Failed to resend OTP', 500);
    }
  },

  /**
   * @swagger
   * /platform/auth/o/refresh:
   *   post:
   *     summary: Refresh access token using refresh token
   *     description: |
   *       Exchanges a valid refresh token for a new access token and refresh token.
   *       Implements refresh token rotation for enhanced security.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 description: Valid refresh token obtained during login
   *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *     responses:
   *       200:
   *         description: Tokens refreshed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 accessToken:
   *                   type: string
   *                   description: New JWT access token
   *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                 refreshToken:
   *                   type: string
   *                   description: New refresh token (old one is revoked)
   *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                 expiresIn:
   *                   type: number
   *                   description: Access token expiration time in seconds
   *                   example: 3600
   *         headers:
   *           X-New-Access-Token:
   *             schema:
   *               type: string
   *             description: New access token (also available in response body)
   *           X-New-Refresh-Token:
   *             schema:
   *               type: string
   *             description: New refresh token (also available in response body)
   *       400:
   *         description: Invalid request - refresh token missing or malformed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: |
   *           Unauthorized - refresh token is invalid, expired, or revoked.
   *           Possible reasons:
   *           - Refresh token has been revoked (user logged out)
   *           - Refresh token has expired
   *           - Refresh token is malformed or invalid
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: User associated with refresh token not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error during token refresh
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *     security: []
   */
  async refreshTokens(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshTokens(
        refreshToken,
        (req as any).requestId,
      );

      if ('error' in result) {
        errorResponse(res, result.error, result.status);
        return;
      }

      successResponse(res, result);
    } catch (error) {
      logger.error('Refresh tokens error', {
        error,
        requestId: (req as any).requestId,
      });
      errorResponse(res, 'Failed to refresh tokens', 500);
    }
  },
};
