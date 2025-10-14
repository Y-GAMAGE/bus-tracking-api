const express = require('express');
const router = express.Router();
const {
  getAllTrips,
  getTripById,
  createTrip,
  startTrip,
  simulateGPS,
  completeTrip,
  getScheduledTrips  // ✅ Add this import
} = require('../controllers/tripController');

const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/trips/scheduled (MOVE THIS BEFORE /:tripId)
router.get('/scheduled', getScheduledTrips);

// @route   GET /api/trips
router.get('/', getAllTrips);

// @route   GET /api/trips/:tripId
router.get('/:tripId', getTripById);

// @route   POST /api/trips
router.post('/', protect, authorize('admin', 'operator'), createTrip);

// @route   POST /api/trips/:tripId/start
router.post('/:tripId/start', protect, authorize('admin', 'operator', 'driver'), startTrip);

// @route   POST /api/trips/:tripId/simulate-gps
router.post('/:tripId/simulate-gps', protect, authorize('admin', 'operator'), simulateGPS);

// @route   POST /api/trips/:tripId/complete
router.post('/:tripId/complete', protect, authorize('admin', 'operator', 'driver'), completeTrip);

module.exports = router;