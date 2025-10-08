const Joi = require('joi');
const { errorResponse } = require('./responses');

// Account type enum
const ACCOUNT_TYPES = ['checking', 'savings', 'credit_card', 'loan', 'investment', 'cash'];

// Currency codes
const CURRENCY_CODES = ['EUR', 'USD', 'BDT', 'GBP', 'JPY', 'INR'];

/**
 * Account validation schema
 */
const accountSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Account name is required',
      'string.max': 'Account name must be at most 255 characters'
    }),

  type: Joi.string()
    .valid(...ACCOUNT_TYPES)
    .required()
    .messages({
      'any.only': `Account type must be one of: ${ACCOUNT_TYPES.join(', ')}`,
      'any.required': 'Account type is required'
    }),

  institution: Joi.string()
    .max(255)
    .allow(null, '')
    .optional(),

  currency: Joi.string()
    .valid(...CURRENCY_CODES)
    .default('EUR')
    .messages({
      'any.only': `Currency must be one of: ${CURRENCY_CODES.join(', ')}`
    }),

  opening_balance: Joi.number()
    .default(0)
    .messages({
      'number.base': 'Opening balance must be a number'
    }),

  current_balance: Joi.number()
    .optional()
    .messages({
      'number.base': 'Current balance must be a number'
    }),

  interest_rate: Joi.number()
    .min(0)
    .max(100)
    .allow(null)
    .optional()
    .messages({
      'number.min': 'Interest rate must be at least 0',
      'number.max': 'Interest rate cannot exceed 100'
    }),

  credit_limit: Joi.number()
    .min(0)
    .allow(null)
    .optional()
    .messages({
      'number.min': 'Credit limit must be at least 0'
    }),

  is_active: Joi.boolean()
    .default(true)
});

/**
 * Account update validation schema (all fields optional)
 */
const accountUpdateSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .optional()
    .messages({
      'string.empty': 'Account name cannot be empty',
      'string.max': 'Account name must be at most 255 characters'
    }),

  type: Joi.string()
    .valid(...ACCOUNT_TYPES)
    .optional()
    .messages({
      'any.only': `Account type must be one of: ${ACCOUNT_TYPES.join(', ')}`
    }),

  institution: Joi.string()
    .max(255)
    .allow(null, '')
    .optional(),

  currency: Joi.string()
    .valid(...CURRENCY_CODES)
    .optional()
    .messages({
      'any.only': `Currency must be one of: ${CURRENCY_CODES.join(', ')}`
    }),

  opening_balance: Joi.number()
    .optional()
    .messages({
      'number.base': 'Opening balance must be a number'
    }),

  current_balance: Joi.number()
    .optional()
    .messages({
      'number.base': 'Current balance must be a number'
    }),

  interest_rate: Joi.number()
    .min(0)
    .max(100)
    .allow(null)
    .optional()
    .messages({
      'number.min': 'Interest rate must be at least 0',
      'number.max': 'Interest rate cannot exceed 100'
    }),

  credit_limit: Joi.number()
    .min(0)
    .allow(null)
    .optional()
    .messages({
      'number.min': 'Credit limit must be at least 0'
    }),

  is_active: Joi.boolean()
    .optional()
}).min(1); // At least one field must be provided for update

/**
 * Registration validation schema
 */
const registrationSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must be at most 100 characters'
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be a valid email address'
    }),

  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }),

  base_currency: Joi.string()
    .valid('EUR', 'USD', 'BDT')
    .default('EUR')
});

/**
 * Login validation schema
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be a valid email address'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
    })
});

/**
 * Change password validation schema
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required'
    }),

  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number'
    })
});

/**
 * Middleware to validate registration
 */
const validateRegistration = (req, res, next) => {
  const { error } = registrationSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return errorResponse(res, 'Validation failed', 400, errors);
  }
  
  next();
};

/**
 * Middleware to validate login
 */
const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return errorResponse(res, 'Validation failed', 400, errors);
  }
  
  next();
};

/**
 * Middleware to validate password change
 */
const validatePasswordChange = (req, res, next) => {
  const { error } = changePasswordSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return errorResponse(res, 'Validation failed', 400, errors);
  }
  
  next();
};

/**
 * Middleware to validate account creation
 */
const validateAccount = (req, res, next) => {
  const { error } = accountSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return errorResponse(res, 'Validation failed', 400, errors);
  }
  
  next();
};

/**
 * Middleware to validate account update
 */
const validateAccountUpdate = (req, res, next) => {
  const { error } = accountUpdateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return errorResponse(res, 'Validation failed', 400, errors);
  }
  
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validatePasswordChange,
  validateAccount,
  validateAccountUpdate
};