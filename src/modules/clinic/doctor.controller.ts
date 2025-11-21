import { Request, Response } from "express";
import { DoctorService } from "./doctor.service";
import { successResponse, errorResponse, getModuleLogger } from "../../utils";
import { DoctorFilterOptions } from "./doctor.type";

const logger = getModuleLogger("doctor-controller");

/**
 * Controller layer for Doctor operations.
 * 
 * @swagger
 * components:
 *   schemas:
 *     Doctor:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: User ID
 *             username:
 *               type: string
 *               description: Username
 *             emailId:
 *               type: string
 *               format: email
 *               description: Email address
 *             mobileNumber:
 *               type: string
 *               description: Phone number
 *             emailVerified:
 *               type: boolean
 *               description: Email verification status
 *             mobileValidationStatus:
 *               type: boolean
 *               description: Mobile verification status
 *             isLocked:
 *               type: boolean
 *               description: Account lock status
 *             profilePictureUrl:
 *               type: string
 *               description: Profile picture URL
 *             tenantId:
 *               type: string
 *               description: Tenant ID
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 *         person:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: Person ID
 *             tenantId:
 *               type: string
 *               description: Tenant ID
 *             type:
 *               type: string
 *               enum: [DOCTOR]
 *               description: Person type
 *             fullName:
 *               type: string
 *               description: Full name
 *             phone:
 *               type: string
 *               description: Phone number
 *             email:
 *               type: string
 *               format: email
 *               description: Email address
 *             dateOfBirth:
 *               type: string
 *               format: date
 *               description: Date of birth
 *             sex:
 *               type: string
 *               enum: [MALE, FEMALE, OTHER]
 *               description: Sex
 *             metadata:
 *               type: object
 *               description: Additional metadata
 *             addressId:
 *               type: string
 *               nullable: true
 *               description: Address ID
 *             address:
 *               type: object
 *               nullable: true
 *               description: Address details
 *               properties:
 *                 id:
 *                   type: string
 *                 address:
 *                   type: string
 *                 townCode:
 *                   type: string
 *                 town:
 *                   type: string
 *                 pin:
 *                   type: string
 *                 subDistrictCode:
 *                   type: string
 *                 subDistrict:
 *                   type: string
 *                 districtCode:
 *                   type: string
 *                 district:
 *                   type: string
 *                 stateCode:
 *                   type: string
 *                 state:
 *                   type: string
 *                 countryCode:
 *                   type: string
 *                 countryName:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 *         clinic:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *               description: Clinic ID
 *             name:
 *               type: string
 *               description: Clinic name
 *             clinicType:
 *               type: string
 *               enum: [HUMAN, PET, LIVESTOCK]
 *               description: Clinic type
 *             isActive:
 *               type: boolean
 *               description: Clinic active status
 *     DoctorCreate:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - phone
 *         - email
 *         - username
 *         - password
 *         - clinicId
 *         - tenantId
 *         - sex
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: First name
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: Last name
 *         phone:
 *           type: string
 *           pattern: '^[\\+]?[0-9\\s\\-\\(\\)]{10,15}$'
 *           description: Phone number
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
 *           pattern: '^[a-zA-Z0-9]+$'
 *           description: Username (alphanumeric only)
 *         password:
 *           type: string
 *           minLength: 8
 *           pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
 *           description: Password (must contain uppercase, lowercase, number, and special character)
 *         clinicId:
 *           type: string
 *           description: Clinic ID
 *         tenantId:
 *           type: string
 *           description: Tenant ID
 *         sex:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER]
 *           description: Sex
 *         middleName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           description: Middle name (optional)
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Date of birth (optional)
 *         address:
 *           type: object
 *           description: Address object (optional)
 *           properties:
 *             address:
 *               type: string
 *               maxLength: 500
 *               description: Street address
 *             townCode:
 *               type: string
 *               description: Town code
 *             town:
 *               type: string
 *               description: Town name
 *             pin:
 *               type: string
 *               pattern: '^[0-9]{6}$'
 *               description: PIN code (6 digits)
 *             subDistrictCode:
 *               type: string
 *               description: Sub-district code
 *             subDistrict:
 *               type: string
 *               description: Sub-district name
 *             districtCode:
 *               type: string
 *               description: District code
 *             district:
 *               type: string
 *               description: District name
 *             stateCode:
 *               type: string
 *               description: State code
 *             state:
 *               type: string
 *               description: State name
 *             countryCode:
 *               type: string
 *               description: Country code
 *             countryName:
 *               type: string
 *               description: Country name
 *         externalId:
 *           type: string
 *           maxLength: 100
 *           description: External ID (optional)
 *         signatureUrl:
 *           type: string
 *           format: uri
 *           description: Signature URL (optional)
 *         profileImageUrl:
 *           type: string
 *           format: uri
 *           description: Profile image URL (optional)
 *     DoctorCreateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         userId:
 *           type: string
 *         personId:
 *           type: string
 *   tags:
 *     - name: Doctors
 *       description: Doctor management operations
 */
