import { Router } from "express";
import { DoctorController } from "./doctor.controller";
import { DoctorValidator } from "./doctor.validator";
import { validateRequest, jwtMiddleware } from "../../middlewares";

const router = Router();

/**
 * Routes for Doctor module within Clinic context.
 * All routes require JWT authentication
 */

// Create a new doctor
router.post(
  "/clinics/doctors",
  jwtMiddleware,
  validateRequest(DoctorValidator.create),
  DoctorController.createDoctor
);

// Get all doctors (with optional filtering via query params)
router.get(
  "/clinics/doctors", 
  jwtMiddleware,
  DoctorController.getAllDoctors
);

// Get doctor by ID
router.get(
  "/clinics/doctors/:id", 
  jwtMiddleware,
  DoctorController.getDoctorById
);

// Get doctors by clinic ID
router.get(
  "/clinics/:clinicId/doctors", 
  jwtMiddleware,
  DoctorController.getDoctorsByClinic
);

export default router;