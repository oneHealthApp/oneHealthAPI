import { Router } from 'express';
import { UserController } from './user.controller';
import {
  UserValidator,
  createUserWithPersonAndRoles,
  updateProfile,
} from './user.validator';
import { jwtMiddleware, validateRequest } from '../../../middlewares';
import Joi from 'joi';

const router = Router();

/**
 * Routes for User module.
 */

router.post(
  '/o/user',
  validateRequest(UserValidator.createOrUpdate),
  UserController.create,
);

// 2. Get all users
router.get('/o/user', jwtMiddleware, UserController.getAll);

// 3. Get all users (paginated)
router.get('/o/user/page', UserController.getAllPaginated);

// 4. Get user by ID
router.get('/o/user/:id', UserController.getById);

// 5. Update user by ID
router.put(
  '/o/user/:id',
  validateRequest(UserValidator.update),
  UserController.update,
);

// 6. Hard delete user by ID
router.delete('/o/user/:id', UserController.delete);

// 7. Register a new user
router.post(
  '/o/user/reg',
  validateRequest(UserValidator.register),
  UserController.register,
);

// 8. Lock user account manually
router.post(
  '/r/user/lock',
  jwtMiddleware,
  validateRequest(UserValidator.lockUnlock),
  UserController.lockAccount,
);

// 9. Unlock a locked user account
router.post(
  '/r/user/unlock',
  jwtMiddleware,
  validateRequest(UserValidator.lockUnlock),
  UserController.unlockAccount,
);

// 10. Get logged-in user's profile
router.get('/r/user/profile', jwtMiddleware, UserController.getProfile);

// 11. Confirm user email (token-based or OTP)
router.post(
  '/r/user/confirm/email',
  validateRequest(UserValidator.confirmEmail),
  UserController.confirmEmail,
);

// 12. Confirm user mobile number via OTP
router.post(
  '/r/user/confirm/mobile',
  validateRequest(UserValidator.confirmMobile),
  UserController.confirmMobile,
);

// 13. Attach role(s) to a user
router.post(
  '/o/user/role/attach',
  validateRequest(UserValidator.modifyRoles),
  UserController.attachRoles,
);

// 14. Detach role(s) from a user
router.post(
  '/o/user/role/detach',
  validateRequest(UserValidator.modifyRoles),
  UserController.detachRoles,
);

// 15. Get full user object by ID
router.get('/o/user/:id', UserController.getFullById);

// 16. Get all roles attached to a user
router.get('/o/user/:id/roles', UserController.getUserRoles);

// 17. List all users with filters (e.g., locked, active, role)
router.get('/user/filtered', UserController.listFiltered);

// 19. Clear user cache by ID
router.post('/o/user/cache/clear/:id', UserController.clearCacheById);

router.get('/o/user/role/:roleName', UserController.getUsersByRole);

router.post(
  '/o/user/with-person-roles',
  jwtMiddleware,
  validateRequest(createUserWithPersonAndRoles),
  UserController.createUserWithPersonAndRoles,
);

router.put(
  '/r/user/profile',
  jwtMiddleware,
  validateRequest(updateProfile),
  UserController.updateProfile,
);

router.put(
  '/o/user/with-person-roles/:id',
  jwtMiddleware,
  validateRequest(createUserWithPersonAndRoles),
  UserController.updateUserWithPersonAndRoles,
);

router.get('/o/user/full/:id', jwtMiddleware, UserController.getFullUserById);

router.get(
  '/o/user/role-id/:roleId',
  jwtMiddleware,
  UserController.getUsersByRoleId,
);

router.post(
  '/r/user/send-password-sms',
  jwtMiddleware,
  validateRequest(
    Joi.object({
      mobile: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required(),
      password: Joi.string().required(),
      purpose: Joi.string().valid('user_creation', 'password_reset').required(),
    }),
  ),
  UserController.sendPasswordSms,
);

export default router;
