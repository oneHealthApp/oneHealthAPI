import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthValidator } from './auth.validator';
import { jwtMiddleware, validateRequest } from '../../../middlewares';
import Joi from 'joi';
import { MobileSettingsController } from '../mobile-settings/mobile-settings.controller';

const router = Router();

/**
 * Routes for Auth module.
 */
router.post(
  '/auth/o/login',
  validateRequest(AuthValidator.login),
  AuthController.login,
);

router.post('/auth/r/logout', jwtMiddleware, AuthController.logout);

router.post(
  '/auth/o/otp',
  validateRequest(AuthValidator.generateOtp),
  AuthController.generateOtp,
);

router.post(
  '/auth/o/otp/verify/login',
  validateRequest(AuthValidator.verifyOtp),
  AuthController.verifyOtpAndLogin,
);

router.post(
  '/auth/o/forgot-password',
  validateRequest(AuthValidator.forgotPassword),
  AuthController.forgotPassword,
);

router.post(
  '/auth/o/reset-password',
  validateRequest(AuthValidator.resetPassword),
  AuthController.resetPassword,
);

router.post(
  '/auth/r/change-password',
  jwtMiddleware,
  validateRequest(AuthValidator.changePassword),
  AuthController.changePassword,
);

router.post(
  '/auth/o/otp/verify-password-reset',
  validateRequest(AuthValidator.verifyOtpForPasswordReset),
  AuthController.verifyOtpForPasswordReset,
);

router.post(
  '/auth/o/otp/resend',
  validateRequest(AuthValidator.resendOtp),
  AuthController.resendOtp,
);

router.post(
  '/auth/o/refresh',
  validateRequest(Joi.object({ refreshToken: Joi.string().required() })),
  AuthController.refreshTokens,
);

// mobile settings routes
router.post(
  '/auth/r/mobile-settings',
  jwtMiddleware,
  validateRequest(
    Joi.object({
      userId: Joi.string().required(),
      appInstanceId: Joi.string().optional(),
      appVersion: Joi.string().optional(),
      deviceInfo: Joi.object().optional(),
    }),
  ),
  MobileSettingsController.getUserMobileSettings,
);

// router.get(
//   '/auth/r/mobile-settings/:appInstanceId',
//   jwtMiddleware,
//   MobileSettingsController.getAppInstanceDetails,
// );

// router.patch(
//   '/auth/r/mobile-settings/:appInstanceId',
//   jwtMiddleware,
//   MobileSettingsController.updateMobileAppSettings,
// );

// router.post(
//   '/auth/r/mobile-settings/:appInstanceId/block',
//   jwtMiddleware,
//   MobileSettingsController.blockAppInstance,
// );

// router.post(
//   '/auth/r/mobile-settings/:appInstanceId/unblock',
//   jwtMiddleware,
//   MobileSettingsController.unblockAppInstance,
// );

export default router;
