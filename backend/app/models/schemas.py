"""Pydantic models for API request/response schemas."""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
import uuid


# ── Enums ──────────────────────────────────────────────

class PipelineStage(str, Enum):
    IDLE = "idle"
    ANALYZING = "analyzing"
    PLANNING = "planning"
    CODING = "coding"
    REVIEWING = "reviewing"
    COMPLETED = "completed"
    FAILED = "failed"


class FileAction(str, Enum):
    CREATE = "create"
    MODIFY = "modify"
    DELETE = "delete"


class ReviewVerdict(str, Enum):
    PASS = "pass"
    WARN = "warn"
    FAIL = "fail"


# ── Repository Models ─────────────────────────────────

class CloneRepoRequest(BaseModel):
    github_url: str = Field(..., description="GitHub repository URL to clone")


class FileTreeNode(BaseModel):
    name: str
    path: str
    is_dir: bool
    children: Optional[List["FileTreeNode"]] = None
    size: Optional[int] = None
    extension: Optional[str] = None


class RepoInfo(BaseModel):
    repo_id: str
    name: str
    url: str
    file_tree: List[FileTreeNode]
    summary: Optional[str] = None
    language_stats: Optional[Dict[str, int]] = None
    total_files: int = 0
    cloned_at: str = ""


class FileContent(BaseModel):
    path: str
    content: str
    language: Optional[str] = None


# ── Pipeline Models ───────────────────────────────────

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    title: str
    description: str
    target_files: List[str] = []
    dependencies: List[str] = []
    complexity: str = "medium"  # low, medium, high
    status: str = "pending"  # pending, in_progress, completed, failed


class TaskPlan(BaseModel):
    goal: str
    analysis: str = ""
    tasks: List[Task] = []
    estimated_total_changes: int = 0


class FileChange(BaseModel):
    file_path: str
    action: FileAction
    original_content: Optional[str] = None
    new_content: str = ""
    description: str = ""
    diff_preview: Optional[str] = None


class TaskResult(BaseModel):
    task_id: str
    task_title: str
    status: str = "completed"
    changes: List[FileChange] = []
    error: Optional[str] = None


class ReviewIssue(BaseModel):
    severity: str  # info, warning, error
    file_path: Optional[str] = None
    description: str
    suggestion: Optional[str] = None


class ReviewReport(BaseModel):
    overall_score: int = 0  # 0-10
    goal_alignment: ReviewVerdict = ReviewVerdict.PASS
    summary: str = ""
    issues: List[ReviewIssue] = []
    suggestions: List[str] = []
    per_file_reviews: Dict[str, str] = {}


# ── Pipeline State ────────────────────────────────────

class StartPipelineRequest(BaseModel):
    repo_id: str
    goal: str


class PipelineState(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    repo_id: str
    goal: str
    stage: PipelineStage = PipelineStage.IDLE
    plan: Optional[TaskPlan] = None
    results: List[TaskResult] = []
    review: Optional[ReviewReport] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    error: Optional[str] = None


# ── WebSocket Messages ────────────────────────────────

class WSMessage(BaseModel):
    type: str  # stage_update, plan_update, code_update, review_update, log, error
    data: Dict[str, Any] = {}
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
