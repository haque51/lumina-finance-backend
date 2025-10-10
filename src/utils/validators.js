// src/utils/validators.js

import Joi from 'joi';

// ============= AUTH VALIDATORS =============

const registrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }),
  name: Joi.string().min(2).max(100).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    })
});

// ============= ACCOUNT VALIDATORS =============

const accountSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('checking', 'savings', 'credit_card', 'loan', 'investment', 'cash').required(),
  institution: Joi.string().required(),
  currency: Joi.string().length(3).required(),
  opening_balance: Joi.number().required(),
  interest_rate: Joi.number().optional(),
  credit_limit: Joi.number().optional(),
  is_active: Joi.boolean().optional()
});

const accountUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  institution: Joi.string().optional(),
  currency: Joi.string().length(3).optional(),
  current_balance: Joi.number().optional(),
  interest_rate: Joi.number().optional(),
  credit_limit: Joi.number().optional(),
  is_active: Joi.boolean().optional()
}).min(1);

// ============= TRANSACTION VALIDATORS =============

const transactionSchema = Joi.object({
  date: Joi.date().required(),
  type: Joi.string().valid('income', 'expense', 'transfer').required(),
  account_id: Joi.string().uuid().when('type', {
    is: Joi.string().valid('income', 'expense'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  from_account_id: Joi.string().uuid().when('type', {
    is: 'transfer',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  to_account_id: Joi.string().uuid().when('type', {
    is: 'transfer',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  payee: Joi.string().optional(),
  category_id: Joi.string().uuid().optional(),
  amount: Joi.number().required(),
  currency: Joi.string().length(3).required(),
  memo: Joi.string().optional()
});

const transactionUpdateSchema = Joi.object({
  date: Joi.date().optional(),
  payee: Joi.string().optional(),
  category_id: Joi.string().uuid().optional(),
  amount: Joi.number().optional(),
  memo: Joi.string().optional()
}).min(1);

// ============= CATEGORY VALIDATORS =============

const categorySchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('income', 'expense').required(),
  parent_id: Joi.string().uuid().optional().allow(null),
  icon: Joi.string().optional()
});

const categoryUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  parent_id: Joi.string().uuid().optional().allow(null),
  icon: Joi.string().optional()
}).min(1);

// ============= BUDGET VALIDATORS =============

const budgetSchema = Joi.object({
  month: Joi.string()
    .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
    .required()
    .messages({
      'string.pattern.base': 'Month must be in YYYY-MM format',
      'any.required': 'Month is required'
    }),
  category_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Category ID must be a valid UUID',
      'any.required': 'Category ID is required'
    }),
  budgeted: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Budget amount must be positive',
      'any.required': 'Budget amount is required'
    })
});

const budgetUpdateSchema = Joi.object({
  month: Joi.string()
    .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional()
    .messages({
      'string.pattern.base': 'Month must be in YYYY-MM format'
    }),
  category_id: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Category ID must be a valid UUID'
    }),
  budgeted: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.positive': 'Budget amount must be positive'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// ============= VALIDATION MIDDLEWARE =============

export const validateRegistration = (req, res, next) => {
  const { error } = registrationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  next();
};

export const validateChangePassword = (req, res, next) => {
  const { error } = changePasswordSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  next();
};

export const validateAccount = (req, res, next) => {
  const { error } = accountSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  next();
};

export const validateAccountUpdate = (req, res, next) => {
  const { error } = accountUpdateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  next();
};

export const validateTransaction = (req, res, next) => {
  const { error } = transactionSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  next();
};

export const validateTransactionUpdate = (req, res, next) => {
  const { error } = transactionUpdateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  next();
};

export const validateCategory = (req, res, next) => {
  const { error } = categorySchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  next();
};

export const validateCategoryUpdate = (req, res, next) => {
  const { error } = categoryUpdateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  next();
};

export const validateBudget = (req, res, next) => {
  const { error } = budgetSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  next();
};

export const validateBudgetUpdate = (req, res, next) => {
  const { error } = budgetUpdateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  next();
};

// ============================================================
// GOAL VALIDATORS
// ============================================================

/**
 * Validation schema for creating a goal
 */
const goalSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Goal name is required',
      'string.max': 'Goal name must not exceed 100 characters',
    }),

  target_amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Target amount must be a number',
      'number.positive': 'Target amount must be positive',
    }),

  current_amount: Joi.number()
    .min(0)
    .precision(2)
    .default(0)
    .messages({
      'number.base': 'Current amount must be a number',
      'number.min': 'Current amount cannot be negative',
    }),

  target_date: Joi.date()
    .iso()
    .min('now')
    .allow(null)
    .messages({
      'date.base': 'Target date must be a valid date',
      'date.min': 'Target date must be in the future',
    }),

  linked_account_id: Joi.string()
    .uuid()
    .allow(null)
    .messages({
      'string.guid': 'Linked account ID must be a valid UUID',
    }),
});

/**
 * Validation schema for updating a goal
 */
const goalUpdateSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .messages({
      'string.empty': 'Goal name cannot be empty',
      'string.max': 'Goal name must not exceed 100 characters',
    }),

  target_amount: Joi.number()
    .positive()
    .precision(2)
    .messages({
      'number.base': 'Target amount must be a number',
      'number.positive': 'Target amount must be positive',
    }),

  current_amount: Joi.number()
    .min(0)
    .precision(2)
    .messages({
      'number.base': 'Current amount must be a number',
      'number.min': 'Current amount cannot be negative',
    }),

  target_date: Joi.date()
    .iso()
    .allow(null)
    .messages({
      'date.base': 'Target date must be a valid date',
    }),

  linked_account_id: Joi.string()
    .uuid()
    .allow(null)
    .messages({
      'string.guid': 'Linked account ID must be a valid UUID',
    }),
}).min(1);

