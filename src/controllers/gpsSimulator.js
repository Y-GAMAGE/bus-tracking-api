// src/controllers/gpsSimulator.js
const Trip = require('../models/trip');
const Route = require('../models/route');
const Location = require('../models/location');

class GPSSimulator {
  constructor(tripId) {
    this.tripId = tripId;
    this.compressionRatio = 60; // 6 minutes for any route
    this.simulationStartTime = new Date();
    this.virtualStartTime = null;
    this.currentVirtualTime = null;
    this.visitedStops = new Set();
    this.isRunning = false;
    this.intervalId = null;
  }

  async startSimulation() {
    try {
      console.log('\n🚌 STARTING GPS SIMULATION');
      console.log('⚡ Any route compressed to 6 minutes demo');
      
      // Get trip and route data
      const trip = await Trip.findOne({ tripId: this.tripId }).populate('routeId');
      if (!trip) throw new Error('Trip not found');

      this.trip = trip;
      this.route = trip.routeId;
      
      // Set virtual timing
      this.virtualStartTime = new Date(trip.scheduledStartTime);
      this.currentVirtualTime = new Date(this.virtualStartTime);
      
      console.log(`📅 Route: ${this.route.name}`);
      console.log(`🚌 Bus: ${trip.busRegistrationNumber}`);
      console.log(`⏰ Virtual start: ${this.virtualStartTime.toLocaleTimeString()}`);
      console.log(`🎯 ${this.route.stops.length} stops to visit\n`);
      
      // Update trip status
      await Trip.findOneAndUpdate(
        { tripId: this.tripId },
        { 
          status: 'started', 
          actualStartTime: new Date(),
          currentStop: this.route.stops[0]?.name 
        }
      );

      this.isRunning = true;
      
      // Generate GPS every 10 seconds (6 min total / route stops)
      const intervalMs = (6 * 60 * 1000) / (this.route.stops.length * 3); // Multiple points per stop
      
      this.intervalId = setInterval(() => {
        this.generateGPSPoint();
      }, intervalMs);
      
      // Stop after 6 minutes
      setTimeout(() => {
        this.stopSimulation();
      }, 6 * 60 * 1000);
      
    } catch (error) {
      console.error('GPS Simulation Error:', error);
    }
  }

  async generateGPSPoint() {
    if (!this.isRunning) return;

    try {
      // Advance virtual time
      const totalDurationMs = this.trip.scheduledEndTime - this.virtualStartTime;
      const elapsedRealMs = Date.now() - this.simulationStartTime;
      const compressionFactor = totalDurationMs / (6 * 60 * 1000); // Compress to 6 minutes
      
      this.currentVirtualTime = new Date(
        this.virtualStartTime.getTime() + (elapsedRealMs * compressionFactor)
      );

      // Calculate position along route
      const progress = elapsedRealMs / (6 * 60 * 1000); // 0 to 1
      const position = this.calculatePositionAtProgress(progress);
      
      // Add realistic variations
      const timeVariation = this.calculateTimeVariation();
      const actualVirtualTime = new Date(this.currentVirtualTime.getTime() + timeVariation);

      // Create GPS point
      const gpsData = {
        registrationNumber: this.trip.registrationNumber,
        tripId: this.trip._id,
        location: {
          type: 'Point',
          coordinates: [position.lng, position.lat]
        },
        speed: this.calculateSpeed(progress),
        heading: this.calculateHeading(position),
        timestamp: actualVirtualTime,
        status: progress >= 0.95 ? 'stopped' : 'moving',
        source: 'simulation'
      };

      // Save GPS point
      await Location.create(gpsData);
      
      console.log(`📡 ${actualVirtualTime.toLocaleTimeString()} | GPS: [${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}] | Speed: ${gpsData.speed} km/h`);

      // Check stop arrivals
      await this.checkStopArrival(position, actualVirtualTime, progress);

    } catch (error) {
      console.error('GPS generation error:', error);
    }
  }

  calculatePositionAtProgress(progress) {
    // Interpolate position along route based on progress (0-1)
    const stops = this.route.stops;
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

    // Find current segment
    const segmentProgress = progress * (totalStops - 1);
    const currentStopIndex = Math.floor(segmentProgress);
    const nextStopIndex = Math.min(currentStopIndex + 1, totalStops - 1);
    const segmentRatio = segmentProgress - currentStopIndex;

    const currentStop = stops[currentStopIndex];
    const nextStop = stops[nextStopIndex];

    // Interpolate between current and next stop
    const lat = currentStop.coordinates.coordinates[1] + 
      (nextStop.coordinates.coordinates[1] - currentStop.coordinates.coordinates[1]) * segmentRatio;
    const lng = currentStop.coordinates.coordinates[0] + 
      (nextStop.coordinates.coordinates[0] - currentStop.coordinates.coordinates[0]) * segmentRatio;

    return { lat, lng };
  }

  async checkStopArrival(position, virtualTime, progress) {
    const stops = this.route.stops;
    
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

      const scheduledArrival = stopArrival.estimatedArrival;
      const actualArrival = new Date(actualVirtualTime);
      
      // Calculate delay in minutes
      const delayMs = actualArrival - scheduledArrival;
      const delayMinutes = Math.round(delayMs / (1000 * 60));

      console.log(`\n🚏 STOP ARRIVAL: ${stop.name}`);
      console.log(`📅 Scheduled: ${scheduledArrival.toLocaleTimeString()}`);
      console.log(`⏰ Actual: ${actualArrival.toLocaleTimeString()}`);
      console.log(`📊 Delay: ${delayMinutes > 0 ? '+' : ''}${delayMinutes} minutes`);
      
      // Update trip with stop arrival
      await Trip.findOneAndUpdate(
        { 
          tripId: this.tripId,
          'stopArrivals.stopName': stop.name 
        },
        {
          $set: {
            'stopArrivals.$.actualArrival': actualArrival,
            'stopArrivals.$.delay': delayMinutes,
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
    // Vary speed based on progress and add randomness
    const baseSpeed = 45;
    const variation = (Math.random() - 0.5) * 20; // ±10 km/h
    
    if (progress < 0.1 || progress > 0.9) {
      return Math.max(0, Math.round((baseSpeed * 0.5) + variation)); // Slower at start/end
    }
    
    return Math.max(0, Math.round(baseSpeed + variation));
  }

  calculateHeading(position) {
    // Simple heading calculation (can be enhanced)
    return Math.floor(Math.random() * 360);
  }

  calculateDistance(pos1, pos2) {
    // Haversine formula for distance calculation
    const R = 6371e3; // Earth radius in meters
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

  stopSimulation() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    console.log('\n🏁 GPS SIMULATION COMPLETED!');
    console.log(`✅ Trip ${this.tripId} finished`);
    
    // Update trip status
    Trip.findOneAndUpdate(
      { tripId: this.tripId },
      { 
        status: 'completed',
        actualEndTime: new Date()
      }
    ).exec();
  }
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

    res.json({
      success: true,
      message: 'GPS simulation started',
      tripId,
      duration: '6 minutes',
      note: 'Check console for live GPS updates'
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