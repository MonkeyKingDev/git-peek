from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv
from backend.app.auth import auth_router
from backend.app.github import github_router
from backend.app.models import SessionManager
from backend.app.security import SecurityMiddleware, validate_input

load_dotenv()

app = FastAPI(
    title="GitHub Code Visualizer API", 
    version="1.0.0",
    docs_url=None if os.getenv("ENVIRONMENT") == "production" else "/docs",
    redoc_url=None if os.getenv("ENVIRONMENT") == "production" else "/redoc"
)

# Security middleware
app.add_middleware(SecurityMiddleware)
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", os.getenv("ALLOWED_HOST", "localhost")]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.getenv("ENVIRONMENT") != "production" else [os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=False if os.getenv("ENVIRONMENT") != "production" else True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["x-csrf-token"]
)

session_manager = SessionManager()

app.include_router(auth_router, prefix="/auth", tags=["authentication"])
app.include_router(github_router, prefix="/api", tags=["github"])

@app.get("/")
async def root():
    return {"message": "GitHub Code Visualizer API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)