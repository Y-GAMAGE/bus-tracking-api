const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { 
  validateFields, 
  validateEmail, 
  validatePassword 
} = require('../middleware/validation');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validateFields(['username', 'email', 'password']),
  validateEmail,
  validatePassword,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user & get token
 * @access  Public
 */
router.post(
  '/login',
  validateFields(['email', 'password']),
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get(
  '/me',
  protect,
  authController.getMe
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  protect,
  authController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put(
  '/change-password',
  protect,
  validateFields(['currentPassword', 'newPassword']),
  authController.changePassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post(
  '/logout',
  protect,
  authController.logout
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset token
 * @access  Public
 */
router.post(
  '/forgot-password',
  validateFields(['email']),
  validateEmail,
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post(
  '/reset-password',
  validateFields(['resetToken', 'newPassword']),
  validatePassword,
  authController.resetPassword
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if token is valid
 * @access  Private
 */
router.get(
  '/verify',
  protect,
  authController.verifyToken
);

module.exports = router;