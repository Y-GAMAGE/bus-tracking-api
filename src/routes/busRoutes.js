const express = require('express');
const router = express.Router();
const {
  getAllBuses,
  getBusByRegistrationNumber,
  createBus,
  updateBusByRegistrationNumber,
  deleteBusByRegistrationNumber
} = require('../controllers/busController');

const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Buses
 *   description: Bus fleet management
 */

/**
 * @swagger
 * /api/buses:
 *   get:
 *     tags: [Buses]
 *     summary: Get all buses
 *     description: Retrieve list of all buses with pagination and filtering
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
 *         description: Number of buses per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [AC, Private, CTB]
 *         description: Filter by bus type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by registration number or operator
 *     responses:
 *       200:
 *         description: Buses retrieved successfully
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
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: integer
 *                       example: 1
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bus'
 */
router.get('/', getAllBuses);

/**
 * @swagger
 * /api/buses/{registrationNumber}:
 *   get:
 *     tags: [Buses]
 *     summary: Get bus by registration number
 *     description: Retrieve specific bus details by registration number
 *     parameters:
 *       - in: path
 *         name: registrationNumber
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z]{2,3}-[0-9]{4}$'
 *         description: Bus registration number (e.g., WP-1234)
 *         example: WP-1234
 *     responses:
 *       200:
 *         description: Bus retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Bus'
 *       404:
 *         description: Bus not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:registrationNumber', getBusByRegistrationNumber);

/**
 * @swagger
 * /api/buses:
 *   post:
 *     tags: [Buses]
 *     summary: Create new bus
 *     description: Add a new bus to the fleet (Admin/Operator only)
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
 *               - capacity
 *               - type
 *               - permitNumber
 *               - operator
 *             properties:
 *               registrationNumber:
 *                 type: string
 *                 pattern: '^[A-Z]{2,3}-[0-9]{4}$'
 *                 example: WP-1234
 *               capacity:
 *                 type: integer
 *                 minimum: 20
 *                 maximum: 60
 *                 example: 45
 *               type:
 *                 type: string
 *                 enum: [AC, Private, CTB]
 *                 example: AC
 *               permitNumber:
 *                 type: string
 *                 example: P019001
 *               operator:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                     example: gampola_express
 *                   phone:
 *                     type: string
 *                     example: "+94711234567"
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [ac, wifi, charging-ports, reclining-seats, restroom, entertainment, gps]
 *                 example: ["ac", "wifi", "charging-ports"]
 *     responses:
 *       201:
 *         description: Bus created successfully
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
 *                   example: Bus created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Bus'
 *       400:
 *         description: Validation error or bus already exists
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
router.post('/', protect, authorize('admin', 'operator'), createBus);

/**
 * @swagger
 * /api/buses/{registrationNumber}:
 *   put:
 *     tags: [Buses]
 *     summary: Update bus by registration number
 *     description: Update existing bus details (Admin/Operator only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationNumber
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z]{2,3}-[0-9]{4}$'
 *         description: Bus registration number
 *         example: WP-1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               capacity:
 *                 type: integer
 *                 minimum: 20
 *                 maximum: 60
 *                 example: 50
 *               type:
 *                 type: string
 *                 enum: [AC, Private, CTB]
 *                 example: AC
 *               permitNumber:
 *                 type: string
 *                 example: P019002
 *               operator:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                     example: updated_operator
 *                   phone:
 *                     type: string
 *                     example: "+94711234568"
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [ac, wifi, charging-ports, reclining-seats, restroom, entertainment, gps]
 *                 example: ["ac", "wifi", "charging-ports", "gps"]
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Bus updated successfully
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
 *                   example: Bus updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Bus'
 *       400:
 *         description: Validation error
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
 *       404:
 *         description: Bus not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:registrationNumber', protect, authorize('admin', 'operator'), updateBusByRegistrationNumber);

/**
 * @swagger
 * /api/buses/{registrationNumber}:
 *   delete:
 *     tags: [Buses]
 *     summary: Delete bus by registration number
 *     description: Soft delete a bus (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationNumber
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z]{2,3}-[0-9]{4}$'
 *         description: Bus registration number
 *         example: WP-1234
 *     responses:
 *       200:
 *         description: Bus deleted successfully
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
 *                   example: Bus deleted successfully
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized (requires admin role)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Bus not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:registrationNumber', protect, authorize('admin'), deleteBusByRegistrationNumber);

module.exports = router;