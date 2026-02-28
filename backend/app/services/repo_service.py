"""Repository service — clone, explore, read/write files."""
import os
import uuid
import stat
import shutil
from typing import List, Optional, Dict
from pathlib import Path

from git import Repo
from app.config import settings
from app.models.schemas import FileTreeNode, RepoInfo


# File extensions to language mapping
EXTENSION_MAP = {
    ".py": "python", ".js": "javascript", ".ts": "typescript",
    ".tsx": "typescriptreact", ".jsx": "javascriptreact",
    ".html": "html", ".css": "css", ".scss": "scss",
    ".json": "json", ".yaml": "yaml", ".yml": "yaml",
    ".md": "markdown", ".txt": "text", ".sh": "shell",
    ".java": "java", ".cpp": "cpp", ".c": "c",
    ".go": "go", ".rs": "rust", ".rb": "ruby",
    ".php": "php", ".sql": "sql", ".xml": "xml",
    ".toml": "toml", ".cfg": "ini", ".ini": "ini",
    ".dockerfile": "dockerfile", ".env": "dotenv",
}

# Directories to ignore during tree traversal
IGNORE_DIRS = {
    ".git", "node_modules", "__pycache__", ".venv", "venv",
    ".idea", ".vscode", ".next", "dist", "build",
    ".cache", ".tox", "egg-info", ".mypy_cache",
}

# Max file size to read (500KB)
MAX_FILE_SIZE = 500 * 1024


