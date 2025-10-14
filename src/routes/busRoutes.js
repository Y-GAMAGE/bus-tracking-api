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

// @route   GET /api/buses
// @desc    Get all buses with pagination and filtering
// @access  Public
router.get('/', getAllBuses);

// @route   GET /api/buses/:registrationNumber
// @desc    Get single bus by registration number (e.g., WP-1234)
// @access  Public
router.get('/:registrationNumber', getBusByRegistrationNumber);

// @route   POST /api/buses
// @desc    Create new bus
// @access  Protected (Admin/Operator only)
router.post('/', protect, authorize('admin', 'operator'), createBus);

// @route   PUT /api/buses/:registrationNumber
// @desc    Update bus by registration number
// @access  Protected (Admin/Operator only)
router.put('/:registrationNumber', protect, authorize('admin', 'operator'), updateBusByRegistrationNumber);

// @route   DELETE /api/buses/:registrationNumber
// @desc    Delete bus by registration number (soft delete)
// @access  Protected (Admin only)
router.delete('/:registrationNumber', protect, authorize('admin'), deleteBusByRegistrationNumber);

module.exports = router;