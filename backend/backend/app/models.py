from pydantic import BaseModel
from typing import Dict, Optional, List, Any
import secrets
import time

class GitHubUser(BaseModel):
    id: int
    login: str
    name: Optional[str]
    email: Optional[str]
    avatar_url: str

class Repository(BaseModel):
    id: int
    name: str
    full_name: str
    private: bool
    description: Optional[str]
    language: Optional[str]
    created_at: str
    updated_at: str

class Session(BaseModel):
    session_id: str
    access_token: str
    user: GitHubUser
    created_at: float
    expires_at: float

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, Session] = {}
        self.session_timeout = 3600  # 1 hour
    
    def create_session(self, access_token: str, user: GitHubUser) -> str:
        session_id = secrets.token_urlsafe(32)
        current_time = time.time()
        
        session = Session(
            session_id=session_id,
            access_token=access_token,
            user=user,
            created_at=current_time,
            expires_at=current_time + self.session_timeout
        )
        
        self.sessions[session_id] = session
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Session]:
        session = self.sessions.get(session_id)
        if session and session.expires_at > time.time():
            return session
        elif session:
            del self.sessions[session_id]
        return None
    
    def delete_session(self, session_id: str) -> bool:
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False
    
    def cleanup_expired_sessions(self):
        current_time = time.time()
        expired_sessions = [
            sid for sid, session in self.sessions.items() 
            if session.expires_at <= current_time
        ]
        for sid in expired_sessions:
            del self.sessions[sid]

class RepositoryAnalysis(BaseModel):
    repository: Repository
    code_ownership: Dict[str, Any]
    knowledge_areas: Dict[str, List[Dict[str, Any]]]
    activity_heatmap: Dict[str, Any]
    dependency_risk: Dict[str, Any]