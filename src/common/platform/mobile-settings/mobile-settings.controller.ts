// mobile-settings.controller.ts - Simplified with proper swagger

import { Request, Response } from 'express';
import { MobileSettingsRepository } from './mobile-settings.repository';
import {
  successResponse,
  errorResponse,
  getModuleLogger,
} from '../../../utils';
import { redisCacheHelper } from '../../../utils/redisCacheHelper';

const logger = getModuleLogger('mobile-settings-controller');

export const MobileSettingsController = {
  /**
   * @swagger
   * /platform/auth/r/mobile-settings:
   *   post:
   *     summary: Get mobile settings for a specific user
   *     description: Returns mobile app settings for the specified user with filtered response
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
   *               - userId
   *             properties:
   *               userId:
   *                 type: string
   *                 description: The user ID to get mobile settings for
   *               appInstanceId:
   *                 type: string
   *                 description: Optional app instance identifier
   *               appVersion:
   *                 type: string
   *                 description: Optional app version
   *               deviceInfo:
   *                 type: object
   *                 description: Optional device information
   *     responses:
   *       200:
   *         description: Mobile settings retrieved successfully (filtered response)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   description: Mobile settings record ID
   *                 isUpdateMandatory:
   *                   type: boolean
   *                   description: Whether update is mandatory
   *                 deviceInfo:
   *                   type: object
   *                   description: Device information
   *                 metaData:
   *                   type: object
   *                   description: Additional metadata
   *                 isBlocked:
   *                   type: boolean
   *                   description: Whether the app instance is blocked
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                   description: Creation timestamp
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
   *                   description: Last update timestamp
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
   *                     emailId:
   *                       type: string
   *                       description: User email
   *                     mobileNumber:
   *                       type: string
   *                       description: User mobile number
   *                     isLocked:
   *                       type: boolean
   *                       description: Whether user account is locked
   *                     isActive:
   *                       type: boolean
   *                       description: Whether user account is active
   *                     profilePictureUrl:
   *                       type: string
   *                       description: Profile picture URL
   *                     person:
   *                       type: object
   *                       description: Person information
   *                       properties:
   *                         id:
   *                           type: string
   *                           description: Person ID
   *                         nameInEnglish:
   *                           type: string
   *                           description: Person name in English
   *                         photoURL:
   *                           type: string
   *                           description: Photo URL
   *                         email:
   *                           type: string
   *                           description: Email address
   *                         mobile:
   *                           type: string
   *                           description: Mobile number
   *       400:
   *         description: Bad request - userId missing in request body
   *       401:
   *         description: Unauthorized - User not authenticated
   *       403:
   *         description: Forbidden - Access denied
   *       404:
   *         description: No mobile settings found for the user
   *       500:
   *         description: Internal server error
   */
  async getUserMobileSettings(req: Request, res: Response): Promise<void> {
    try {
      const { userId, appInstanceId, appVersion, deviceInfo } = req.body;
      const authenticatedUserId = (req as any).user?.id;
      const requestId = (req as any).requestId;

      if (!userId) {
        errorResponse(res, 'userId is required in request body', 400);
        return;
      }

      // Authorization check
      if (authenticatedUserId !== userId) {
        errorResponse(
          res,
          'Access denied - can only access your own mobile settings',
          403,
        );
        return;
      }

      let settings;

      // If appInstanceId is provided, use it directly
      if (appInstanceId) {
        settings =
          await MobileSettingsRepository.getMobileSettingsByUserIdAndAppInstance(
            userId,
            appInstanceId,
          );
      }

      // If not found or no appInstanceId provided, get latest settings
      if (!settings) {
        settings =
          await MobileSettingsRepository.getLatestMobileSettingsByUserId(
            userId,
          );
      }

      if (!settings) {
        errorResponse(res, 'No mobile settings found for this user', 404);
        return;
      }

      // Get user's organizations
      const organizations =
        await MobileSettingsRepository.getUserOrganizations(userId);

      // Filter out the unwanted fields from the response but keep person data including aadhaarMasked
      const {
        appInstanceId: _,
        appName,
        platform,
        fcmId,
        version,
        ...filteredSettings
      } = settings;

      // Ensure person data is preserved with aadhaarMasked
      const response = {
        ...filteredSettings,
        organizations, // Include organizations array
      };

      successResponse(res, response);
    } catch (error) {
      logger.error('Get user mobile settings error', {
        error,
        requestId: (req as any).requestId,
        userId: req.body?.userId,
      });
      errorResponse(res, 'Failed to get mobile settings', 500);
    }
  },

  async getAppInstanceDetails(req: Request, res: Response): Promise<void> {
    try {
      const { appInstanceId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        errorResponse(res, 'User not authenticated', 401);
        return;
      }

      const settings =
        await MobileSettingsRepository.getMobileSettingsByAppInstance(
          appInstanceId,
        );

      if (!settings) {
        errorResponse(res, 'App instance not found', 404);
        return;
      }

      // Verify the app instance belongs to the authenticated user
      if (settings.userId !== userId) {
        errorResponse(res, 'Access denied', 403);
        return;
      }

      successResponse(res, settings);
    } catch (error) {
      logger.error('Get app instance details error', {
        error,
        requestId: (req as any).requestId,
      });
      errorResponse(res, 'Failed to get app instance details', 500);
    }
  },

  async updateMobileAppSettings(req: Request, res: Response): Promise<void> {
    try {
      const { appInstanceId } = req.params;
      const userId = (req as any).user?.id;
      const updates = req.body;

      if (!userId) {
        errorResponse(res, 'User not authenticated', 401);
        return;
      }

      // Verify the app instance belongs to the user
      const settings =
        await MobileSettingsRepository.getMobileSettingsByAppInstance(
          appInstanceId,
        );
      if (!settings) {
        errorResponse(res, 'App instance not found', 404);
        return;
      }

      if (settings.userId !== userId) {
        errorResponse(res, 'Access denied', 403);
        return;
      }

      const updatedSettings =
        await MobileSettingsRepository.updateMobileAppSettings(
          appInstanceId,
          updates,
          userId,
        );

      logger.info('Mobile app settings updated', {
        appInstanceId,
        updatedBy: userId,
        requestId: (req as any).requestId,
      });

      successResponse(res, updatedSettings);
    } catch (error) {
      logger.error('Update mobile app settings error', {
        error,
        requestId: (req as any).requestId,
      });
      errorResponse(res, 'Failed to update mobile settings', 500);
    }
  },

  async blockAppInstance(req: Request, res: Response): Promise<void> {
    try {
      const { appInstanceId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        errorResponse(res, 'User not authenticated', 401);
        return;
      }

      const settings =
        await MobileSettingsRepository.getMobileSettingsByAppInstance(
          appInstanceId,
        );
      if (!settings) {
        errorResponse(res, 'App instance not found', 404);
        return;
      }

      if (settings.userId !== userId) {
        errorResponse(res, 'Access denied', 403);
        return;
      }

      await MobileSettingsRepository.updateMobileAppSettings(
        appInstanceId,
        { isBlocked: true },
        userId,
      );

      logger.info('App instance blocked', {
        appInstanceId,
        blockedBy: userId,
        requestId: (req as any).requestId,
      });

      successResponse(res, { message: 'App instance blocked successfully' });
    } catch (error) {
      logger.error('Block app instance error', {
        error,
        requestId: (req as any).requestId,
      });
      errorResponse(res, 'Failed to block app instance', 500);
    }
  },

  async unblockAppInstance(req: Request, res: Response): Promise<void> {
    try {
      const { appInstanceId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        errorResponse(res, 'User not authenticated', 401);
        return;
      }

      const settings =
        await MobileSettingsRepository.getMobileSettingsByAppInstance(
          appInstanceId,
        );
      if (!settings) {
        errorResponse(res, 'App instance not found', 404);
        return;
      }

      if (settings.userId !== userId) {
        errorResponse(res, 'Access denied', 403);
        return;
      }

      await MobileSettingsRepository.updateMobileAppSettings(
        appInstanceId,
        { isBlocked: false },
        userId,
      );

      logger.info('App instance unblocked', {
        appInstanceId,
        unblockedBy: userId,
        requestId: (req as any).requestId,
      });

      successResponse(res, { message: 'App instance unblocked successfully' });
    } catch (error) {
      logger.error('Unblock app instance error', {
        error,
        requestId: (req as any).requestId,
      });
      errorResponse(res, 'Failed to unblock app instance', 500);
    }
  },
};
