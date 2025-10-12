const Bus = require('../models/Bus');
const Route = require('../models/route');
const asyncHandler = require('express-async-handler');
const User = require('../models/user');

/**
 * @desc    Get all buses with pagination, filtering, and sorting
 * @route   GET /api/buses
 * @access  Public
 */
const getAllBuses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      routeId,
      search,
      sort = 'busNumber',
      order = 'asc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    // Role-based filtering
    if (req.user) {
      if (req.user.role === 'operator') {
        // Operators can only see their own buses
        filter.operatorId = req.user.id;
      }
      if (req.user.role === 'driver') {
        // Drivers can only see assigned buses
        filter['driver.userId'] = req.user.id;
      }
    }
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (routeId) filter.routeId = routeId;

    if (search) {
      filter.$or = [
        { busNumber: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const buses = await Bus.find(filter)
      .populate('routeId', 'routeName from to duration')
      .populate('currentTrip', 'tripNumber departureTime arrivalTime')
      .populate('operatorId', 'username operatorDetails.companyName')
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Bus.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      count: buses.length,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      data: buses
    });
  } catch (error) {
    console.error('Get buses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buses'
    });
  }
};



/**
 * @desc    Get single bus by ID
 * @route   GET /api/buses/:id
 * @access  Public
 */
const getBusById = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id)
    .populate('routeId', 'routeName from to distance duration stops')
    .populate('currentTrip', 'tripNumber departureTime arrivalTime status')
    .populate('driver.userId', 'firstName lastName email phoneNumber')
    .select('-__v');

  if (!bus || !bus.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Bus not found'
    });
  }

  res.status(200).json({
    success: true,
    data: bus
  });
});

/**
 * @desc    Create new bus
 * @route   POST /api/buses
 * @access  Protected (Admin/Operator)
 */
const createBus = async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'operator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create buses'
      });
    }

    const {
      busNumber,
      registrationNumber,
      routeId,
      capacity,
      type,
      amenities,
      specifications,
      maintenance
    } = req.body;

    // Check if route exists
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route ID'
      });
    }

    // Check for duplicate bus number or registration
    const existingBus = await Bus.findOne({
      $or: [
        { busNumber: busNumber.toUpperCase() },
        { registrationNumber: registrationNumber.toUpperCase() }
      ]
    });

    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: 'Bus number or registration number already exists'
      });
    }

    // Set operator ID
    let operatorId = req.user.id; // For operators, use their own ID
    if (req.user.role === 'admin' && req.body.operatorId) {
      operatorId = req.body.operatorId; // Admin can assign to any operator
    }

    // Create bus
    const bus = await Bus.create({
      busNumber: busNumber.toUpperCase(),
      registrationNumber: registrationNumber.toUpperCase(),
      routeId,
      capacity,
      type,
      operatorId, // Add operator reference
      amenities,
      specifications,
      maintenance
    });

    const populatedBus = await Bus.findById(bus._id)
      .populate('routeId', 'routeName from to')
      .populate('operatorId', 'username operatorDetails.companyName')
      .select('-__v');

    res.status(201).json({
      success: true,
      message: 'Bus created successfully',
      data: populatedBus
    });
  } catch (error) {
    console.error('Create bus error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating bus'
    });
  }
};

/**
 * @desc    Update bus
 * @route   PUT /api/buses/:id
 * @access  Protected (Admin/Operator)
 */
const updateBus = asyncHandler(async (req, res) => {
  let bus = await Bus.findById(req.params.id);

  if (!bus || !bus.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Bus not found'
    });
  }

  // Check if routeId is being updated and if it exists
  if (req.body.routeId && req.body.routeId !== bus.routeId.toString()) {
    const route = await Route.findById(req.body.routeId);
    if (!route) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route ID'
      });
    }
  }

  // Check for duplicate bus number or registration (excluding current bus)
  if (req.body.busNumber || req.body.registrationNumber) {
    const query = { _id: { $ne: req.params.id } };
    
    if (req.body.busNumber) {
      query.busNumber = req.body.busNumber.toUpperCase();
    }
    if (req.body.registrationNumber) {
      query.registrationNumber = req.body.registrationNumber.toUpperCase();
    }

    const existingBus = await Bus.findOne(query);
    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: 'Bus number or registration number already exists'
      });
    }
  }

  // Update bus
  bus = await Bus.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('routeId', 'routeName from to');

  res.status(200).json({
    success: true,
    message: 'Bus updated successfully',
    data: bus
  });
});

