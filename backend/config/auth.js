const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET  = process.env.JWT_SECRET  || 'fallback_secret_change_this';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Sign a JWT token for a user
 * @param {object} payload - data to encode (id, email)
 * @returns {string} signed JWT
 */
const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
};

/**
 * Verify a JWT token
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { signToken, verifyToken };
