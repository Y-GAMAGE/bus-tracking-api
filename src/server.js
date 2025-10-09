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

// TODO: Add other routes here as you create them
// app.use('/api/routes', require('./routes/routeRoutes'));
// app.use('/api/trips', require('./routes/tripRoutes'));
// app.use('/api/locations', require('./routes/locationRoutes'));

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
  console.log('   🔐 AUTH ENDPOINTS:');
  console.log(`   - GET  /`);
  console.log(`   - GET  /health`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET  /api/auth/me`);
  console.log(`   - PUT  /api/auth/profile`);
  console.log(`   - PUT  /api/auth/change-password`);
  console.log(`   - POST /api/auth/logout`);
  console.log(`   - POST /api/auth/forgot-password`);
  console.log(`   - POST /api/auth/reset-password`);
  console.log(`   - GET  /api/auth/verify`);
  console.log('');
  console.log('   🚌 BUS ENDPOINTS:');
  console.log(`   - GET  /api/buses`);
  console.log(`   - GET  /api/buses/:id`);
  console.log(`   - POST /api/buses`);
  console.log(`   - PUT  /api/buses/:id`);
  console.log(`   - DELETE /api/buses/:id`);
  console.log(`   - GET  /api/buses/route/:routeId`);
  console.log(`   - GET  /api/buses/status/:status`);
  console.log(`   - PUT  /api/buses/:id/location`);
  console.log(`   - PUT  /api/buses/:id/assign-driver`);
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