import { Prisma, User, PersonType } from '@prisma/client';
import { UserCreateInput, StaffCreateInput, StaffCreateResponse } from './user.type';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserRepository } from './user.repository';
import { getModuleLogger, env } from '../../utils';
import { redisCacheHelper } from '../../utils/redisCacheHelper';
import { OTPService } from './otpService/otp.service';
import crypto from 'crypto';

const logger = getModuleLogger('user-service');
const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRY = env.JWT_EXPIRES_IN;
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRY = env.JWT_REFRESH_EXPIRY || '7d';
const PASSWORD_EXPIRY_DAYS = parseInt(process.env.PASSWORD_EXPIRY_DAYS || '90');

type SafeUser = Omit<User, 'passwordHash'> & {
  roles: string[];
};

export const UserService = {
  async register(input: UserCreateInput, requestId: string, userId: string): Promise<{
    user: SafeUser;
    confirmationToken?: string;
  }> {
    try {
      logger.debug('Registering new user', { input: { ...input, password: '**REDACTED**' }, requestId, userId });

      const now = new Date();

      // Validate unique fields
      const existingUser = await UserRepository.findUserByIdentifier(input.username);
      if (existingUser) throw new Error('User ID already exists');

      if (input.emailId) {
        const emailExists = await UserRepository.findUserByIdentifier(input.emailId);
        if (emailExists) throw new Error('Email already registered');
      }

      if (input.mobileNumber) {
        const phoneExists = await UserRepository.findUserByIdentifier(input.mobileNumber);
        if (phoneExists) throw new Error('Mobile number already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.passwordHash, 10);

      // Token generation
      const confirmationToken = input.emailId
        ? jwt.sign({ email: input.emailId }, JWT_SECRET, { expiresIn: '24h' })
        : undefined;


      // Password expiry
      const passwordExpiryDate = new Date(now);
      passwordExpiryDate.setDate(passwordExpiryDate.getDate() + PASSWORD_EXPIRY_DAYS);

      // Final user data
      const userData: UserCreateInput = {
        ...input,
        passwordHash: hashedPassword,
        passwordExpiryDate,
        emailValidationStatus: false,
        mobileValidationStatus: false,
        confirmationToken,
        tokenGenerationTime: input.emailId ? now : undefined,
        isLocked: input.isLocked ?? false,
        lockedTillDate: input.lockedTillDate ?? null,
        multiSessionCount: input.multiSessionCount ?? 1,
        privacyPolicyVersion: input.privacyPolicyVersion ?? '1.0',
        profilePictureUrl: input.profilePictureUrl ?? null,
        metaData: input.metaData ?? Prisma.DbNull,
        createdAt: now,
        updatedAt: now,
      };

      // Save to DB
      const user = await UserRepository.createUser(userData);

      const { passwordHash, ...rest } = user;
      const roles = user.userRoles?.map((ur: { roleId: string }) => ur.roleId) || [];

      logger.info('User registered successfully', { username: user.username, requestId });

      return {
        user: { ...rest, roles },
        confirmationToken
      };
    } catch (error) {
      logger.error('Registration failed', {
        error,
        input: {
          ...input,
          password: '**REDACTED**',
          confirmationToken: '**REDACTED**',
          passwordRecoveryToken: '**REDACTED**'
        },
        requestId,
        userId
      });
      throw error;
    }
  },

  async createStaff(input: StaffCreateInput, requestId: string, createdBy: string): Promise<StaffCreateResponse> {
    try {
      logger.debug('Creating staff user', { 
        input: { ...input, password: '**REDACTED**' }, 
        requestId, 
        createdBy 
      });

      // First, check if the roleId exists and get the role name to verify if it's STAFF
      const role = await UserRepository.findRoleById(input.roleId);
      if (!role) {
        throw new Error('Invalid role ID');
      }

      const isStaffRole = role.roleName === 'STAFF';
      logger.debug('Role validation', { roleId: input.roleId, roleName: role.roleName, isStaffRole });

      // Validate unique fields
      const existingUser = await UserRepository.findUserByIdentifier(input.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const emailExists = await UserRepository.findUserByIdentifier(input.email);
      if (emailExists) {
        throw new Error('Email already registered');
      }

      const phoneExists = await UserRepository.findUserByIdentifier(input.phoneNumber);
      if (phoneExists) {
        throw new Error('Phone number already registered');
      }

      // Validate tenant and clinic existence
      const tenant = await UserRepository.findTenantById(input.tenantId);
      if (!tenant) {
        throw new Error('Invalid tenant ID');
      }

      const clinic = await UserRepository.findClinicById(input.clinicId);
      if (!clinic) {
        throw new Error('Invalid clinic ID');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Use Prisma transaction to create User, Person (if STAFF), UserRole, and UserClinic
      const result = await UserRepository.createStaffWithTransaction({
        userData: {
          username: input.username,
          passwordHash: hashedPassword,
          emailId: input.email,
          mobileNumber: input.phoneNumber,
          tenantId: input.tenantId,
          emailValidationStatus: false,
          mobileValidationStatus: false,
          isLocked: false,
          multiSessionCount: 1,
          createdBy,
          updatedBy: createdBy,
        },
        personData: isStaffRole ? {
          tenantId: input.tenantId,
          type: PersonType.USER,
          fullName: input.name,
          phone: input.phoneNumber,
          email: input.email,
          sex: input.sex || null,
        } : null,
        roleData: {
          roleId: input.roleId,
          priority: role.priority,
          createdBy,
          updatedBy: createdBy,
        },
        clinicData: {
          clinicId: input.clinicId,
          roleInClinic: 'STAFF',
        },
      }, requestId);

      logger.info('Staff user created successfully', {
        username: result.user.username,
        personCreated: isStaffRole,
        requestId
      });

      return {
        success: true,
        message: 'User created successfully',
        data: result,
      };
    } catch (error) {
      logger.error('Staff creation failed', {
        error,
        input: { ...input, password: '**REDACTED**' },
        requestId,
        createdBy
      });
      throw error;
    }
  },

  async login(input: { identifier: string; password: string }, requestId: string): Promise<{
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      logger.debug('Login attempt', { identifier: input.identifier, requestId });

      const user = await UserRepository.findUserByIdentifier(input.identifier);
      if (!user) throw new Error('Invalid credentials');

      if (user.isLocked && user.lockedTillDate && new Date() < user.lockedTillDate) {
        throw new Error(`Account locked until ${user.lockedTillDate.toISOString()}`);
      }

      const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isPasswordValid) throw new Error('Invalid credentials');

      if (user.passwordExpiryDate && new Date() > user.passwordExpiryDate) {
        throw new Error('Password expired. Please reset your password.');
      }

      const roles = user.userRoles?.map((ur: { roleId: string }) => ur.roleId) || [];
      

      const accessToken = jwt.sign(
        { username: user.username, id: user.id },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY } as jwt.SignOptions,
      );

      const refreshToken = jwt.sign(
        { username: user.username, id: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRY } as jwt.SignOptions,
      );

      await redisCacheHelper.set(
        `session:${user.id}`,
        {
          refreshToken,
          username: user.username,
          createdAt: new Date().toISOString(),
        },
        7 * 24 * 60 * 60,
      );

      const { passwordHash, ...rest } = user;

      logger.info('Login successful', { username: user.username, requestId });

      return {
        user: { ...rest, roles },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Login failed', { 
        error, 
        identifier: input.identifier, 
        requestId 
      });
      throw error;
    }
  },
async logout(id: string, requestId: string): Promise<void> {
  try {
    logger.debug('Logging out user', { id, requestId });

    const sessionKey = `session:${id}`;

    const exists = await redisCacheHelper.has(sessionKey);
    if (!exists) {
      logger.warn('Session not found during logout', { id, requestId });
      return;
    }

    await redisCacheHelper.delete(sessionKey);

    logger.info('User logged out successfully', { id, requestId });
  } catch (error) {
    logger.error('Failed to logout user', { id, requestId, error });
    throw error;
  }
},

  async getAll(requestId: string, userId: string) {
    try {
      logger.debug('Fetching all users', { requestId, userId });
      const users = await UserRepository.getAll(requestId, userId);
      return users;
    } catch (error) {
      logger.error('Error fetching all users', { error, requestId, userId });
      throw error;
    }
  },

  async blockUserByIdentifier(
    identifier: string,
    blockedBy: string,
    requestId: string
  ): Promise<void> {
    try {
      logger.debug('Blocking user', { identifier, blockedBy, requestId });

      const user = await UserRepository.findUserByIdentifier(identifier);
      if (!user) throw new Error('User not found');
      if (user.isLocked) throw new Error('User is already blocked');

      await UserRepository.blockUser(user.id, blockedBy);
      logger.info('User blocked successfully', { username: user.username, requestId });
    } catch (error) {
      logger.error('Failed to block user', { identifier, error, requestId });
      throw error;
    }
  },

  async unblockUserByIdentifier(
    identifier: string,
    unblockedBy: string,
    requestId: string
  ): Promise<void> {
    try {
      logger.debug('Unblocking user', { identifier, unblockedBy, requestId });

      const user = await UserRepository.findUserByIdentifier(identifier);
      if (!user) throw new Error('User not found');
      if (!user.isLocked) throw new Error('User is not blocked');

      await UserRepository.unblockUser(user.id, unblockedBy);
      logger.info('User unblocked successfully', { username: user.username, requestId });
    } catch (error) {
      logger.error('Failed to unblock user', { identifier, error, requestId });
      throw error;
    }
  },

  async refreshToken(refreshToken: string, requestId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: SafeUser;
  }> {
    try {
      logger.debug('Refreshing token', { requestId });

      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
        username: string;
        id: string;
      };

      const user = await UserRepository.findUserByIdentifier(decoded.username);
      if (!user) throw new Error('User not found');

      if (user.isLocked && user.lockedTillDate && new Date() < user.lockedTillDate) {
        throw new Error(`Account locked until ${user.lockedTillDate.toISOString()}`);
      }

      const roles = user.userRoles?.map((ur: { roleId: string }) => ur.roleId) || [];

      const newAccessToken = jwt.sign(
        { username: user.username, id: user.id, roles },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY } as jwt.SignOptions,
      );

      const newRefreshToken = jwt.sign(
        { username: user.username, id: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRY } as jwt.SignOptions,
      );

      const { passwordHash, ...rest } = user;

      logger.info('Token refreshed successfully', { username: user.username, requestId });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: { ...rest, roles },
      };
    } catch (error) {
      logger.error('Refresh token failed', { error, requestId });
      throw error;
    }
  },

  async getUserProfile(userId: string, requestId: string): Promise<SafeUser | null> {
  try {
    logger.debug('Fetching user profile', { userId, requestId });

    const user = await UserRepository.findUserByIdentifier(userId);
    if (!user) {
      logger.warn('User not found while fetching profile', { userId, requestId });
      return null;
    }

    const roles = user.userRoles?.map((ur: { roleId: string }) => ur.roleId) || [];
    const { passwordHash, ...rest } = user;

    logger.info('User profile fetched', { username: user.username, requestId });

    return { ...rest, roles };
  } catch (error) {
    logger.error('Failed to get user profile', { userId, error, requestId });
    throw error;
  }
},

