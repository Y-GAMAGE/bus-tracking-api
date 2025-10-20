const express = require('express');
const router = express.Router();
const {
  getCurrentBusLocation,
  getTripLocationHistory,
  recordLocation,
  // getAllLocations,
  // getLocationById,
  // updateLocation,
  // deleteLocation
} = require('../controllers/locationController');

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: GPS location tracking and history
 */

// ========================================
// PUBLIC ROUTES
// ========================================

/**
 * @swagger
 * /api/locations/bus/{busRegistrationNumber}/current:
 *   get:
 *     tags: [Locations]
 *     summary: Get current bus location
 *     description: Retrieve current GPS location and status of a specific bus
 *     parameters:
 *       - in: path
 *         name: busRegistrationNumber
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z]{2,3}-[0-9]{4}$'
 *         description: Bus registration number
 *         example: WP-1234
 *     responses:
 *       200:
 *         description: Current bus location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     busRegistrationNumber:
 *                       type: string
 *                       example: WP-1234
 *                     routeNumber:
 *                       type: string
 *                       example: CMB-GMP-019
 *                     routeName:
 *                       type: string
 *                       example: Colombo - Gampola Express Route 019
 *                     scheduledDate:
 *                       type: string
 *                       format: date
 *                       example: 2024-12-15
 *                     currentLocation:
 *                       type: object
 *                       properties:
 *                         stopName:
 *                           type: string
 *                           example: Kandy
 *                         stopSequence:
 *                           type: integer
 *                           example: 1
 *                         scheduledArrival:
 *                           type: string
 *                           example: "06:00"
 *                         actualArrival:
 *                           type: string
 *                           example: "06:05"
 *                         delayMinutes:
 *                           type: integer
 *                           example: 5
 *                         status:
 *                           type: string
 *                           enum: [on-time, delayed, early]
 *                           example: delayed
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                     nextStops:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           locationName:
 *                             type: string
 *                           estimatedArrival:
 *                             type: string
 *                           adjustedEstimate:
 *                             type: string
 *       404:
 *         description: No location data found for bus
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/bus/:busRegistrationNumber/current', getCurrentBusLocation);

/**
 * @swagger
 * /api/locations/trip/{tripId}/history:
 *   get:
 *     tags: [Locations]
 *     summary: Get trip GPS history
 *     description: Retrieve complete GPS tracking history for a specific trip
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID or MongoDB ObjectId
 *         example: CMB-GMP-20241215-0600
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of GPS points to return
 *     responses:
 *       200:
 *         description: Trip GPS history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 36
 *                 tripDetails:
 *                   type: object
 *                   properties:
 *                     tripId:
 *                       type: string
 *                       example: CMB-GMP-20241215-0600
 *                     busRegistrationNumber:
 *                       type: string
 *                       example: WP-1234
 *                     routeNumber:
 *                       type: string
 *                       example: CMB-GMP-019
 *                     status:
 *                       type: string
 *                       example: completed
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       index:
 *                         type: integer
 *                         example: 1
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       coordinates:
 *                         type: object
 *                         properties:
 *                           latitude:
 *                             type: number
 *                             example: 7.2906
 *                           longitude:
 *                             type: number
 *                             example: 80.6350
 *                       speed:
 *                         type: number
 *                         example: 45
 *                       nearestStop:
 *                         type: string
 *                         example: Kandy
 *                       source:
 *                         type: string
 *                         example: simulation
 *       404:
 *         description: Trip or location history not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/trip/:tripId/history', getTripLocationHistory);

// ========================================
// PROTECTED ROUTES (uncomment if using auth)
// ========================================

/**
 * @swagger
 * /api/locations:
 *   post:
 *     tags: [Locations]
 *     summary: Record new GPS location
 *     description: Record a new GPS location point for a bus
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registrationNumber
 *               - tripId
 *               - latitude
 *               - longitude
 *             properties:
 *               registrationNumber:
 *                 type: string
 *                 pattern: '^[A-Z]{2,3}-[0-9]{4}$'
 *                 example: WP-1234
 *               tripId:
 *                 type: string
 *                 example: CMB-GMP-20241215-0600
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 example: 7.2906
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 example: 80.6350
 *               speed:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 example: 45
 *               heading:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 360
 *                 default: 0
 *                 example: 180
 *               status:
 *                 type: string
 *                 enum: [moving, stopped, at-stop, breakdown]
 *                 default: moving
 *                 example: moving
 *               source:
 *                 type: string
 *                 enum: [gps, manual, simulation]
 *                 default: gps
 *                 example: gps
 *     responses:
 *       201:
 *         description: Location recorded successfully
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
 *                   example: Location recorded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     locationId:
 *                       type: string
 *                       example: 67093f1e5c8d2a3b4c5d6e8d
 *                     registrationNumber:
 *                       type: string
 *                       example: WP-1234
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     coordinates:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                           example: 7.2906
 *                         longitude:
 *                           type: number
 *                           example: 80.6350
 *       400:
 *         description: Missing required fields or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Trip not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', recordLocation);

module.exports = router;