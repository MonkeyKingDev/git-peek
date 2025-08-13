from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import re
import html
import secrets
import time
from typing import Dict

class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.csrf_tokens: Dict[str, float] = {}
        self.rate_limits: Dict[str, list] = {}
        self.csrf_token_lifetime = 3600  # 1 hour
        self.rate_limit_window = 60  # 1 minute
        self.rate_limit_max_requests = 100
    
    async def dispatch(self, request: Request, call_next):
        # Add security headers
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self'; "
            "font-src 'self'; "
            "object-src 'none'; "
            "media-src 'self'; "
            "frame-src 'none';"
        )
        
        return response

def validate_input(data: str, max_length: int = 1000, allow_html: bool = False) -> str:
    if not data:
        return data
    
    if len(data) > max_length:
        raise HTTPException(status_code=400, detail=f"Input too long (max {max_length} characters)")
    
    # Check for potential XSS attempts
    xss_patterns = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',
        r'<iframe[^>]*>.*?</iframe>',
        r'<object[^>]*>.*?</object>',
        r'<embed[^>]*>.*?</embed>',
    ]
    
    for pattern in xss_patterns:
        if re.search(pattern, data, re.IGNORECASE | re.DOTALL):
            raise HTTPException(status_code=400, detail="Potentially malicious content detected")
    
    # Sanitize HTML if not allowed
    if not allow_html:
        data = html.escape(data)
    
    return data

def validate_session_id(session_id: str) -> bool:
    if not session_id:
        return False
    
    # Session ID should be alphanumeric and reasonable length
    if not re.match(r'^[a-zA-Z0-9_-]{32,}$', session_id):
        return False
    
    return True

def validate_github_data(data: dict) -> dict:
    """Validate and sanitize data from GitHub API"""
    if not isinstance(data, dict):
        return {}
    
    # Recursively validate nested dictionaries and lists
    validated = {}
    for key, value in data.items():
        if isinstance(value, str):
            # Sanitize string values
            validated[key] = html.escape(value[:1000])  # Limit string length
        elif isinstance(value, (int, float, bool)):
            validated[key] = value
        elif isinstance(value, dict):
            validated[key] = validate_github_data(value)
        elif isinstance(value, list):
            validated[key] = [
                validate_github_data(item) if isinstance(item, dict) 
                else html.escape(str(item)[:1000]) if isinstance(item, str)
                else item
                for item in value[:100]  # Limit list length
            ]
        else:
            # Convert other types to string and sanitize
            validated[key] = html.escape(str(value)[:1000])
    
    return validated

class RateLimiter:
    def __init__(self):
        self.requests: Dict[str, list] = {}
        self.max_requests = 100
        self.window_seconds = 60
    
    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        
        # Clean old requests
        if client_ip in self.requests:
            self.requests[client_ip] = [
                req_time for req_time in self.requests[client_ip]
                if now - req_time < self.window_seconds
            ]
        else:
            self.requests[client_ip] = []
        
        # Check if limit exceeded
        if len(self.requests[client_ip]) >= self.max_requests:
            return False
        
        # Add current request
        self.requests[client_ip].append(now)
        return True