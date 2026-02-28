from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import repo, pipeline, files, ai
from app.api.websocket import router as ws_router
import os


app = FastAPI(
    title="RepoPilot API",
    description="AI Autonomous Developer — analyze, plan, code, and review across entire projects",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(repo.router, prefix="/api/repo", tags=["Repository"])
app.include_router(pipeline.router, prefix="/api/pipeline", tags=["Pipeline"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(ws_router, tags=["WebSocket"])


@app.on_event("startup")
async def startup_event():
    """Validate configuration on startup."""
    os.makedirs(settings.REPOS_DIR, exist_ok=True)
    
    if not settings.MISTRAL_API_KEY:
        print("WARNING: MISTRAL_API_KEY not set. AI features will not work.")
    else:
        print("Mistral AI API key configured")
    
    print(f"Repos directory: {settings.REPOS_DIR}")
    print("RepoPilot API is ready!")


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "mistral_configured": bool(settings.MISTRAL_API_KEY)
    }
