import { RegisterCreateInput, RegisterResponse, LoginRequest, LoginResponse, LogoutRequest } from "./register.type";
import { RegisterRepository } from "./register.repository";
import { getModuleLogger } from "../../../utils";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

const logger = getModuleLogger("register-service");

/**
 * Business logic layer for Register operations.
 */
export const RegisterService = {
  async register(data: RegisterCreateInput, requestId: string): Promise<RegisterResponse | { error: string; status: number }> {
    try {
      logger.debug("Creating user account", { username: data.username, requestId });
      
      // Check if user already exists
      const existingUser = await RegisterRepository.checkUserExists(
        data.username,
        data.emailId,
        data.mobileNumber
      );
      
      if (existingUser) {
        return { error: 'User with this username, email, or mobile already exists', status: 400 };
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);
      
      // Create user with hashed password
      const userData = { ...data, password: hashedPassword };
      const user = await RegisterRepository.createUser(userData);

      if (!user) {
        return { error: 'Failed to create user', status: 500 };
      }

      // Return sanitized user data
      const response: RegisterResponse = {
        id: user.id,
        username: user.username,
        emailId: user.emailId || undefined,
        mobileNumber: user.mobileNumber || undefined,
        fullName: (user as any).person?.fullName || undefined,
        emailVerified: user.emailVerified,
        mobileValidationStatus: user.mobileValidationStatus,
        createdAt: user.createdAt
      };

      logger.info("User registered successfully", { userId: user.id, username: user.username, requestId });
      return response;
    } catch (error) {
      logger.error("Error registering user", { error, requestId });
      return { error: 'Registration failed', status: 500 };
    }
  },

  async login(loginData: LoginRequest, requestId: string): Promise<LoginResponse | { error: string; status: number }> {
    try {
      logger.debug("User login attempt", { identifier: loginData.identifier, requestId });
      
      // Find user by identifier
      const user = await RegisterRepository.findUserByIdentifier(loginData.identifier);
      
      if (!user) {
        return { error: 'Invalid credentials', status: 401 };
      }

      // Check if user account is locked
      if (user.isLocked) {
        return { error: 'Account is locked', status: 403 };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);
      
      if (!isPasswordValid) {
        return { error: 'Invalid credentials', status: 401 };
      }

      // Generate JWT tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Prepare user data for response
      const userResponse = {
        id: user.id,
        username: user.username,
        emailId: user.emailId || undefined,
        fullName: (user as any).person?.fullName || undefined,
        tenantId: user.tenantId || (user as any).tenant?.id || null,
        clinicId: (user as any).clinics?.[0]?.clinic?.id || null,
        roles: (user as any).userRoles?.map((ur: any) => ({
          roleId: ur.role.id,
          roleName: ur.role.roleName,
          roleCategory: ur.role.roleCategory
        })) || [],
        // Include tenant information when available
        ...((user as any).tenant && {
          tenant: {
            id: (user as any).tenant.id,
            name: (user as any).tenant.name,
            slug: (user as any).tenant.slug,
          },
        }),
        // Include clinic information when available
        ...((user as any).clinics && (user as any).clinics.length > 0 && {
          clinics: (user as any).clinics.map((userClinic: any) => ({
            id: userClinic.clinic.id,
            name: userClinic.clinic.name,
            clinicType: userClinic.clinic.clinicType,
          })),
        }),
      };

      const response: LoginResponse = {
        user: userResponse,
        accessToken,
        refreshToken,
        expiresIn: 14400 // 4 hours in seconds
      };

      logger.info("User logged in successfully", { userId: user.id, username: user.username, requestId });
      return response;
    } catch (error) {
      logger.error("Error during login", { error, requestId });
      return { error: 'Login failed', status: 500 };
    }
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string, requestId: string): Promise<{ success: boolean } | { error: string; status: number }> {
    try {
      logger.debug("Change password attempt", { userId, requestId });
      
      // Find user
      const user = await RegisterRepository.findUserById(userId);
      
      if (!user) {
        return { error: 'User not found', status: 404 };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isCurrentPasswordValid) {
        return { error: 'Current password is incorrect', status: 401 };
      }

      // Check if new password is different from current
      const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
      
      if (isSamePassword) {
        return { error: 'New password must be different from current password', status: 400 };
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update password
      await RegisterRepository.updateUserPassword(userId, hashedNewPassword);

      logger.info("Password changed successfully", { userId, requestId });
      return { success: true };
    } catch (error) {
      logger.error("Error changing password", { error, userId, requestId });
      return { error: 'Failed to change password', status: 500 };
    }
  },

  generateAccessToken(user: User): string {
    const payload = {
      id: user.id,
      username: user.username,
      emailId: user.emailId,
      type: 'access'
    };
    
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    return (jwt as any).sign(payload, secret, { expiresIn: '15m' });
  },

  generateRefreshToken(user: User): string {
    const payload = {
      id: user.id,
      username: user.username,
      type: 'refresh'
    };
    
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }
    
    return (jwt as any).sign(payload, secret, { expiresIn: '7d' });
  },

  async verifyEmailAddress(userId: string, requestId: string): Promise<{ success: boolean } | { error: string; status: number }> {
    try {
      await RegisterRepository.verifyEmail(userId);
      logger.info("Email verified successfully", { userId, requestId });
      return { success: true };
    } catch (error) {
      logger.error("Error verifying email", { error, userId, requestId });
      return { error: 'Failed to verify email', status: 500 };
    }
  },

  async verifyMobileNumber(userId: string, requestId: string): Promise<{ success: boolean } | { error: string; status: number }> {
    try {
      await RegisterRepository.verifyMobile(userId);
      logger.info("Mobile number verified successfully", { userId, requestId });
      return { success: true };
    } catch (error) {
      logger.error("Error verifying mobile", { error, userId, requestId });
      return { error: 'Failed to verify mobile number', status: 500 };
    }
  },

  async logout(logoutData: LogoutRequest, userId: string, requestId: string): Promise<{ success: boolean } | { error: string; status: number }> {
    try {
      logger.debug("User logout attempt", { userId, requestId });
      
      // For now, we'll implement a simple logout
      // In a production system, you might want to:
      // 1. Add the token to a blacklist/revocation list
      // 2. Clear refresh tokens from database
      // 3. Log the logout event
      
      if (logoutData.allDevices) {
        // Logic to invalidate all refresh tokens for the user
        logger.info("User logged out from all devices", { userId, requestId });
      } else {
        // Logic to invalidate current session/token
        logger.info("User logged out from current device", { userId, requestId });
      }

      return { success: true };
    } catch (error) {
      logger.error("Error during logout", { error, userId, requestId });
      return { error: 'Logout failed', status: 500 };
    }
  }
};