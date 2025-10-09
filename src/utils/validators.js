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