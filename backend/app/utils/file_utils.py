"""File utility helpers."""
import os
from typing import Optional

# Binary file extensions
BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg",
    ".pdf", ".zip", ".tar", ".gz", ".rar",
    ".exe", ".dll", ".so", ".dylib",
    ".woff", ".woff2", ".ttf", ".eot",
    ".mp3", ".mp4", ".avi", ".mov",
    ".pyc", ".class", ".o",
}


def is_binary_file(file_path: str) -> bool:
    """Check if a file is likely binary based on extension."""
    ext = os.path.splitext(file_path)[1].lower()
    return ext in BINARY_EXTENSIONS


def get_language_from_extension(file_path: str) -> Optional[str]:
    """Get the programming language from a file extension."""
    ext_map = {
        ".py": "python", ".js": "javascript", ".ts": "typescript",
        ".tsx": "typescriptreact", ".jsx": "javascriptreact",
        ".html": "html", ".css": "css", ".scss": "scss",
        ".json": "json", ".yaml": "yaml", ".yml": "yaml",
        ".md": "markdown", ".sh": "bash", ".bash": "bash",
        ".java": "java", ".cpp": "cpp", ".c": "c", ".h": "c",
        ".go": "go", ".rs": "rust", ".rb": "ruby",
        ".php": "php", ".sql": "sql", ".xml": "xml",
        ".toml": "toml", ".ini": "ini",
    }
    ext = os.path.splitext(file_path)[1].lower()
    return ext_map.get(ext)
