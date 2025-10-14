// src/routes/locationRoutes.js
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

// Middleware (if you have auth)
// const { protect, authorize } = require('../middleware/auth');

// ========================================
// PUBLIC ROUTES
// ========================================

// Get current location for a specific bus
router.get('/bus/:busRegistrationNumber/current', getCurrentBusLocation);

// Get location history for a specific trip
router.get('/trip/:tripId/history', getTripLocationHistory);

// // Get all locations (with pagination)
// router.get('/', getAllLocations);

// // Get specific location by ID
// router.get('/:id', getLocationById);

// ========================================
// PROTECTED ROUTES (uncomment if using auth)
// ========================================

// Record new GPS location
router.post('/', recordLocation);

// // Update location
// router.put('/:id', updateLocation);

// // Delete location
// router.delete('/:id', deleteLocation);

module.exports = router;