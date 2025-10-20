const express = require('express');
const router = express.Router();
const {
  getAllTrips,
  getTripById,
  createTrip,
  startTrip,
  simulateGPS,
  completeTrip,
  getScheduledTrips
} = require('../controllers/tripController');

const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Trips
 *   description: Trip management and GPS simulation
 */

/**
 * @swagger
 * /api/trips/scheduled:
 *   get:
 *     tags: [Trips]
 *     summary: Get scheduled trips for passengers
 *     description: Retrieve upcoming trips with filtering options
 *     parameters:
 *       - in: query
 *         name: busType
 *         schema:
 *           type: string
 *           enum: [AC, Private, CTB]
 *         description: Filter by bus type
 *       - in: query
 *         name: routeId
 *         schema:
 *           type: string
 *         description: Filter by route ID
 *         example: CMB-GMP-019
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by travel date
 *         example: 2024-12-15
 *     responses:
 *       200:
 *         description: Scheduled trips retrieved successfully
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
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trip'
 */
router.get('/scheduled', getScheduledTrips);

/**
 * @swagger
 * /api/trips:
 *   get:
 *     tags: [Trips]
 *     summary: Get all trips
 *     description: Retrieve list of all trips with pagination and filtering (Admin/Operator)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of trips per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, started, in-progress, completed, cancelled]
 *         description: Filter by trip status
 *       - in: query
 *         name: routeId
 *         schema:
 *           type: string
 *         description: Filter by route ID
 *       - in: query
 *         name: registrationNumber
 *         schema:
 *           type: string
 *         description: Filter by bus registration number
 *     responses:
 *       200:
 *         description: Trips retrieved successfully
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
 *                   example: 10
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trip'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getAllTrips);

/**
 * @swagger
 * /api/trips/{tripId}:
 *   get:
 *     tags: [Trips]
 *     summary: Get trip by ID
 *     description: Retrieve specific trip details by trip ID
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID or MongoDB ObjectId
 *         example: CMB-GMP-20241215-0600
 *     responses:
 *       200:
 *         description: Trip retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Trip'
 *       404:
 *         description: Trip not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:tripId', getTripById);

/**
 * @swagger
 * /api/trips:
 *   post:
 *     tags: [Trips]
 *     summary: Create new trip
 *     description: Schedule a new bus trip (Admin/Operator only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registrationNumber
 *               - routeId
 *               - scheduledDate
 *               - scheduledStartTime
 *               - scheduledEndTime
 *             properties:
 *               registrationNumber:
 *                 type: string
 *                 pattern: '^[A-Z]{2,3}-[0-9]{4}$'
 *                 example: WP-1234
 *               routeId:
 *                 type: string
 *                 example: CMB-GMP-019
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-12-15
 *               scheduledStartTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: "06:00"
 *               scheduledEndTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: "10:10"
 *     responses:
 *       201:
 *         description: Trip created successfully
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
 *                   example: Trip created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Trip'
 *       400:
 *         description: Validation error or conflicting trip exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized (requires admin or operator role)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', protect, authorize('admin', 'operator'), createTrip);

/**
 * @swagger
 * /api/trips/{tripId}/start:
 *   post:
 *     tags: [Trips]
 *     summary: Start a trip
 *     description: Mark a trip as started (Admin/Operator/Driver)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID to start
 *         example: CMB-GMP-20241215-0600
 *     responses:
 *       200:
 *         description: Trip started successfully
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
 *                   example: Trip started successfully
 *                 data:
 *                   $ref: '#/components/schemas/Trip'
 *       400:
 *         description: Trip already started or completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized (requires admin, operator, or driver role)
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
router.post('/:tripId/start', protect, authorize('admin', 'operator', 'driver'), startTrip);

/**
 * @swagger
 * /api/trips/{tripId}/simulate-gps:
 *   post:
 *     tags: [Trips]
 *     summary: Start GPS simulation (6-minute demo)
 *     description: Start real-time GPS simulation for a trip - compresses any route to 6 minutes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID to simulate
 *         example: CMB-GMP-20241215-0600
 *     responses:
 *       200:
 *         description: GPS simulation started successfully
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
 *                   example: GPS simulation started. Trip will complete in 6 minutes.
 *                 data:
 *                   type: object
 *                   properties:
 *                     tripId:
 *                       type: string
 *                       example: CMB-GMP-20241215-0600
 *                     duration:
 *                       type: string
 *                       example: 6 minutes
 *                     updateInterval:
 *                       type: string
 *                       example: 10 seconds
 *                     startedAt:
 *                       type: object
 *                       properties:
 *                         date:
 *                           type: string
 *                           example: 2024-12-15
 *                         time:
 *                           type: string
 *                           example: 06:00
 *       404:
 *         description: Trip not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Trip already completed or in progress
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized (requires admin or operator role)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:tripId/simulate-gps', protect, authorize('admin', 'operator'), simulateGPS);

/**
 * @swagger
 * /api/trips/{tripId}/complete:
 *   post:
 *     tags: [Trips]
 *     summary: Complete a trip
 *     description: Mark a trip as completed (Admin/Operator/Driver)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID to complete
 *         example: CMB-GMP-20241215-0600
 *     responses:
 *       200:
 *         description: Trip completed successfully
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
 *                   example: Trip completed successfully
 *                 data:
 *                   $ref: '#/components/schemas/Trip'
 *       400:
 *         description: Trip not started or already completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized (requires admin, operator, or driver role)
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
router.post('/:tripId/complete', protect, authorize('admin', 'operator', 'driver'), completeTrip);

module.exports = router;