async verifyEmailById(
  id: string,
  verifiedBy: string,
  requestId: string
): Promise<{ user?: SafeUser; error?: string }> {
  try {
    logger.debug('Verifying email by ID', { id, verifiedBy, requestId });

    const user = await UserRepository.findUserById(id);
    if (!user) {
      logger.warn('User not found during email verification', { id, requestId });
      return { error: 'User not found' };
    }

    if (user.emailValidationStatus) {
      logger.warn('Email already verified', { username: user.username, requestId });
      return { error: 'Email is already verified' };
    }

    if (!user.emailId) {
      logger.warn('User has no email', { username: user.username, requestId });
      return { error: 'User has no email to verify' };
    }

    const updatedUser = await UserRepository.verifyEmailById(id, verifiedBy);
    const { passwordHash, ...rest } = updatedUser;

    logger.info('Email verified successfully', { username: updatedUser.username, requestId });

    return {
      user: {
        ...rest,
        roles: updatedUser.userRoles?.map((ur: { roleId: string }) => ur.roleId) || [],
      },
    };
  } catch (error) {
    logger.error('Failed to verify email', { id, error, requestId });
    throw error;
  }
},

  async loginWithOTP(
    identifier: string,
    otp: string,
    requestId: string
  ): Promise<{
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      logger.debug('Attempting OTP login', { identifier, requestId });

      const isValidOTP = await OTPService.verifyOTP(identifier, otp, 'login');
      if (!isValidOTP) throw new Error('Invalid or expired OTP');

      const user = await UserRepository.findUserByIdentifier(identifier);
      if (!user) throw new Error('User not found');

      if (user.isLocked && user.lockedTillDate && new Date() < user.lockedTillDate) {
        throw new Error(`Account locked until ${user.lockedTillDate.toISOString()}`);
      }

      const roles = user.userRoles?.map((ur: { roleId: string }) => ur.roleId) || [];

      const accessToken = jwt.sign(
        { username: user.username, id: user.id, roles },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY } as jwt.SignOptions
      );

      const refreshToken = jwt.sign(
        { username: user.username, id: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRY } as jwt.SignOptions
      );

      await redisCacheHelper.set(
        `session:${user.id}`,
        {
          refreshToken,
          username: user.username,
          createdAt: new Date().toISOString()
        },
        7 * 24 * 60 * 60
      );

      const { passwordHash, ...rest } = user;

      logger.info('OTP login successful', { username: user.username, requestId });

      return {
        user: { ...rest, roles },
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('OTP login failed', { identifier, error, requestId });
      throw error;
    }
  },

  async verifyEmail(token: string, requestId: string): Promise<SafeUser> {
    try {
      logger.debug('Verifying email', { requestId });

      const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
      
      const user = await UserRepository.findUserByIdentifier(decoded.email);
      if (!user) throw new Error('User not found');
      
      if (user.emailValidationStatus) {
        throw new Error('Email already verified');
      }
      
      if (!user.confirmationToken || user.confirmationToken !== token) {
        throw new Error('Invalid verification token');
      }
      
      if (user.tokenGenerationTime) {
        const tokenAge = Date.now() - user.tokenGenerationTime.getTime();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        
        if (tokenAge > TWENTY_FOUR_HOURS) {
          throw new Error('Verification token expired');
        }
      }
      
      const updatedUser = await UserRepository.verifyEmailById(
        user.id, 
        user.username,
        token
      );
      
      const { passwordHash, ...rest } = updatedUser;

      logger.info('Email verified successfully', { username: user.username, requestId });
      
      return { 
        ...rest, 
        roles: updatedUser.userRoles?.map((ur: { roleId: string }) => ur.roleId) || [] 
      };
      
    } catch (error) {
      logger.error('Email verification failed', { 
        error,
        token: token ? '**REDACTED**' : 'MISSING_TOKEN',
        requestId
      });
      
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Verification token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid verification token');
      }
      
      throw error;
    }
  },

  async verifyPhone(identifier: string, otp: string, requestId: string): Promise<SafeUser> {
    try {
      logger.debug('Verifying phone', { identifier, requestId });

      const isValid = await OTPService.verifyOTP(identifier, otp, 'phone_verification');
      if (!isValid) throw new Error('Invalid or expired OTP');

      const user = await UserRepository.findUserByIdentifier(identifier);
      if (!user) throw new Error('User not found');
      if (user.mobileValidationStatus) throw new Error('Phone already verified');

      const updatedUser = await UserRepository.verifyPhoneById(user.id, user.username);
      const { passwordHash, ...rest } = updatedUser;

      logger.info('Phone verified successfully', { username: user.username, requestId });
      
      return { ...rest, roles: updatedUser.userRoles?.map((ur: { roleId: string }) => ur.roleId) || [] };
    } catch (error) {
      logger.error('Phone verification failed', { identifier, error, requestId });
      throw error;
    }
  },

  async resendVerification(
    identifier: string, 
    requestId: string
  ): Promise<{ channel: 'email' | 'sms'; identifier: string }> {
    try {
      logger.debug('Resending verification', { identifier, requestId });

      const user = await UserRepository.findUserByIdentifier(identifier);
      if (!user) {
        throw new Error('User not found');
      }

      let channel: 'email' | 'sms' = 'email';
      let purpose = 'email_verification';
      let needsVerification = false;

      if (identifier.includes('@')) {
        needsVerification = !user.emailValidationStatus;
      } else {
        channel = 'sms';
        purpose = 'phone_verification';
        needsVerification = !user.mobileValidationStatus;
      }

      if (!needsVerification) {
        throw new Error('Account already verified');
      }

      const verificationToken = crypto.randomInt(100000, 999999).toString();
      await UserRepository.updateVerificationToken(
        user.id,
        channel === 'email' ? verificationToken : null,
        channel === 'sms' ? verificationToken : null
      );

      await OTPService.sendOTP(identifier, channel, purpose);

      logger.info('Verification resent successfully', { username: user.username, channel, requestId });

      return { channel, identifier };
    } catch (error) {
      logger.error('Failed to resend verification', { identifier, error, requestId });
      throw error;
    }
  },
};