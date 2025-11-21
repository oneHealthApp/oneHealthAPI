import { Router } from "express";
import { ClinicController } from "./clinic.controller";
import { ClinicValidator } from "./clinic.validator";
import { validateRequest, jwtMiddleware } from "../../middlewares";

const router = Router();

/**
 * Routes for Clinic module.
 * All routes require JWT authentication
 */

// Create a new clinic
router.post(
  "/clinics",
  jwtMiddleware,
  validateRequest(ClinicValidator.create),
  ClinicController.create
);

// Bulk create clinics
router.post(
  "/clinics/bulk",
  jwtMiddleware,
  validateRequest(ClinicValidator.bulkCreate),
  ClinicController.bulkCreate
);

// Get all clinics (with optional filtering via query params)
router.get(
  "/clinics", 
  jwtMiddleware,
  ClinicController.getAll
);

// Get paginated clinics (with optional filtering via query params)
router.get(
  "/clinics/page", 
  jwtMiddleware,
  ClinicController.getAllPaginated
);

// Get clinic by ID
router.get(
  "/clinics/:id", 
  jwtMiddleware,
  ClinicController.getById
);

// Update clinic
router.put(
  "/clinics/:id",
  jwtMiddleware,
  validateRequest(ClinicValidator.update),
  ClinicController.update
);

// Delete clinic
router.delete(
  "/clinics/:id", 
  jwtMiddleware,
  ClinicController.delete
);

export default router;