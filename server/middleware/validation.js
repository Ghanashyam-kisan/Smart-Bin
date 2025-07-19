const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['resident', 'authority'])
    .withMessage('Role must be either resident or authority'),
  handleValidationErrors,
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

// Bin validation rules
const validateBinCreation = [
  body('binId')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Bin ID must be between 3 and 20 characters'),
  body('type')
    .isIn(['general', 'recycling', 'organic', 'hazardous'])
    .withMessage('Invalid bin type'),
  body('location.address')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Address must be at least 5 characters'),
  body('location.coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  handleValidationErrors,
];

// Pickup request validation rules
const validatePickupRequest = [
  body('bin')
    .isMongoId()
    .withMessage('Invalid bin ID'),
  body('requestedDate')
    .isISO8601()
    .toDate()
    .withMessage('Invalid date format'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('type')
    .optional()
    .isIn(['regular', 'emergency', 'bulk', 'special'])
    .withMessage('Invalid request type'),
  handleValidationErrors,
];

// Report validation rules
const validateReport = [
  body('type')
    .isIn(['overflow', 'damage', 'maintenance', 'contamination', 'missing', 'vandalism', 'other'])
    .withMessage('Invalid report type'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('location.coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  handleValidationErrors,
];

// Common validation rules
const validateObjectId = (field) => [
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`),
  handleValidationErrors,
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateBinCreation,
  validatePickupRequest,
  validateReport,
  validateObjectId,
  validatePagination,
};