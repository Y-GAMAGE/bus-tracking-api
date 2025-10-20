const Trip = require('../models/trip');
const Route = require('../models/route');
const Location = require('../models/location');

class GPSSimulator {
  constructor(tripId) {
    this.tripId = tripId;
    this.simulationStartTime = new Date(); // Real time when simulation starts
    this.scheduledStartTime = null; // Trip's scheduled start time
    this.scheduledEndTime = null; // Trip's scheduled end time
    this.visitedStops = new Set();
    this.isRunning = false;
    this.intervalId = null;
  }

  async startSimulation() {
    try {
      console.log('\n🚌 STARTING GPS SIMULATION');
      console.log('⚡ Using SCHEDULED trip times (not current time)');
      
      // Get trip and route data
      const trip = await Trip.findOne({ tripId: this.tripId });
      if (!trip) throw new Error('Trip not found');

      const route = await Route.findOne({ routeId: trip.routeId });
      if (!route) throw new Error('Route not found');

      this.trip = trip;
      this.route = route;
      
      // ✅ USE SCHEDULED TIMES FROM TRIP (not current time)
      this.scheduledStartTime = new Date(trip.scheduledStartTime);
      this.scheduledEndTime = new Date(trip.scheduledEndTime);
      
      const scheduledDurationMs = this.scheduledEndTime - this.scheduledStartTime;
      const simulationDurationMs = 6 * 60 * 1000; // 6 minutes simulation
      
      console.log(`📅 Route: ${this.route.name}`);
      console.log(`🚌 Bus: ${trip.registrationNumber}`);
      console.log(`🕒 Scheduled Start: ${this.scheduledStartTime.toLocaleString()}`);
      console.log(`🕒 Scheduled End: ${this.scheduledEndTime.toLocaleString()}`);
      console.log(`⏱️  Scheduled Duration: ${Math.round(scheduledDurationMs / (1000 * 60))} minutes`);
      console.log(`🎯 ${this.route.stops.length} stops to visit\n`);
      
      // Update trip status with scheduled start time (not current time)
      await Trip.findOneAndUpdate(
        { tripId: this.tripId },
        { 
          status: 'in-progress', 
          actualStartTime: this.scheduledStartTime, // ✅ Use scheduled time
          currentStop: this.route.stops[0]?.name 
        }
      );

      this.isRunning = true;
      
      // Generate GPS points every 10 seconds
      const intervalMs = 10 * 1000; // 10 seconds
      
      this.intervalId = setInterval(() => {
        this.generateGPSPoint();
      }, intervalMs);
      
      // Stop after 6 minutes
      setTimeout(() => {
        this.stopSimulation();
      }, simulationDurationMs);
      
    } catch (error) {
      console.error('GPS Simulation Error:', error);
    }
  }

  async generateGPSPoint() {
    if (!this.isRunning) return;

    try {
      // Calculate progress (0 to 1) based on simulation time
      const elapsedRealMs = Date.now() - this.simulationStartTime;
      const simulationProgress = Math.min(elapsedRealMs / (6 * 60 * 1000), 1);
      
      // ✅ Calculate VIRTUAL TIME based on scheduled trip duration
      const scheduledDurationMs = this.scheduledEndTime - this.scheduledStartTime;
      const virtualElapsedMs = simulationProgress * scheduledDurationMs;
      const currentVirtualTime = new Date(this.scheduledStartTime.getTime() + virtualElapsedMs);
      
      // Calculate position along route
      const position = this.calculatePositionAtProgress(simulationProgress);
      
      // Add realistic time variations (±2 minutes)
      const timeVariation = this.calculateTimeVariation();
      const actualVirtualTime = new Date(currentVirtualTime.getTime() + timeVariation);

      // Create GPS point with virtual scheduled time
      const gpsData = {
        registrationNumber: this.trip.registrationNumber,
        tripId: this.trip._id,
        location: {
          type: 'Point',
          coordinates: [position.lng, position.lat]
        },
        speed: this.calculateSpeed(simulationProgress),
        heading: this.calculateHeading(position),
        timestamp: actualVirtualTime, // ✅ Virtual time based on schedule
        status: simulationProgress >= 0.95 ? 'stopped' : 'moving',
        source: 'simulation'
      };

      // Save GPS point
      await Location.create(gpsData);
      
      console.log(`📡 Virtual Time: ${actualVirtualTime.toLocaleString()} | GPS: [${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}] | Speed: ${gpsData.speed} km/h | Progress: ${Math.round(simulationProgress * 100)}%`);

      // Check stop arrivals with virtual time
      await this.checkStopArrival(position, actualVirtualTime, simulationProgress);

    } catch (error) {
      console.error('GPS generation error:', error);
    }
  }

