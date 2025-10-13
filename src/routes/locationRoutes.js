const express = require('express');
const router = express.Router();
const {
  getAllLocations,
  getCurrentBusLocation,
  getBusLocationHistory,
  getLiveBusLocations,
  recordBusLocation,
  getBusRouteProgress
} = require('../controllers/locationController');

const { protect, authorize } = require('../middleware/auth');

// ========================================
// PUBLIC ROUTES (Real-time tracking)
// ========================================

// Get all location records (admin filtering)
router.get('/', getAllLocations);

// ⭐ ESSENTIAL: Real-time bus locations for dashboard
router.get('/live', getLiveBusLocations);

// ⭐ ESSENTIAL: Current location of specific bus
router.get('/bus/:busId/current', getCurrentBusLocation);

// ⭐ IMPORTANT: Location history for specific bus
router.get('/bus/:busId/history', getBusLocationHistory);

// ✅ USEFUL: Route progress tracking
router.get('/bus/:busId/route-progress', getBusRouteProgress);

// ========================================
// PROTECTED ROUTES
// ========================================

router.use(protect);

// ⭐ ESSENTIAL: Record GPS location updates
router.post('/', authorize('admin', 'operator', 'driver'), recordBusLocation);

module.exports = router;