import { Request, Response } from 'express';
import { VisitService } from './visit.service';
import { VisitFilterOptions } from './visit.type';
import { successResponse, errorResponse, getModuleLogger } from '../../utils';

const logger = getModuleLogger('visit-controller');

/**
 * Controller layer for Visit operations.
 * 
 * @swagger
 * components:
 *   schemas:
 *     VisitVitals:
 *       type: object
 *       properties:
 *         temperature:
 *           type: number
 *           minimum: 90
 *           maximum: 110
 *           description: Body temperature in Fahrenheit
 *           example: 98.6
 *         pulse:
 *           type: number
 *           minimum: 40
 *           maximum: 200
 *           description: Heart rate in beats per minute
 *           example: 72
 *         bp:
 *           type: string
 *           pattern: '^\\d{2,3}/\\d{2,3}$'
 *           description: Blood pressure in format systolic/diastolic
 *           example: "120/80"
 *         spo2:
 *           type: number
 *           minimum: 70
 *           maximum: 100
 *           description: Oxygen saturation percentage
 *           example: 98
 *     
 *     VisitCreateRequest:
 *       type: object
 *       required:
 *         - tenantId
 *         - clinicId
 *         - patientId
 *       properties:
 *         tenantId:
 *           type: string
 *           description: Valid tenant ID
 *           example: "tenant-123"
 *         clinicId:
 *           type: string
 *           description: Valid clinic ID
 *           example: "clinic-456"
 *         patientId:
 *           type: string
 *           description: Valid patient ID
 *           example: "patient-789"
 *         doctorId:
 *           type: string
 *           nullable: true
 *           description: Valid doctor ID (optional)
 *           example: "doctor-101"
 *         visitType:
 *           type: string
 *           enum: [CLINIC, HOME, ON_CALL, FARM]
 *           description: Type of visit
 *           example: "CLINIC"
 *         vitals:
 *           $ref: '#/components/schemas/VisitVitals'
 *         symptoms:
 *           type: string
 *           maxLength: 1000
 *           description: Patient symptoms description
 *           example: "Fever, headache, and fatigue"
 *         notes:
 *           type: string
 *           maxLength: 2000
 *           description: Additional visit notes
 *           example: "Patient appears alert and responsive"
 *     
 *     VisitResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Visit ID
 *         tenantId:
 *           type: string
 *           description: Tenant ID
 *         clinicId:
 *           type: string
 *           description: Clinic ID
 *         patientId:
 *           type: string
 *           description: Patient ID
 *         doctorId:
 *           type: string
 *           nullable: true
 *           description: Doctor ID
 *         visitType:
 *           type: string
 *           enum: [CLINIC, HOME, ON_CALL, FARM]
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: Visit start time
 *         endedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Visit end time
 *         symptoms:
 *           type: string
 *           nullable: true
 *           description: Patient symptoms
 *         vitals:
 *           $ref: '#/components/schemas/VisitVitals'
 *           nullable: true
 *         notes:
 *           type: string
 *           nullable: true
 *           description: Visit notes
 *         workflowState:
 *           type: string
 *           description: Current workflow state
 *           example: "OPEN"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     VisitCreateResponseData:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Visit created successfully"
 *         data:
 *           $ref: '#/components/schemas/VisitResponse'
 *   
 *   tags:
 *     - name: Visits
 *       description: Patient visit management operations
 */
