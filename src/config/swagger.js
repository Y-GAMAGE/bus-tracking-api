const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'NTC Bus Tracking API',
    version: '2.0.0',
    description: 'Real-Time Bus Tracking System for Inter-Provincial Services in Sri Lanka'
  },
  servers: [
    {
      url: 'https://bus-tracking-api.onrender.com',
      description: 'Production server'
    },
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token from /api/auth/login'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

console.log('Current directory:', __dirname);
console.log('Looking for routes at:', path.join(__dirname, '../routes/'));

const options = {
  swaggerDefinition,
  apis: [
    path.join(__dirname, '../routes/authRoutes.js'),
    path.join(__dirname, '../routes/busRoutes.js'),
    path.join(__dirname, '../routes/routeRoutes.js'),
    path.join(__dirname, '../routes/tripRoutes.js'),
    path.join(__dirname, '../routes/locationRoutes.js')
  ]
};

let swaggerSpec;
try {
  swaggerSpec = swaggerJsdoc(options);
  console.log('✅ Swagger loaded successfully');
  console.log('Swagger paths found:', Object.keys(swaggerSpec.paths || {}));
  console.log('Number of endpoints:', Object.keys(swaggerSpec.paths || {}).length);
} catch (error) {
  console.error('❌ Swagger parsing error:', error.message);
  
  // Fallback swagger spec
  swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'NTC Bus Tracking API (Error Mode)',
      version: '2.0.0',
      description: 'Swagger parsing failed - check console for errors'
    },
    paths: {}
  };
}

module.exports = { swaggerUi, swaggerSpec };