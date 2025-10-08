const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

const errorResponse = (res, message, statusCode = 400, details = null) => {
  return res.status(statusCode).json({
    status: 'error',
    error: message,
    ...(details && { details })
  });
};

const createdResponse = (res, data, message = 'Resource created successfully') => {
  return res.status(201).json({
    status: 'success',
    message,
    data
  });
};

module.exports = {
  successResponse,
  errorResponse,
  createdResponse
};