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
 *     DiagnosisInput:
 *       type: object
 *       required:
 *         - icdCode
 *         - label
 *       properties:
 *         providerId:
 *           type: string
 *           description: Provider ID (optional)
 *         icdCode:
 *           type: string
 *           description: ICD-10 diagnosis code
 *           example: "A00"
 *         snomedId:
 *           type: string
 *           description: SNOMED CT identifier (optional)
 *           example: "123456"
 *         label:
 *           type: string
 *           description: Human-readable diagnosis label
 *           example: "Cholera"
 *         primary:
 *           type: boolean
 *           description: Is this the primary diagnosis
 *           example: true
 *         confidence:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: Confidence level (0-1)
 *           example: 0.9
 *         status:
 *           type: string
 *           enum: [provisional, confirmed, ruled-out]
 *           description: Diagnosis status
 *           example: "confirmed"
 *         notes:
 *           type: string
 *           maxLength: 500
 *           description: Additional notes
 *           example: "Strong symptoms"
 *     
 *     PrescriptionItem:
 *       type: object
 *       required:
 *         - medicine
 *         - dose
 *         - frequency
 *         - duration
 *       properties:
 *         medicine:
 *           type: string
 *           description: Medicine name
 *           example: "Paracetamol"
 *         dose:
 *           type: string
 *           description: Dosage amount
 *           example: "500 mg"
 *         frequency:
 *           type: string
 *           description: How often to take
 *           example: "2 times/day"
 *         duration:
 *           type: string
 *           description: How long to take
 *           example: "5 days"
 *     
 *     PrescriptionInput:
 *       type: object
 *       required:
 *         - items
 *       properties:
 *         prescriberId:
 *           type: string
 *           description: Prescriber ID (optional)
 *         diagnosisId:
 *           type: string
 *           description: Related diagnosis ID (optional)
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PrescriptionItem'
 *           minItems: 1
 *           description: List of prescription items
 *         instructions:
 *           type: string
 *           maxLength: 1000
 *           description: Additional instructions
 *           example: "Take after meals"
 *     
 *     LabOrderTest:
 *       type: object
 *       required:
 *         - testName
 *       properties:
 *         testName:
 *           type: string
 *           description: Name of the lab test
 *           example: "Complete Blood Count"
 *         testCode:
 *           type: string
 *           description: Lab test code (optional)
 *           example: "CBC"
 *         category:
 *           type: string
 *           description: Test category (optional)
 *           example: "Hematology"
 *         instructions:
 *           type: string
 *           maxLength: 500
 *           description: Special instructions for the test
 *           example: "Fasting required"
 *     
 *     LabOrderInput:
 *       type: object
 *       required:
 *         - tests
 *       properties:
 *         tests:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LabOrderTest'
 *           minItems: 1
 *           description: List of lab tests to order
 *         status:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *           description: Lab order status
 *           example: "PENDING"
 *         notes:
 *           type: string
 *           maxLength: 500
 *           description: Additional notes for the lab order
 *           example: "Rush order - urgent"
 *     
 *     VisitDetailsRequest:
 *       type: object
 *       required:
 *         - visitId
 *       properties:
 *         visitId:
 *           type: string
 *           description: Existing visit ID
 *           example: "VISIT123"
 *         diagnoses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DiagnosisInput'
 *           description: List of diagnoses to add
 *         prescriptions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PrescriptionInput'
 *           description: List of prescriptions to add
 *         labOrders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LabOrderInput'
 *           description: List of lab orders to add
 *     
 *     VisitDetailsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Visit updated successfully"
 *         data:
 *           type: object
 *           properties:
 *             diagnoses:
 *               type: array
 *               items:
 *                 type: object
 *             prescriptions:
 *               type: array
 *               items:
 *                 type: object
 *             labOrders:
 *               type: array
 *               items:
 *                 type: object
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

  /**
   * @swagger
   * /patients/visits/clinic/{clinicId}/ongoing:
   *   get:
   *     tags: [Visits]
   *     summary: Get ongoing visits for a specific clinic
   *     description: |
   *       Retrieves all visits for a specific clinic where the visit is still ongoing (endedAt is null or empty).
   *       This endpoint is useful for displaying active visits in the clinic dashboard.
   *       
   *       **Business Logic:**
   *       - Returns only visits where endedAt is null (ongoing visits)
   *       - Includes patient information and assigned doctor details
   *       - Results are ordered by visit start time (most recent first)
   *       - Includes visit vitals, symptoms, and current workflow state
   *       
   *       **Use Cases:**
   *       - Clinic dashboard showing current active visits
   *       - Queue management for ongoing patient visits
   *       - Staff assignment and workload monitoring
   *       - Real-time clinic capacity tracking
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: clinicId
   *         required: true
   *         schema:
   *           type: string
   *         description: The clinic ID to get ongoing visits for
   *         example: "clinic-456"
   *     responses:
   *       200:
   *         description: Ongoing visits retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Ongoing visits retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         description: Visit ID
   *                         example: "visit-abc123"
   *                       tenantId:
   *                         type: string
   *                         description: Tenant ID
   *                         example: "tenant-123"
   *                       clinicId:
   *                         type: string
   *                         description: Clinic ID
   *                         example: "clinic-456"
   *                       patientId:
   *                         type: string
   *                         description: Patient ID
   *                         example: "patient-789"
   *                       visitType:
   *                         type: string
   *                         enum: [CLINIC, HOME, ON_CALL, FARM]
   *                         example: "CLINIC"
   *                       startedAt:
   *                         type: string
   *                         format: date-time
   *                         description: Visit start time
   *                         example: "2025-11-22T10:30:00.000Z"
   *                       endedAt:
   *                         type: null
   *                         description: Visit end time (null for ongoing visits)
   *                         example: null
   *                       symptoms:
   *                         type: string
   *                         nullable: true
   *                         description: Patient symptoms
   *                         example: "Fever, headache"
   *                       vitals:
   *                         type: object
   *                         nullable: true
   *                         description: Patient vital signs
   *                         example:
   *                           temperature: 98.6
   *                           pulse: 72
   *                           bp: "120/80"
   *                           spo2: 98
   *                       notes:
   *                         type: string
   *                         nullable: true
   *                         description: Visit notes
   *                         example: "Patient appears alert"
   *                       workflowState:
   *                         type: string
   *                         description: Current workflow state
   *                         example: "OPEN"
   *                       patient:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                             example: "patient-789"
   *                           pseudonymId:
   *                             type: string
   *                             example: "P-12345"
   *                           type:
   *                             type: string
   *                             enum: [HUMAN, PET, LIVESTOCK]
   *                             example: "HUMAN"
   *                           age:
   *                             type: number
   *                             nullable: true
   *                             example: 35
   *                           sex:
   *                             type: string
   *                             nullable: true
   *                             example: "Male"
   *                           species:
   *                             type: string
   *                             nullable: true
   *                             example: null
   *                       doctor:
   *                         type: object
   *                         nullable: true
   *                         properties:
   *                           id:
   *                             type: string
   *                             example: "doctor-101"
   *                           username:
   *                             type: string
   *                             example: "dr.smith"
   *                           emailId:
   *                             type: string
   *                             example: "dr.smith@clinic.com"
   *                           person:
   *                             type: object
   *                             nullable: true
   *                             properties:
   *                               fullName:
   *                                 type: string
   *                                 example: "Dr. John Smith"
   *                       clinic:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                             example: "clinic-456"
   *                           name:
   *                             type: string
   *                             example: "City General Clinic"
   *                           clinicType:
   *                             type: string
   *                             enum: [HUMAN, PET, LIVESTOCK]
   *                             example: "HUMAN"
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-11-22T10:30:00.000Z"
   *                       updatedAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-11-22T10:30:00.000Z"
   *             examples:
   *               withOngoingVisits:
   *                 summary: Clinic with ongoing visits
   *                 value:
   *                   success: true
   *                   message: "Ongoing visits retrieved successfully"
   *                   data:
   *                     - id: "visit-abc123"
   *                       tenantId: "tenant-123"
   *                       clinicId: "clinic-456"
   *                       patientId: "patient-789"
   *                       visitType: "CLINIC"
   *                       startedAt: "2025-11-22T10:30:00.000Z"
   *                       endedAt: null
   *                       symptoms: "Fever, headache"
   *                       vitals:
   *                         temperature: 98.6
   *                         pulse: 72
   *                         bp: "120/80"
   *                         spo2: 98
   *                       notes: "Patient appears alert"
   *                       workflowState: "OPEN"
   *                       patient:
   *                         id: "patient-789"
   *                         pseudonymId: "P-12345"
   *                         type: "HUMAN"
   *                         age: 35
   *                         sex: "Male"
   *                         species: null
   *                       doctor:
   *                         id: "doctor-101"
   *                         username: "dr.smith"
   *                         emailId: "dr.smith@clinic.com"
   *                         person:
   *                           fullName: "Dr. John Smith"
   *                       clinic:
   *                         id: "clinic-456"
   *                         name: "City General Clinic"
   *                         clinicType: "HUMAN"
   *                       createdAt: "2025-11-22T10:30:00.000Z"
   *                       updatedAt: "2025-11-22T10:30:00.000Z"
   *               emptyResult:
   *                 summary: No ongoing visits
   *                 value:
   *                   success: true
   *                   message: "Ongoing visits retrieved successfully"
   *                   data: []
   *       400:
   *         description: Bad Request - Invalid clinic ID
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
   *                   example: "Invalid clinic ID"
   *                 error:
   *                   type: string
   *                   example: "Clinic with provided ID does not exist or is inactive"
   *       401:
   *         description: Unauthorized - Missing or invalid JWT token
   *       404:
   *         description: Clinic not found
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
   *                   example: "Clinic not found"
   *       500:
   *         description: Internal Server Error
   */
  async getOngoingVisitsByClinic(req: Request, res: Response) {
    try {
      const clinicId = String(req.params.clinicId);
      
      const result = await VisitService.getOngoingVisitsByClinic(
        clinicId,
        (req as any).requestId,
        (req as any).user?.id
      );

      logger.debug('✅ Ongoing visits retrieved successfully', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        clinicId,
        count: result.data.length,
      });

      successResponse(res, result);
    } catch (error) {
      logger.error('❌ Get ongoing visits error', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        clinicId: req.params.clinicId,
        error,
      });

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch ongoing visits';
      const statusCode = errorMessage.includes('not found') || errorMessage.includes('Invalid') ? 404 : 500;

      errorResponse(
        res,
        errorMessage,
        statusCode,
        process.env.NODE_ENV === 'development' ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /patients/visits/details:
   *   post:
   *     tags: [Visits]
   *     summary: Add diagnoses and prescriptions to an existing visit
   *     description: |
   *       Adds multiple diagnoses and/or prescriptions to an already existing visit.
   *       This endpoint is used after visit creation to add medical details.
   *       
   *       **Business Logic:**
   *       - Visit must already exist in the system
   *       - At least one diagnosis or prescription must be provided
   *       - All operations are performed within a database transaction
   *       - Prescription items are stored as JSON in the database
   *       
   *       **Validation:**
   *       - Validates visit existence
   *       - Validates required fields for diagnoses (icdCode, label)
   *       - Validates required fields for prescriptions (items with medicine, dose, frequency, duration)
   *       - Confidence values must be between 0 and 1
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/VisitDetailsRequest'
   *           examples:
   *             fullDetails:
   *               summary: Visit with both diagnoses and prescriptions
   *               value:
   *                 visitId: "VISIT123"
   *                 diagnoses:
   *                   - providerId: "D1"
   *                     icdCode: "A00"
   *                     snomedId: "123456"
   *                     label: "Cholera"
   *                     primary: true
   *                     confidence: 0.9
   *                     status: "confirmed"
   *                     notes: "Strong symptoms"
   *                   - providerId: "D1"
   *                     icdCode: "B00"
   *                     label: "Viral Infection"
   *                 prescriptions:
   *                   - prescriberId: "D1"
   *                     items:
   *                       - medicine: "Paracetamol"
   *                         dose: "500 mg"
   *                         frequency: "2 times/day"
   *                         duration: "5 days"
   *                     instructions: "Take after meals"
   *                   - prescriberId: "D1"
   *                     items:
   *                       - medicine: "Vitamin C"
   *                         dose: "1 tablet"
   *                         frequency: "once/day"
   *                         duration: "10 days"
   *             diagnosisOnly:
   *               summary: Visit with only diagnoses
   *               value:
   *                 visitId: "VISIT123"
   *                 diagnoses:
   *                   - icdCode: "J06.9"
   *                     label: "Acute upper respiratory infection"
   *                     primary: true
   *                     status: "confirmed"
   *             prescriptionOnly:
   *               summary: Visit with only prescriptions
   *               value:
   *                 visitId: "VISIT123"
   *                 prescriptions:
   *                   - items:
   *                       - medicine: "Amoxicillin"
   *                         dose: "250 mg"
   *                         frequency: "3 times/day"
   *                         duration: "7 days"
   *                     instructions: "Complete the full course"
   *     responses:
   *       200:
   *         description: Visit details added successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/VisitDetailsResponse'
   *             example:
   *               success: true
   *               message: "Visit updated successfully"
   *               data:
   *                 diagnoses:
   *                   - id: "diag-abc123"
   *                     visitId: "VISIT123"
   *                     providerId: "D1"
   *                     icdCode: "A00"
   *                     snomedId: "123456"
   *                     label: "Cholera"
   *                     primary: true
   *                     confidence: 0.9
   *                     status: "confirmed"
   *                     notes: "Strong symptoms"
   *                     createdAt: "2025-11-21T10:30:00.000Z"
   *                 prescriptions:
   *                   - id: "presc-def456"
   *                     visitId: "VISIT123"
   *                     prescriberId: "D1"
   *                     items:
   *                       - medicine: "Paracetamol"
   *                         dose: "500 mg"
   *                         frequency: "2 times/day"
   *                         duration: "5 days"
   *                     instructions: "Take after meals"
   *                     createdAt: "2025-11-21T10:30:00.000Z"
   *       400:
   *         description: Bad Request - Validation errors or visit not found
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
   *                   example: "Visit not found"
   *                 error:
   *                   type: string
   *                   example: "Visit with provided ID does not exist"
   *       401:
   *         description: Unauthorized - Missing or invalid JWT token
   *       500:
   *         description: Internal Server Error
   */
  async addVisitDetails(req: Request, res: Response) {
    try {
      const result = await VisitService.addVisitDetails(
        req.body,
        (req as any).requestId,
        (req as any).user?.id
      );

      logger.debug('✅ Visit details added successfully', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        visitId: req.body.visitId,
        diagnosesCount: result.data.diagnoses.length,
        prescriptionsCount: result.data.prescriptions.length,
      });

      successResponse(res, result, 200);
    } catch (error) {
      logger.error('❌ Add visit details error', {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });

      const errorMessage = error instanceof Error ? error.message : 'Failed to add visit details';
      const statusCode = getStatusCodeFromError(errorMessage);

      errorResponse(
        res,
        errorMessage,
        statusCode,
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
