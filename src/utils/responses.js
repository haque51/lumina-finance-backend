const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json(data);
};

const errorResponse = (res, message, statusCode = 400, details = null) => {
  return res.status(statusCode).json({
    error: message,
    ...(details && { details })
  });
};

const createdResponse = (res, data) => {
  return res.status(201).json(data);
};

module.exports = {
  successResponse,
  errorResponse,
  createdResponse
};
