// src/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/database');
const { swaggerSpec, swaggerUi } = require('./config/swagger');


const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NTC Bus Tracking API with GPS Simulation',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    endpoints: {
      auth: '/api/auth',
      buses: '/api/buses',
      routes: '/api/routes',
      locations: '/api/locations',
      trips: '/api/trips',
      health: '/health'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: {
      usage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  });
});

// ========================================
// API ROUTES
// ========================================

// Auth routes
app.use('/api/auth', require('./routes/authRoutes'));

// Bus routes
app.use('/api/buses', require('./routes/busRoutes'));

// Route routes
app.use('/api/routes', require('./routes/routeRoutes'));

// Location routes
app.use('/api/locations', require('./routes/locationRoutes'));

// Trip routes with GPS simulation
app.use('/api/trips', require('./routes/tripRoutes'));

// ========================================
// ERROR HANDLING MIDDLEWARE
// ========================================

const { notFound, errorHandler } = require('./middleware/errorHandler');

app.use(notFound);
app.use(errorHandler);

// ========================================
// SWAGGER DOCUMENTATION
// ========================================

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NTC Bus Tracking API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
  }
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
// Basic route (update to include docs link)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NTC Bus Tracking API with GPS Simulation',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    documentation: 'http://localhost:3000/api-docs', // ✅ Add this line
    endpoints: {
      auth: '/api/auth',
      buses: '/api/buses',
      routes: '/api/routes',
      locations: '/api/locations',
      trips: '/api/trips',
      health: '/health'
    }
  });
});

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('========================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`); // ✅ Add this line

  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
  console.log('========================================');
  console.log('📋 Available endpoints:');
  console.log('');
  console.log('   🏠 GENERAL:');
  console.log(`   - GET  /                     (API Info)`);
  console.log(`   - GET  /health               (Health Check)`);
  console.log('');
  console.log('   🔐 AUTH:');
  console.log(`   - POST /api/auth/register    (User Registration)`);
  console.log(`   - POST /api/auth/login       (User Login)`);
  console.log(`   - POST /api/auth/logout      (User Logout)`);
  console.log(`   - GET  /api/auth/profile     (Get User Profile)`);
  console.log(`   - PUT  /api/auth/profile     (Update Profile)`);
  console.log(`   - POST /api/auth/forgot      (Forgot Password)`);
  console.log(`   - POST /api/auth/reset       (Reset Password)`);
  console.log('');
  console.log('   🚌 BUSES:');
  console.log(`   - GET  /api/buses                    (Get All Buses)`);
  console.log(`   - GET  /api/buses/:regNumber         (Get Bus by Registration)`);
  console.log(`   - POST /api/buses                    (Create Bus)`);
  console.log(`   - PUT  /api/buses/:regNumber         (Update Bus)`);
  console.log(`   - DELETE /api/buses/:regNumber       (Delete Bus)`);
  console.log(`   - GET  /api/buses/route/:routeId     (Get Buses by Route)`);
  console.log(`   - GET  /api/buses/status/:status     (Get Buses by Status)`);
  console.log(`   - POST /api/buses/:regNumber/assign  (Assign Bus to Route)`);
  console.log('');
  console.log('   🛣️  ROUTES:');
  console.log(`   - GET  /api/routes                   (Get All Routes)`);
  console.log(`   - GET  /api/routes/:id               (Get Route by ID or routeId)`);
  console.log(`   - GET  /api/routes/route/:routeId    (Get Route by routeId)`);
  console.log(`   - POST /api/routes                   (Create Route)`);
  console.log(`   - PUT  /api/routes/route/:routeId    (Update Route)`);
  console.log(`   - DELETE /api/routes/:routeId        (Delete Route)`);
  console.log(`   - GET  /api/routes/search            (Search Routes by Origin/Destination)`);
  console.log('');
  console.log('   📍 LOCATIONS:');
  console.log(`   - GET  /api/locations                          (Get All Locations)`);
  console.log(`   - GET  /api/locations/:id                      (Get Location by ID)`);
  console.log(`   - GET  /api/locations/bus/:regNumber/current   (Get Current Bus Location)`);
  console.log(`   - GET  /api/locations/trip/:tripId/history     (Get Trip GPS History)`);
  console.log(`   - POST /api/locations                          (Record GPS Point)`);
  console.log(`   - PUT  /api/locations/:id                      (Update Location)`);
  console.log(`   - DELETE /api/locations/:id                    (Delete Location)`);
  console.log('');
  console.log('   🚌 TRIPS & GPS SIMULATION:');
  console.log(`   - GET  /api/trips                     (Get All Trips)`);
  console.log(`   - GET  /api/trips/:tripId             (Get Trip Details)`);
  console.log(`   - POST /api/trips                     (Create Trip)`);
  console.log(`   - PUT  /api/trips/:tripId             (Update Trip)`);
  console.log(`   - DELETE /api/trips/:tripId           (Delete Trip)`);
  console.log(`   - POST /api/trips/:tripId/start       (Start Trip)`);
  console.log(`   - POST /api/trips/:tripId/complete    (Complete Trip)`);
  console.log(`   - POST /api/trips/:tripId/simulate-gps (Start 6-min GPS Demo)`);
  console.log(`   - GET  /api/trips/bus/:regNumber      (Get Trips by Bus)`);
  console.log(`   - GET  /api/trips/route/:routeId      (Get Trips by Route)`);
  console.log(`   - GET  /api/trips/date/:date          (Get Trips by Date)`);
  console.log('========================================');
  console.log('');

  console.log('========================================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});