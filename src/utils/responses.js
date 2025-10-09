// src/utils/responses.js

export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

export const errorResponse = (res, error, statusCode = 500) => {
  return res.status(statusCode).json({
    status: 'error',
    error: error
  });
};