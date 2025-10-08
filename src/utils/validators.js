const Joi = require('joi');

// ==================== AUTH VALIDATORS ====================

const registrationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required',
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required',
  }),
  base_currency: Joi.string().length(3).default('EUR').messages({
    'string.length': 'Currency code must be exactly 3 characters',
  }),
  secondary_currencies: Joi.array().items(Joi.string().length(3)).default([]).messages({
    'string.length': 'Currency codes must be exactly 3 characters',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

// ==================== ACCOUNT VALIDATORS ====================

const accountSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Account name is required',
    'string.min': 'Account name must be at least 2 characters',
    'string.max': 'Account name cannot exceed 100 characters',
  }),
  type: Joi.string()
    .valid('checking', 'savings', 'credit_card', 'loan', 'investment', 'cash')
    .required()
    .messages({
      'any.only': 'Invalid account type',
      'any.required': 'Account type is required',
    }),
  institution: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Institution name is required',
    'string.min': 'Institution name must be at least 2 characters',
    'string.max': 'Institution name cannot exceed 100 characters',
  }),
  currency: Joi.string().length(3).required().messages({
    'string.length': 'Currency code must be exactly 3 characters',
    'any.required': 'Currency is required',
  }),
  opening_balance: Joi.number().default(0).messages({
    'number.base': 'Opening balance must be a number',
  }),
  interest_rate: Joi.number().min(0).max(100).optional().allow(null).messages({
    'number.min': 'Interest rate cannot be negative',
    'number.max': 'Interest rate cannot exceed 100%',
  }),
  credit_limit: Joi.number().min(0).optional().allow(null).messages({
    'number.min': 'Credit limit cannot be negative',
  }),
  is_active: Joi.boolean().default(true),
});

const updateAccountSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Account name must be at least 2 characters',
    'string.max': 'Account name cannot exceed 100 characters',
  }),
  institution: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Institution name must be at least 2 characters',
    'string.max': 'Institution name cannot exceed 100 characters',
  }),
  currency: Joi.string().length(3).optional().messages({
    'string.length': 'Currency code must be exactly 3 characters',
  }),
  current_balance: Joi.number().optional().messages({
    'number.base': 'Current balance must be a number',
  }),
  interest_rate: Joi.number().min(0).max(100).optional().allow(null).messages({
    'number.min': 'Interest rate cannot be negative',
    'number.max': 'Interest rate cannot exceed 100%',
  }),
  credit_limit: Joi.number().min(0).optional().allow(null).messages({
    'number.min': 'Credit limit cannot be negative',
  }),
  is_active: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

// ==================== TRANSACTION VALIDATORS ====================

const transactionSchema = Joi.object({
  type: Joi.string().valid('income', 'expense', 'transfer').required().messages({
    'any.only': 'Type must be income, expense, or transfer',
    'any.required': 'Transaction type is required',
  }),
  date: Joi.date().iso().required().messages({
    'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
    'any.required': 'Transaction date is required',
  }),
  amount: Joi.number().required().messages({
    'number.base': 'Amount must be a number',
    'any.required': 'Amount is required',
  }),
  currency: Joi.string().length(3).required().messages({
    'string.length': 'Currency code must be exactly 3 characters',
    'any.required': 'Currency is required',
  }),
  account_id: Joi.when('type', {
    is: Joi.valid('income', 'expense'),
    then: Joi.string().uuid().required().messages({
      'string.guid': 'Account ID must be a valid UUID',
      'any.required': 'Account ID is required for income/expense transactions',
    }),
    otherwise: Joi.forbidden(),
  }),
  from_account_id: Joi.when('type', {
    is: 'transfer',
    then: Joi.string().uuid().required().messages({
      'string.guid': 'From account ID must be a valid UUID',
      'any.required': 'From account ID is required for transfers',
    }),
    otherwise: Joi.forbidden(),
  }),
  to_account_id: Joi.when('type', {
    is: 'transfer',
    then: Joi.string().uuid().required().messages({
      'string.guid': 'To account ID must be a valid UUID',
      'any.required': 'To account ID is required for transfers',
    }),
    otherwise: Joi.forbidden(),
  }),
  category_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'Category ID must be a valid UUID',
  }),
  payee: Joi.string().max(255).optional().allow('', null).messages({
    'string.max': 'Payee cannot exceed 255 characters',
  }),
  memo: Joi.string().max(500).optional().allow('', null).messages({
    'string.max': 'Memo cannot exceed 500 characters',
  }),
  is_reconciled: Joi.boolean().default(false),
});

