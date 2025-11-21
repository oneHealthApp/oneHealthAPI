import { Request, Response } from 'express';
import { UserService } from './user.service';
import { successResponse, errorResponse, getModuleLogger } from '../../utils';
import { OTPService } from './otpService/otp.service';
import { PasswordService } from './passwordService/password.service';

const logger = getModuleLogger('user-controller');

export const UserController = {
  async register(req: Request, res: Response) {
    try {
      const result = await UserService.register(
        req.body,
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ User logged in successfully', {
        requestId: (req as any).requestId,
        userId: result.user.id,
      });
      successResponse(res, { user: result.user });
    } catch (error: any) {
      logger.error('❌ Registration failed', {
        requestId: (req as any).requestId,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to register user',
        400,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async login(req: Request, res: Response) {
    try {
      const result = await UserService.login(req.body, (req as any).requestId);

      logger.debug('✅ Login successful', {
        requestId: (req as any).requestId,
        userId: result.user.id,
      });

      successResponse(res, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error: any) {
      logger.error('❌ Login failed', {
        requestId: (req as any).requestId,
        error,
      });

      errorResponse(
        res,
        error || 'Failed to login',
        401,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

async logout(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id; // ✅ Use internal UUID, not login identifier
    const requestId = (req as any).requestId;

    if (!userId) {
      errorResponse(res, 'User not authenticated', 401);
      return;
    }

    await UserService.logout(userId, requestId); // ✅ now matches Redis key

    successResponse(res, { message: 'Logged out successfully' });
  } catch (error) {
    logger.error('❌ Logout error', {
      requestId: (req as any).requestId,
      error,
    });

    errorResponse(res, 'Failed to logout', 500);
  }
},

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw Error('Refresh token is required');
      }

      const result = await UserService.refreshToken(
        refreshToken,
        (req as any).requestId,
      );
      logger.debug('✅ Refresh token successful', {
        requestId: (req as any).requestId,
        userId: result.user.id,
      });

      successResponse(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (error: any) {
      logger.error('❌ Refresh token failed', {
        requestId: (req as any).requestId,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to refresh token',
        401,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const result = await UserService.getAll(
        (req as any).requestId,
        (req as any).user?.id,
      );
      logger.debug('✅ All users retrieved', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error('❌ Get all users error', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        'Failed to fetch users',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async blockUser(req: Request, res: Response) {
    try {
      const { identifier } = req.body;
      const blockedBy = (req as any).user?.userId || 'system';

      await UserService.blockUserByIdentifier(
        identifier,
        blockedBy,
        (req as any).requestId,
      );

      logger.debug('✅ User blocked', {
        requestId: (req as any).requestId,
        blockedBy,
        identifier,
      });

      successResponse(res, { message: 'User blocked successfully' });
    } catch (error: any) {
      logger.error('❌ Block user failed', {
        requestId: (req as any).requestId,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to block user',
        400,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async unblockUser(req: Request, res: Response) {
    try {
      const { identifier } = req.body;
      const unblockedBy = (req as any).user?.userId || 'system';

      await UserService.unblockUserByIdentifier(
        identifier,
        unblockedBy,
        (req as any).requestId,
      );

      logger.debug('✅ User unblocked', {
        requestId: (req as any).requestId,
        unblockedBy,
        identifier,
      });

      successResponse(res, { message: 'User unblocked successfully' });
    } catch (error: any) {
      logger.error('❌ Unblock user failed', {
        requestId: (req as any).requestId,
        error,
      });
      errorResponse(
        res,
        error || 'Failed to unblock user',
        400,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },
  async getProfile(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).requestId;
    const userId = (req as any).user?.userId; // Ensure this matches your auth middleware

    try {
      logger.debug('Fetching user profile', { userId, requestId });
      
      const user = await UserService.getUserProfile(userId, requestId);
      logger.info('✅ User profile fetched successfully', { requestId, userId });
      
      successResponse(res, user);
      
    } catch (error: any) {
      // Use error status if provided, default to 500
      const status = error.status || 500;
      const clientMessage = status === 500 
        ? 'Failed to fetch profile' 
        : error.message || 'Failed to fetch profile';
      
      logger.error('❌ Profile fetch failed', { 
        requestId, 
        userId,
        status,
        error: error.message || error,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });

      errorResponse(
        res,
        clientMessage,
        status,
        process.env.NODE_ENV === 'development' ? error.details || error.message : undefined
      );
    }
},

  async verifyEmailById(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const verifiedBy = (req as any).user?.userId || 'system';
    const { id } = req.params;

    try {
      const { user, error } = await UserService.verifyEmailById(
        id,
        verifiedBy,
        requestId,
      );

      if (error) {
        logger.warn('Email verification failed', {
          id,
          requestId,
          verifiedBy,
          error,
        });
        errorResponse(res, error, 400);
        return;
      }

      successResponse(res, {
        message: 'Email verified successfully',
        user,
      });
    } catch (error: any) {
      logger.error('❌ Email verification error', {
        requestId,
        id,
        error,
      });
      errorResponse(
        res,
        'Failed to verify email',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async sendOTP(req: Request, res: Response) {
    try {
      const { identifier, channel } = req.body;

      if (!['email', 'sms'].includes(channel)) {
        throw new Error('Invalid channel specified');
      }

      await OTPService.sendOTP(
        identifier,
        'login',
        channel === 'sms'
          ? 'Your verification code is {OTP}'
          : 'Your verification code is {OTP}. Please do not share this code with anyone.',
        channel === 'email' ? 'Verification Code' : undefined,
      );

      successResponse(res, {
        message: 'OTP sent successfully',
        identifier,
        channel,
      });
    } catch (error: any) {
      errorResponse(res, error, 400);
    }
  },

  async verifyOTP(req: Request, res: Response) {
    try {
      const { identifier, otp } = req.body;

      if (!identifier || !otp) {
        throw new Error('Identifier and OTP are required');
      }

      const isValid = await OTPService.verifyOTP(
        identifier,
        otp,
        'verification',
      );

      if (!isValid) {
        errorResponse(res, 'Invalid OTP', 400);
        return;
      }

      successResponse(res, {
        message: 'OTP verified successfully',
        identifier,
      });
    } catch (error: any) {
      errorResponse(res, error, 400);
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { identifier } = req.body;

      await PasswordService.initiatePasswordReset(
        identifier,
        (req as any).requestId,
      );

      logger.debug('✅ Password reset initiated', {
        requestId: (req as any).requestId,
        identifier,
      });

      successResponse(res, {
        message: 'If the identifier exists, a reset OTP has been sent',
      });
    } catch (error: any) {
      logger.error('❌ Password reset initiation failed', {
        requestId: (req as any).requestId,
        error,
      });

      errorResponse(
        res,
        error || 'Failed to initiate password reset',
        400,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { identifier, otp, newPassword } = req.body;

      await PasswordService.resetPassword(
        identifier,
        otp,
        newPassword,
        (req as any).requestId,
      );

      logger.debug('✅ Password reset successful', {
        requestId: (req as any).requestId,
        identifier,
      });

      successResponse(res, {
        message: 'Password has been reset successfully',
      });
    } catch (error: any) {
      logger.error('❌ Password reset failed', {
        requestId: (req as any).requestId,
        error,
      });

      errorResponse(
        res,
        error || 'Failed to reset password',
        400,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async changePassword(req: Request, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req as any).user.id;

      await PasswordService.changePassword(
        userId,
        currentPassword,
        newPassword,
        (req as any).requestId,
      );

      logger.debug('✅ Password changed successfully', {
        requestId: (req as any).requestId,
        userId,
      });

      successResponse(res, {
        message: 'Password has been changed successfully',
      });
    } catch (error: any) {
      logger.error('❌ Password change failed', {
        requestId: (req as any).requestId,
        error,
      });

      errorResponse(
        res,
        error || 'Failed to change password',
        400,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async loginWithOTP(req: Request, res: Response) {
    try {
      const { identifier, otp } = req.body;

      const result = await UserService.loginWithOTP(
        identifier,
        otp,
        (req as any).requestId,
      );

      logger.debug('✅ OTP login successful', {
        requestId: (req as any).requestId,
        userId: result.user.id,
      });

      successResponse(res, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error: any) {
      logger.error('❌ OTP login failed', {
        requestId: (req as any).requestId,
        error,
      });

      errorResponse(
        res,
        error || 'Failed to login with OTP',
        401,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const user = await UserService.verifyEmail(token, (req as any).requestId);

      logger.debug('✅ Email verified successfully', {
        requestId: (req as any).requestId,
        userId: user.id,
      });

      successResponse(res, {
        message: 'Email verified successfully',
        user,
      });
    } catch (error: any) {
      logger.error('❌ Email verification failed', {
        requestId: (req as any).requestId,
        error,
      });

      errorResponse(
        res,
        error || 'Failed to verify email',
        400,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async verifyPhone(req: Request, res: Response) {
    try {
      const { identifier, otp } = req.body;
      const user = await UserService.verifyPhone(
        identifier,
        otp,
        (req as any).requestId,
      );

      logger.debug('✅ Phone verified successfully', {
        requestId: (req as any).requestId,
        userId: user.id,
      });

      successResponse(res, {
        message: 'Phone verified successfully',
        user,
      });
    } catch (error: any) {
      logger.error('❌ Phone verification failed', {
        requestId: (req as any).requestId,
        error,
      });

      errorResponse(
        res,
        error || 'Failed to verify phone',
        400,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },

  async resendVerification(req: Request, res: Response) {
    try {
      const { identifier } = req.body;

      if (!identifier) {
        errorResponse(res, 'Identifier is required', 400);
      }

      const result = await UserService.resendVerification(
        identifier,
        (req as any).requestId,
      );

      successResponse(res, {
        message: 'Verification resent successfully',
        channel: result.channel,
        identifier: result.identifier,
      });
    } catch (error: any) {
      errorResponse(
        res,
        error || 'Failed to resend verification',
        error || 500,
      );
    }
  },


};
