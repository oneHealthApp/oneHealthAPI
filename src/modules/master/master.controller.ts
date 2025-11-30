import { Request, Response } from 'express';
import { MasterService } from './master.service';
import { getModuleLogger } from '../../utils';

const logger = getModuleLogger("master-controller");
/**
 * @swagger
 * components:
 *   schemas:
 *     MasterDataItem:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           description: Unique value identifier
 *           example: "saving"
 *         label:
 *           type: string
 *           description: Display label
 *           example: "Saving Account"
 *       required:
 *         - value
 *         - label
 *
 *     DiseaseItem:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           example: "type_2_diabetes"
 *         label:
 *           type: string
 *           example: "Type 2 Diabetes Mellitus"
 *         snomedId:
 *           type: string
 *           example: "44054006"
 *         icdCode:
 *           type: string
 *           example: "E11"
 *         diseaseType:
 *           type: string
 *           example: "Metabolic"
 *         metadata:
 *           type: object
 *           properties:
 *             commonSymptoms:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Increased thirst", "Frequent urination"]
 *
 *     MedicineItem:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           example: "human_insulatard_40iu"
 *         label:
 *           type: string
 *           example: "Human Insulatard 40IU/ml Suspension for Injection"
 *         category:
 *           type: string
 *           example: "Human Insulin Basal"
 *         saltComposition:
 *           type: string
 *           example: "Insulin Isophane (40IU)"
 *         price:
 *           type: string
 *           example: "₹133.93"
 *         manufacturer:
 *           type: string
 *           example: "Novo Nordisk India Pvt Ltd"
 *         metadata:
 *           type: object
 *           properties:
 *             description:
 *               type: string
 *               example: "Human Insulatard 40IU/ml Suspension for Injection is used to improve blood sugar control..."
 *             sideEffects:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Hypoglycemia", "Injection site allergic reaction"]
 *             drugInteractions:
 *               type: object
 *               properties:
 *                 drugs:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Benazepril", "Captopril"]
 *                 brands:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Apriace", "Capotril"]
 *                 effects:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["MODERATE", "MODERATE"]
 *
 *     MedicineItem:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           example: "human_insulatard_40iu"
 *         label:
 *           type: string
 *           example: "Human Insulatard 40IU/ml Suspension for Injection"
 *         category:
 *           type: string
 *           example: "Human Insulin Basal"
 *         saltComposition:
 *           type: string
 *           example: "Insulin Isophane (40IU)"
 *         price:
 *           type: string
 *           example: "₹133.93"
 *         manufacturer:
 *           type: string
 *           example: "Novo Nordisk India Pvt Ltd"
 *         metadata:
 *           type: object
 *           properties:
 *             description:
 *               type: string
 *               example: "Human Insulatard 40IU/ml Suspension for Injection is used to improve blood sugar control..."
 *             sideEffects:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Hypoglycemia", "Injection site allergic reaction"]
 *             drugInteractions:
 *               type: object
 *               properties:
 *                 drugs:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Benazepril", "Captopril"]
 *                 brands:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Apriace", "Capotril"]
 *                 effects:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["MODERATE", "MODERATE"]
 *
 *     MasterDataResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "account_types master data retrieved successfully"
 *         data:
 *           type: object
 *           properties:
 *             collection:
 *               type: string
 *               example: "account_types"
 *             items:
 *               type: array
 *               items:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/MasterDataItem'
 *                   - $ref: '#/components/schemas/DiseaseItem'
 *                   - $ref: '#/components/schemas/MedicineItem'
 *                   - $ref: '#/components/schemas/MedicineItem'
 *             count:
 *               type: integer
 *               example: 2
 *
 *     CollectionsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Available master data collections retrieved successfully"
 *         data:
 *           type: object
 *           properties:
 *             collections:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["account_types", "human_disease_master", "patient_types"]
 *             count:
 *               type: integer
 *               example: 3
 */

export class MasterController {
  /**
   * @swagger
   * /master/{collection}:
   *   get:
   *     summary: Get master data by collection name
   *     description: Retrieve specific master data collection by name
   *     tags: [Master Data]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: collection
   *         required: true
   *         schema:
   *           type: string
   *           enum: [human_disease_master, livestock_disease_master, pet_disease_master, medicine_master, account_types, patient_types, visit_types, gender_options, blood_groups, marital_status]
   *         description: Name of the master data collection
   *         example: human_disease_master
   *     responses:
   *       200:
   *         description: Master data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MasterDataResponse'
   *       400:
   *         description: Invalid collection name
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
   *                   example: "Invalid collection name"
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Collection not found
   *       500:
   *         description: Internal server error
   */
  static async getMasterData(req: Request, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      logger.info(`[${requestId}] GET /master/${req.params.collection} - Getting master data`);
      
      const { collection } = req.params;
      const result = await MasterService.getMasterData(collection as any);
      
      logger.info(`[${requestId}] Master data retrieved successfully: ${collection}`);
      res.status(200).json(result);
      
    } catch (error) {
      logger.error(`[${requestId}] Error getting master data:`, error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  /**
   * @swagger
   * /master:
   *   get:
   *     summary: Get list of available master data collections
   *     description: Retrieve list of all available master data collections
   *     tags: [Master Data]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Available collections retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CollectionsResponse'
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  static async getAvailableCollections(req: Request, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      logger.info(`[${requestId}] GET /master - Getting available collections`);
      
      const result = await MasterService.getAvailableCollections();
      
      logger.info(`[${requestId}] Available collections retrieved successfully`);
      res.status(200).json(result);
      
    } catch (error) {
      logger.error(`[${requestId}] Error getting available collections:`, error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * @swagger
   * /master/{collection}/search:
   *   get:
   *     summary: Search within a master data collection
   *     description: Search for items within a specific master data collection
   *     tags: [Master Data]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: collection
   *         required: true
   *         schema:
   *           type: string
   *           enum: [human_disease_master, livestock_disease_master, pet_disease_master, medicine_master, account_types, patient_types, visit_types, gender_options, blood_groups, marital_status]
   *         description: Name of the master data collection to search
   *         example: human_disease_master
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *           minLength: 1
   *           maxLength: 100
   *         description: Search term (searches in label, value, disease type, ICD code, symptoms, medicine name, manufacturer, salt composition)
   *         example: diabetes
   *     responses:
   *       200:
   *         description: Search results retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MasterDataResponse'
   *             example:
   *               success: true
   *               message: "Search results for 'diabetes' in human_disease_master"
   *               data:
   *                 collection: "human_disease_master"
   *                 items:
   *                   - value: "type_2_diabetes"
   *                     label: "Type 2 Diabetes Mellitus"
   *                     snomedId: "44054006"
   *                     icdCode: "E11"
   *                     diseaseType: "Metabolic"
   *                 count: 1
   *       400:
   *         description: Invalid parameters
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Collection not found
   *       500:
   *         description: Internal server error
   */
  static async searchMasterData(req: Request, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      logger.info(`[${requestId}] GET /master/${req.params.collection}/search - Searching master data`);
      
      const { collection } = req.params;
      const { q: searchTerm } = req.query;

      if (!searchTerm || typeof searchTerm !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
        return;
      }
      
      const result = await MasterService.searchMasterData(collection as any, searchTerm);
      
      logger.info(`[${requestId}] Search completed successfully: ${collection}, term: ${searchTerm}`);
      res.status(200).json(result);
      
    } catch (error) {
      logger.error(`[${requestId}] Error searching master data:`, error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }
}