class RepoService:
    """Service for managing cloned repositories."""
    
    def __init__(self):
        os.makedirs(settings.REPOS_DIR, exist_ok=True)
    
    def clone_repo(self, github_url: str) -> RepoInfo:
        """Clone a GitHub repository and return its info."""
        repo_id = str(uuid.uuid4())[:12]
        repo_name = github_url.rstrip("/").split("/")[-1].replace(".git", "")
        repo_path = os.path.join(settings.REPOS_DIR, repo_id)
        
        # Clone the repo
        Repo.clone_from(github_url, repo_path, depth=1)
        
        # Build file tree
        file_tree = self._build_file_tree(repo_path, repo_path)
        
        # Count files and language stats
        total_files, lang_stats = self._analyze_repo(repo_path)
        
        return RepoInfo(
            repo_id=repo_id,
            name=repo_name,
            url=github_url,
            file_tree=file_tree,
            total_files=total_files,
            language_stats=lang_stats,
            cloned_at="",
        )
    
    def get_file_tree(self, repo_id: str) -> List[FileTreeNode]:
        """Get the file tree for a cloned repo."""
        repo_path = self._get_repo_path(repo_id)
        return self._build_file_tree(repo_path, repo_path)
    
    def read_file(self, repo_id: str, file_path: str) -> str:
        """Read a file's contents."""
        full_path = os.path.join(self._get_repo_path(repo_id), file_path)
        
        if not os.path.isfile(full_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        if os.path.getsize(full_path) > MAX_FILE_SIZE:
            raise ValueError(f"File too large: {file_path}")
        
        try:
            with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                return f.read()
        except UnicodeDecodeError:
            return "[Binary file — cannot display]"
    
    def write_file(self, repo_id: str, file_path: str, content: str) -> None:
        """Write content to a file (create if needed)."""
        full_path = os.path.join(self._get_repo_path(repo_id), file_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
    
    def delete_file(self, repo_id: str, file_path: str) -> None:
        """Delete a file from the repo."""
        full_path = os.path.join(self._get_repo_path(repo_id), file_path)
        if os.path.isfile(full_path):
            os.remove(full_path)
    
    def get_repo_summary(self, repo_id: str) -> Dict:
        """Get a summary of repo structure for AI context."""
        repo_path = self._get_repo_path(repo_id)
        total_files, lang_stats = self._analyze_repo(repo_path)
        
        # Find key files
        key_files = []
        key_file_names = {
            "README.md", "readme.md", "package.json", "requirements.txt",
            "setup.py", "pyproject.toml", "Cargo.toml", "go.mod",
            "Makefile", "Dockerfile", "docker-compose.yml",
            ".gitignore", "tsconfig.json", "vite.config.ts",
        }
        
        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for f in files:
                if f in key_file_names:
                    rel = os.path.relpath(os.path.join(root, f), repo_path)
                    key_files.append(rel)
        
        # Read key file contents (truncated)
        key_file_contents = {}
        for kf in key_files[:10]:
            try:
                content = self.read_file(repo_id, kf)
                key_file_contents[kf] = content[:2000]
            except Exception:
                pass
        
        return {
            "total_files": total_files,
            "language_stats": lang_stats,
            "key_files": key_files,
            "key_file_contents": key_file_contents,
            "file_tree_text": self._tree_to_text(repo_path, repo_path, depth=3),
        }
    
    def _get_repo_path(self, repo_id: str) -> str:
        path = os.path.join(settings.REPOS_DIR, repo_id)
        if not os.path.isdir(path):
            raise FileNotFoundError(f"Repository not found: {repo_id}")
        return path
    
    def _build_file_tree(self, base_path: str, current_path: str, max_depth: int = 5, depth: int = 0) -> List[FileTreeNode]:
        """Recursively build file tree."""
        if depth > max_depth:
            return []
        
        nodes = []
        try:
            entries = sorted(os.listdir(current_path))
        except PermissionError:
            return []
        
        # Directories first, then files
        dirs = [e for e in entries if os.path.isdir(os.path.join(current_path, e)) and e not in IGNORE_DIRS]
        files = [e for e in entries if os.path.isfile(os.path.join(current_path, e))]
        
        for d in dirs:
            dir_path = os.path.join(current_path, d)
            rel_path = os.path.relpath(dir_path, base_path)
            children = self._build_file_tree(base_path, dir_path, max_depth, depth + 1)
            nodes.append(FileTreeNode(
                name=d,
                path=rel_path,
                is_dir=True,
                children=children,
            ))
        
        for f in files:
            file_path = os.path.join(current_path, f)
            rel_path = os.path.relpath(file_path, base_path)
            ext = os.path.splitext(f)[1].lower()
            try:
                size = os.path.getsize(file_path)
            except OSError:
                size = 0
            
            nodes.append(FileTreeNode(
                name=f,
                path=rel_path,
                is_dir=False,
                size=size,
                extension=ext if ext else None,
            ))
        
        return nodes
    
    def _analyze_repo(self, repo_path: str):
        """Count files and compute language statistics."""
        total_files = 0
        lang_stats: Dict[str, int] = {}
        
        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for f in files:
                total_files += 1
                ext = os.path.splitext(f)[1].lower()
                lang = EXTENSION_MAP.get(ext, "other")
                lang_stats[lang] = lang_stats.get(lang, 0) + 1
        
        return total_files, lang_stats
    
    def _tree_to_text(self, base_path: str, current_path: str, depth: int = 3, indent: int = 0) -> str:
        """Generate a text representation of the file tree."""
        if indent > depth:
            return ""
        
        lines = []
        try:
            entries = sorted(os.listdir(current_path))
        except PermissionError:
            return ""
        
        dirs = [e for e in entries if os.path.isdir(os.path.join(current_path, e)) and e not in IGNORE_DIRS]
        files = [e for e in entries if os.path.isfile(os.path.join(current_path, e))]
        
        prefix = "  " * indent
        for d in dirs:
            lines.append(f"{prefix}{d}/")
            sub = self._tree_to_text(base_path, os.path.join(current_path, d), depth, indent + 1)
            if sub:
                lines.append(sub)
        
        for f in files:
            lines.append(f"{prefix}{f}")
        
        return "\n".join(lines)


# Singleton instance
repo_service = RepoService()
