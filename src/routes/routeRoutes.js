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

// Public routes
router.get('/', getAllRoutes);
router.get('/search', searchRoutes);
router.get('/route/:routeId', getRouteByRouteId);
router.get('/:id', getRouteById);


// Protected routes
router.use(protect); // All routes below require authentication

// Admin and Operator can create and update routes
router.post('/', authorize('admin', 'operator'), createRoute);
router.put('/route/:routeId', authorize('admin', 'operator'), updateRoute);  // ✅ This line

// Only admin can delete routes
router.delete('/route/:routeId', authorize('admin'), deleteRoute);

module.exports = router;