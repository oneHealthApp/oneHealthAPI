/**
 * Data types used across Auth module.
 */

export type LoginInput = {
  identifier: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  appInstanceId?: string;
  promoterOrganizationId?: string; // Add this field
  user: {
    id: string;
    userId: string;
    avatar?: string;
    userName?: string;
    email?: string;
    authority?: string;
    roles: Array<{
      roleId: string;
      roleName: string;
      roleCategory?: string;
    }>;
    // Enhanced role information for backward compatibility
    primaryRoleId?: string;
    primaryRoleName?: string;
    // Tenant information
    tenantId?: string;
    tenantName?: string;
    // Clinic information
    clinicId?: string;
    clinicName?: string;
    clinicType?: string;
    clinics?: Array<{
      id: string;
      name: string;
      type: string;
    }>;
    shgMemberships?: SHGMembershipResponse[];
    profilePictureUrl?: string;
  };
};

export type UserSessionCreateInput = {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
};

export type LogoutResponse = {
  message: string;
};

export type UpdateSessionInput = {
  id: string;
  loginTime: Date;
};

export type GenerateOtpInput = {
  identifier: string;
  channel?: 'sms' | 'email';
};

export type VerifyOtpInput = {
  identifier: string;
  otp: string;
  mobileAppSettings?: MobileAppSettingsInput;
};

export type PasswordOtpResponse = {
  message: string;
  otpExpiry?: number;
  success: boolean;
};

export type OtpResponse = {
  success: boolean;
  message: string;
  otpExpiry?: number;
};

export type ForgotPasswordInput = {
  identifier: string;
  channel?: 'sms' | 'email';
};

export type ResetPasswordInput = {
  identifier: string;
  token: string; // Changed from token to resetToken
  newPassword: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type VerifyOtpForPasswordResetInput = {
  identifier: string;
  otp: string;
};

export type ResendOtpInput = {
  identifier: string;
  channel?: 'sms' | 'email';
  purpose: 'login' | 'password_reset';
};

// Add this new type
export type SHGMembershipResponse = {
  id: string;
  shgId: string;
  organizationName: string;
  organizationCode: string;
  membershipRole: string;
  memberFromDate: Date;
  memberValidTillDate?: Date;
  isActive: boolean;
};

export type TokenPayload = {
  userId: string;
  userIdentifier: string;
  roleIds: string[];
  jti?: string;
  exp?: number;
  iat?: number;
  appInstanceId?: string;
  sessionId?: string;
};

export interface RefreshTokenData {
  jti: string;
  userId: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

export type TokenRefreshResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
};

export type AuthError = {
  error: string;
  status: number;
  code?: string;
};

export type TokenRefreshResult = {
  newAccessToken?: string;
  newRefreshToken?: string;
  error?: AuthError;
};

export type MobileAppSettingsInput = {
  appInstanceId?: string;
  appName: string;
  platform: 'ANDROID' | 'IOS';
  fcmId: string;
  version: string;
  deviceInfo?: Record<string, any>;
  metaData?: Record<string, any>;
};

export type VerifyOtpWithMobileSettingsInput = VerifyOtpInput & {
  mobileAppSettings: MobileAppSettingsInput;
};

export type OtpVerificationResult = {
  isValid: boolean;
  errorType?: 'INVALID' | 'EXPIRED' | 'NOT_FOUND';
  message?: string;
};
export type MobileSettingsResponse = {
  id: string;
  isUpdateMandatory: boolean;
  deviceInfo?: Record<string, any>;
  metaData?: Record<string, any>;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    userId: string;
    emailId?: string;
    mobileNumber?: string;
    isLocked: boolean;
    profilePictureUrl?: string;
    person?: {
      id: string;
      nameInEnglish?: string;
      photoURL?: string;
      email?: string;
      mobile?: string;
      aadhaarMasked?: string;
    };
  };
  organizations: any[];
};
