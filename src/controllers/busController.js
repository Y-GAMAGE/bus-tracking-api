const mongoose = require('mongoose');
const Bus = mongoose.models.Bus || require('../models/Bus');
const Route = require('../models/route');
const asyncHandler = require('express-async-handler');
const User = require('../models/user');

/**
 * @desc    Get all buses with pagination, filtering, and sorting
 * @route   GET /api/buses
 * @access  Public
 */
const getAllBuses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      search,
      sort = 'registrationNumber',
      order = 'asc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    // Role-based filtering
    if (req.user) {
      if (req.user.role === 'operator') {
        // Operators can only see their own buses
        filter['operator.username'] = req.user.username;
      }
      if (req.user.role === 'driver') {
        // Drivers can only see assigned buses
        filter['driver.username'] = req.user.username;
      }
    }
    
    if (status) filter.status = status;
    if (type) filter.type = type;

    if (search) {
      filter.$or = [
        { registrationNumber: { $regex: search, $options: 'i' } },
        { 'operator.username': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const buses = await Bus.find(filter)
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Bus.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      count: buses.length,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      data: buses
    });
  } catch (error) {
    console.error('Get buses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buses'
    });
  }
};

/**
 * @desc    Get single bus by registration number
 * @route   GET /api/buses/:registrationNumber
 * @access  Public
 */
const getBusByRegistrationNumber = async (req, res) => {
  try {
    const { registrationNumber } = req.params;
    
    // Clean and normalize the registration number
    const cleanRegNumber = registrationNumber.trim().toUpperCase();
    
    console.log(`🔍 Searching for bus with registration: "${cleanRegNumber}"`);
    
    const bus = await Bus.findOne({ 
      registrationNumber: cleanRegNumber,
      isActive: true 
    }).select('-__v');

    if (!bus) {
      // Debug: Check if bus exists with different case or status
      const allBuses = await Bus.find({}).select('registrationNumber isActive');
      console.log('📋 All buses in database:', allBuses);
      
      return res.status(404).json({
        success: false,
        message: `Bus with registration number "${cleanRegNumber}" not found`,
        debug: {
          searchedFor: cleanRegNumber,
          availableBuses: allBuses.map(b => ({
            reg: b.registrationNumber,
            active: b.isActive
          }))
        }
      });
    }

    res.status(200).json({
      success: true,
      data: bus
    });
  } catch (error) {
    console.error('Get bus by registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bus'
    });
  }
};

/**
 * @desc    Create new bus
 * @route   POST /api/buses
 * @access  Protected (Admin/Operator)
 */
const createBus = async (req, res) => {
  try {
    // Check permissions
    if (!req.user || !['admin', 'operator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create buses'
      });
    }

    const {
      registrationNumber,
      capacity,
      type,
      amenities,
      specifications,
      permitNumber,
      operator
    } = req.body;

    // Clean and normalize registration number
    const cleanRegNumber = registrationNumber.trim().toUpperCase();

    // Check for duplicate registration
    const existingBus = await Bus.findOne({
      registrationNumber: cleanRegNumber
    });

    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: `Bus with registration number ${cleanRegNumber} already exists`
      });
    }

    // Create bus
    const bus = await Bus.create({
      registrationNumber: cleanRegNumber,
      capacity,
      type,
      permitNumber,
      operator,
      amenities,
      specifications
    });

    console.log(`✅ Bus created successfully: ${cleanRegNumber}`);

    res.status(201).json({
      success: true,
      message: 'Bus created successfully',
      data: bus
    });
  } catch (error) {
    console.error('Create bus error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating bus'
    });
  }
};

/**
 * @desc    Update bus by registration number
 * @route   PUT /api/buses/:registrationNumber
 * @access  Protected (Admin/Operator)
 */
const updateBusByRegistrationNumber = async (req, res) => {
  try {
    // Check permissions
    if (!req.user || !['admin', 'operator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update buses'
      });
    }

    const { registrationNumber } = req.params;
    const cleanRegNumber = registrationNumber.trim().toUpperCase();
    
    let bus = await Bus.findOne({ 
      registrationNumber: cleanRegNumber,
      isActive: true 
    });

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: `Bus with registration number ${cleanRegNumber} not found`
      });
    }

    // Check if operator can update this bus
    if (req.user.role === 'operator' && bus.operator?.username !== req.user.username) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this bus'
      });
    }

    // Check for duplicate registration if changing registration number
    if (req.body.registrationNumber) {
      const newRegNumber = req.body.registrationNumber.trim().toUpperCase();
      if (newRegNumber !== cleanRegNumber) {
        const existingBus = await Bus.findOne({
          registrationNumber: newRegNumber
        });
        
        if (existingBus) {
          return res.status(400).json({
            success: false,
            message: `Registration number ${newRegNumber} already exists`
          });
        }
        req.body.registrationNumber = newRegNumber;
      }
    }

    // Update bus
    bus = await Bus.findOneAndUpdate(
      { registrationNumber: cleanRegNumber },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Bus updated successfully',
      data: bus
    });
  } catch (error) {
    console.error('Update bus error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating bus'
    });
  }
};

/**
 * @desc    Delete bus by registration number (soft delete)
 * @route   DELETE /api/buses/:registrationNumber
 * @access  Protected (Admin only)
 */
const deleteBusByRegistrationNumber = async (req, res) => {
  try {
    // Check permissions
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete buses. Admin access required.'
      });
    }

    const { registrationNumber } = req.params;
    const cleanRegNumber = registrationNumber.trim().toUpperCase();
    
    const bus = await Bus.findOne({ 
      registrationNumber: cleanRegNumber,
      isActive: true 
    });

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: `Bus with registration number ${cleanRegNumber} not found`
      });
    }


    const deletedBus = await Bus.findOneAndDelete({
      registrationNumber: cleanRegNumber
    });

    res.status(200).json({
      success: true,
      message: `Bus ${cleanRegNumber} deleted successfully`
    });
  } catch (error) {
    console.error('Delete bus error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting bus'
    });
  }
};

module.exports = {
  getAllBuses,
  getBusByRegistrationNumber,
  createBus,
  updateBusByRegistrationNumber,
  deleteBusByRegistrationNumber
};