"""Session manager — track pipeline state across sessions."""
from typing import Dict, Optional
from app.models.schemas import PipelineState, PipelineStage


class SessionManager:
    """In-memory session management for pipeline states."""
    
    def __init__(self):
        self._sessions: Dict[str, PipelineState] = {}
    
    def create_session(self, repo_id: str, goal: str) -> PipelineState:
        """Create a new pipeline session."""
        state = PipelineState(repo_id=repo_id, goal=goal)
        self._sessions[state.session_id] = state
        return state
    
    def get_session(self, session_id: str) -> Optional[PipelineState]:
        """Get a session by ID."""
        return self._sessions.get(session_id)
    
    def update_stage(self, session_id: str, stage: PipelineStage) -> None:
        """Update the pipeline stage."""
        if session_id in self._sessions:
            self._sessions[session_id].stage = stage
    
    def set_error(self, session_id: str, error: str) -> None:
        """Set an error on a session."""
        if session_id in self._sessions:
            self._sessions[session_id].stage = PipelineStage.FAILED
            self._sessions[session_id].error = error
    
    def list_sessions(self) -> list:
        """List all active sessions."""
        return [
            {
                "session_id": s.session_id,
                "repo_id": s.repo_id,
                "goal": s.goal[:100],
                "stage": s.stage,
                "created_at": s.created_at,
            }
            for s in self._sessions.values()
        ]


session_manager = SessionManager()
