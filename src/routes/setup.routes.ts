import { Router, Request, Response } from "express";
import { createSuperAdmin } from "../scripts/create-super-admin";
import { successResponse, errorResponse, getModuleLogger } from "../utils";

const router = Router();
const logger = getModuleLogger("setup-controller");

/**
 * Development/Setup Routes
 * ⚠️ These should be disabled in production!
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SuperAdminSetup:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           default: admin
 *         password:
 *           type: string
 *           default: Admin@1234
 *         email:
 *           type: string
 *           default: admin@onehealth.com
 */

/**
 * @swagger
 * /setup/super-admin:
 *   post:
 *     tags: [Setup]
 *     summary: Create Super Admin User (Development Only)
 *     description: Creates a super admin user with predefined credentials. Should be disabled in production.
 *     security: []
 *     responses:
 *       201:
 *         description: Super Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     username:
 *                       type: string
 *                     roleAssigned:
 *                       type: boolean
 *       400:
 *         description: Error creating super admin
 *       403:
 *         description: Not allowed in production
 */
router.post("/super-admin", async (req: Request, res: Response) => {
  try {
    const requestId = req.headers['x-request-id'] as string || 'setup-request';

    // Prevent creation in production
    if (process.env.NODE_ENV === 'production') {
      logger.warn("Super admin creation attempted in production", { requestId });
      errorResponse(res, "Super admin creation not allowed in production", 403);
      return;
    }

    logger.info("Creating super admin user", { requestId });

    const superAdminUser = await createSuperAdmin();

    successResponse(res, {
      userId: superAdminUser.id,
      username: superAdminUser.username,
      email: superAdminUser.emailId,
      roleAssigned: true,
      loginCredentials: {
        username: 'admin',
        password: 'Admin@1234',
        note: 'Please change password after first login'
      }
    }, 201, "Super Admin created successfully");

  } catch (error: any) {
    logger.error("Error creating super admin", { error: error.message });
    errorResponse(res, error.message, 400);
  }
});

/**
 * @swagger
 * /setup/health:
 *   get:
 *     tags: [Setup]
 *     summary: Setup Health Check
 *     description: Check if setup endpoints are available
 *     security: []
 *     responses:
 *       200:
 *         description: Setup endpoints available
router.get("/health", (req: Request, res: Response) => {
  successResponse(res, {
    environment: process.env.NODE_ENV,
    setupEndpointsEnabled: process.env.NODE_ENV !== 'production',
    timestamp: new Date().toISOString()
  }, "Setup endpoints health check");
});
});
**/
export default router;