/**
 * @desc    Delete bus (soft delete)
 * @route   DELETE /api/buses/:id
 * @access  Protected (Admin only)
 */
const deleteBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);

  if (!bus || !bus.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Bus not found'
    });
  }

  // Soft delete - set isActive to false
  await Bus.findByIdAndUpdate(req.params.id, { isActive: false });

  res.status(200).json({
    success: true,
    message: 'Bus deleted successfully'
  });
});

/**
 * @desc    Get buses by route
 * @route   GET /api/buses/route/:routeId
 * @access  Public
 */
const getBusesByRoute = asyncHandler(async (req, res) => {
  const { routeId } = req.params;
  const { status } = req.query;

  // Check if route exists
  const route = await Route.findById(routeId);
  if (!route) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }

  // Build filter
  const filter = { routeId, isActive: true };
  if (status) filter.status = status;

  const buses = await Bus.find(filter)
    .populate('routeId', 'routeName from to')
    .populate('currentTrip', 'tripNumber departureTime arrivalTime')
    .select('-__v')
    .sort('busNumber');

  res.status(200).json({
    success: true,
    count: buses.length,
    route: {
      id: route._id,
      name: route.routeName,
      from: route.from,
      to: route.to
    },
    data: buses
  });
});

/**
 * @desc    Get buses by status
 * @route   GET /api/buses/status/:status
 * @access  Public
 */
const getBusesByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  
  // Validate status
  const validStatuses = ['active', 'inactive', 'maintenance', 'en-route', 'at-stop', 'breakdown'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
    });
  }

  const buses = await Bus.find({ status, isActive: true })
    .populate('routeId', 'routeName from to')
    .populate('currentTrip', 'tripNumber departureTime arrivalTime')
    .select('-__v')
    .sort('busNumber');

  res.status(200).json({
    success: true,
    count: buses.length,
    status,
    data: buses
  });
});

/**
 * @desc    Update bus location
 * @route   PUT /api/buses/:id/location
 * @access  Protected (Driver/Admin)
 */
const updateBusLocation = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;
    
    // Validate coordinates
    if (!longitude || !latitude || 
        longitude < -180 || longitude > 180 || 
        latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    const bus = await Bus.findById(req.params.id);

    if (!bus || !bus.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    // Permission check
    if (req.user.role === 'driver') {
      // Driver can only update their assigned bus
      if (bus.driver.userId?.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this bus location'
        });
      }
       } else if (req.user.role === 'operator') {
      // Operator can only update their own buses
      if (bus.operatorId?.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this bus location'
        });
      }
    }
    // Admin can update any bus location

    // Update location
    bus.currentLocation = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };
    bus.lastLocationUpdate = new Date();

    await bus.save();

    res.status(200).json({
      success: true,
      message: 'Bus location updated successfully',
      data: {
        busNumber: bus.busNumber,
        location: bus.currentLocation,
        updatedAt: bus.lastLocationUpdate
      }
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bus location'
    });
     }
};

/**
 * @desc    Assign driver to bus
 * @route   PUT /api/buses/:id/assign-driver
 * @access  Protected (Operator/Admin)
 */
const assignDriver = async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'operator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to assign drivers'
      });
    }

    const { userId } = req.body;

    const bus = await Bus.findById(req.params.id);

    if (!bus || !bus.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    // Check if operator can assign to this bus
    if (req.user.role === 'operator' && bus.operatorId?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to assign driver to this bus'
      });
    }

    // Verify driver exists and has driver role
    const driver = await User.findById(userId);
    
    if (!driver || driver.role !== 'driver') {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver user ID'
      });
    }

    // Update driver assignment
    bus.driver = {
      userId: driver._id,
      name: `${driver.profile?.firstName || ''} ${driver.profile?.lastName || ''}`.trim() || driver.username,
      contactNumber: driver.phone || '',
      licenseNumber: driver.driverDetails?.licenseNumber || ''
    };

    await bus.save();

    const updatedBus = await Bus.findById(bus._id)
      .populate('driver.userId', 'username profile phone')
      .select('busNumber registrationNumber driver');

    res.status(200).json({
      success: true,
      message: 'Driver assigned successfully',
      data: updatedBus
    });

    } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning driver'
    });
  }
};

module.exports = {
  getAllBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
  getBusesByRoute,
  getBusesByStatus,
  updateBusLocation,
  assignDriver
};