import { Request, Response } from "express";
import { RegisterService } from "./register.service";
import { successResponse, errorResponse, getModuleLogger } from "../../../utils";

const logger = getModuleLogger("register-controller");

/**
 * Controller layer for User Registration and Authentication operations.
 */
export const RegisterController = {
  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register a new user account
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 50
   *                 description: Unique username for the account
   *                 example: "john_doe"
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"
   *                 description: Password with uppercase, lowercase, number, and special character
   *                 example: "SecurePass123!"
   *               emailId:
   *                 type: string
   *                 format: email
   *                 description: User's email address
   *                 example: "john.doe@example.com"
   *               mobileNumber:
   *                 type: string
   *                 pattern: "^[0-9]{10}$"
   *                 description: 10-digit mobile number
   *                 example: "9876543210"
   *               countryDialCode:
   *                 type: string
   *                 description: Country dialing code
   *                 example: "+91"
   *               fullName:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 100
   *                 description: User's full name
   *                 example: "John Doe"
   *               tenantId:
   *                 type: string
   *                 description: Tenant/Organization ID
   *                 example: "tenant_123"
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   description: User ID
   *                 username:
   *                   type: string
   *                   description: Username
   *                 emailId:
   *                   type: string
   *                   description: Email address
   *                 mobileNumber:
   *                   type: string
   *                   description: Mobile number
   *                 fullName:
   *                   type: string
   *                   description: Full name
   *                 emailVerified:
   *                   type: boolean
   *                   description: Email verification status
   *                 mobileValidationStatus:
   *                   type: boolean
   *                   description: Mobile verification status
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                   description: Account creation timestamp
   *       400:
   *         description: Invalid input or user already exists
   *       500:
   *         description: Registration failed
   */
  async register(req: Request, res: Response) {
    try {
      const result = await RegisterService.register(
        req.body,
        (req as any).requestId
      );
      
      if ('error' in result) {
        errorResponse(res, result.error, result.status);
        return;
      }

      logger.debug("✅ User registered:", {
        requestId: (req as any).requestId,
        userId: result.id,
      });
      successResponse(res, result, 201);
    } catch (error) {
      logger.error("❌ Registration error:", {
        requestId: (req as any).requestId,
        error,
      });
      errorResponse(
        res,
        "Registration failed",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: User login with credentials
   *     tags: [Authentication]
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
   *                 description: Username, email, or mobile number
   *                 example: "john_doe"
   *               password:
   *                 type: string
   *                 description: User's password
   *                 example: "SecurePass123!"
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: User ID
   *                     username:
   *                       type: string
   *                       description: Username
   *                     emailId:
   *                       type: string
   *                       description: Email address
   *                     fullName:
   *                       type: string
   *                       description: Full name
   *                     roles:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           roleId:
   *                             type: string
   *                           roleName:
   *                             type: string
   *                           roleCategory:
   *                             type: string
   *                 accessToken:
   *                   type: string
   *                   description: JWT access token
   *                 refreshToken:
   *                   type: string
   *                   description: JWT refresh token
   *                 expiresIn:
   *                   type: number
   *                   description: Token expiry in seconds
   *       401:
   *         description: Invalid credentials
   *       403:
   *         description: Account locked
   *       500:
   *         description: Login failed
   */
  async login(req: Request, res: Response) {
    try {
      const result = await RegisterService.login(
        req.body,
        (req as any).requestId
      );
      
      if ('error' in result) {
        errorResponse(res, result.error, result.status);
        return;
      }

      logger.debug("✅ User logged in:", {
        requestId: (req as any).requestId,
        userId: result.user.id,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ Login error:", {
        requestId: (req as any).requestId,
        error,
      });
      errorResponse(
        res,
        "Login failed",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /auth/change-password:
   *   post:
   *     summary: Change user password (requires authentication)
   *     tags: [Authentication]
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
   *                 description: Current password
   *                 example: "OldPass123!"
   *               newPassword:
   *                 type: string
   *                 minLength: 8
   *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"
   *                 description: New password with uppercase, lowercase, number, and special character
   *                 example: "NewPass123!"
   *     responses:
   *       200:
   *         description: Password changed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *       400:
   *         description: Invalid request or new password same as old
   *       401:
   *         description: Current password incorrect or unauthorized
   *       404:
   *         description: User not found
   *       500:
   *         description: Password change failed
   */
  async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { currentPassword, newPassword } = req.body;
      
      const result = await RegisterService.changePassword(
        userId,
        currentPassword,
        newPassword,
        (req as any).requestId
      );
      
      if ('error' in result) {
        errorResponse(res, result.error, result.status);
        return;
      }

      logger.debug("✅ Password changed:", {
        requestId: (req as any).requestId,
        userId,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ Change password error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        "Failed to change password",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /auth/verify-email/{userId}:
   *   post:
   *     summary: Verify user email address
   *     tags: [Authentication]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         description: User ID
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Email verified successfully
   *       404:
   *         description: User not found
   *       500:
   *         description: Verification failed
   */
  async verifyEmail(req: Request, res: Response) {
    try {
      const userId = String(req.params.userId);
      const result = await RegisterService.verifyEmailAddress(
        userId,
        (req as any).requestId
      );
      
      if ('error' in result) {
        errorResponse(res, result.error, result.status);
        return;
      }

      logger.debug("✅ Email verified:", {
        requestId: (req as any).requestId,
        userId,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ Email verification error:", {
        requestId: (req as any).requestId,
        userId: req.params.userId,
        error,
      });
      errorResponse(
        res,
        "Failed to verify email",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /auth/verify-mobile/{userId}:
   *   post:
   *     summary: Verify user mobile number
   *     tags: [Authentication]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         description: User ID
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Mobile number verified successfully
   *       404:
   *         description: User not found
   *       500:
   *         description: Verification failed
   */
  async verifyMobile(req: Request, res: Response) {
    try {
      const userId = String(req.params.userId);
      const result = await RegisterService.verifyMobileNumber(
        userId,
        (req as any).requestId
      );
      
      if ('error' in result) {
        errorResponse(res, result.error, result.status);
        return;
      }

      logger.debug("✅ Mobile verified:", {
        requestId: (req as any).requestId,
        userId,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ Mobile verification error:", {
        requestId: (req as any).requestId,
        userId: req.params.userId,
        error,
      });
      errorResponse(
        res,
        "Failed to verify mobile number",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     summary: User logout (requires authentication)
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               allDevices:
   *                 type: boolean
   *                 description: Logout from all devices
   *                 default: false
   *                 example: false
   *               token:
   *                 type: string
   *                 description: Optional specific token to logout
   *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Logged out successfully"
   *       401:
   *         description: Unauthorized - Invalid or missing token
   *       500:
   *         description: Logout failed
   */
  async logout(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        errorResponse(res, "Unauthorized", 401);
        return;
      }
      
      const result = await RegisterService.logout(
        req.body || {},
        userId,
        (req as any).requestId
      );
      
      if ('error' in result) {
        errorResponse(res, result.error, result.status);
        return;
      }

      logger.debug("✅ User logged out:", {
        requestId: (req as any).requestId,
        userId,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ Logout error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        "Logout failed",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  }
};