import { Router } from 'express';
import { UserController } from './user.controller';
import { UserValidator } from './user.validator';
import { jwtMiddleware, validateRequest } from '../../middlewares';

const router = Router();

router.get('/users', UserController.getAll);

router.post(
  '/auth/register',
  validateRequest(UserValidator.register),
  UserController.register,
);
router.post(
  '/auth/login',
  validateRequest(UserValidator.login),
  UserController.login,
);
router.post(
  '/users/block',
  validateRequest(UserValidator.blockUserSchema),
  UserController.blockUser,
);
router.post(
  '/users/unblock',
  validateRequest(UserValidator.unblockUserSchema),
  UserController.unblockUser,
);
router.post(
  '/auth/refresh-token',
  validateRequest(UserValidator.refreshTokenSchema),
  UserController.refreshToken,
);
router.post('/auth/logout', jwtMiddleware, UserController.logout);

router.get('/users/profile', jwtMiddleware, UserController.getProfile);

router.put(
  '/users/verify-email/:id',
  jwtMiddleware,
  UserController.verifyEmailById,
);

router.post(
  '/auth/otp/send',
  validateRequest(UserValidator.sendOTPSchema),
  UserController.sendOTP
);

router.post(
  '/auth/otp/verify',
  validateRequest(UserValidator.verifyOTPSchema),
  UserController.verifyOTP
);

router.post(
  '/auth/password/forgot',
  validateRequest(UserValidator.forgotPasswordSchema),
  UserController.forgotPassword
);

router.post(
  '/auth/password/reset',
  validateRequest(UserValidator.resetPasswordSchema),
  UserController.resetPassword
);
router.post(
  '/auth/password/change',
  jwtMiddleware,
  validateRequest(UserValidator.changePasswordSchema),
  UserController.changePassword
);
router.post(
  '/auth/login/otp',
  validateRequest(UserValidator.loginWithOTPSchema),
  UserController.loginWithOTP
);
router.post(
  '/auth/verify/email',
  validateRequest(UserValidator.verifyEmailSchema),
  UserController.verifyEmail
);
router.post(
  '/auth/verify/phone',
  validateRequest(UserValidator.verifyPhoneSchema),
  UserController.verifyPhone
);
router.post(
  '/auth/resend-verification',
  validateRequest(UserValidator.resendVerificationSchema),
  UserController.resendVerification
);

// Staff creation endpoint
router.post(
  '/users/staff',
  jwtMiddleware,
  validateRequest(UserValidator.createStaff),
  UserController.createStaff,
);

export default router;
