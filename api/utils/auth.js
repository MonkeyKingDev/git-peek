import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Verify JWT token and return decoded payload
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired session');
  }
}

/**
 * Create JWT token with user data and access token
 * @param {object} user - User data from GitHub
 * @param {string} accessToken - GitHub access token
 * @param {number} expiresInHours - Token expiration in hours (default: 24)
 * @returns {string} JWT token
 */
export function createToken(user, accessToken, expiresInHours = 24) {
  const payload = {
    user,
    access_token: accessToken,
    exp: Math.floor(Date.now() / 1000) + (3600 * expiresInHours)
  };
  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Middleware to verify session from query parameters
 * @param {object} req - Request object
 * @returns {object} Decoded session data
 * @throws {Error} If session is invalid
 */
export function getSessionFromRequest(req) {
  const { session_id } = req.query;
  
  if (!session_id) {
    throw new Error('Session ID not provided');
  }
  
  return verifyToken(session_id);
}