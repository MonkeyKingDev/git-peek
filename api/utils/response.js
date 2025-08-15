/**
 * HTTP response utility functions
 */

/**
 * Set CORS headers for API responses
 * @param {object} res - Response object
 */
export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Handle OPTIONS requests for CORS preflight
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {boolean} True if OPTIONS request was handled
 */
export function handleCors(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  
  return false;
}

/**
 * Send error response with consistent format
 * @param {object} res - Response object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {Error} error - Optional error object for logging
 */
export function sendError(res, status, message, error = null) {
  if (error) {
    console.error('API Error:', error);
  }
  
  res.status(status).json({ 
    error: message,
    timestamp: new Date().toISOString()
  });
}

/**
 * Send success response with data
 * @param {object} res - Response object
 * @param {any} data - Response data
 * @param {object} meta - Optional metadata
 */
export function sendSuccess(res, data, meta = {}) {
  const response = {
    data,
    ...meta,
    timestamp: new Date().toISOString()
  };
  
  res.status(200).json(response);
}

/**
 * Wrap async handler to catch errors
 * @param {function} handler - Async handler function
 * @returns {function} Wrapped handler
 */
export function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('Unhandled error in API handler:', error);
      
      if (error.message === 'Session ID not provided') {
        return sendError(res, 400, error.message);
      }
      
      if (error.message.includes('Invalid or expired session')) {
        return sendError(res, 401, error.message);
      }
      
      if (error.message.includes('GitHub token expired')) {
        return sendError(res, 401, error.message);
      }
      
      if (error.message.includes('not found')) {
        return sendError(res, 404, error.message);
      }
      
      sendError(res, 500, 'Internal server error', error);
    }
  };
}