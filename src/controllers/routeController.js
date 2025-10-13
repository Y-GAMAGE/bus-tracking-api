const Route = require('../models/route');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get all routes with pagination, filtering, and sorting
 * @route   GET /api/routes
 * @access  Public
 */
const getAllRoutes = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.origin) {
      filter['origin.city'] = { $regex: req.query.origin, $options: 'i' };
    }
    
    if (req.query.destination) {
      filter['destination.city'] = { $regex: req.query.destination, $options: 'i' };
    }

    if (req.query.search) {
      filter.$or = [
        { routeId: { $regex: req.query.search, $options: 'i' } },
        { name: { $regex: req.query.search, $options: 'i' } },
        { 'origin.city': { $regex: req.query.search, $options: 'i' } },
        { 'destination.city': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortField = req.query.sort || 'routeId';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortOrder };

    // Execute queries
    const routes = await Route.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Route.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: routes.length,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      data: routes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching routes'
    });
  }
});

/**
 * @desc    Get single route by ID
 * @route   GET /api/routes/:id
 * @access  Public
 */
const getRouteById = asyncHandler(async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    res.status(200).json({
      success: true,
      data: route
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching route'
    });
  }
});

/**
 * @desc    Get route by route ID (string)
 * @route   GET /api/routes/route/:routeId
 * @access  Public
 */
const getRouteByRouteId = asyncHandler(async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.routeId.toUpperCase() });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    res.status(200).json({
      success: true,
      data: route
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching route'
    });
  }
});

/**
 * @desc    Create new route
 * @route   POST /api/routes
 * @access  Private (Admin, Operator)
 */
const createRoute = asyncHandler(async (req, res) => {
  try {
    const {
      routeId,
      name,
      origin,
      destination,
      distance,
      estimatedDuration,
      stops,
      fare,
      frequency,
      category,
      operatingHours
    } = req.body;

    // Check if route ID already exists
    const existingRoute = await Route.findOne({ routeId: routeId.toUpperCase() });
    if (existingRoute) {
      return res.status(400).json({
        success: false,
        message: 'Route ID already exists'
      });
    }

    const routeData = {
      routeId: routeId.toUpperCase(),
      name,
      origin,
      destination,
      distance,
      estimatedDuration,
      stops: stops || [],
      fare,
      frequency,
      category,
      operatingHours
    };

    const route = await Route.create(routeData);

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: route
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Route ID already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating route'
    });
  }
});


/**
 * @desc    Update route
 * @route   PUT /api/routes/route/:routeId
 * @access  Private (Admin, Operator)
 */
const updateRoute = asyncHandler(async (req, res) => {
  try {
    // ✅ Add .trim() to remove whitespace and newlines
    const routeId = req.params.routeId.trim().toUpperCase();
    
    // Find the route by routeId
    const route = await Route.findOne({ routeId: routeId });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route with ID ${routeId} not found`
      });
    }

    // If updating routeId, check for conflicts
    if (req.body.routeId) {
      req.body.routeId = req.body.routeId.trim().toUpperCase(); // ✅ Add .trim() here too
      
      if (req.body.routeId !== route.routeId) {
        const existingRoute = await Route.findOne({ 
          routeId: req.body.routeId,
          _id: { $ne: route._id }
        });
        
        if (existingRoute) {
          return res.status(400).json({
            success: false,
            message: `Route ID ${req.body.routeId} already exists`
          });
        }
      }
    }

    // Update the route
    const updatedRoute = await Route.findOneAndUpdate(
      { routeId: routeId },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Route updated successfully',
      data: updatedRoute
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Route ID already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Delete route
 * @route   DELETE /api/routes/:id
 * @access  Private (Admin only)
 */
const deleteRoute = asyncHandler(async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.routeId.toUpperCase() });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Check if route is being used by buses
    const Bus = require('../models/Bus');
    const busesUsingRoute = await Bus.countDocuments({ routeId: req.params.id });
    
    if (busesUsingRoute > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete route. ${busesUsingRoute} bus(es) are currently using this route`
      });
    }

    await Route.findOneAndDelete({ routeId: req.params.routeId.toUpperCase() });

    res.status(200).json({
      success: true,
      message: 'Route deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting route'
    });
  }
});

/**
 * @desc    Get routes by origin and destination
 * @route   GET /api/routes/search
 * @access  Public
 */
const searchRoutes = asyncHandler(async (req, res) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required'
      });
    }

    const routes = await Route.find({
      'origin.city': { $regex: origin, $options: 'i' },
      'destination.city': { $regex: destination, $options: 'i' },
      status: 'operational'
    }).sort({ estimatedDuration: 1 });

    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error searching routes'
    });
  }
});

module.exports = {
  getAllRoutes,
  getRouteById,
  getRouteByRouteId,
  createRoute,
  updateRoute,
  deleteRoute,
  searchRoutes
};