import { Request, Response } from "express";
import { ClinicService } from "./clinic.service";
import { successResponse, errorResponse, getModuleLogger, PaginationInput } from "../../utils";
import { ClinicFilterOptions } from "./clinic.type";

const logger = getModuleLogger("clinic-controller");

/**
 * Controller layer for Clinic operations.
 * 
 * @swagger
 * components:
 *   schemas:
 *     Clinic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Clinic ID
 *         tenantId:
 *           type: string
 *           description: Tenant ID
 *         name:
 *           type: string
 *           description: Clinic name
 *         clinicType:
 *           type: string
 *           enum: [HUMAN, PET, LIVESTOCK]
 *           description: Type of clinic
 *         isActive:
 *           type: boolean
 *           description: Clinic active status
 *         phone:
 *           type: string
 *           description: Clinic phone number
 *         email:
 *           type: string
 *           format: email
 *           description: Clinic email address
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         tenant:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             slug:
 *               type: string
 *         address:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             address:
 *               type: string
 *             town:
 *               type: string
 *             state:
 *               type: string
 *             countryName:
 *               type: string
 *         _count:
 *           type: object
 *           properties:
 *             patients:
 *               type: integer
 *             appointments:
 *               type: integer
 *             visits:
 *               type: integer
 *     ClinicCreate:
 *       type: object
 *       required:
 *         - name
 *         - clinicType
 *       properties:
 *         tenantId:
 *           type: string
 *           description: Tenant ID (optional - if not provided, will create tenant using clinic name)
 *         tenantName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Tenant name (optional - if not provided, will use clinic name as tenant name)
 *         tenantSlug:
 *           type: string
 *           description: Tenant slug (optional - will be auto-generated from tenant name)
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Clinic name
 *         clinicType:
 *           type: string
 *           enum: [HUMAN, PET, LIVESTOCK]
 *           description: Type of clinic
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Clinic active status
 *         addressId:
 *           type: string
 *           description: Address ID
 *         phone:
 *           type: string
 *           pattern: '^[\\+]?[0-9\\s\\-\\(\\)]{10,15}$'
 *           description: Clinic phone number
 *         email:
 *           type: string
 *           format: email
 *           description: Clinic email address
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
 *     ClinicUpdate:
 *       type: object
 *       properties:
 *         tenantId:
 *           type: string
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         clinicType:
 *           type: string
 *           enum: [HUMAN, PET, LIVESTOCK]
 *         isActive:
 *           type: boolean
 *         addressId:
 *           type: string
 *         phone:
 *           type: string
 *           pattern: '^[\\+]?[0-9\\s\\-\\(\\)]{10,15}$'
 *         email:
 *           type: string
 *           format: email
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
 *   tags:
 *     - name: Clinics
 *       description: Clinic management operations
 */
