import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../utils/responseFormatter';
import { loadQueryByName, substituteParams } from '../../utils/sql-engine';
import { prisma } from '../../common';
export const DashboardController = {
/**
 * @swagger
 * /o/dashboard/analyticaldata:
 *   post:
 *     summary: Execute analytical dashboard queries
 *     description: |
 *       Executes predefined SQL queries for analytical dashboard data.
 *       Uses parameter substitution for safe query execution.
 *       Query files are stored in the sql folder with `-- name: <QueryName>` declaration.
 *     tags: [Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ref
 *             properties:
 *               ref:
 *                 type: string
 *                 description: The query reference name (from `-- name:` in the .sql file)
 *                 example: ageDistribution
 *               params:
 *                 type: object
 *                 description: Key-value parameters to substitute into the SQL (e.g., `{{param}}`).
 *                 example: {}
 *     responses:
 *       200:
 *         description: Query executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 *               example:
 *                 - age_group: "0-10"
 *                   sex: "Male"
 *                   total: 25
 *                 - age_group: "0-10"
 *                   sex: "Female"
 *                   total: 23
 *                 - age_group: "11-20"
 *                   sex: "Male"
 *                   total: 30
 *       400:
 *         description: Missing ref in body
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
 *                   example: "Missing ref in body"
 *                 error:
 *                   type: string
 *                   example: "ref required"
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 *       500:
 *         description: Failed to execute query
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
 *                   example: "Failed to execute query"
 *                 error:
 *                   type: string
 *                   example: "SQL Error: relation does not exist"
 *                 statusCode:
 *                   type: integer
 *                   example: 500
 */
  async getAnalyticalDashboardData(req: Request, res: Response): Promise<void> {
    const { ref, params } = req.body;

    if (!ref) {
      errorResponse(res, 'Missing ref in body', 400, 'ref required');
      return;
    }

    try {
      const rawSql = await loadQueryByName(ref);
      const finalSql = substituteParams(rawSql, params);
      // console.log("🚀 ~ getDashboardData ~ finalSql:", finalSql)
      const result = await prisma.$queryRawUnsafe(finalSql);

      // Use standardized success response; BigInt-safe globally
      successResponse(res, result, 200);
      return;
    } catch (error) {
      console.error('SQL Error:', error);
      errorResponse(res, 'Failed to execute query', 500, String(error));
    }
  },
};
