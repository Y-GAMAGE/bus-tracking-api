const Location = require('../models/location');
const Trip = require('../models/trip');
const Route = require('../models/route');

/**
 * Helper function for distance calculation using Haversine formula
 */
function calculateDistance(pos1, pos2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = pos1.lat * Math.PI / 180;
  const φ2 = pos2.lat * Math.PI / 180;
  const Δφ = (pos2.lat - pos1.lat) * Math.PI / 180;
  const Δλ = (pos2.lng - pos1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

/**
 * ✅ Extract time from stored datetime WITHOUT timezone conversion
 */
function formatTimeToLocal(utcTimeString) {
  const date = new Date(utcTimeString);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * ✅ Convert datetime to separate date and time fields WITHOUT timezone conversion
 */
function formatDateTimeToLocal(utcTimeString) {
  const date = new Date(utcTimeString);
  
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  };
}

/**
 * Calculate estimated arrival time based on current GPS position and distance
 */
function calculateEstimatedArrival(currentLat, currentLng, stop, currentSpeed) {
  const stopLat = stop.coordinates.coordinates[1];
  const stopLng = stop.coordinates.coordinates[0];
  
  const distance = calculateDistance(
    { lat: currentLat, lng: currentLng },
    { lat: stopLat, lng: stopLng }
  );
  
  const speedKmh = currentSpeed || 50;
  const distanceKm = distance / 1000;
  const timeHours = distanceKm / speedKmh;
  const timeMinutes = Math.round(timeHours * 60);
  
  const estimatedArrival = new Date(Date.now() + (timeMinutes * 60 * 1000));
  
  return {
    estimatedArrival,
    timeMinutes,
    distanceKm: Math.round(distanceKm * 10) / 10
  };
}

/**
 * @desc    Get current location for a specific bus (CLEAN VERSION - NO GARBAGE)
 * @route   GET /api/locations/bus/:busRegistrationNumber/current
 * @access  Public
 */
async function getCurrentBusLocation(req, res) {
  console.log('🚀 CLEAN LOCATION CONTROLLER - NO TRIPROGRESS GARBAGE!');
  console.log('🔥 Getting trip data for bus:', req.params.busRegistrationNumber);
  
  try {
    const registrationNumber = req.params.busRegistrationNumber;
    
    if (!registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bus registration number is required'
      });
    }
    
    // ✅ Find the latest active trip for this bus
    const latestTrip = await Trip.findOne({ 
      registrationNumber: registrationNumber.toUpperCase(),
      status: { $in: ['scheduled', 'in-progress', 'started'] }
    })
    .sort({ createdAt: -1 });

    if (!latestTrip) {
      return res.status(404).json({
        success: false,
        message: `No active trip found for bus ${registrationNumber}`
      });
    }

    console.log('✅ Found trip:', latestTrip.tripId);

    // ✅ Find the most recent location for this specific trip
    const currentLocation = await Location.findOne({ 
      registrationNumber: registrationNumber.toUpperCase(),
      tripId: latestTrip._id
    })
    .sort({ timestamp: -1 });

    // ✅ Get route data
    const route = await Route.findOne({ 
      routeId: latestTrip.routeId,
      isActive: true 
    });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route data not found'
      });
    }

    // ✅ Use GPS location or route start as fallback
    let busLat, busLng, locationSpeed = 0, locationTimestamp;
    
    if (!currentLocation) {
      // Use first stop as current location
      const firstStop = route.stops.sort((a, b) => a.sequence - b.sequence)[0];
      busLat = firstStop.coordinates.coordinates[1];
      busLng = firstStop.coordinates.coordinates[0];
      locationTimestamp = new Date();
      console.log('⚠️ Using route start location');
    } else {
      busLat = currentLocation.location.coordinates[1];
      busLng = currentLocation.location.coordinates[0];
      locationSpeed = currentLocation.speed || 0;
      locationTimestamp = currentLocation.timestamp;
      console.log('📍 Using GPS location');
    }

    const currentTime = new Date();

    // ✅ Format times
    const scheduledDateInfo = formatDateTimeToLocal(latestTrip.scheduledDate);
    const scheduledStartInfo = formatDateTimeToLocal(latestTrip.scheduledStartTime);
    const scheduledEndInfo = formatDateTimeToLocal(latestTrip.scheduledEndTime);
    const currentDateTime = formatDateTimeToLocal(currentTime);
    const locationDateTime = formatDateTimeToLocal(locationTimestamp);

    // ✅ Get upcoming stops (NO PASSED STOPS)
    const upcomingStops = latestTrip.stopArrivals
      .filter(stopArrival => !stopArrival.hasPassed && !stopArrival.actualArrival)
      .map(stopArrival => {
        const scheduledTime = formatTimeToLocal(stopArrival.estimatedArrival);
        const routeStop = route.stops.find(s => s.name === stopArrival.stopName);
        
        if (!routeStop) {
          return {
            stopName: stopArrival.stopName,
            scheduledArrival: scheduledTime,
            estimatedArrival: scheduledTime,
            delayMinutes: 0,
            delayStatus: 'on-time',
            distanceFromCurrentLocation: 'N/A',
            estimatedTravelTime: 'N/A'
          };
        }

        // Calculate GPS-based estimated arrival
        const estimation = calculateEstimatedArrival(
          busLat, 
          busLng, 
          routeStop, 
          locationSpeed || 50
        );
        
        const estimatedTime = formatTimeToLocal(estimation.estimatedArrival);
        
        // Calculate delay
        const scheduledTimestamp = new Date(stopArrival.estimatedArrival).getTime();
        const estimatedTimestamp = estimation.estimatedArrival.getTime();
        const delayMinutes = Math.round((estimatedTimestamp - scheduledTimestamp) / (1000 * 60));
        
        return {
          stopName: stopArrival.stopName,
          scheduledArrival: scheduledTime,
          estimatedArrival: estimatedTime,
          delayMinutes: delayMinutes,
          delayStatus: delayMinutes > 5 ? 'delayed' : delayMinutes < -2 ? 'early' : 'on-time',
          distanceFromCurrentLocation: `${estimation.distanceKm} km`,
          estimatedTravelTime: `${estimation.timeMinutes} min`
        };
      });

    console.log('✅ Scheduled data:', {
      date: scheduledDateInfo.date,
      startTime: scheduledStartInfo.time,
      endTime: scheduledEndInfo.time,
      upcomingStops: upcomingStops.length
    });

    // ✅ CLEAN RESPONSE - NO GARBAGE FIELDS
    res.json({
      success: true,
      date: currentDateTime.date,
      time: currentDateTime.time,
      data: {
        // ✅ Current Location ONLY
        currentLocation: {
          coordinates: {
            latitude: busLat,
            longitude: busLng
          },
          speed: `${Math.round(locationSpeed)} km/h`,
          date: locationDateTime.date,
          time: locationDateTime.time,
          source: currentLocation ? 'gps' : 'route-start'
        },
        
        // ✅ Trip Details ONLY
        tripDetails: {
          tripId: latestTrip.tripId,
          busRegistrationNumber: latestTrip.registrationNumber,
          routeId: latestTrip.routeId,
          routeName: route.name,
          status: latestTrip.status,
          scheduledDate: scheduledDateInfo.date,
          scheduledStartTime: scheduledStartInfo.time,
          scheduledEndTime: scheduledEndInfo.time,
          actualStartTime: latestTrip.actualStartTime ? formatTimeToLocal(latestTrip.actualStartTime) : null,
          actualStartDate: latestTrip.actualStartTime ? formatDateTimeToLocal(latestTrip.actualStartTime).date : null,
          actualEndTime: latestTrip.actualEndTime ? formatTimeToLocal(latestTrip.actualEndTime) : null,
          actualEndDate: latestTrip.actualEndTime ? formatDateTimeToLocal(latestTrip.actualEndTime).date : null
        },
        
        // ✅ Upcoming Stops ONLY (NO PASSED STOPS)
        upcomingStops: upcomingStops
      }
    });

  } catch (error) {
    console.error('❌ Location error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * @desc    Get location history for a specific trip
 * @route   GET /api/locations/trip/:tripId/history
 * @access  Public
 */
async function getTripLocationHistory(req, res) {
  try {
    const tripIdParam = req.params.tripId;
    const { limit = 100 } = req.query;

    if (!tripIdParam) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID is required'
      });
    }

    const tripId = tripIdParam.toString().trim();

    // Find trip
    let trip;
    if (tripId.length === 24 && /^[0-9a-fA-F]+$/.test(tripId)) {
      trip = await Trip.findById(tripId);
    } else {
      trip = await Trip.findOne({ tripId: tripId });
    }

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: `Trip not found: ${tripId}`
      });
    }

    // Get locations
    const locations = await Location.find({ tripId: trip._id })
      .sort({ timestamp: 1 })
      .limit(parseInt(limit));

    if (locations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No location history found for this trip'
      });
    }

    // Format history
    const history = locations.map((loc, index) => ({
      index: index + 1,
      timestamp: loc.timestamp,
      coordinates: {
        latitude: loc.location.coordinates[1],
        longitude: loc.location.coordinates[0]
      },
      speed: Math.round(loc.speed || 0),
      status: loc.status || 'moving'
    }));

    res.json({
      success: true,
      count: history.length,
      tripDetails: {
        tripId: trip.tripId,
        registrationNumber: trip.registrationNumber,
        status: trip.status
      },
      data: history
    });

  } catch (error) {
    console.error('Location history error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * @desc    Record a new GPS location
 * @route   POST /api/locations
 * @access  Protected
 */
async function recordLocation(req, res) {
  try {
    const {
      registrationNumber,
      tripId,
      latitude,
      longitude,
      speed = 0,
      heading = 0,
      status = 'moving',
      source = 'gps'
    } = req.body;

    if (!registrationNumber || !tripId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'registrationNumber, tripId, latitude, and longitude are required'
      });
    }

    const cleanTripId = tripId.toString().trim();

    // Find trip
    let trip;
    if (cleanTripId.length === 24 && /^[0-9a-fA-F]+$/.test(cleanTripId)) {
      trip = await Trip.findById(cleanTripId);
    } else {
      trip = await Trip.findOne({ tripId: cleanTripId });
    }

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: `Trip not found: ${cleanTripId}`
      });
    }

    // Create location record
    const location = await Location.create({
      registrationNumber: registrationNumber.toUpperCase(),
      tripId: trip._id,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      speed: parseFloat(speed),
      heading: parseFloat(heading),
      status,
      timestamp: new Date(),
      source
    });

    res.status(201).json({
      success: true,
      message: 'Location recorded successfully',
      data: {
        locationId: location._id,
        registrationNumber: location.registrationNumber,
        timestamp: location.timestamp,
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        }
      }
    });

  } catch (error) {
    console.error('Record location error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  getCurrentBusLocation,
  getTripLocationHistory,
  recordLocation
};