export const ClinicController = {
  /**
   * @swagger
   * /clinics:
   *   post:
   *     tags: [Clinics]
   *     summary: Create a new clinic
   *     description: Creates a new clinic record in the system
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ClinicCreate'
   *     responses:
   *       201:
   *         description: Clinic created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Clinic'
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  async create(req: Request, res: Response) {
    try {
      const result = await ClinicService.create(
        req.body,
        (req as any).requestId,
        (req as any).user?.id
      );
      logger.debug("✅ Clinic created:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 201);
    } catch (error) {
      logger.error("❌ create Clinic error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || "Failed to create clinic",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /clinics/bulk:
   *   post:
   *     tags: [Clinics]
   *     summary: Bulk create clinics
   *     description: Creates multiple clinic records at once
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               clinics:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/ClinicCreate'
   *                 minItems: 1
   *                 maxItems: 50
   *     responses:
   *       201:
   *         description: Clinics created successfully
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  async bulkCreate(req: Request, res: Response) {
    try {
      const result = await ClinicService.bulkCreate(
        req.body.clinics,
        (req as any).requestId,
        (req as any).user?.id
      );
      logger.debug("✅ Clinics bulk created:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result, 201);
    } catch (error) {
      logger.error("❌ bulk create clinics error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || "Failed to bulk create clinics",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /clinics:
   *   get:
   *     tags: [Clinics]
   *     summary: Get all clinics
   *     description: Retrieves all clinics with optional filtering
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: tenantId
   *         in: query
   *         schema:
   *           type: string
   *         description: Filter by tenant ID
   *       - name: clinicType
   *         in: query
   *         schema:
   *           type: string
   *           enum: [HUMAN, PET, LIVESTOCK]
   *         description: Filter by clinic type
   *       - name: isActive
   *         in: query
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *       - name: search
   *         in: query
   *         schema:
   *           type: string
   *         description: Search in name, phone, or email
   *     responses:
   *       200:
   *         description: Clinics retrieved successfully
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
   *                     $ref: '#/components/schemas/Clinic'
   *       500:
   *         description: Internal server error
   */
  async getAll(req: Request, res: Response) {
    try {
      const filters: ClinicFilterOptions = {
        tenantId: req.query.tenantId as string,
        clinicType: req.query.clinicType as any,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof ClinicFilterOptions] === undefined) {
          delete filters[key as keyof ClinicFilterOptions];
        }
      });

      const result = await ClinicService.getAll(
        Object.keys(filters).length > 0 ? filters : undefined,
        (req as any).requestId,
        (req as any).user?.id
      );
      logger.debug("✅ all clinics retrieved:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        filters,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ get all clinics error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || "Failed to fetch clinics",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /clinics/page:
   *   get:
   *     tags: [Clinics]
   *     summary: Get paginated clinics
   *     description: Retrieves clinics with pagination and optional filtering
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
   *       - name: clinicType
   *         in: query
   *         schema:
   *           type: string
   *           enum: [HUMAN, PET, LIVESTOCK]
   *         description: Filter by clinic type
   *       - name: isActive
   *         in: query
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *       - name: search
   *         in: query
   *         schema:
   *           type: string
   *         description: Search in name, phone, or email
   *     responses:
   *       200:
   *         description: Paginated clinics retrieved successfully
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
   *                         $ref: '#/components/schemas/Clinic'
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

      const filters: ClinicFilterOptions = {
        tenantId: req.query.tenantId as string,
        clinicType: req.query.clinicType as any,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof ClinicFilterOptions] === undefined) {
          delete filters[key as keyof ClinicFilterOptions];
        }
      });

      const result = await ClinicService.getPaginated(
        pagination,
        Object.keys(filters).length > 0 ? filters : undefined,
        (req as any).requestId,
        (req as any).user?.id
      );
      logger.debug("✅ paginated clinics retrieved:", {
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
        error ||  "Failed to fetch paginated clinics",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /clinics/{id}:
   *   get:
   *     tags: [Clinics]
   *     summary: Get clinic by ID
   *     description: Retrieves a specific clinic by their ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Clinic ID
   *     responses:
   *       200:
   *         description: Clinic retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Clinic'
   *       404:
   *         description: Clinic not found
   *       500:
   *         description: Internal server error
   */
  async getById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await ClinicService.get(
        id,
        (req as any).requestId,
        (req as any).user?.id
      );
      if (!result) {
        errorResponse(res, "Clinic not found", 404);
        return;
      }
      logger.debug("✅ Clinic retrieved by ID:", {
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
        error || "Failed to fetch clinic",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /clinics/{id}:
   *   put:
   *     tags: [Clinics]
   *     summary: Update clinic
   *     description: Updates an existing clinic record
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Clinic ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ClinicUpdate'
   *     responses:
   *       200:
   *         description: Clinic updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Clinic'
   *       404:
   *         description: Clinic not found
   *       500:
   *         description: Internal server error
   */
  async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await ClinicService.update(
        id,
        req.body,
        (req as any).requestId,
        (req as any).user?.id
      );
      if (!result) {
        errorResponse(res, "Clinic not found", 404);
        return;
      }
      logger.debug("✅ Clinic updated:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ update Clinic error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || "Failed to update clinic",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },

  /**
   * @swagger
   * /clinics/{id}:
   *   delete:
   *     tags: [Clinics]
   *     summary: Delete clinic
   *     description: Deletes a clinic record from the system
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Clinic ID
   *     responses:
   *       200:
   *         description: Clinic deleted successfully
   *       404:
   *         description: Clinic not found
   *       500:
   *         description: Internal server error
   */
  async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await ClinicService.delete(
        id,
        (req as any).requestId,
        (req as any).user?.id
      );
      if (!result) {
        errorResponse(res, "Clinic not found", 404);
        return;
      }
      logger.debug("✅ Clinic deleted:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        result,
      });
      successResponse(res, result);
    } catch (error) {
      logger.error("❌ delete Clinic error:", {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        error,
      });
      errorResponse(
        res,
        error || "Failed to delete clinic",
        500,
        process.env.NODE_ENV === "development" ? String(error) : undefined
      );
    }
  },
};