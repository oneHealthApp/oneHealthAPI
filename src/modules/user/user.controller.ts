import { Request, Response } from 'express';
import { UserService } from './user.service';
import { successResponse, errorResponse, getModuleLogger } from '../../utils';
import { OTPService } from './otpService/otp.service';
import { PasswordService } from './passwordService/password.service';

const logger = getModuleLogger('user-controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     StaffCreateRequest:
 *       type: object
 *       required:
 *         - tenantId
 *         - clinicId
 *         - name
 *         - phoneNumber
 *         - email
 *         - username
 *         - password
 *         - roleId
 *       properties:
 *         tenantId:
 *           type: string
 *           description: Valid tenant ID
 *           example: "tenant-123"
 *         clinicId:
 *           type: string
 *           description: Valid clinic ID
 *           example: "clinic-456"
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Full name of the staff member
 *           example: "John Doe"
 *         phoneNumber:
 *           type: string
 *           pattern: '^[0-9]{10,15}$'
 *           description: Phone number (10-15 digits)
 *           example: "1234567890"
 *         email:
 *           type: string
 *           format: email
 *           description: Valid email address
 *           example: "john.doe@example.com"
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           pattern: '^[a-zA-Z0-9_]+$'
 *           description: Username (alphanumeric and underscores only)
 *           example: "johndoe_staff"
 *         password:
 *           type: string
 *           minLength: 8
 *           pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
 *           description: Password (must contain uppercase, lowercase, number, and special character)
 *           example: "SecurePass123!"
 *         sex:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER]
 *           description: Gender (optional)
 *           example: "MALE"
 *         roleId:
 *           type: string
 *           description: Valid role ID
 *           example: "role-staff-id"
 *     
 *     StaffUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Generated user ID
 *         username:
 *           type: string
 *           description: Username
 *         emailId:
 *           type: string
 *           description: Email address
 *         mobileNumber:
 *           type: string
 *           description: Phone number
 *         tenantId:
 *           type: string
 *           description: Tenant ID
 *         personId:
 *           type: string
 *           nullable: true
 *           description: Person ID (only for STAFF role)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *     
 *     StaffPerson:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Generated person ID
 *         tenantId:
 *           type: string
 *           description: Tenant ID
 *         type:
 *           type: string
 *           enum: [USER]
 *           description: Person type
 *         fullName:
 *           type: string
 *           description: Full name
 *         phone:
 *           type: string
 *           description: Phone number
 *         email:
 *           type: string
 *           description: Email address
 *         sex:
 *           type: string
 *           nullable: true
 *           enum: [MALE, FEMALE, OTHER]
 *           description: Gender
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *     
 *     StaffUserRole:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Generated user role ID
 *         userId:
 *           type: string
 *           description: User ID
 *         roleId:
 *           type: string
 *           description: Role ID
 *         priority:
 *           type: integer
 *           description: Role priority
 *     
 *     StaffUserClinic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Generated user clinic ID
 *         userId:
 *           type: string
 *           description: User ID
 *         clinicId:
 *           type: string
 *           description: Clinic ID
 *         roleInClinic:
 *           type: string
 *           description: Role in clinic
 *           example: "STAFF"
 *     
 *     StaffCreateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "User created successfully"
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/StaffUser'
 *             person:
 *               $ref: '#/components/schemas/StaffPerson'
 *               nullable: true
 *               description: "Only present if role is STAFF"
 *             userRole:
 *               $ref: '#/components/schemas/StaffUserRole'
 *             userClinic:
 *               $ref: '#/components/schemas/StaffUserClinic'
 *     
 *     ValidationError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Validation error message"
 *         error:
 *           type: string
 *           example: "Detailed validation error"
 *     
 *     ConflictError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Username already exists"
 *         error:
 *           type: string
 *           example: "Detailed conflict information"
 *   
 *   tags:
 *     - name: Staff Management
 *       description: Staff user creation and management operations
 */

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

  /**
   * @swagger
   * /users/staff:
   *   post:
   *     tags: [Staff Management]
   *     summary: Create a new staff user
   *     description: |
   *       Creates a new staff user with automatic Person record creation if role is "STAFF".
   *       Uses Prisma transactions to ensure data consistency across User, Person, UserRole, and UserClinic tables.
   *       
   *       **Business Logic:**
   *       - If role name is "STAFF", creates both User and Person records
   *       - If role name is not "STAFF", creates only User, UserRole, and UserClinic records
   *       - All operations are performed within an atomic database transaction
   *       - Validates uniqueness of username, email, and phone number
   *       - Hashes password using bcrypt with 10 salt rounds
   *       
   *       **Security Features:**
   *       - JWT authentication required
   *       - Comprehensive input validation
   *       - Password complexity enforcement
   *       - SQL injection prevention via Prisma ORM
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/StaffCreateRequest'
   *           examples:
   *             staffUser:
   *               summary: Staff user (creates Person record)
   *               value:
   *                 tenantId: "tenant-123"
   *                 clinicId: "clinic-456"
   *                 name: "John Doe"
   *                 phoneNumber: "1234567890"
   *                 email: "john.doe@example.com"
   *                 username: "johndoe_staff"
   *                 password: "SecurePass123!"
   *                 sex: "MALE"
   *                 roleId: "role-staff-id"
   *             adminUser:
   *               summary: Admin user (no Person record)
   *               value:
   *                 tenantId: "tenant-123"
   *                 clinicId: "clinic-456"
   *                 name: "Jane Admin"
   *                 phoneNumber: "0987654321"
   *                 email: "jane.admin@example.com"
   *                 username: "janeadmin"
   *                 password: "AdminPass456!"
   *                 roleId: "role-admin-id"
   *     responses:
   *       201:
   *         description: Staff user created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/StaffCreateResponse'
   *             examples:
   *               staffCreated:
   *                 summary: STAFF role user (with Person record)
   *                 value:
   *                   success: true
   *                   message: "User created successfully"
   *                   data:
   *                     user:
   *                       id: "user-789"
   *                       username: "johndoe_staff"
   *                       emailId: "john.doe@example.com"
   *                       mobileNumber: "1234567890"
   *                       tenantId: "tenant-123"
   *                       personId: "person-456"
   *                       createdAt: "2025-11-21T10:30:00.000Z"
   *                     person:
   *                       id: "person-456"
   *                       tenantId: "tenant-123"
   *                       type: "USER"
   *                       fullName: "John Doe"
   *                       phone: "1234567890"
   *                       email: "john.doe@example.com"
   *                       sex: "MALE"
   *                       createdAt: "2025-11-21T10:30:00.000Z"
   *                     userRole:
   *                       id: "userrole-123"
   *                       userId: "user-789"
   *                       roleId: "role-staff-id"
   *                       priority: 1
   *                     userClinic:
   *                       id: "userclinic-456"
   *                       userId: "user-789"
   *                       clinicId: "clinic-456"
   *                       roleInClinic: "STAFF"
   *               nonStaffCreated:
   *                 summary: Non-STAFF role user (no Person record)
   *                 value:
   *                   success: true
   *                   message: "User created successfully"
   *                   data:
   *                     user:
   *                       id: "user-890"
   *                       username: "janeadmin"
   *                       emailId: "jane.admin@example.com"
   *                       mobileNumber: "0987654321"
   *                       tenantId: "tenant-123"
   *                       personId: null
   *                       createdAt: "2025-11-21T10:30:00.000Z"
   *                     person: null
   *                     userRole:
   *                       id: "userrole-124"
   *                       userId: "user-890"
   *                       roleId: "role-admin-id"
   *                       priority: 2
   *                     userClinic:
   *                       id: "userclinic-457"
   *                       userId: "user-890"
   *                       clinicId: "clinic-456"
   *                       roleInClinic: "STAFF"
   *       400:
   *         description: Bad Request - Validation errors or invalid references
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationError'
   *             examples:
   *               validationError:
   *                 summary: Field validation error
   *                 value:
   *                   success: false
   *                   message: "Email must be valid"
   *                   error: "Validation failed on email field"
   *               invalidReference:
   *                 summary: Invalid reference error
   *                 value:
   *                   success: false
   *                   message: "Invalid tenant ID"
   *                   error: "Tenant with provided ID does not exist"
   *               passwordComplexity:
   *                 summary: Password complexity error
   *                 value:
   *                   success: false
   *                   message: "Password must contain uppercase, lowercase, number and special character"
   *                   error: "Password validation failed"
   *       401:
   *         description: Unauthorized - Missing or invalid JWT token
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Unauthorized"
   *                 error:
   *                   type: string
   *                   example: "Missing or invalid JWT token"
   *       409:
   *         description: Conflict - Duplicate data (username, email, or phone already exists)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ConflictError'
   *             examples:
   *               usernameConflict:
   *                 summary: Username already exists
   *                 value:
   *                   success: false
   *                   message: "Username already exists"
   *                   error: "User with this username is already registered"
   *               emailConflict:
   *                 summary: Email already registered
   *                 value:
   *                   success: false
   *                   message: "Email already registered"
   *                   error: "User with this email already exists"
   *               phoneConflict:
   *                 summary: Phone number already registered
   *                 value:
   *                   success: false
   *                   message: "Phone number already registered"
   *                   error: "User with this phone number already exists"
   *       500:
   *         description: Internal Server Error - Database or system error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Failed to create staff user"
   *                 error:
   *                   type: string
   *                   example: "Database transaction failed"
   */
  async createStaff(req: Request, res: Response) {
    try {
      const result = await UserService.createStaff(
        req.body,
        (req as any).requestId,
        (req as any).user?.id || 'system'
      );

      logger.debug('✅ Staff user created successfully', {
        requestId: (req as any).requestId,
        userId: result.data.user.id,
        personCreated: !!result.data.person,
      });

      successResponse(res, result, 201);
    } catch (error: any) {
      logger.error('❌ Staff creation failed', {
        requestId: (req as any).requestId,
        error,
      });

      // Determine appropriate status code based on error message
      let statusCode = 500;
      if (error.message?.includes('already exists') || error.message?.includes('already registered')) {
        statusCode = 409; // Conflict
      } else if (error.message?.includes('Invalid') || error.message?.includes('required')) {
        statusCode = 400; // Bad Request
      }

      errorResponse(
        res,
        error.message || 'Failed to create staff user',
        statusCode,
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
      );
    }
  },


};
