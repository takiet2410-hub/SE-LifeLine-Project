import { Router } from 'express';
import { CampaignController } from '../controllers/campaign.controller';
import { authenticateJWT, authorizePermissions, authorizeRoles } from '../../../shared/auth.middleware';
import { validateRequest } from '../../../shared/validate.middleware';
import {
  CreateCampaignSchema,
  QueryCampaignSchema,
  UpdateCampaignSchema,
  GetCampaignDetailsSchema
} from '../schemas/campaign.schema';

const router = Router();

/**
 * @openapi
 * /api/v1/campaigns:
 *   get:
 *     summary: BC-UC-01 View Campaign List
 *     tags: [Campaign]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Successfully retrieved campaign list
 */
router.get('/', validateRequest(QueryCampaignSchema), CampaignController.listCampaigns);

/**
 * @openapi
 * /api/v1/campaigns:
 *   post:
 *     summary: BC-UC-02 Create Donation Campaign
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - venue
 *               - fullAddress
 *               - targetBloodGroups
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               venue:
 *                 type: string
 *               fullAddress:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 description: Start date in YYYY-MM-DD format
 *                 example: "2026-08-10"
 *               startDateTime:
 *                 type: string
 *                 description: ISO date string or YYYY-MM-DD
 *                 example: "2026-08-10T07:30:00.000Z"
 *               endDate:
 *                 type: string
 *                 description: End date in YYYY-MM-DD format
 *                 example: "2026-08-10"
 *               endDateTime:
 *                 type: string
 *                 description: ISO date string or YYYY-MM-DD
 *                 example: "2026-08-10T16:30:00.000Z"
 *               targetBloodGroups:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'ALL TYPES', 'All Types']
 *               capacity:
 *                 type: integer
 *               targetUnitsGoal:
 *                 type: integer
 *               contactPerson:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *               internalRemarks:
 *                 type: string
 *               status:
 *                 type: string
 *               bloodCenterId:
 *                 type: string
 *               timeslots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *                     capacity:
 *                       type: integer
 *                     registeredCount:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authenticateJWT, authorizeRoles('BloodCenterStaff', 'Administrator'), authorizePermissions('campaign:create'), validateRequest(CreateCampaignSchema), CampaignController.createCampaign);

/**
 * @openapi
 * /api/v1/campaigns/{id}:
 *   get:
 *     summary: BC-UC-03 View Campaign Details
 *     tags: [Campaign]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign details retrieved successfully
 *       404:
 *         description: Campaign not found
 */
router.get('/:id', validateRequest(GetCampaignDetailsSchema), CampaignController.getCampaignById);

/**
 * @openapi
 * /api/v1/campaigns/{id}:
 *   put:
 *     summary: BC-UC-03 Edit Campaign Details
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               venue:
 *                 type: string
 *               fullAddress:
 *                 type: string
 *               startDateTime:
 *                 type: string
 *               endDateTime:
 *                 type: string
 *               targetBloodGroups:
 *                 type: array
 *                 items:
 *                   type: string
 *               capacity:
 *                 type: integer
 *               targetUnitsGoal:
 *                 type: integer
 *               contactPerson:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *               internalRemarks:
 *                 type: string
 *               status:
 *                 type: string
 *               timeslots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *                     capacity:
 *                       type: integer
 *                     registeredCount:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *       400:
 *         description: Validation error or capacity below registered donors
 *       404:
 *         description: Campaign not found
 */
router.put('/:id', authenticateJWT, authorizeRoles('BloodCenterStaff', 'Administrator'), authorizePermissions('campaign:edit'), validateRequest(UpdateCampaignSchema), CampaignController.updateCampaign);

/**
 * @openapi
 * /api/v1/campaigns/{id}/registrations:
 *   get:
 *     summary: View Campaign Donor Registrations Sub-resource
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registrations retrieved successfully
 *       404:
 *         description: Campaign not found
 */
router.get('/:id/registrations', authenticateJWT, validateRequest(GetCampaignDetailsSchema), CampaignController.getCampaignRegistrations);

export default router;
