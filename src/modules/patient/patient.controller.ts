import { Request, Response } from "express";
import { PatientService } from "./patient.service";
import { successResponse, errorResponse, getModuleLogger, PaginationInput } from "../../utils";
import { PatientFilterOptions } from "./patient.type";

const logger = getModuleLogger("patient-controller");

/**
 * Controller layer for Patient operations.
 * 
 * @swagger
 * components:
 *   schemas:
 *     Patient:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Patient ID
 *         tenantId:
 *           type: string
 *           description: Tenant ID
 *         clinicId:
 *           type: string
 *           description: Clinic ID
 *         pseudonymId:
 *           type: string
 *           description: Anonymized patient identifier
 *         type:
 *           type: string
 *           enum: [HUMAN, PET, LIVESTOCK]
 *           description: Patient type
 *         age:
 *           type: integer
 *           description: Patient age
 *         sex:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER, UNKNOWN]
 *           description: Patient sex
 *         species:
 *           type: string
 *           enum: [DOG, CAT, COW, GOAT, SHEEP, PIG, OTHER]
 *           description: Animal species (for pets/livestock)
 *         breed:
 *           type: string
 *           description: Animal breed
 *         hasIdentifyingInfo:
 *           type: boolean
 *           description: Whether patient has identifying information
 *         externalId:
 *           type: string
 *           description: External system identifier
 *         ownerId:
 *           type: string
 *           description: Owner ID (for pets/livestock)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     PatientCreate:
 *       type: object
 *       required:
 *         - tenantId
 *         - pseudonymId
 *         - type
 *       properties:
 *         tenantId:
 *           type: string
 *         clinicId:
 *           type: string
 *         pseudonymId:
 *           type: string
 *         type:
 *           type: string
 *           enum: [HUMAN, PET, LIVESTOCK]
 *         age:
 *           type: integer
 *           minimum: 0
 *           maximum: 200
 *         sex:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER, UNKNOWN]
 *         species:
 *           type: string
 *           enum: [DOG, CAT, COW, GOAT, SHEEP, PIG, OTHER]
 *         breed:
 *           type: string
 *         hasIdentifyingInfo:
 *           type: boolean
 *         externalId:
 *           type: string
 *         ownerId:
 *           type: string
 *         addressId:
 *           type: string
 *         address:
 *           type: object
 *           description: Address object - if provided, will create address automatically
 *           properties:
 *             address:
 *               type: string
 *             townCode:
 *               type: string
 *             town:
 *               type: string
 *             pin:
 *               type: string
 *               pattern: '^[0-9]{6}$'
 *             subDistrictCode:
 *               type: string
 *             subDistrict:
 *               type: string
 *             districtCode:
 *               type: string
 *             district:
 *               type: string
 *             stateCode:
 *               type: string
 *             state:
 *               type: string
 *             countryId:
 *               type: string
 *             countryName:
 *               type: string
 *             geoLocation:
 *               type: object
 *         person:
 *           type: object
 *           description: Person object - if provided, will create person automatically
 *           properties:
 *             fullName:
 *               type: string
 *               minLength: 2
 *               maxLength: 100
 *             phone:
 *               type: string
 *               pattern: '^[\\+]?[0-9\\s\\-\\(\\)]{10,15}$'
 *             email:
 *               type: string
 *               format: email
 *             dateOfBirth:
 *               type: string
 *               format: date
 *             sex:
 *               type: string
 *               enum: [MALE, FEMALE, OTHER, UNKNOWN]
 *     PatientUpdate:
 *       type: object
 *       properties:
 *         tenantId:
 *           type: string
 *         clinicId:
 *           type: string
 *         pseudonymId:
 *           type: string
 *         type:
 *           type: string
 *           enum: [HUMAN, PET, LIVESTOCK]
 *         age:
 *           type: integer
 *           minimum: 0
 *           maximum: 200
 *         sex:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER, UNKNOWN]
 *         species:
 *           type: string
 *           enum: [DOG, CAT, COW, GOAT, SHEEP, PIG, OTHER]
 *         breed:
 *           type: string
 *         hasIdentifyingInfo:
 *           type: boolean
 *         externalId:
 *           type: string
 *         ownerId:
 *           type: string
 *         addressId:
 *           type: string
 *         address:
 *           type: object
 *           description: Address object - if provided, will create/update address automatically
 *           properties:
 *             address:
 *               type: string
 *             townCode:
 *               type: string
 *             town:
 *               type: string
 *             pin:
 *               type: string
 *               pattern: '^[0-9]{6}$'
 *             subDistrictCode:
 *               type: string
 *             subDistrict:
 *               type: string
 *             districtCode:
 *               type: string
 *             district:
 *               type: string
 *             stateCode:
 *               type: string
 *             state:
 *               type: string
 *             countryId:
 *               type: string
 *             countryName:
 *               type: string
 *             geoLocation:
 *               type: object
 *         person:
 *           type: object
 *           description: Person object - if provided, will create/update person automatically
 *           properties:
 *             fullName:
 *               type: string
 *               minLength: 2
 *               maxLength: 100
 *             phone:
 *               type: string
 *               pattern: '^[\\+]?[0-9\\s\\-\\(\\)]{10,15}$'
 *             email:
 *               type: string
 *               format: email
 *             dateOfBirth:
 *               type: string
 *               format: date
 *             sex:
 *               type: string
 *               enum: [MALE, FEMALE, OTHER, UNKNOWN]
 *   tags:
 *     - name: Patients
 *       description: Patient management operations
 */
