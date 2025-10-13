const Location = require('../models/location');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// ✅ Safe Bus model getter
const getBus = () => {
  return mongoose.models.Bus || require('../models/Bus');
};

/**
 * @desc    Get all location records with filtering
 * @route   GET /api/locations
 * @access  Public
 */
const getAllLocations = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      busId, 
      status, 
      source,
      startDate,
      endDate,
      sort = '-timestamp'
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (busId) filter.busId = busId;
    if (status) filter.status = status;
    if (source) filter.source = source;
    
    // Date range filter
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    // Execute query with pagination
    const locations = await Location.find(filter)
      .populate('busId', 'busNumber registrationNumber routeId')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Location.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: locations.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      data: locations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching locations'
    });
  }
});

/**
 * @desc    Get current location for a specific bus
 * @route   GET /api/locations/bus/:busId/current
 * @access  Public
 * ⭐ ESSENTIAL: Real-time bus tracking
 */
const getCurrentBusLocation = asyncHandler(async (req, res) => {
  try {
    const Bus = getBus();
    const bus = await Bus.findById(req.params.busId).populate('routeId', 'routeId name');
    
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    const currentLocation = await Location.findOne({ busId: req.params.busId })
      .sort({ timestamp: -1 });
    
    if (!currentLocation) {
      return res.status(404).json({
        success: false,
        message: 'No location data found for this bus'
      });
    }
    
    res.status(200).json({
      success: true,
      bus: {
        id: bus._id,
        busNumber: bus.busNumber,
        registrationNumber: bus.registrationNumber,
        route: bus.routeId
      },
      currentLocation: {
        coordinates: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        },
        speed: currentLocation.speed,
        heading: currentLocation.heading,
        address: currentLocation.address,
        status: currentLocation.status,
        timestamp: currentLocation.timestamp,
        source: currentLocation.source
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching current location'
    });
  }
});

/**
 * @desc    Get recent location history for a bus
 * @route   GET /api/locations/bus/:busId/history
 * @access  Public
 * ⭐ ESSENTIAL: Track bus movement patterns
 */
const getBusLocationHistory = asyncHandler(async (req, res) => {
  try {
    const { limit = 50, hours = 24 } = req.query;
    
    const Bus = getBus();
    const bus = await Bus.findById(req.params.busId);
    
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    // Get locations from last X hours
    const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    
    const locations = await Location.find({
      busId: req.params.busId,
      timestamp: { $gte: startTime }
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .select('location speed heading address status timestamp source');
    
    res.status(200).json({
      success: true,
      count: locations.length,
      bus: {
        id: bus._id,
        busNumber: bus.busNumber,
        registrationNumber: bus.registrationNumber
      },
      timeRange: {
        from: startTime,
        to: new Date(),
        hours: parseInt(hours)
      },
      data: locations.map(loc => ({
        coordinates: {
          latitude: loc.latitude,
          longitude: loc.longitude
        },
        speed: loc.speed,
        heading: loc.heading,
        address: loc.address,
        status: loc.status,
        timestamp: loc.timestamp,
        source: loc.source
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching location history'
    });
  }
});

/**
 * @desc    Get live locations of all active buses
 * @route   GET /api/locations/live
 * @access  Public
 * ⭐ ESSENTIAL: Real-time dashboard for all buses
 */
const getLiveBusLocations = asyncHandler(async (req, res) => {
  try {
    const { routeId, status } = req.query;
    
    // Get recent locations (last 15 minutes) for all buses
    const recentTime = new Date(Date.now() - 15 * 60 * 1000);
    
    // Aggregate to get latest location per bus
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: recentTime }
        }
      },
      {
        $sort: { busId: 1, timestamp: -1 }
      },
      {
        $group: {
          _id: '$busId',
          latestLocation: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'buses',
          localField: '_id',
          foreignField: '_id',
          as: 'bus'
        }
      },
      {
        $unwind: '$bus'
      },
      {
        $lookup: {
          from: 'routes',
          localField: 'bus.routeId',
          foreignField: '_id',
          as: 'route'
        }
      },
      {
        $unwind: { path: '$route', preserveNullAndEmptyArrays: true }
      }
    ];
    
    // Add filters if provided
    if (routeId) {
      pipeline.push({
        $match: { 'bus.routeId': new mongoose.Types.ObjectId(routeId) }
      });
    }
    
    if (status) {
      pipeline.push({
        $match: { 'latestLocation.status': status }
      });
    }
    
    pipeline.push({
      $project: {
        busId: '$bus._id',
        busNumber: '$bus.busNumber',
        registrationNumber: '$bus.registrationNumber',
        route: {
          id: '$route._id',
          routeId: '$route.routeId',
          name: '$route.name'
        },
        location: {
          coordinates: {
            latitude: { $arrayElemAt: ['$latestLocation.location.coordinates', 1] },
            longitude: { $arrayElemAt: ['$latestLocation.location.coordinates', 0] }
          },
          speed: '$latestLocation.speed',
          heading: '$latestLocation.heading',
          address: '$latestLocation.address',
          status: '$latestLocation.status',
          timestamp: '$latestLocation.timestamp'
        }
      }
    });
    
    const liveBuses = await Location.aggregate(pipeline);
    
    res.status(200).json({
      success: true,
      count: liveBuses.length,
      timestamp: new Date(),
      data: liveBuses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching live bus locations'
    });
  }
});

/**
 * @desc    Create/Update bus location (GPS tracking)
 * @route   POST /api/locations
 * @access  Private (Driver, Admin, Operator)
 * ⭐ ESSENTIAL: Record GPS updates from buses
 */
const recordBusLocation = asyncHandler(async (req, res) => {
  try {
    const {
      busId,
      latitude,
      longitude,
      speed = 0,
      heading = 0,
      address,
      status = 'moving'
    } = req.body;
    
    // Validate required fields
    if (!busId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Bus ID, latitude, and longitude are required'
      });
    }
    
    // Validate coordinates
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }
    
    // Verify bus exists
    const Bus = getBus();
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bus ID'
      });
    }
    
    // Create location record
    const location = new Location({
      busId,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      speed: parseFloat(speed),
      heading: parseFloat(heading),
      address,
      status,
      source: 'gps',
      timestamp: new Date()
    });
    
    const savedLocation = await location.save();
    
    res.status(201).json({
      success: true,
      message: 'Location recorded successfully',
      data: {
        locationId: savedLocation._id,
        busNumber: bus.busNumber,
        coordinates: {
          latitude: savedLocation.latitude,
          longitude: savedLocation.longitude
        },
        speed: savedLocation.speed,
        heading: savedLocation.heading,
        status: savedLocation.status,
        timestamp: savedLocation.timestamp
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error recording location'
    });
  }
});