export const VisitController = {
  /**
   * @swagger
   * /patients/visits:
   *   post:
   *     tags: [Visits]
   *     summary: Create a new patient visit
   *     description: |
   *       Creates a new visit record when a patient comes to the clinic.
   *       This endpoint handles visit appointment forms from the frontend.
   *       
   *       **Business Logic:**
   *       - Patient registration must be completed before creating a visit
   *       - Visit starts immediately (startedAt = current time)
   *       - Vitals are stored as JSON in the database
   *       - WorkflowState defaults to "OPEN"
   *       - Doctor assignment is optional
   *       
   *       **Validation:**
   *       - Validates tenant, clinic, and patient existence
   *       - Validates doctor role if doctor is assigned
   *       - Validates vital signs within medical ranges
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/VisitCreateRequest'
   *           examples:
   *             clinicVisit:
   *               summary: Clinic visit with vitals
   *               value:
   *                 tenantId: "tenant-123"
   *                 clinicId: "clinic-456"
   *                 patientId: "patient-789"
   *                 doctorId: "doctor-101"
   *                 visitType: "CLINIC"
   *                 vitals:
   *                   temperature: 98.6
   *                   pulse: 72
   *                   bp: "120/80"
   *                   spo2: 98
   *                 symptoms: "Fever, headache, and fatigue"
   *                 notes: "Patient appears alert and responsive"
   *             emergencyVisit:
   *               summary: Emergency visit without doctor
   *               value:
   *                 tenantId: "tenant-123"
   *                 clinicId: "clinic-456"
   *                 patientId: "patient-789"
   *                 visitType: "CLINIC"
   *                 vitals:
   *                   temperature: 102.5
   *                   pulse: 110
   *                   bp: "140/90"
   *                   spo2: 95
   *                 symptoms: "Severe chest pain, difficulty breathing"
   *                 notes: "EMERGENCY - requires immediate attention"
   *     responses:
   *       201:
   *         description: Visit created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/VisitCreateResponseData'
   *             example:
   *               success: true
   *               message: "Visit created successfully"
   *               data:
   *                 id: "visit-abc123"
   *                 tenantId: "tenant-123"
   *                 clinicId: "clinic-456"
   *                 patientId: "patient-789"
   *                 doctorId: "doctor-101"
   *                 visitType: "CLINIC"
   *                 startedAt: "2025-11-21T10:30:00.000Z"
   *                 endedAt: null
   *                 symptoms: "Fever, headache, and fatigue"
   *                 vitals:
   *                   temperature: 98.6
   *                   pulse: 72
   *                   bp: "120/80"
   *                   spo2: 98
   *                 notes: "Patient appears alert and responsive"
   *                 workflowState: "OPEN"
   *                 createdAt: "2025-11-21T10:30:00.000Z"
   *                 updatedAt: "2025-11-21T10:30:00.000Z"
   *       400:
   *         description: Bad Request - Validation errors
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Invalid patient ID"
   *                 error:
   *                   type: string
   *                   example: "Patient with provided ID does not exist"
   *       401:
   *         description: Unauthorized - Missing or invalid JWT token
   *       500:
   *         description: Internal Server Error
   */
  async createVisit(req: Request, res: Response) {
    try {
      const result = await VisitService.createVisit(
        req.body,
        (req as any).requestId,
        (req as any).user?.id
      );

      logger.debug('✅ Visit created successfully', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        visitId: result.data.id,
      });

      successResponse(res, result, 201);
    } catch (error) {
      logger.error('❌ Create visit error', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });

      const errorMessage = error instanceof Error ? error.message : 'Failed to create visit';
      const statusCode = getStatusCodeFromError(errorMessage);

      errorResponse(
        res,
        errorMessage,
        statusCode,
        process.env.NODE_ENV === 'development' ? String(error) : undefined
      );
    }
  },

  /**
   * Get visit by ID
   */
  async getVisitById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await VisitService.getVisitById(
        id,
        (req as any).requestId,
        (req as any).user?.id
      );

      logger.debug('✅ Visit retrieved by ID', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        visitId: id,
      });

      successResponse(res, result);
    } catch (error) {
      logger.error('❌ Get visit by ID error', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch visit';
      const statusCode = errorMessage.includes('not found') ? 404 : 500;

      errorResponse(
        res,
        errorMessage,
        statusCode,
        process.env.NODE_ENV === 'development' ? String(error) : undefined
      );
    }
  },

  /**
   * Update visit
   */
  async updateVisit(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await VisitService.updateVisit(
        id,
        req.body,
        (req as any).requestId,
        (req as any).user?.id
      );

      logger.debug('✅ Visit updated successfully', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        visitId: id,
      });

      successResponse(res, result);
    } catch (error) {
      logger.error('❌ Update visit error', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });

      const errorMessage = error instanceof Error ? error.message : 'Failed to update visit';
      const statusCode = getStatusCodeFromError(errorMessage);

      errorResponse(
        res,
        errorMessage,
        statusCode,
        process.env.NODE_ENV === 'development' ? String(error) : undefined
      );
    }
  },

  /**
   * Get visits with filtering
   */
  async getVisits(req: Request, res: Response) {
    try {
      const filters: VisitFilterOptions = {
        tenantId: req.query.tenantId as string,
        clinicId: req.query.clinicId as string,
        patientId: req.query.patientId as string,
        doctorId: req.query.doctorId as string,
        visitType: req.query.visitType as any,
        workflowState: req.query.workflowState as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof VisitFilterOptions] === undefined) {
          delete filters[key as keyof VisitFilterOptions];
        }
      });

      const result = await VisitService.getVisits(
        filters,
        (req as any).requestId,
        (req as any).user?.id
      );

      logger.debug('✅ Visits retrieved successfully', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        count: result.length,
        filters,
      });

      successResponse(res, result);
    } catch (error) {
      logger.error('❌ Get visits error', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });

      errorResponse(
        res,
        error instanceof Error ? error.message : 'Failed to fetch visits',
        500,
        process.env.NODE_ENV === 'development' ? String(error) : undefined
      );
    }
  },
};

/**
 * Helper function to determine appropriate HTTP status code from error message
 */
function getStatusCodeFromError(errorMessage: string): number {
  if (errorMessage.includes('Invalid') || errorMessage.includes('not found')) {
    return 400; // Bad Request
  }
  if (errorMessage.includes('required') || errorMessage.includes('must be')) {
    return 400; // Bad Request
  }
  return 500; // Internal Server Error
}
