const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001/api';

// Global auth handler that can be set by AuthContext
let authErrorHandler = null;

export function setAuthErrorHandler(handler) {
  authErrorHandler = handler;
}

export async function apiCall(endpoint, method = 'GET', data = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
    },
  };

  if (data && method !== 'GET') {
    // Sanitize data before sending
    const sanitizedData = sanitizeObject(data);
    config.body = JSON.stringify(sanitizedData);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Handle 401 Unauthorized errors specifically
      if (response.status === 401) {
        console.warn('401 Unauthorized - clearing session and redirecting to login');
        if (authErrorHandler) {
          authErrorHandler();
        }
        throw new Error('Session expired. Please log in again.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      // Handle new API response format with data wrapper
      const data = result.data !== undefined ? result.data : result;
      // Don't sanitize trusted fields that contain URLs or repository names
      return sanitizeObject(data, ['auth_url', 'redirect_url', 'name', 'full_name', 'login', 'avatar_url']); 
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

function sanitizeObject(obj, skipSanitizeKeys = []) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, skipSanitizeKeys));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (skipSanitizeKeys.includes(key) && typeof value === 'string') {
        sanitized[key] = value; // Don't sanitize trusted URL fields
      } else {
        sanitized[key] = sanitizeObject(value, skipSanitizeKeys);
      }
    }
    return sanitized;
  }

  return obj;
}

function sanitizeString(str) {
  // Basic XSS prevention - encode HTML entities
  // Note: Forward slashes are safe in JSON and don't need encoding
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}