const Route = require('../models/route');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

const getBus = () => {
  return mongoose.models.Bus || require('../models/Bus');
};

const getAllRoutes = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

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

    const sortField = req.query.sort || 'routeId';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortOrder };

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

const getRouteById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that ID parameter exists
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Route ID parameter is required'
      });
    }

    // Safe string conversion and trimming
    const identifier = String(id).trim();
    
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Route ID cannot be empty'
      });
    }

    let route;

    // Check if it's a valid MongoDB ObjectId (24 hex characters)
    if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
      route = await Route.findById(identifier);
    } else {
      // Search by routeId string
      route = await Route.findOne({ routeId: identifier.toUpperCase() });
    }

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route not found: ${identifier}`
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

const getRouteByRouteId = asyncHandler(async (req, res) => {
  try {
    const { routeId } = req.params;
    
    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: 'Route ID is required'
      });
    }

    const cleanRouteId = String(routeId).trim();
    
    if (!cleanRouteId) {
      return res.status(400).json({
        success: false,
        message: 'Route ID cannot be empty'
      });
    }

    const route = await Route.findOne({ routeId: cleanRouteId.toUpperCase() });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route not found: ${cleanRouteId}`
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

    // Validation
    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: 'Route ID is required'
      });
    }

    const cleanRouteId = String(routeId).trim().toUpperCase();
    
    if (!cleanRouteId) {
      return res.status(400).json({
        success: false,
        message: 'Route ID cannot be empty'
      });
    }

    const existingRoute = await Route.findOne({ routeId: cleanRouteId });
    if (existingRoute) {
      return res.status(400).json({
        success: false,
        message: `Route ID already exists: ${cleanRouteId}`
      });
    }

    const routeData = {
      routeId: cleanRouteId,
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

const updateRoute = asyncHandler(async (req, res) => {
  try {
    const { routeId } = req.params;
    
    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: 'Route ID is required'
      });
    }

    const cleanRouteId = String(routeId).trim().toUpperCase();
    
    if (!cleanRouteId) {
      return res.status(400).json({
        success: false,
        message: 'Route ID cannot be empty'
      });
    }
    
    const route = await Route.findOne({ routeId: cleanRouteId });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route with ID ${cleanRouteId} not found`
      });
    }

    if (req.body.routeId) {
      const newRouteId = String(req.body.routeId).trim().toUpperCase();
      
      if (newRouteId !== route.routeId) {
        const existingRoute = await Route.findOne({ 
          routeId: newRouteId,
          _id: { $ne: route._id }
        });
        
        if (existingRoute) {
          return res.status(400).json({
            success: false,
            message: `Route ID ${newRouteId} already exists`
          });
        }
      }
      
      req.body.routeId = newRouteId;
    }

    const updatedRoute = await Route.findOneAndUpdate(
      { routeId: cleanRouteId },
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

const deleteRoute = asyncHandler(async (req, res) => {
  try {
    const { routeId } = req.params;
    
    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: 'Route ID is required'
      });
    }

    const cleanRouteId = String(routeId).trim().toUpperCase();
    
    if (!cleanRouteId) {
      return res.status(400).json({
        success: false,
        message: 'Route ID cannot be empty'
      });
    }

    const route = await Route.findOne({ routeId: cleanRouteId });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route not found: ${cleanRouteId}`
      });
    }

    const Bus = getBus();
    const busesUsingRoute = await Bus.countDocuments({ routeId: route._id });
    
    if (busesUsingRoute > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete route. ${busesUsingRoute} bus(es) are currently using this route`
      });
    }

    await Route.findOneAndDelete({ routeId: cleanRouteId });

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