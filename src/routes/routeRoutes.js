const express = require('express');
const router = express.Router();
const {
  getAllRoutes,
  getRouteById,
  getRouteByRouteId,
  createRoute,
  updateRoute,
  deleteRoute,
  searchRoutes
} = require('../controllers/routeController');

const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Routes
 *   description: Bus route management and search
 */

/**
 * @swagger
 * /api/routes:
 *   get:
 *     tags: [Routes]
 *     summary: Get all routes
 *     description: Retrieve list of all bus routes with pagination and filtering
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
 *         description: Number of routes per page
 *       - in: query
 *         name: origin
 *         schema:
 *           type: string
 *         description: Filter by origin city
 *         example: Colombo
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: Filter by destination city
 *         example: Gampola
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Routes retrieved successfully
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
 *                     $ref: '#/components/schemas/Route'
 */
router.get('/', getAllRoutes);

/**
 * @swagger
 * /api/routes/search:
 *   get:
 *     tags: [Routes]
 *     summary: Search routes between cities
 *     description: Search for routes between specific origin and destination cities
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *         description: Origin city
 *         example: Colombo
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *         description: Destination city
 *         example: Gampola
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Travel date (optional)
 *         example: 2024-12-15
 *     responses:
 *       200:
 *         description: Routes found successfully
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
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Route'
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No routes found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search', searchRoutes);

/**
 * @swagger
 * /api/routes/route/{routeId}:
 *   get:
 *     tags: [Routes]
 *     summary: Get route by route ID
 *     description: Retrieve specific route details by route ID (e.g., CMB-GMP-019)
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *         example: CMB-GMP-019
 *     responses:
 *       200:
 *         description: Route retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Route'
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/route/:routeId', getRouteByRouteId);

/**
 * @swagger
 * /api/routes/{id}:
 *   get:
 *     tags: [Routes]
 *     summary: Get route by MongoDB ID
 *     description: Retrieve specific route details by MongoDB ObjectId
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId
 *         example: 67093f1e5c8d2a3b4c5d6e8a
 *     responses:
 *       200:
 *         description: Route retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Route'
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getRouteById);

/**
 * @swagger
 * /api/routes:
 *   post:
 *     tags: [Routes]
 *     summary: Create new route
 *     description: Add a new bus route (Admin/Operator only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - routeId
 *               - name
 *               - origin
 *               - destination
 *               - distance
 *               - estimatedDuration
 *               - stops
 *             properties:
 *               routeId:
 *                 type: string
 *                 example: CMB-GMP-019
 *               name:
 *                 type: string
 *                 example: Colombo - Gampola Express Route 019
 *               origin:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                     example: Colombo
 *                   terminal:
 *                     type: string
 *                     example: Colombo Central Bus Stand
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: Point
 *                       coordinates:
 *                         type: array
 *                         items:
 *                           type: number
 *                         example: [79.8612, 6.9271]
 *               destination:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                     example: Gampola
 *                   terminal:
 *                     type: string
 *                     example: Gampola Bus Station
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: Point
 *                       coordinates:
 *                         type: array
 *                         items:
 *                           type: number
 *                         example: [80.5981, 7.1644]
 *               distance:
 *                 type: number
 *                 example: 116
 *                 description: Distance in kilometers
 *               estimatedDuration:
 *                 type: number
 *                 example: 250
 *                 description: Estimated duration in minutes
 *               stops:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Kandy
 *                     sequence:
 *                       type: number
 *                       example: 1
 *                     coordinates:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: Point
 *                         coordinates:
 *                           type: array
 *                           items:
 *                             type: number
 *                           example: [80.6350, 7.2906]
 *                     estimatedArrivalOffset:
 *                       type: number
 *                       example: 120
 *                       description: Offset from start time in minutes
 *     responses:
 *       201:
 *         description: Route created successfully
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
 *                   example: Route created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Route'
 *       400:
 *         description: Validation error or route already exists
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
router.post('/', protect, authorize('admin', 'operator'), createRoute);

/**
 * @swagger
 * /api/routes/route/{routeId}:
 *   put:
 *     tags: [Routes]
 *     summary: Update route by route ID
 *     description: Update existing route details (Admin/Operator only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *         example: CMB-GMP-019
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Colombo - Gampola Express Route 019 (Updated)
 *               distance:
 *                 type: number
 *                 example: 118
 *               estimatedDuration:
 *                 type: number
 *                 example: 255
 *               stops:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     sequence:
 *                       type: number
 *                     coordinates:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                         coordinates:
 *                           type: array
 *                           items:
 *                             type: number
 *                     estimatedArrivalOffset:
 *                       type: number
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Route updated successfully
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
 *                   example: Route updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Route'
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
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/route/:routeId', protect, authorize('admin', 'operator'), updateRoute);

/**
 * @swagger
 * /api/routes/route/{routeId}:
 *   delete:
 *     tags: [Routes]
 *     summary: Delete route by route ID
 *     description: Soft delete a route (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *         example: CMB-GMP-019
 *     responses:
 *       200:
 *         description: Route deleted successfully
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
 *                   example: Route deleted successfully
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
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/route/:routeId', protect, authorize('admin'), deleteRoute);

module.exports = router;