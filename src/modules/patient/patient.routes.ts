import { Router } from "express";
import { PatientController } from "./patient.controller";
import { PatientValidator } from "./patient.validator";
import { VisitController } from "./visit.controller";
import { VisitValidator } from "./visit.validator";
import { validateRequest, jwtMiddleware } from "../../middlewares";

const router = Router();

/**
 * Routes for Patient module.
 * All routes require JWT authentication
 */

// Create a new patient
router.post(
  "/patients",
  jwtMiddleware,
  validateRequest(PatientValidator.create),
  PatientController.create
);

// Bulk create patients
router.post(
  "/patients/bulk",
  jwtMiddleware,
  validateRequest(PatientValidator.bulkCreate),
  PatientController.bulkCreate
);

// Get all patients (with optional filtering via query params)
router.get(
  "/patients", 
  jwtMiddleware,
  PatientController.getAll
);

// Get paginated patients (with optional filtering via query params)
router.get(
  "/patients/page", 
  jwtMiddleware,
  PatientController.getAllPaginated
);

// Get patient by ID
router.get(
  "/patients/:id", 
  jwtMiddleware,
  PatientController.getById
);

// Get patient by pseudonym ID
router.get(
  "/patients/pseudonym/:pseudonymId", 
  jwtMiddleware,
  PatientController.getByPseudonymId
);

// Update patient
router.put(
  "/patients/:id",
  jwtMiddleware,
  validateRequest(PatientValidator.update),
  PatientController.update
);

// Delete patient
router.delete(
  "/patients/:id", 
  jwtMiddleware,
  PatientController.delete
);

// ========================================
// VISIT ROUTES
// ========================================

// Create a new visit
router.post(
  "/patients/visits",
  jwtMiddleware,
  validateRequest(VisitValidator.create),
  VisitController.createVisit
);

// Get visit by ID
router.get(
  "/patients/visits/:id",
  jwtMiddleware,
  VisitController.getVisitById
);

// Update visit
router.put(
  "/patients/visits/:id",
  jwtMiddleware,
  validateRequest(VisitValidator.update),
  VisitController.updateVisit
);

// Get visits with filtering
router.get(
  "/patients/visits",
  jwtMiddleware,
  VisitController.getVisits
);

export default router;