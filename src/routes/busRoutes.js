const express = require('express');
const {
  getAllBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
  getBusesByRoute,
  getBusesByStatus,
  updateBusLocation,
  assignDriver
} = require('../controllers/busController');

// Import middleware
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validateBus, validateBusUpdate, validateLocation, validateDriverAssignment } = require('../middleware/validation');

const router = express.Router();

/**
 * PUBLIC ROUTES
 */

// @route   GET /api/buses
// @desc    Get all buses with filtering, sorting, pagination
// @access  Public
router.get('/', getAllBuses);

// @route   GET /api/buses/route/:routeId
// @desc    Get buses by route ID
// @access  Public
router.get('/route/:routeId', getBusesByRoute);

// @route   GET /api/buses/status/:status
// @desc    Get buses by status
// @access  Public
router.get('/status/:status', getBusesByStatus);

// @route   GET /api/buses/:id
// @desc    Get single bus by ID
// @access  Public
router.get('/:id', getBusById);

/**
 * PROTECTED ROUTES
 */

// @route   POST /api/buses
// @desc    Create new bus
// @access  Protected (Admin/Operator only)
router.post('/', 
  protect, 
  authorize('admin', 'operator'), 
  validateBus,
  createBus
);

// @route   PUT /api/buses/:id
// @desc    Update bus
// @access  Protected (Admin/Operator only)
router.put('/:id', 
  protect, 
  authorize('admin', 'operator'), 
  validateBusUpdate,
  updateBus
);

// @route   DELETE /api/buses/:id
// @desc    Delete bus (soft delete)
// @access  Protected (Admin only)
router.delete('/:id', 
  protect, 
  authorize('admin'), 
  deleteBus
);

// @route   PUT /api/buses/:id/location
// @desc    Update bus location
// @access  Protected (Driver/Admin only)
router.put('/:id/location', 
  protect, 
  authorize('admin', 'driver'), 
  validateLocation,
  updateBusLocation
);

// @route   PUT /api/buses/:id/assign-driver
// @desc    Assign driver to bus
// @access  Protected (Operator/Admin only)
router.put('/:id/assign-driver', 
  protect, 
  authorize('admin', 'operator'), 
  validateDriverAssignment,
  assignDriver
);

module.exports = router;