import { Router } from 'express';
import { RegistrationController } from '../controllers/registration.controller';
import { authenticateJWT } from '../../../shared/auth.middleware';
import { validateRequest } from '../../../shared/validate.middleware';

import {
  QueryRegistrationListSchema,
  GetRegistrationDetailsSchema,
  UpdateScreeningSchema
} from '../schemas/registration.schema';

const router = Router();

/**
 * @openapi
 * /api/v1/campaigns/{campaignId}/registrations:
 *   get:
 *     summary: BC-UC-04 View Donor Registration List
 *     tags: [Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: bloodType
 *         in: query
 *         schema:
 *           type: string
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved donor registration list
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Campaign not found
 */
router.get(
  '/campaigns/:campaignId/registrations',
  authenticateJWT,
  validateRequest(QueryRegistrationListSchema),
  RegistrationController.listCampaignRegistrations
);

/**
 * @openapi
 * /api/v1/registrations/{registrationId}:
 *   get:
 *     summary: BC-UC-05 Read Donor Registration Details
 *     tags: [Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: registrationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved registration details
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Registration record not found
 */
router.get(
  '/registrations/:registrationId',
  authenticateJWT,
  validateRequest(GetRegistrationDetailsSchema),
  RegistrationController.getRegistrationById
);

/**
 * @openapi
 * /api/v1/registrations/{registrationId}/screening:
 *   put:
 *     summary: BC-UC-05 Write Edit Screening Vitals & Donor Status
 *     tags: [Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: registrationId
 *         in: path
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
 *               bloodType:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-, Unknown]
 *                 description: Cập nhật nhóm máu người hiến (đồng bộ vào DonorProfile)
 *               vitals:
 *                 type: object
 *                 properties:
 *                   bloodPressure:
 *                     type: string
 *                     example: "120/80"
 *                   weight:
 *                     type: number
 *                     example: 65.5
 *                   bodyTemperature:
 *                     type: number
 *                     example: 36.6
 *                   hemoglobinLevel:
 *                     type: number
 *                     example: 13.5
 *               screeningNotes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Pending, Confirmed, Rejected, CheckedIn, Eligible, Ineligible, Completed, Eligible for Donation, Ineligible for Donation, Donation Completed]
 *               responses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     selectedOptions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     description:
 *                       type: string
 *     responses:
 *       200:
 *         description: Successfully updated screening and donor status
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Registration record not found
 */
router.put(
  '/registrations/:registrationId/screening',
  authenticateJWT,
  validateRequest(UpdateScreeningSchema),
  RegistrationController.updateRegistrationScreening
);

/**
  * @openapi
  * /api/v1/registrations/qr-checkin:
  *   post:
  *     summary: Scan E-Ticket QR Code & Auto Check-In Registration Status
  *     tags: [Registration]
  *     security:
  *       - bearerAuth: []
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               qrPayload:
  *                 type: string
  *     responses:
  *       200:
  *         description: Successfully checked-in registration via QR Code
  */
router.post(
  '/registrations/qr-checkin',
  authenticateJWT,
  RegistrationController.checkInByQRCode
);

export default router;