export const PatientController = {
  /**
   * @swagger
   * /patients:
   *   post:
   *     tags: [Patients]
   *     summary: Create a new patient
   *     description: Creates a new patient record in the system
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PatientCreate'
   *     responses:
   *       201:
   *         description: Patient created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Patient'
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  async create(req: Request, res: Response) {
    try {
      const result = await PatientService.create(
        req.body,
        (req as any).requestId,
        (req as any).user?.id
      );
      logger.debug("✅ Patient created:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 201);
    } catch (error) {
      logger.error("❌ create Patient error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || "Failed to create patient",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /patients/bulk:
   *   post:
   *     tags: [Patients]
   *     summary: Bulk create patients
   *     description: Creates multiple patient records at once
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               patients:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/PatientCreate'
   *                 minItems: 1
   *                 maxItems: 100
   *     responses:
   *       201:
   *         description: Patients created successfully
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  async bulkCreate(req: Request, res: Response) {
    try {
      const result = await PatientService.bulkCreate(
        req.body.patients,
        (req as any).requestId,
        (req as any).user?.id
      );
      logger.debug("✅ Patients bulk created:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 201);
    } catch (error) {
      logger.error("❌ bulk create patients error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || "Failed to bulk create patients",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /patients:
   *   get:
   *     tags: [Patients]
   *     summary: Get all patients
   *     description: Retrieves all patients with optional filtering
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
   *       - name: type
   *         in: query
   *         schema:
   *           type: string
   *           enum: [HUMAN, PET, LIVESTOCK]
   *         description: Filter by patient type
   *       - name: species
   *         in: query
   *         schema:
   *           type: string
   *           enum: [DOG, CAT, COW, GOAT, SHEEP, PIG, OTHER]
   *         description: Filter by species
   *       - name: search
   *         in: query
   *         schema:
   *           type: string
   *         description: Search in pseudonym or external ID
   *     responses:
   *       200:
   *         description: Patients retrieved successfully
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
   *                     $ref: '#/components/schemas/Patient'
   *       500:
   *         description: Internal server error
   */
  async getAll(req: Request, res: Response) {
    try {
      const filters: PatientFilterOptions = {
        tenantId: req.query.tenantId as string,
        clinicId: req.query.clinicId as string,
        type: req.query.type as any,
        species: req.query.species as any,
        ownerId: req.query.ownerId as string,
        hasIdentifyingInfo: req.query.hasIdentifyingInfo ? req.query.hasIdentifyingInfo === 'true' : undefined,
        search: req.query.search as string,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof PatientFilterOptions] === undefined) {
          delete filters[key as keyof PatientFilterOptions];
        }
      });

      const result = await PatientService.getAll(
        Object.keys(filters).length > 0 ? filters : undefined,
        (req as any).requestId,
        (req as any).user?.id
      );
      logger.debug("✅ all patients retrieved:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        filters,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ get all patients error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || "Failed to fetch patients",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /patients/page:
   *   get:
   *     tags: [Patients]
   *     summary: Get paginated patients
   *     description: Retrieves patients with pagination and optional filtering
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: page
   *         in: query
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - name: limit
   *         in: query
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Number of items per page
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
   *       - name: type
   *         in: query
   *         schema:
   *           type: string
   *           enum: [HUMAN, PET, LIVESTOCK]
   *         description: Filter by patient type
   *     responses:
   *       200:
   *         description: Paginated patients retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Patient'
   *                     total:
   *                       type: integer
   *                     currentPage:
   *                       type: integer
   *                     pageSize:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   */
  async getAllPaginated(req: Request, res: Response) {
    try {
      const pagination: PaginationInput = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const filters: PatientFilterOptions = {
        tenantId: req.query.tenantId as string,
        clinicId: req.query.clinicId as string,
        type: req.query.type as any,
        species: req.query.species as any,
        ownerId: req.query.ownerId as string,
        hasIdentifyingInfo: req.query.hasIdentifyingInfo ? req.query.hasIdentifyingInfo === 'true' : undefined,
        search: req.query.search as string,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof PatientFilterOptions] === undefined) {
          delete filters[key as keyof PatientFilterOptions];
        }
      });

      const result = await PatientService.getPaginated(
        pagination,
        Object.keys(filters).length > 0 ? filters : undefined,
        (req as any).requestId,
        (req as any).user?.id
      );
      logger.debug("✅ paginated patients retrieved:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        pagination,
        filters,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ paginated fetch error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error ||  "Failed to fetch paginated patients",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /patients/{id}:
   *   get:
   *     tags: [Patients]
   *     summary: Get patient by ID
   *     description: Retrieves a specific patient by their ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Patient ID
   *     responses:
   *       200:
   *         description: Patient retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Patient'
   *       404:
   *         description: Patient not found
   *       500:
   *         description: Internal server error
   */
  async getById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await PatientService.get(
        id,
        (req as any).requestId,
        (req as any).user?.id
      );
      if (!result) {
        errorResponse(res, "Patient not found", 404);
        return;
      }
      logger.debug("✅ Patient retrieved by ID:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ get by ID error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || "Failed to fetch patient",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /patients/pseudonym/{pseudonymId}:
   *   get:
   *     tags: [Patients]
   *     summary: Get patient by pseudonym ID
   *     description: Retrieves a specific patient by their pseudonym ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: pseudonymId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Patient pseudonym ID
   *     responses:
   *       200:
   *         description: Patient retrieved successfully
   *       404:
   *         description: Patient not found
   *       500:
   *         description: Internal server error
   */
  async getByPseudonymId(req: Request, res: Response) {
    try {
      const pseudonymId = String(req.params.pseudonymId);
      const result = await PatientService.getByPseudonymId(
        pseudonymId,
        (req as any).requestId,
        (req as any).user?.id
      );
      if (!result) {
        errorResponse(res, "Patient not found", 404);
        return;
      }
      logger.debug("✅ Patient retrieved by pseudonym ID:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ get by pseudonym ID error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || "Failed to fetch patient",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /patients/{id}:
   *   put:
   *     tags: [Patients]
   *     summary: Update patient
   *     description: Updates an existing patient record
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Patient ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PatientUpdate'
   *     responses:
   *       200:
   *         description: Patient updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Patient'
   *       404:
   *         description: Patient not found
   *       500:
   *         description: Internal server error
   */
  async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await PatientService.update(
        id,
        req.body,
        (req as any).requestId,
        (req as any).user?.id
      );
      if (!result) {
        errorResponse(res, "Patient not found", 404);
        return;
      }
      logger.debug("✅ Patient updated:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ update Patient error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || "Failed to update patient",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /patients/{id}:
   *   delete:
   *     tags: [Patients]
   *     summary: Delete patient
   *     description: Deletes a patient record from the system
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Patient ID
   *     responses:
   *       200:
   *         description: Patient deleted successfully
   *       404:
   *         description: Patient not found
   *       500:
   *         description: Internal server error
   */
  async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await PatientService.delete(
        id,
        (req as any).requestId,
        (req as any).user?.id
      );
      if (!result) {
        errorResponse(res, "Patient not found", 404);
        return;
      }
      logger.debug("✅ Patient deleted:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ delete Patient error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || "Failed to delete patient",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },
};