// services/otp.service.ts
import crypto from 'crypto';
import { redisCacheHelper } from '../../../utils/redisCacheHelper';
import { NotificationHelper } from '../../../utils/notificationHelper';

const OTP_EXPIRY_SECONDS = 300; // 5 minutes

export const OTPService = {
  async sendOTP(
    identifier: string,
    purpose: string,
    messageTemplate: string,
    subject?: string
  ): Promise<void> {
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Store in Redis with purpose
    await redisCacheHelper.set(
      `otp:${purpose}:${identifier}`,
      otp,
      OTP_EXPIRY_SECONDS
    );

    // Determine channel based on identifier
    const channel = identifier.includes('@') ? 'email' : 'sms';
    const message = messageTemplate.replace('{OTP}', otp);

    if (channel === 'sms') {
      await NotificationHelper.sendSMS(identifier, message);
    } else {
      await NotificationHelper.sendEmail(
        identifier,
        subject || 'Your Verification Code',
        message
      );
    }
  },

  async verifyOTP(
    identifier: string,
    otp: string,
    purpose: string
  ): Promise<boolean> {
    const storedOTP = await redisCacheHelper.get<string>(`otp:${purpose}:${identifier}`);
    if (!storedOTP) return false;
    
    const isValid = storedOTP === otp;
    if (isValid) {
      await redisCacheHelper.delete(`otp:${purpose}:${identifier}`);
    }
    return isValid;
  }
};