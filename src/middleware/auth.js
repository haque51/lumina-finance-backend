// src/middleware/auth.js

import jwt from 'jsonwebtoken';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        error: 'Token expired'
      });
    }

    return res.status(401).json({
      status: 'error',
      error: 'Invalid token'
    });
  }
};

export const authenticateToken = authenticate;