const Trip = require('../models/trip');
const Route = require('../models/route');
const Location = require('../models/location');
const Bus = require('../models/Bus');

/**
 * ✅ Extract time from stored datetime WITHOUT timezone conversion
 */
function formatTimeToLocal(utcTimeString) {
  const date = new Date(utcTimeString);
  // ✅ Extract UTC hours and minutes directly (no timezone conversion)
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * ✅ Convert datetime to separate date and time fields WITHOUT timezone conversion
 */
function formatDateTimeToLocal(utcTimeString) {
  const date = new Date(utcTimeString);
  
  // ✅ Extract date and time directly from UTC (no conversion)
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  
  return {
    date: `${year}-${month}-${day}`, // YYYY-MM-DD format
    time: `${hours}:${minutes}`       // HH:MM format
  };
}

const getAllTrips = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      registrationNumber,
      routeId,
      date
    } = req.query;

    const filter = { isActive: true };
    
    if (status) filter.status = status;
    if (registrationNumber) filter.registrationNumber = registrationNumber.toUpperCase();
    if (routeId) filter.routeId = routeId.toUpperCase();
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.scheduledDate = { $gte: startDate, $lt: endDate };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const trips = await Trip.find(filter)
      .sort({ scheduledStartTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // ✅ Manually add route details and format dates/times
    const tripsWithRoutes = await Promise.all(
      trips.map(async (trip) => {
        const routeDetails = await Route.findOne({ routeId: trip.routeId });
        
        // ✅ Format all date/time fields
        const scheduledDateInfo = formatDateTimeToLocal(trip.scheduledDate);
        const scheduledStartInfo = formatDateTimeToLocal(trip.scheduledStartTime);
        const scheduledEndInfo = formatDateTimeToLocal(trip.scheduledEndTime);
        
        return {
          ...trip.toObject(),
          // ✅ Replace timestamp fields with separate date and time
          scheduledDate: scheduledDateInfo.date,
          scheduledStartTime: scheduledStartInfo.time,
          scheduledEndTime: scheduledEndInfo.time,
          scheduledStartDate: scheduledStartInfo.date,
          scheduledEndDate: scheduledEndInfo.date,
          // ✅ Format actual times if they exist
          actualStartTime: trip.actualStartTime ? formatTimeToLocal(trip.actualStartTime) : null,
          actualEndTime: trip.actualEndTime ? formatTimeToLocal(trip.actualEndTime) : null,
          actualStartDate: trip.actualStartTime ? formatDateTimeToLocal(trip.actualStartTime).date : null,
          actualEndDate: trip.actualEndTime ? formatDateTimeToLocal(trip.actualEndTime).date : null,
          routeDetails
        };
      })
    );

    const total = await Trip.countDocuments(filter);

    res.json({
      success: true,
      count: tripsWithRoutes.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: tripsWithRoutes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getTripById = async (req, res) => {
  try {
    const { tripId } = req.params;
    
    let trip;
    if (/^[0-9a-fA-F]{24}$/.test(tripId)) {
      trip = await Trip.findById(tripId);
    } else {
      trip = await Trip.findOne({ tripId: tripId.toUpperCase() });
    }

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: `Trip not found: ${tripId}`
      });
    }

    // ✅ Manually get route details and format dates/times
    const routeDetails = await Route.findOne({ routeId: trip.routeId });
    
    // ✅ Format all date/time fields
    const scheduledDateInfo = formatDateTimeToLocal(trip.scheduledDate);
    const scheduledStartInfo = formatDateTimeToLocal(trip.scheduledStartTime);
    const scheduledEndInfo = formatDateTimeToLocal(trip.scheduledEndTime);

    res.json({
      success: true,
      data: {
        ...trip.toObject(),
        // ✅ Replace timestamp fields with separate date and time
        scheduledDate: scheduledDateInfo.date,
        scheduledStartTime: scheduledStartInfo.time,
        scheduledEndTime: scheduledEndInfo.time,
        scheduledStartDate: scheduledStartInfo.date,
        scheduledEndDate: scheduledEndInfo.date,
        // ✅ Format actual times if they exist
        actualStartTime: trip.actualStartTime ? formatTimeToLocal(trip.actualStartTime) : null,
        actualEndTime: trip.actualEndTime ? formatTimeToLocal(trip.actualEndTime) : null,
        actualStartDate: trip.actualStartTime ? formatDateTimeToLocal(trip.actualStartTime).date : null,
        actualEndDate: trip.actualEndTime ? formatDateTimeToLocal(trip.actualEndTime).date : null,
        routeDetails
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const createTrip = async (req, res) => {
  try {
    const {
      tripId,
      registrationNumber,
      routeId,
      scheduledDate,
      scheduledStartTime,
      scheduledEndTime
    } = req.body;

    if (!tripId || !registrationNumber || !routeId || !scheduledDate || !scheduledStartTime || !scheduledEndTime) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: tripId, registrationNumber, routeId, scheduledDate, scheduledStartTime, scheduledEndTime'
      });
    }

    // Validate bus exists
    const bus = await Bus.findOne({ 
      registrationNumber: registrationNumber.toUpperCase(),
      isActive: true 
    });
    
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: `Bus not found: ${registrationNumber}`
      });
    }

    const route = await Route.findOne({ 
      routeId: routeId.toUpperCase(),
      isActive: true 
    });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route not found: ${routeId}`
      });
    }

    const scheduledStart = new Date(scheduledStartTime);
    
    if (isNaN(scheduledStart.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scheduledStartTime format. Use ISO format like 2024-10-14T10:00:00.000Z'
      });
    }

    // Create stop arrivals based on route stops
    const stopArrivals = route.stops.sort((a, b) => a.sequence - b.sequence).map(stop => {
      const estimatedArrival = new Date(scheduledStart.getTime() + (stop.estimatedArrivalOffset * 60 * 1000));
      
      return {
        stopName: stop.name,
        estimatedArrival,
        hasPassed: false,
        delayMinutes: 0
      };
    });

    const trip = await Trip.create({
      tripId: tripId.toUpperCase(),
      registrationNumber: registrationNumber.toUpperCase(),
      routeId: routeId.toUpperCase(),
      scheduledDate: new Date(scheduledDate),
      scheduledStartTime: scheduledStart,
      scheduledEndTime: new Date(scheduledEndTime),
      stopArrivals
    });

    const routeDetails = await Route.findOne({ routeId: trip.routeId });
    
    // ✅ Format all date/time fields for response
    const scheduledDateInfo = formatDateTimeToLocal(trip.scheduledDate);
    const scheduledStartInfo = formatDateTimeToLocal(trip.scheduledStartTime);
    const scheduledEndInfo = formatDateTimeToLocal(trip.scheduledEndTime);

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      data: {
        ...trip.toObject(),
        // ✅ Replace timestamp fields with separate date and time
        scheduledDate: scheduledDateInfo.date,
        scheduledStartTime: scheduledStartInfo.time,
        scheduledEndTime: scheduledEndInfo.time,
        scheduledStartDate: scheduledStartInfo.date,
        scheduledEndDate: scheduledEndInfo.date,
        routeDetails
      }
    });
  } catch (error) {
    console.error('Trip creation error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const startTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    
    const trip = await Trip.findOne({ tripId: tripId.toUpperCase() });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: `Trip not found: ${tripId}`
      });
    }

    if (trip.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: `Trip cannot be started. Current status: ${trip.status}`
      });
    }

    const startTime = new Date();
    await Trip.findByIdAndUpdate(trip._id, {
      status: 'in-progress',
      actualStartTime: startTime,
      currentStop: trip.stopArrivals[0]?.stopName
    });

    // ✅ Format response with separate date and time
    const startDateTime = formatDateTimeToLocal(startTime);

    res.json({
      success: true,
      message: 'Trip started successfully',
      startedAt: {
        date: startDateTime.date,
        time: startDateTime.time
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



const simulateGPS = async (req, res) => {
  try {
    const { tripId } = req.params;
    
    const trip = await Trip.findOne({ tripId: tripId.toUpperCase() });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: `Trip not found: ${tripId}`
      });
    }

    if (trip.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Trip is already completed'
      });
    }

    const route = await Route.findOne({ routeId: trip.routeId });
    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route not found: ${trip.routeId}`
      });
    }

    // ✅ Import and use the updated GPS simulator
    const { GPSSimulator } = require('./gpsSimulator');
    const simulator = new GPSSimulator(tripId);
    await simulator.startSimulation();

    // ✅ Format response with scheduled times
    const scheduledStartInfo = formatDateTimeToLocal(trip.scheduledStartTime);
    const scheduledEndInfo = formatDateTimeToLocal(trip.scheduledEndTime);

    res.json({
      success: true,
      message: 'GPS simulation started using scheduled trip times',
      data: {
        tripId: trip.tripId,
        duration: '6 minutes (compressed)',
        updateInterval: '10 seconds',
        scheduledTiming: {
          startDate: scheduledStartInfo.date,
          startTime: scheduledStartInfo.time,
          endDate: scheduledEndInfo.date,
          endTime: scheduledEndInfo.time
        },
        note: 'GPS timestamps use scheduled trip timing, not current real time'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



const completeTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    
    const endTime = new Date();
    const trip = await Trip.findOneAndUpdate(
      { tripId: tripId.toUpperCase() },
      {
        status: 'completed',
        actualEndTime: endTime
      },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: `Trip not found: ${tripId}`
      });
    }

    // ✅ Format response with separate date and time
    const endDateTime = formatDateTimeToLocal(endTime);
    const scheduledDateInfo = formatDateTimeToLocal(trip.scheduledDate);
    const scheduledStartInfo = formatDateTimeToLocal(trip.scheduledStartTime);
    const scheduledEndInfo = formatDateTimeToLocal(trip.scheduledEndTime);

    res.json({
      success: true,
      message: 'Trip completed successfully',
      data: {
        ...trip.toObject(),
        // ✅ Format all date/time fields
        scheduledDate: scheduledDateInfo.date,
        scheduledStartTime: scheduledStartInfo.time,
        scheduledEndTime: scheduledEndInfo.time,
        actualStartTime: trip.actualStartTime ? formatTimeToLocal(trip.actualStartTime) : null,
        actualEndTime: formatTimeToLocal(trip.actualEndTime),
        completedAt: {
          date: endDateTime.date,
          time: endDateTime.time
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GPS simulation function (unchanged)
const simulateGPSRoute = async (trip, route) => {
  const SIMULATION_DURATION = 6 * 60 * 1000; // 6 minutes
  const UPDATE_INTERVAL = 10 * 1000; // 10 seconds
  const totalUpdates = SIMULATION_DURATION / UPDATE_INTERVAL;
  
  const stops = route.stops.sort((a, b) => a.sequence - b.sequence);
  let currentUpdateIndex = 0;
  
  console.log(`🚀 Starting GPS simulation for trip ${trip.tripId}`);
  
  const simulationInterval = setInterval(async () => {
    try {
      const progress = currentUpdateIndex / totalUpdates;
      
      const currentPosition = interpolatePosition(stops, progress);
      const currentSpeed = 45 + Math.random() * 20;
      
      await Location.create({
        registrationNumber: trip.registrationNumber,
        tripId: trip._id,
        location: {
          type: 'Point',
          coordinates: [currentPosition.lng, currentPosition.lat]
        },
        speed: currentSpeed,
        heading: Math.floor(Math.random() * 360),
        timestamp: new Date(),
        status: progress > 0.95 ? 'stopped' : 'moving',
        source: 'simulation'
      });
      
      console.log(`📍 GPS Update ${currentUpdateIndex + 1}/${totalUpdates} - Progress: ${Math.round(progress * 100)}%`);
      
      currentUpdateIndex++;
      
      if (currentUpdateIndex >= totalUpdates) {
        clearInterval(simulationInterval);
        await Trip.findByIdAndUpdate(trip._id, {
          status: 'completed',
          actualEndTime: new Date(),
          currentStop: stops[stops.length - 1].name
        });
        console.log(`✅ GPS simulation completed for trip ${trip.tripId}`);
      }
      
    } catch (error) {
      console.error('GPS simulation error:', error);
      clearInterval(simulationInterval);
    }
  }, UPDATE_INTERVAL);
};

// Helper function (unchanged)
const interpolatePosition = (stops, progress) => {
  const totalStops = stops.length;
  const currentStopIndex = Math.floor(progress * (totalStops - 1));
  const nextStopIndex = Math.min(currentStopIndex + 1, totalStops - 1);
  
  if (currentStopIndex === nextStopIndex) {
    return {
      lat: stops[currentStopIndex].coordinates.coordinates[1],
      lng: stops[currentStopIndex].coordinates.coordinates[0]
    };
  }
  
  const segmentProgress = (progress * (totalStops - 1)) - currentStopIndex;
  
  const startStop = stops[currentStopIndex];
  const endStop = stops[nextStopIndex];
  
  const lat = startStop.coordinates.coordinates[1] + 
    (endStop.coordinates.coordinates[1] - startStop.coordinates.coordinates[1]) * segmentProgress;
  const lng = startStop.coordinates.coordinates[0] + 
    (endStop.coordinates.coordinates[0] - startStop.coordinates.coordinates[0]) * segmentProgress;
    
  return { lat, lng };
};

/**
 * @desc    Get all scheduled trips for passengers (filtered by bus type)
 * @route   GET /api/trips/scheduled?busType=luxury&date=2025-10-15
 * @access  Public
 */
const getScheduledTrips = async (req, res) => {
  try {
    const { busType, date, routeId } = req.query;
    
    console.log('🔍 Filtering trips with:', { busType, date, routeId });
    
    // Build query filters
    let tripQuery = {
      status: { $in: ['scheduled', 'in-progress'] }
    };
    
    // Filter by date if provided
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      tripQuery.scheduledDate = {
        $gte: searchDate,
        $lt: nextDay
      };
    }
    
    // Filter by route if provided
    if (routeId) {
      tripQuery.routeId = routeId.toUpperCase();
    }
    
    // Get all trips
    const trips = await Trip.find(tripQuery)
      .sort({ scheduledStartTime: 1 });
    
    console.log('📋 Found trips:', trips.length);
    
    if (trips.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No scheduled trips found',
        filters: { busType, date, routeId }
      });
    }
    
    // Get details for each trip
    const tripsWithDetails = await Promise.all(
      trips.map(async (trip) => {
        const route = await Route.findOne({ routeId: trip.routeId });
        const bus = await Bus.findOne({ registrationNumber: trip.registrationNumber });
        
        console.log('🚌 Bus found:', {
          registration: trip.registrationNumber,
          busType: bus?.type,  // ✅ Changed from busType to type
          filterBusType: busType
        });
        
        // ✅ Check bus.type instead of bus.busType
        if (busType && bus) {
          if (bus.type !== busType) {
            console.log('❌ Bus type mismatch:', { busType: bus.type, filterBusType: busType });
            return null;
          }
        }
        
        // Format dates and times
        const scheduledDateInfo = formatDateTimeToLocal(trip.scheduledDate);
        const scheduledStartInfo = formatDateTimeToLocal(trip.scheduledStartTime);
        const scheduledEndInfo = formatDateTimeToLocal(trip.scheduledEndTime);
        
        return {
          tripId: trip.tripId,
          routeId: trip.routeId,
          routeName: route ? route.name : 'Unknown Route',
          
          // ✅ Bus Details (using correct field names)
          busDetails: {
            registrationNumber: trip.registrationNumber,
            busType: bus ? bus.type : 'CTB',  // ✅ Changed from busType to type
            capacity: bus ? bus.capacity : null,
            amenities: bus ? bus.amenities : [],
            operator: bus ? bus.operator.username : 'Unknown',  // ✅ Get username from operator object
            permitNumber: bus ? bus.permitNumber : null
          },
          
          // ✅ Schedule Information
          schedule: {
            date: scheduledDateInfo.date,
            startTime: scheduledStartInfo.time,
            endTime: scheduledEndInfo.time,
            totalStops: route ? route.stops.length : 0
          },
          
          // ✅ Trip Status
          status: trip.status,
          currentStatus: trip.status === 'in-progress' ? 'Running' : 'Scheduled',
          
          // ✅ Route Stops
          routeStops: {
            startStop: route && route.stops.length > 0 ? 
              route.stops.sort((a, b) => a.sequence - b.sequence)[0].name : 'Unknown',
            endStop: route && route.stops.length > 0 ? 
              route.stops.sort((a, b) => b.sequence - a.sequence)[0].name : 'Unknown'
          }
        };
      })
    );
    
    // Filter out null entries (busType mismatch)
    const filteredTrips = tripsWithDetails.filter(trip => trip !== null);
    
    console.log('✅ Filtered trips:', filteredTrips.length);
    
    if (filteredTrips.length === 0) {
      return res.status(404).json({
        success: false,
        message: busType ? `No "${busType}" trips found` : 'No trips found',
        filters: { busType, date, routeId },
        availableBusTypes: ['AC', 'Private', 'CTB']  // ✅ Show correct available types
      });
    }
    
    res.json({
      success: true,
      date: formatDateTimeToLocal(new Date()).date,
      time: formatDateTimeToLocal(new Date()).time,
      filters: {
        busType: busType || 'all',
        date: date || 'today',
        routeId: routeId || 'all'
      },
      totalTrips: filteredTrips.length,
      availableBusTypes: ['AC', 'Private', 'CTB'],
      data: filteredTrips
    });
    
  } catch (error) {
    console.error('Get scheduled trips error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


module.exports = {
  getAllTrips,
  getTripById,
  createTrip,
  startTrip,
  simulateGPS,
  completeTrip,
  getScheduledTrips 
};