const updateTransactionSchema = Joi.object({
  type: Joi.string().valid('income', 'expense', 'transfer').optional().messages({
    'any.only': 'Type must be income, expense, or transfer',
  }),
  date: Joi.date().iso().optional().messages({
    'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
  }),
  amount: Joi.number().optional().messages({
    'number.base': 'Amount must be a number',
  }),
  currency: Joi.string().length(3).optional().messages({
    'string.length': 'Currency code must be exactly 3 characters',
  }),
  account_id: Joi.string().uuid().optional().messages({
    'string.guid': 'Account ID must be a valid UUID',
  }),
  from_account_id: Joi.string().uuid().optional().messages({
    'string.guid': 'From account ID must be a valid UUID',
  }),
  to_account_id: Joi.string().uuid().optional().messages({
    'string.guid': 'To account ID must be a valid UUID',
  }),
  category_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'Category ID must be a valid UUID',
  }),
  payee: Joi.string().max(255).optional().allow('', null).messages({
    'string.max': 'Payee cannot exceed 255 characters',
  }),
  memo: Joi.string().max(500).optional().allow('', null).messages({
    'string.max': 'Memo cannot exceed 500 characters',
  }),
  is_reconciled: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

// ==================== CATEGORY VALIDATORS ====================

const categorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Category name is required',
    'string.min': 'Category name must be at least 2 characters',
    'string.max': 'Category name cannot exceed 100 characters',
  }),
  type: Joi.string().valid('income', 'expense').required().messages({
    'any.only': 'Type must be either income or expense',
    'any.required': 'Category type is required',
  }),
  parent_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'Parent ID must be a valid UUID',
  }),
  icon: Joi.string().max(10).optional().allow('', null).messages({
    'string.max': 'Icon cannot exceed 10 characters',
  }),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Category name must be at least 2 characters',
    'string.max': 'Category name cannot exceed 100 characters',
  }),
  type: Joi.string().valid('income', 'expense').optional().messages({
    'any.only': 'Type must be either income or expense',
  }),
  parent_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'Parent ID must be a valid UUID',
  }),
  icon: Joi.string().max(10).optional().allow('', null).messages({
    'string.max': 'Icon cannot exceed 10 characters',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

// ==================== VALIDATION MIDDLEWARE ====================

const validateRegistration = (req, res, next) => {
  const { error } = registrationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: 'error',
      error: error.details.map((detail) => detail.message).join(', '),
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: 'error',
      error: error.details.map((detail) => detail.message).join(', '),
    });
  }
  next();
};

const validateAccount = (req, res, next) => {
  const { error } = accountSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: 'error',
      error: error.details.map((detail) => detail.message).join(', '),
    });
  }
  next();
};

const validateAccountUpdate = (req, res, next) => {
  const { error } = updateAccountSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: 'error',
      error: error.details.map((detail) => detail.message).join(', '),
    });
  }
  next();
};

const validateTransaction = (req, res, next) => {
  const { error } = transactionSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: 'error',
      error: error.details.map((detail) => detail.message).join(', '),
    });
  }
  next();
};

const validateTransactionUpdate = (req, res, next) => {
  const { error } = updateTransactionSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: 'error',
      error: error.details.map((detail) => detail.message).join(', '),
    });
  }
  next();
};

const validateCategory = (req, res, next) => {
  const { error } = categorySchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: 'error',
      error: error.details.map((detail) => detail.message).join(', '),
    });
  }
  next();
};

const validateCategoryUpdate = (req, res, next) => {
  const { error } = updateCategorySchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: 'error',
      error: error.details.map((detail) => detail.message).join(', '),
    });
  }
  next();
};

// ==================== EXPORTS ====================

module.exports = {
  validateRegistration,
  validateLogin,
  validateAccount,
  validateAccountUpdate,
  validateTransaction,
  validateTransactionUpdate,
  validateCategory,
  validateCategoryUpdate,
};