/**
 * @desc    Get bus route progress
 * @route   GET /api/locations/bus/:busId/route-progress
 * @access  Public
 * ⭐ USEFUL: Track bus progress along route
 */
const getBusRouteProgress = asyncHandler(async (req, res) => {
  try {
    const Bus = getBus();
    const bus = await Bus.findById(req.params.busId)
      .populate('routeId', 'routeId name stops distance estimatedDuration');
    
    if (!bus || !bus.routeId) {
      return res.status(404).json({
        success: false,
        message: 'Bus or route not found'
      });
    }
    
    // Get current location
    const currentLocation = await Location.findOne({ busId: req.params.busId })
      .sort({ timestamp: -1 });
    
    if (!currentLocation) {
      return res.status(404).json({
        success: false,
        message: 'No location data found'
      });
    }
    
    // Get locations from last 2 hours to calculate progress
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentLocations = await Location.find({
      busId: req.params.busId,
      timestamp: { $gte: twoHoursAgo }
    }).sort({ timestamp: 1 });
    
    // Calculate distance traveled
    let distanceTraveled = 0;
    for (let i = 1; i < recentLocations.length; i++) {
      const prev = recentLocations[i - 1];
      const curr = recentLocations[i];
      
      // Simple distance calculation (you can use more accurate formulas)
      const lat1 = prev.latitude;
      const lon1 = prev.longitude;
      const lat2 = curr.latitude;
      const lon2 = curr.longitude;
      
      const distance = Math.sqrt(
        Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)
      ) * 111; // Rough conversion to km
      
      distanceTraveled += distance;
    }
    
    res.status(200).json({
      success: true,
      bus: {
        id: bus._id,
        busNumber: bus.busNumber,
        route: bus.routeId
      },
      progress: {
        currentLocation: {
          coordinates: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          },
          address: currentLocation.address,
          timestamp: currentLocation.timestamp
        },
        distanceTraveled: Math.round(distanceTraveled * 100) / 100, // Round to 2 decimals
        averageSpeed: recentLocations.length > 1 ? 
          Math.round((distanceTraveled / 2) * 100) / 100 : 0, // km/h over 2 hours
        totalStops: bus.routeId.stops?.length || 0,
        routeDistance: bus.routeId.distance || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching route progress'
    });
  }
});

module.exports = {
  getAllLocations,
  getCurrentBusLocation,
  getBusLocationHistory,
  getLiveBusLocations,
  recordBusLocation,
  getBusRouteProgress
};