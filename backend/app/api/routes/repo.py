"""Repository API routes — clone and explore repos."""
from fastapi import APIRouter, HTTPException
from app.models.schemas import CloneRepoRequest, RepoInfo, FileTreeNode
from app.services.repo_service import repo_service
from typing import List

router = APIRouter()


@router.post("/clone", response_model=RepoInfo)
async def clone_repository(request: CloneRepoRequest):
    """Clone a GitHub repository."""
    try:
        repo_info = repo_service.clone_repo(request.github_url)
        return repo_info
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to clone repository: {str(e)}")


@router.get("/{repo_id}/tree", response_model=List[FileTreeNode])
async def get_file_tree(repo_id: str):
    """Get the file tree for a cloned repo."""
    try:
        return repo_service.get_file_tree(repo_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Repository not found")


@router.get("/{repo_id}/summary")
async def get_repo_summary(repo_id: str):
    """Get a summary of the repository for AI context."""
    try:
        return repo_service.get_repo_summary(repo_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Repository not found")
