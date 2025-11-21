import { Router } from "express";
import { RegisterController } from "./register.controller";
import { RegisterValidator } from "./register.validator";
import { validateRequest } from "../../../middlewares";

const router = Router();

/**
 * Authentication Routes
 * All routes are public (no JWT required) except change-password
 */

// Public Routes
router.post(
  "/register",
  validateRequest(RegisterValidator.createOrUpdate),
  RegisterController.register
);

router.post(
  "/login",
  validateRequest(RegisterValidator.login),
  RegisterController.login
);

// Email and Mobile Verification (Public for now, could add token validation)
router.post("/verify-email/:userId", RegisterController.verifyEmail);

router.post("/verify-mobile/:userId", RegisterController.verifyMobile);

// Protected Routes (require JWT - add JWT middleware when implementing)
router.post(
  "/change-password",
  validateRequest(RegisterValidator.changePassword),
  // TODO: Add JWT middleware here: jwt,
  RegisterController.changePassword
);

router.post(
  "/logout",
  validateRequest(RegisterValidator.logout),
  // TODO: Add JWT middleware here: jwt,
  RegisterController.logout
);

export default router;