  calculatePositionAtProgress(progress) {
    const stops = this.route.stops.sort((a, b) => a.sequence - b.sequence);
    const totalStops = stops.length;
    
    if (progress <= 0) {
      return {
        lat: stops[0].coordinates.coordinates[1],
        lng: stops[0].coordinates.coordinates[0]
      };
    }
    
    if (progress >= 1) {
      const lastStop = stops[totalStops - 1];
      return {
        lat: lastStop.coordinates.coordinates[1],
        lng: lastStop.coordinates.coordinates[0]
      };
    }

    // ✅ Fixed interpolation between stops
    const segmentProgress = progress * (totalStops - 1);
    const currentStopIndex = Math.floor(segmentProgress);
    const nextStopIndex = Math.min(currentStopIndex + 1, totalStops - 1);
    const segmentRatio = segmentProgress - currentStopIndex;

    const currentStop = stops[currentStopIndex];
    const nextStop = stops[nextStopIndex];

    const lat = currentStop.coordinates.coordinates[1] + 
      (nextStop.coordinates.coordinates[1] - currentStop.coordinates.coordinates[1]) * segmentRatio;
    const lng = currentStop.coordinates.coordinates[0] + 
      (nextStop.coordinates.coordinates[0] - currentStop.coordinates.coordinates[0]) * segmentRatio;

    return { lat, lng };
  }

