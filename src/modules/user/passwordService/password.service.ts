 import { User } from '@prisma/client';
 import bcrypt from 'bcryptjs';
import { UserRepository } from '../user.repository';
import { getModuleLogger } from '../../../utils';
import { OTPService } from '../otpService/otp.service';
import { redisCacheHelper } from '../../../utils/redisCacheHelper';
 
 const logger = getModuleLogger('user-service');
 const PASSWORD_EXPIRY_DAYS = parseInt(process.env.PASSWORD_EXPIRY_DAYS || '90');
 
 type SafeUser = Omit<User, 'password'> & {
   roles: string[];
 };
 
 export const PasswordService = {
 async initiatePasswordReset(identifier: string, requestId: string): Promise<void> {
    try {
      logger.debug('Initiating password reset', { identifier, requestId });

      const user = await UserRepository.findUserByIdentifier(identifier);
      
      if (!user) {
        logger.debug('Password reset requested for non-existent identifier', {
          identifier,
          requestId
        });
        return;
      }
      
      await OTPService.sendOTP(
        identifier,
        'password_reset',
        'Your password reset OTP is: {OTP}',
        'Password Reset OTP'
      );
      
      logger.info('Password reset OTP sent', { userId: user.id, requestId });
    } catch (error) {
      logger.error('Failed to initiate password reset', { 
        identifier, 
        error, 
        requestId 
      });
      throw error;
    }
  },

  async resetPassword(
    identifier: string,
    otp: string,
    newPassword: string,
    requestId: string
  ): Promise<void> {
    try {
      logger.debug('Resetting password', { identifier, requestId });

      const isValid = await OTPService.verifyOTP(identifier, otp, 'password_reset');
      if (!isValid) throw new Error('Invalid or expired OTP');

      const user = await UserRepository.findUserByIdentifier(identifier);
      if (!user) throw new Error('User not found');

      const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
      if (isSamePassword) {
        throw new Error('New password must be different from current password');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const passwordExpiryDate = new Date();
      passwordExpiryDate.setDate(passwordExpiryDate.getDate() + PASSWORD_EXPIRY_DAYS);
      
      await UserRepository.updateUserPassword(
        user.id,
        hashedPassword,
        passwordExpiryDate
      );
      
      await redisCacheHelper.delete(`session:${user.id}`);
      
      logger.info('Password reset successful', { userId: user.id, requestId });
    } catch (error) {
      logger.error('Password reset failed', { 
        identifier, 
        error, 
        requestId 
      });
      throw error;
    }
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    requestId: string
  ): Promise<void> {
    try {
      logger.debug('Changing password', { userId, requestId });

      const user = await UserRepository.findUserById(userId);
      if (!user) throw new Error('User not found');

      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) throw new Error('Current password is incorrect');

      if (currentPassword === newPassword) {
        throw new Error('New password must be different from current password');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const passwordExpiryDate = new Date();
      passwordExpiryDate.setDate(passwordExpiryDate.getDate() + PASSWORD_EXPIRY_DAYS);
      
      await UserRepository.updateUserPassword(
        userId,
        hashedPassword,
        passwordExpiryDate
      );
      
      await redisCacheHelper.delete(`session:${userId}`);
      
      logger.info('Password changed successfully', { userId, requestId });
    } catch (error) {
      logger.error('Password change failed', { 
        userId, 
        error, 
        requestId 
      });
      throw error;
    }
  },
}