from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import RedirectResponse, HTMLResponse
import httpx
import os
import secrets
import urllib.parse
from backend.app.models import GitHubUser, SessionManager
from backend.app.security import validate_input, validate_session_id, validate_github_data

auth_router = APIRouter()
session_manager = SessionManager()

# In-memory store for OAuth state (non-persistent)
oauth_states = {}

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

print(f"Environment variables loaded:")
print(f"GITHUB_CLIENT_ID: {GITHUB_CLIENT_ID}")
print(f"FRONTEND_URL: {FRONTEND_URL}")

if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
    print("⚠️  Warning: GitHub OAuth credentials not configured. Some features will not work.")
    GITHUB_CLIENT_ID = "dummy"
    GITHUB_CLIENT_SECRET = "dummy"

@auth_router.get("/login")
async def github_login(request: Request):
    state = secrets.token_urlsafe(32)
    oauth_states[state] = True
    
    params = {
        'client_id': GITHUB_CLIENT_ID,
        'redirect_uri': f"{request.base_url}auth/callback",
        'scope': 'repo read:org',
        'state': state
    }
    
    github_url = f"https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}"
    return {"auth_url": github_url, "state": state}

@auth_router.get("/callback")
async def github_callback(code: str, state: str, request: Request, response: Response):
    print(f"=== OAuth Callback Hit ===")
    print(f"Code: {code}")
    print(f"State: {state}")
    print(f"Request URL: {request.url}")
    print(f"OAuth states: {list(oauth_states.keys())}")
    
    if state not in oauth_states:
        print(f"State {state} not found in oauth_states")
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    # Clean up the used state
    del oauth_states[state]
    print("State validated and cleaned up")
    
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not provided")
    
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                'client_id': GITHUB_CLIENT_ID,
                'client_secret': GITHUB_CLIENT_SECRET,
                'code': code
            },
            headers={'Accept': 'application/json'}
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        token_data = token_response.json()
        access_token = token_data.get('access_token')
        
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received")
        
        user_response = await client.get(
            "https://api.github.com/user",
            headers={'Authorization': f'token {access_token}'}
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        user_data = validate_github_data(user_response.json())
        user = GitHubUser(
            id=user_data['id'],
            login=user_data['login'],
            name=user_data.get('name') if user_data.get('name') else None,
            email=user_data.get('email') if user_data.get('email') else None,
            avatar_url=user_data['avatar_url']
        )
        
        session_id = session_manager.create_session(access_token, user)
        print(f"Created session: {session_id}")
        print(f"User data: {user}")
        
        redirect_url = f"{FRONTEND_URL}/dashboard?session={session_id}"
        print(f"Redirecting to: {redirect_url}")
        
        # Use standard HTTP redirect
        return RedirectResponse(url=redirect_url, status_code=302)

@auth_router.get("/user")
async def get_current_user(session_id: str):
    print(f"get_current_user called with session_id: {session_id}")
    if not validate_session_id(session_id):
        print(f"Invalid session ID format: {session_id}")
        raise HTTPException(status_code=400, detail="Invalid session ID format")
    
    session = session_manager.get_session(session_id)
    print(f"Retrieved session: {session}")
    if not session:
        print(f"No session found or expired for: {session_id}")
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    print(f"Returning user: {session.user}")
    return session.user

@auth_router.post("/logout")
async def logout(session_id: str):
    success = session_manager.delete_session(session_id)
    return {"success": success, "message": "Logged out successfully"}


def get_current_session(session_id: str):
    if not validate_session_id(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID format")
    
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return session