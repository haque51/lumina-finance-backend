const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
      'string.empty': 'Email cannot be empty'
    }),
  
  password: Joi.string()
    .min(8)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }),
  
  name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 255 characters',
      'any.required': 'Name is required'
    })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  
  newPassword: Joi.string()
    .min(8)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'any.required': 'New password is required',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number'
    })
});

const validate = (schema) => {
  return (data) => {
    const result = schema.validate(data, { 
      abortEarly: false,
      stripUnknown: true
    });
    
    if (result.error) {
      const errors = {};
      result.error.details.forEach(detail => {
        errors[detail.path[0]] = detail.message;
      });
      return { 
        error: { 
          message: 'Validation failed',
          details: errors 
        } 
      };
    }
    
    return { value: result.value };
  };
};

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateChangePassword: validate(changePasswordSchema)
};
