// src/utils/validators.js
const Joi = require('joi');

// ==================== AUTH VALIDATORS ====================

const registrationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }),
  baseCurrency: Joi.string().valid('EUR', 'USD', 'BDT').default('EUR'),
  secondaryCurrencies: Joi.array().items(Joi.string().valid('EUR', 'USD', 'BDT')).default([])
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
});

// ==================== ACCOUNT VALIDATORS ====================

const accountSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string().valid('checking', 'savings', 'credit_card', 'loan', 'investment', 'cash').required(),
  institution: Joi.string().min(2).max(100).required(),
  currency: Joi.string().valid('EUR', 'USD', 'BDT').required(),
  openingBalance: Joi.number().default(0),
  currentBalance: Joi.number().optional(),
  isActive: Joi.boolean().default(true),
  interestRate: Joi.number().min(0).max(100).optional(),
  creditLimit: Joi.number().min(0).optional()
});

const updateAccountSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  type: Joi.string().valid('checking', 'savings', 'credit_card', 'loan', 'investment', 'cash').optional(),
  institution: Joi.string().min(2).max(100).optional(),
  currency: Joi.string().valid('EUR', 'USD', 'BDT').optional(),
  currentBalance: Joi.number().optional(),
  isActive: Joi.boolean().optional(),
  interestRate: Joi.number().min(0).max(100).optional(),
  creditLimit: Joi.number().min(0).optional()
}).min(1);

// ==================== TRANSACTION VALIDATORS ====================

const createTransactionSchema = Joi.object({
  date: Joi.date().required(),
  type: Joi.string().valid('income', 'expense', 'transfer').required(),
  
  // For income/expense
  accountId: Joi.string().uuid().when('type', {
    is: Joi.valid('income', 'expense'),
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  payee: Joi.string().max(255).when('type', {
    is: Joi.valid('income', 'expense'),
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  
  // For transfer
  fromAccountId: Joi.string().uuid().when('type', {
    is: 'transfer',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  toAccountId: Joi.string().uuid().when('type', {
    is: 'transfer',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  // Common fields
  categoryId: Joi.string().uuid().optional().allow(null),
  amount: Joi.number().positive().required(),
  currency: Joi.string().valid('EUR', 'USD', 'BDT').optional(),
  memo: Joi.string().max(500).optional().allow('')
});

const updateTransactionSchema = Joi.object({
  date: Joi.date().optional(),
  type: Joi.string().valid('income', 'expense', 'transfer').optional(),
  accountId: Joi.string().uuid().optional(),
  fromAccountId: Joi.string().uuid().optional(),
  toAccountId: Joi.string().uuid().optional(),
  payee: Joi.string().max(255).optional().allow(''),
  categoryId: Joi.string().uuid().optional().allow(null),
  amount: Joi.number().positive().optional(),
  currency: Joi.string().valid('EUR', 'USD', 'BDT').optional(),
  memo: Joi.string().max(500).optional().allow('')
}).min(1);

const transactionQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  type: Joi.string().valid('income', 'expense', 'transfer').optional(),
  accountId: Joi.string().uuid().optional(),
  categoryId: Joi.string().uuid().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  minAmount: Joi.number().optional(),
  maxAmount: Joi.number().optional(),
  search: Joi.string().max(100).optional(),
  isReconciled: Joi.string().valid('true', 'false').optional()
});

// ==================== MIDDLEWARE VALIDATORS ====================

const validateRegistration = (req, res, next) => {
  const { error } = registrationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateChangePassword = (req, res, next) => {
  const { error } = changePasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateAccount = (req, res, next) => {
  const { error } = accountSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateAccountUpdate = (req, res, next) => {
  const { error } = updateAccountSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateCreateTransaction = (req, res, next) => {
  const { error } = createTransactionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateUpdateTransaction = (req, res, next) => {
  const { error } = updateTransactionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateTransactionQuery = (req, res, next) => {
  const { error } = transactionQuerySchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

module.exports = {
  // Auth validators
  validateRegistration,
  validateLogin,
  validateChangePassword,
  
  // Account validators
  validateAccount,
  validateAccountUpdate,
  
  // Transaction validators
  validateCreateTransaction,
  validateUpdateTransaction,
  validateTransactionQuery
};