const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (optional but helpful for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NTC Bus Tracking API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    endpoints: {
      auth: '/api/auth',
      buses: '/api/buses',
      routes: '/api/routes',
      locations: '/api/locations',
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

// TODO: Add other routes here as you create them
// app.use('/api/trips', require('./routes/tripRoutes'));

// ========================================
// ERROR HANDLING MIDDLEWARE (Must be last)
// ========================================

const { notFound, errorHandler } = require('./middleware/errorHandler');

// 404 handler - catches all undefined routes
app.use(notFound);

// Global error handler - handles all errors
app.use(errorHandler);

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('========================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
  console.log('========================================');
  console.log('📋 Available endpoints:');
  console.log('');
  console.log('   🏠 GENERAL ENDPOINTS:');
  console.log(`   - GET  /                     (API Info)`);
  console.log(`   - GET  /health               (Health Check)`);
  console.log('');
  console.log('   🔐 AUTH ENDPOINTS:');
  console.log(`   - POST /api/auth/register    (User Registration)`);
  console.log(`   - POST /api/auth/login       (User Login)`);
  console.log(`   - GET  /api/auth/me          (Get Profile)`);
  console.log(`   - PUT  /api/auth/profile     (Update Profile)`);
  console.log(`   - PUT  /api/auth/change-password (Change Password)`);
  console.log(`   - POST /api/auth/logout      (User Logout)`);
  console.log(`   - POST /api/auth/forgot-password (Forgot Password)`);
  console.log(`   - POST /api/auth/reset-password (Reset Password)`);
  console.log(`   - GET  /api/auth/verify      (Verify Token)`);
  console.log('');
console.log('   🚌 BUS ENDPOINTS (PRACTICAL):');
  console.log(`   - GET  /api/buses                      (Get All Buses)`);
  console.log(`   - GET  /api/buses/:registrationNumber  (Get Bus - e.g., WP-1234)`);
  console.log(`   - POST /api/buses                      (Create Bus) [Admin/Operator]`);
  console.log(`   - PUT  /api/buses/:registrationNumber  (Update Bus - e.g., WP-1234) [Admin/Operator]`);
  console.log(`   - DELETE /api/buses/:registrationNumber (Delete Bus - e.g., WP-1234) [Admin Only]`);
  console.log('');
  console.log('   🛣️  ROUTE ENDPOINTS:');
  console.log(`   - GET  /api/routes           (Get All Routes)`);
  console.log(`   - GET  /api/routes/:id       (Get Single Route)`);
  console.log(`   - GET  /api/routes/route/:routeId (Get Route by RouteID)`);
  console.log(`   - POST /api/routes           (Create Route)`);
  console.log(`   - PUT  /api/routes/route/:routeId (Update Route)`);
  console.log(`   - DELETE /api/routes/route/:routeId (Delete Route)`);
  console.log(`   - GET  /api/routes/search    (Search Routes)`);
  console.log('');
  console.log('   📍 LOCATION ENDPOINTS:');
  console.log(`   - GET  /api/locations        (Get All Location Records)`);
  console.log(`   - GET  /api/locations/:id    (Get Single Location Record)`);
  console.log(`   - GET  /api/locations/nearby (Get Nearby Buses)`);
  console.log(`   - GET  /api/locations/bus/:busId/current (Get Current Bus Location)`);
  console.log(`   - GET  /api/locations/bus/:busId/recent (Get Recent Bus Locations)`);
  console.log(`   - GET  /api/locations/bus/:busId/history (Get Bus Location History)`);
  console.log(`   - POST /api/locations        (Create Location Record)`);
  console.log(`   - PUT  /api/locations/:id    (Update Location Record)`);
  console.log(`   - DELETE /api/locations/:id  (Delete Location Record)`);
  console.log('');
  console.log('   📍 COMING SOON:');
  console.log(`   - /api/trips                 (Trip Management)`);
  console.log(`   - Extended Bus Endpoints     (Route/Status Filtering, Location Updates, Driver Assignment)`);
  console.log('========================================');
  console.log('');
  console.log('🧪 TESTING READY:');
  console.log('   Bus Types: AC, Private, CTB');
  console.log('   Required: registrationNumber, capacity, type, permitNumber, operator.username');
  console.log('   Optional: amenities, specifications');
  console.log('========================================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});