  async checkStopArrival(position, virtualTime, progress) {
    const stops = this.route.stops.sort((a, b) => a.sequence - b.sequence);
    
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const stopKey = `${stop.name}-${i}`;
      
      if (this.visitedStops.has(stopKey)) continue;

      // Calculate distance to stop
      const distance = this.calculateDistance(
        position,
        {
          lat: stop.coordinates.coordinates[1],
          lng: stop.coordinates.coordinates[0]
        }
      );

      // If within 200 meters of stop
      if (distance < 200) {
        this.visitedStops.add(stopKey);
        await this.recordStopArrival(stop, virtualTime, i);
      }
    }
  }

  async recordStopArrival(stop, actualVirtualTime, stopIndex) {
    try {
      // Find scheduled arrival for this stop
      const stopArrival = this.trip.stopArrivals.find(sa => sa.stopName === stop.name);
      
      if (!stopArrival) return;

      const scheduledArrival = new Date(stopArrival.estimatedArrival);
      const actualArrival = new Date(actualVirtualTime);
      
      // Calculate delay in minutes
      const delayMs = actualArrival - scheduledArrival;
      const delayMinutes = Math.round(delayMs / (1000 * 60));

      console.log(`\n🚏 STOP ARRIVAL: ${stop.name}`);
      console.log(`📅 Scheduled: ${scheduledArrival.toLocaleString()}`);
      console.log(`⏰ Actual: ${actualArrival.toLocaleString()}`);
      console.log(`📊 Delay: ${delayMinutes > 0 ? '+' : ''}${delayMinutes} minutes`);
      
      // ✅ Update trip with delayMinutes field (not delay)
      await Trip.findOneAndUpdate(
        { 
          tripId: this.tripId,
          'stopArrivals.stopName': stop.name 
        },
        {
          $set: {
            'stopArrivals.$.actualArrival': actualArrival,
            'stopArrivals.$.delayMinutes': delayMinutes, // ✅ Use delayMinutes
            'stopArrivals.$.hasPassed': true,
            currentStop: stop.name
          }
        }
      );

      // Mark previous stops as passed
      await this.markPreviousStopsAsPassed(stopIndex);

    } catch (error) {
      console.error('Stop arrival recording error:', error);
    }
  }

  async markPreviousStopsAsPassed(currentStopIndex) {
    try {
      const previousStops = this.route.stops.slice(0, currentStopIndex);
      
      for (const prevStop of previousStops) {
        await Trip.findOneAndUpdate(
          { 
            tripId: this.tripId,
            'stopArrivals.stopName': prevStop.name,
            'stopArrivals.hasPassed': false
          },
          {
            $set: {
              'stopArrivals.$.hasPassed': true
            }
          }
        );
        
        console.log(`✅ Marked as passed: ${prevStop.name}`);
      }
    } catch (error) {
      console.error('Error marking previous stops:', error);
    }
  }

  calculateTimeVariation() {
    // Realistic delay scenarios
    const scenarios = [
      { probability: 0.6, variation: 0 },        // 60% on time
      { probability: 0.2, variation: 120000 },   // 20% +2 min delay
      { probability: 0.15, variation: 300000 },  // 15% +5 min delay
      { probability: 0.05, variation: -60000 }   // 5% -1 min early
    ];
    
    const random = Math.random();
    let cumulative = 0;
    
    for (const scenario of scenarios) {
      cumulative += scenario.probability;
      if (random <= cumulative) {
        return scenario.variation;
      }
    }
    return 0;
  }

  calculateSpeed(progress) {
    const baseSpeed = 45;
    const variation = (Math.random() - 0.5) * 20;
    
    if (progress < 0.1 || progress > 0.9) {
      return Math.max(0, Math.round((baseSpeed * 0.5) + variation));
    }
    
    return Math.max(0, Math.round(baseSpeed + variation));
  }

  calculateHeading(position) {
    return Math.floor(Math.random() * 360);
  }

  calculateDistance(pos1, pos2) {
    const R = 6371e3;
    const φ1 = pos1.lat * Math.PI / 180;
    const φ2 = pos2.lat * Math.PI / 180;
    const Δφ = (pos2.lat - pos1.lat) * Math.PI / 180;
    const Δλ = (pos2.lng - pos1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  stopSimulation() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    console.log('\n🏁 GPS SIMULATION COMPLETED!');
    console.log(`✅ Trip ${this.tripId} finished`);
    
    // ✅ Update trip status with scheduled end time
    Trip.findOneAndUpdate(
      { tripId: this.tripId },
      { 
        status: 'completed',
        actualEndTime: this.scheduledEndTime // ✅ Use scheduled end time
      }
    ).exec();
  }
}

/**
 * ✅ Helper function to format scheduled times properly
 */
function formatScheduledTime(dateString) {
  const date = new Date(dateString);
  // ✅ Use UTC methods to avoid timezone conversion
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return { 
    date: `${year}-${month}-${day}`, 
    time: `${hours}:${minutes}` 
  };
}

/**
 * @desc    Start GPS simulation for a trip
 * @route   POST /api/trips/:tripId/simulate-gps
 * @access  Protected
 */
const startGPSSimulation = async (req, res) => {
  try {
    const { tripId } = req.params;
    
    const trip = await Trip.findOne({ tripId });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Start simulation
    const simulator = new GPSSimulator(tripId);
    simulator.startSimulation();

    // ✅ Format scheduled start time properly (not current time)
    const scheduledStartInfo = formatScheduledTime(trip.scheduledStartTime);
    const scheduledEndInfo = formatScheduledTime(trip.scheduledEndTime);

    res.json({
      success: true,
      message: 'GPS simulation started. Trip will complete in 6 minutes.',
      data: {
        tripId: trip.tripId,
        duration: '6 minutes',
        updateInterval: '10 seconds',
        startedAt: {
          date: scheduledStartInfo.date, // ✅ Shows scheduled date
          time: scheduledStartInfo.time  // ✅ Shows scheduled time (e.g., "11:30")
        },
        scheduledEnd: {
          date: scheduledEndInfo.date,
          time: scheduledEndInfo.time
        },
        note: 'GPS data uses scheduled trip timing, not current real time'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  GPSSimulator,
  startGPSSimulation
};