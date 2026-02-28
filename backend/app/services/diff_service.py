"""Diff service — generate and apply code diffs."""
import difflib
from typing import List, Optional
from app.models.schemas import FileChange, FileAction


class DiffService:
    """Generate and apply unified diffs."""
    
    def generate_diff(self, original: Optional[str], modified: str, file_path: str) -> str:
        """Generate a unified diff between original and modified content."""
        if original is None:
            original = ""
        
        original_lines = original.splitlines(keepends=True)
        modified_lines = modified.splitlines(keepends=True)
        
        diff = difflib.unified_diff(
            original_lines,
            modified_lines,
            fromfile=f"a/{file_path}",
            tofile=f"b/{file_path}",
            lineterm="",
        )
        
        return "\n".join(diff)
    
    def generate_change_preview(self, changes: List[FileChange]) -> str:
        """Generate a preview of all changes."""
        previews = []
        for change in changes:
            if change.action == FileAction.CREATE:
                previews.append(f"+ NEW FILE: {change.file_path}")
                previews.append(f"  {change.description}")
            elif change.action == FileAction.DELETE:
                previews.append(f"- DELETE: {change.file_path}")
                previews.append(f"  {change.description}")
            elif change.action == FileAction.MODIFY:
                diff = self.generate_diff(
                    change.original_content,
                    change.new_content,
                    change.file_path
                )
                previews.append(f"~ MODIFY: {change.file_path}")
                previews.append(f"  {change.description}")
                previews.append(diff)
            previews.append("")
        
        return "\n".join(previews)


diff_service = DiffService()