export const DoctorController = {
  /**
   * @swagger
   * /clinics/doctors:
   *   post:
   *     tags: [Doctors]
   *     summary: Create a new doctor
   *     description: Creates a new doctor user with associated person record and clinic assignment
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/DoctorCreate'
   *     responses:
   *       201:
   *         description: Doctor created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/DoctorCreateResponse'
   *       400:
   *         description: Bad request - validation errors
   *       409:
   *         description: Conflict - username, email, or phone already exists
   *       500:
   *         description: Internal server error
   */
  async createDoctor(req: Request, res: Response) {
    try {
      const result = await DoctorService.createDoctor(
        req.body,
        (req as any).requestId,
        (req as any).user?.id
      );
      
      logger.debug("✅ Doctor created successfully:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      
      successResponse(res, result, 201);
    } catch (error) {
      logger.error("❌ Create doctor error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });

      const errorMessage = error instanceof Error ? error.message : "Failed to create doctor";
      const statusCode = getStatusCodeFromError(errorMessage);
      
      errorResponse(
        res,
        errorMessage,
        statusCode,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /clinics/doctors/{id}:
   *   get:
   *     tags: [Doctors]
   *     summary: Get doctor by ID
   *     description: Retrieves a specific doctor by their user ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Doctor user ID
   *     responses:
   *       200:
   *         description: Doctor retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Doctor'
   *       404:
   *         description: Doctor not found
   *       500:
   *         description: Internal server error
   */
  async getDoctorById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await DoctorService.getDoctorById(
        id,
        (req as any).requestId,
        (req as any).user?.id
      );
      
      if (!result) {
        errorResponse(res, "Doctor not found", 404);
        return;
      }
      
      logger.debug("✅ Doctor retrieved by ID:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        doctorId: id,
      });
      
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ Get doctor by ID error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      
      errorResponse(
        res,
        error instanceof Error ? error.message : "Failed to fetch doctor",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /clinics/{clinicId}/doctors:
   *   get:
   *     tags: [Doctors]
   *     summary: Get doctors by clinic
   *     description: Retrieves all doctors associated with a specific clinic
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: clinicId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Clinic ID
   *       - name: tenantId
   *         in: query
   *         schema:
   *           type: string
   *         description: Filter by tenant ID
   *       - name: isActive
   *         in: query
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *       - name: search
   *         in: query
   *         schema:
   *           type: string
   *         description: Search in name, email, phone, or username
   *     responses:
   *       200:
   *         description: Doctors retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Doctor'
   *       500:
   *         description: Internal server error
   */
  async getDoctorsByClinic(req: Request, res: Response) {
    try {
      const clinicId = String(req.params.clinicId);
      
      const filters: DoctorFilterOptions = {
        tenantId: req.query.tenantId as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof DoctorFilterOptions] === undefined) {
          delete filters[key as keyof DoctorFilterOptions];
        }
      });

      const result = await DoctorService.getDoctorsByClinic(
        clinicId,
        Object.keys(filters).length > 0 ? filters : undefined,
        (req as any).requestId,
        (req as any).user?.id
      );
      
      logger.debug("✅ Doctors retrieved by clinic:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        clinicId,
        filters,
        count: result.length,
      });
      
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ Get doctors by clinic error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      
      errorResponse(
        res,
        error instanceof Error ? error.message : "Failed to fetch doctors",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /clinics/doctors:
   *   get:
   *     tags: [Doctors]
   *     summary: Get all doctors
   *     description: Retrieves all doctors with optional filtering
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: tenantId
   *         in: query
   *         schema:
   *           type: string
   *         description: Filter by tenant ID
   *       - name: clinicId
   *         in: query
   *         schema:
   *           type: string
   *         description: Filter by clinic ID
   *       - name: isActive
   *         in: query
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *       - name: search
   *         in: query
   *         schema:
   *           type: string
   *         description: Search in name, email, phone, or username
   *     responses:
   *       200:
   *         description: Doctors retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Doctor'
   *       500:
   *         description: Internal server error
   */
  async getAllDoctors(req: Request, res: Response) {
    try {
      const filters: DoctorFilterOptions = {
        tenantId: req.query.tenantId as string,
        clinicId: req.query.clinicId as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof DoctorFilterOptions] === undefined) {
          delete filters[key as keyof DoctorFilterOptions];
        }
      });

      const result = await DoctorService.getAllDoctors(
        filters.tenantId,
        Object.keys(filters).length > 0 ? filters : undefined,
        (req as any).requestId,
        (req as any).user?.id
      );
      
      logger.debug("✅ All doctors retrieved:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        filters,
        count: result.length,
      });
      
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ Get all doctors error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      
      errorResponse(
        res,
        error instanceof Error ? error.message : "Failed to fetch doctors",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },
};

/**
 * Helper function to determine appropriate HTTP status code from error message
 */
function getStatusCodeFromError(errorMessage: string): number {
  if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
    return 409; // Conflict
  }
  if (errorMessage.includes('required') || errorMessage.includes('must be') || errorMessage.includes('Invalid')) {
    return 400; // Bad Request
  }
  if (errorMessage.includes('not found')) {
    return 404; // Not Found
  }
  return 500; // Internal Server Error
}