/**
 * Middleware to validate goal creation
 */
export const validateGoal = (req, res, next) => {
  const { error } = goalSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  
  next();
};

/**
 * Middleware to validate goal update
 */
export const validateGoalUpdate = (req, res, next) => {
  const { error } = goalUpdateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  
  next();
};

// ============================================================
// RECURRING TRANSACTION VALIDATORS
// ============================================================

/**
 * Validation schema for creating a recurring transaction
 */
const recurringSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Recurring transaction name is required',
      'string.max': 'Name must not exceed 100 characters',
    }),

  account_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Account ID must be a valid UUID',
      'any.required': 'Account ID is required',
    }),

  type: Joi.string()
    .valid('income', 'expense')
    .required()
    .messages({
      'any.only': 'Type must be either "income" or "expense"',
      'any.required': 'Transaction type is required',
    }),

  payee: Joi.string()
    .trim()
    .max(255)
    .allow(null, '')
    .messages({
      'string.max': 'Payee must not exceed 255 characters',
    }),

  category_id: Joi.string()
    .uuid()
    .allow(null)
    .messages({
      'string.guid': 'Category ID must be a valid UUID',
    }),

  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required',
    }),

  currency: Joi.string()
    .length(3)
    .uppercase()
    .messages({
      'string.length': 'Currency must be a 3-letter code',
    }),

  frequency: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'yearly')
    .required()
    .messages({
      'any.only': 'Frequency must be one of: daily, weekly, monthly, yearly',
      'any.required': 'Frequency is required',
    }),

  interval: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Interval must be a number',
      'number.min': 'Interval must be at least 1',
    }),

  start_date: Joi.date()
    .iso()
    .required()
    .messages({
      'date.base': 'Start date must be a valid date',
      'any.required': 'Start date is required',
    }),

  end_date: Joi.date()
    .iso()
    .min(Joi.ref('start_date'))
    .allow(null)
    .messages({
      'date.base': 'End date must be a valid date',
      'date.min': 'End date must be after start date',
    }),

  is_active: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'is_active must be a boolean',
    }),
});

/**
 * Validation schema for updating a recurring transaction
 */
const recurringUpdateSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .messages({
      'string.empty': 'Name cannot be empty',
      'string.max': 'Name must not exceed 100 characters',
    }),

  account_id: Joi.string()
    .uuid()
    .messages({
      'string.guid': 'Account ID must be a valid UUID',
    }),

  type: Joi.string()
    .valid('income', 'expense')
    .messages({
      'any.only': 'Type must be either "income" or "expense"',
    }),

  payee: Joi.string()
    .trim()
    .max(255)
    .allow(null, '')
    .messages({
      'string.max': 'Payee must not exceed 255 characters',
    }),

  category_id: Joi.string()
    .uuid()
    .allow(null)
    .messages({
      'string.guid': 'Category ID must be a valid UUID',
    }),

  amount: Joi.number()
    .positive()
    .precision(2)
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
    }),

  currency: Joi.string()
    .length(3)
    .uppercase()
    .messages({
      'string.length': 'Currency must be a 3-letter code',
    }),

  frequency: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'yearly')
    .messages({
      'any.only': 'Frequency must be one of: daily, weekly, monthly, yearly',
    }),

  interval: Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'Interval must be a number',
      'number.min': 'Interval must be at least 1',
    }),

  start_date: Joi.date()
    .iso()
    .messages({
      'date.base': 'Start date must be a valid date',
    }),

  end_date: Joi.date()
    .iso()
    .allow(null)
    .messages({
      'date.base': 'End date must be a valid date',
    }),

  is_active: Joi.boolean()
    .messages({
      'boolean.base': 'is_active must be a boolean',
    }),
}).min(1);

/**
 * Middleware to validate recurring transaction creation
 */
export const validateRecurring = (req, res, next) => {
  const { error } = recurringSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  
  next();
};

/**
 * Middleware to validate recurring transaction update
 */
export const validateRecurringUpdate = (req, res, next) => {
  const { error } = recurringUpdateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  
  next();
};

export const currencyConversionSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required'
  }),
  from: Joi.string()
    .length(3)
    .uppercase()
    .required()
    .messages({
      'string.length': 'Currency code must be 3 characters',
      'any.required': 'From currency is required'
    }),
  to: Joi.string()
    .length(3)
    .uppercase()
    .required()
    .messages({
      'string.length': 'Currency code must be 3 characters',
      'any.required': 'To currency is required'
    })
});

export const exchangeRateUpdateSchema = Joi.object({
  rate: Joi.number().positive().required().messages({
    'number.base': 'Rate must be a number',
    'number.positive': 'Rate must be positive',
    'any.required': 'Rate is required'
  })
});

// ===========================
// VALIDATION MIDDLEWARE
// ===========================

export const validateCurrencyConversion = (req, res, next) => {
  const { error } = currencyConversionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      error: error.details[0].message
    });
  }
  next();
};

export const validateExchangeRateUpdate = (req, res, next) => {
  const { error } = exchangeRateUpdateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      error: error.details[0].message
    });
  }
  next();
};