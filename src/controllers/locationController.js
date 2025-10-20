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
 * Find the closest stop to current GPS coordinates
 */
function findClosestStop(currentLat, currentLng, stops) {
  let closestStop = null;
  let shortestDistance = Infinity;
  let isExactMatch = false;
  let closestStopIndex = -1;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const stopLat = stop.coordinates.coordinates[1];
    const stopLng = stop.coordinates.coordinates[0];
    
    const distance = calculateDistance(
      { lat: currentLat, lng: currentLng },
      { lat: stopLat, lng: stopLng }
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;
      closestStop = stop;
      closestStopIndex = i;
      // Consider exact match if within 200 meters (increased threshold)
      isExactMatch = distance <= 200;
    }
  }

  return {
    stop: closestStop,
    distance: shortestDistance,
    isExactMatch,
    stopIndex: closestStopIndex
  };
}

// ...existing code...

/**
 * @desc    Get current location for a specific bus - SIMPLIFIED VERSION
 * @route   GET /api/locations/bus/:busRegistrationNumber/current
 * @access  Public
 */
async function getCurrentBusLocation(req, res) {
  console.log('🚀 SIMPLIFIED LOCATION CONTROLLER');
  console.log('🔥 Getting current location for bus:', req.params.busRegistrationNumber);
  
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

    // ✅ Check if trip is completed
    if (latestTrip.status === 'completed') {
      return res.json({
        success: true,
        data: {
          tripId: latestTrip.tripId,
          registrationNumber: latestTrip.registrationNumber,
          status: 'completed',
          message: 'Trip has been completed',
          completedAt: latestTrip.actualEndTime || latestTrip.scheduledEndTime
        }
      });
    }

    console.log('✅ Found trip:', latestTrip.tripId);

    // ✅ Find the most recent GPS location
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
    let busLat, busLng, locationSpeed = 45, gpsTimestamp;
    
    if (!currentLocation) {
      // Use first stop as current location
      const firstStop = route.stops.sort((a, b) => a.sequence - b.sequence)[0];
      busLat = firstStop.coordinates.coordinates[1];
      busLng = firstStop.coordinates.coordinates[0];
      gpsTimestamp = new Date();
      console.log('⚠️ Using route start location');
    } else {
      busLat = currentLocation.location.coordinates[1];
      busLng = currentLocation.location.coordinates[0];
      locationSpeed = currentLocation.speed || 45;
      gpsTimestamp = currentLocation.timestamp;
      console.log('📍 Using GPS location from:', gpsTimestamp);
    }

    // ✅ Find closest stop to current position
    const sortedStops = route.stops.sort((a, b) => a.sequence - b.sequence);
    const closestStopInfo = findClosestStop(busLat, busLng, sortedStops);
    
    // ✅ Determine current location description
    let currentLocationDescription;
    if (closestStopInfo.isExactMatch) {
      currentLocationDescription = `At ${closestStopInfo.stop.name}`;
    } else {
      const distanceKm = Math.round(closestStopInfo.distance / 100) / 10;
      currentLocationDescription = `${distanceKm} km from ${closestStopInfo.stop.name}`;
    }

    // ✅ Get ONLY upcoming stops (after current position)
    const currentStopIndex = closestStopInfo.stopIndex;
    
    // ✅ Filter upcoming stops that haven't been passed
    const upcomingStops = latestTrip.stopArrivals
      .filter(stopArrival => {
        // ✅ Check if stop has been marked as passed
        if (stopArrival.hasPassed) {
          return false;
        }
        
        // Find this stop in the sorted route
        const routeStopIndex = sortedStops.findIndex(s => s.name === stopArrival.stopName);
        
        // ✅ Only include stops that are ahead of current position
        if (closestStopInfo.isExactMatch) {
          return routeStopIndex > currentStopIndex;
        } else {
          return routeStopIndex >= currentStopIndex;
        }
      })
      .sort((a, b) => {
        // Sort by route sequence order
        const stopA = sortedStops.find(s => s.name === a.stopName);
        const stopB = sortedStops.find(s => s.name === b.stopName);
        return (stopA?.sequence || 0) - (stopB?.sequence || 0);
      })
      .map(stopArrival => {
        const routeStop = sortedStops.find(s => s.name === stopArrival.stopName);
        
        if (!routeStop) {
          return {
            stopName: stopArrival.stopName,
            scheduledArrival: formatTimeToLocal(stopArrival.estimatedArrival),
            estimatedArrival: formatTimeToLocal(stopArrival.estimatedArrival),
            status: 'on time'
          };
        }

        // ✅ Calculate estimated arrival based on GPS timestamp + travel time
        const stopLat = routeStop.coordinates.coordinates[1];
        const stopLng = routeStop.coordinates.coordinates[0];
        
        const distance = calculateDistance(
          { lat: busLat, lng: busLng },
          { lat: stopLat, lng: stopLng }
        );
        
        const distanceKm = Math.round(distance / 100) / 10;
        const timeMinutes = Math.round((distanceKm / locationSpeed) * 60);
        
        const estimatedArrivalTime = new Date(gpsTimestamp.getTime() + (timeMinutes * 60 * 1000));
        
        // ✅ Get scheduled arrival time
        const scheduledArrivalTime = new Date(stopArrival.estimatedArrival);
        
        // ✅ Calculate delay in minutes (FIXED CALCULATION)
        let delayMinutes;
        if (stopArrival.actualArrival) {
          // If bus already arrived at this stop, use actual time
          const actualTime = new Date(stopArrival.actualArrival);
          delayMinutes = Math.round((actualTime - scheduledArrivalTime) / (1000 * 60));
        } else {
          // Calculate delay based on estimated arrival
          delayMinutes = Math.round((estimatedArrivalTime - scheduledArrivalTime) / (1000 * 60));
        }
        
        // ✅ FIXED DELAY STATUS LOGIC
        let status;
        if (delayMinutes > 0) {
          // Bus is late
          status = `delayed by ${delayMinutes} minutes`;
        } else if (delayMinutes < 0) {
          // Bus is early
          const earlyMinutes = Math.abs(delayMinutes);
          status = `early by ${earlyMinutes} minutes`;
        } else {
          // Bus is exactly on time
          status = 'on time';
        }
        
        return {
          stopName: stopArrival.stopName,
          scheduledArrival: formatTimeToLocal(stopArrival.estimatedArrival),
          estimatedArrival: formatTimeToLocal(estimatedArrivalTime),
          status: status // ✅ SIMPLIFIED STATUS
        };
      });

    console.log(`📍 Current location: ${currentLocationDescription}`);
    console.log(`🎯 Found ${upcomingStops.length} upcoming stops`);

    // ✅ SIMPLIFIED RESPONSE
    res.json({
      success: true,
      data: {
        // ✅ Basic Trip Info
        tripId: latestTrip.tripId,
        registrationNumber: latestTrip.registrationNumber,
        
        // ✅ Current Location Info
        currentLocation: {
          description: currentLocationDescription,
          speed: `${Math.round(locationSpeed)} km/h`
        },
        
        // ✅ Upcoming Stops Only
        upcomingStops: upcomingStops,
        
        // ✅ Route Info
        routeInfo: {
          routeId: latestTrip.routeId,
          routeName: route.name,
          totalStops: route.stops.length,
          remainingStops: upcomingStops.length
        }
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