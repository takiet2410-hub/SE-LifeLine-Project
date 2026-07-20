import { Router, Request, Response, NextFunction } from 'express';
import campaignController from './campaign.controller';
import { authenticate, authorize } from '../../shared/auth.middleware';
import { validate } from '../../shared/validate.middleware';
import { createCampaignSchema, updateCampaignSchema } from './schemas/campaign.schema';

const router = Router();

/**
 * @openapi
 * /api/v1/campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags:
 *       - Campaign
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bloodCenterId
 *               - name
 *               - venue
 *               - location
 *               - startDateTime
 *               - endDateTime
 *               - targetBloodGroups
 *               - capacity
 *             properties:
 *               bloodCenterId:
 *                 type: string
 *               name:
 *                 type: string
 *               venue:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: Point
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [106.700424, 10.776889]
 *               startDateTime:
 *                 type: string
 *                 format: date-time
 *               endDateTime:
 *                 type: string
 *                 format: date-time
 *               targetBloodGroups:
 *                 type: array
 *                 items:
 *                   type: string
 *               capacity:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [Draft, Active, Full, Closed, Cancelled]
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *       400:
 *         description: Bad Request / Validation Error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  authenticate,
  authorize('Blood Center Staff'),
  validate(createCampaignSchema),
  (req: Request, res: Response, next: NextFunction) => {
    campaignController.createCampaign(req, res, next);
  }
);

/**
 * @openapi
 * /api/v1/campaigns:
 *   get:
 *     summary: Retrieve all campaigns
 *     tags:
 *       - Campaign
 *     responses:
 *       200:
 *         description: List of campaigns
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  campaignController.getCampaigns(req, res, next);
});

/**
 * @openapi
 * /api/v1/campaigns/{id}:
 *   get:
 *     summary: Retrieve a campaign by ID
 *     tags:
 *       - Campaign
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign details
 *       404:
 *         description: Campaign not found
 */
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  campaignController.getCampaignById(req, res, next);
});

/**
 * @openapi
 * /api/v1/campaigns/{id}:
 *   patch:
 *     summary: Update a campaign
 *     tags:
 *       - Campaign
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               venue:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *       400:
 *         description: Validation or business rule error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Campaign not found
 */
router.patch(
  '/:id',
  authenticate,
  authorize('Blood Center Staff'),
  validate(updateCampaignSchema),
  (req: Request, res: Response, next: NextFunction) => {
    campaignController.updateCampaign(req, res, next);
  }
);

export default router;
