"""Files API routes — read and write files."""
from fastapi import APIRouter, HTTPException
from app.models.schemas import FileContent
from app.services.repo_service import repo_service

router = APIRouter()


@router.get("/{repo_id}")
async def read_file(repo_id: str, path: str):
    """Read a file from the repository."""
    try:
        content = repo_service.read_file(repo_id, path)
        ext = path.rsplit(".", 1)[-1] if "." in path else ""
        return FileContent(path=path, content=content, language=ext)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
