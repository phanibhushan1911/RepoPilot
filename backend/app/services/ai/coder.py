"""Coder Agent — generates code changes for individual tasks."""
import json
from typing import Dict, Any, List, Optional
from app.services.ai.mistral_client import mistral_client
from app.services.ai.prompts import CODER_SYSTEM_PROMPT
from app.services.repo_service import repo_service
from app.models.schemas import Task, FileChange, FileAction, TaskResult
from app.config import settings


class CoderAgent:
    """Uses Codestral to generate code changes for each task in the plan."""
    
    async def execute_task(
        self,
        task: Task,
        repo_id: str,
        goal: str,
        previous_changes: List[FileChange] = [],
    ) -> TaskResult:
        """Generate code changes for a single task."""
        
        # Gather context: read target files and surrounding files
        context = await self._gather_context(repo_id, task, previous_changes)
        
        messages = [
            {"role": "system", "content": CODER_SYSTEM_PROMPT},
            {"role": "user", "content": f"""## Overall Goal
{goal}

## Current Task
**{task.title}**: {task.description}

## Target Files
{', '.join(task.target_files) if task.target_files else 'To be determined based on the task'}

## Current File Contents
{context}

## Previous Changes in This Session
{self._format_previous_changes(previous_changes)}

Generate the code changes needed for this task. Respond with valid JSON only."""}
        ]
        
        try:
            result = await mistral_client.chat_json(
                model=settings.CODESTRAL_MODEL,
                messages=messages,
                temperature=0.2,
                max_tokens=8192,
            )
            
            changes = []
            for change_data in result.get("changes", []):
                action_str = change_data.get("action", "modify").lower()
                try:
                    action = FileAction(action_str)
                except ValueError:
                    action = FileAction.MODIFY
                
                # Get original content for modifications
                original_content = None
                if action == FileAction.MODIFY:
                    try:
                        original_content = repo_service.read_file(repo_id, change_data["file_path"])
                    except FileNotFoundError:
                        action = FileAction.CREATE
                
                changes.append(FileChange(
                    file_path=change_data.get("file_path", ""),
                    action=action,
                    original_content=original_content,
                    new_content=change_data.get("new_content", ""),
                    description=change_data.get("description", ""),
                ))
            
            return TaskResult(
                task_id=task.id,
                task_title=task.title,
                status="completed",
                changes=changes,
            )
            
        except Exception as e:
            return TaskResult(
                task_id=task.id,
                task_title=task.title,
                status="failed",
                error=str(e),
            )
    
    async def _gather_context(
        self,
        repo_id: str,
        task: Task,
        previous_changes: List[FileChange],
    ) -> str:
        """Read target files and build context string."""
        parts = []
        
        # Read target files
        for file_path in task.target_files:
            try:
                content = repo_service.read_file(repo_id, file_path)
                parts.append(f"### {file_path}\n```\n{content[:3000]}\n```")
            except FileNotFoundError:
                parts.append(f"### {file_path}\n(File does not exist yet — will be created)")
            except ValueError:
                parts.append(f"### {file_path}\n(File too large to display)")
        
        if not parts:
            parts.append("No specific target files identified. Use the file structure to determine appropriate locations.")
        
        return "\n\n".join(parts)
    
    def _format_previous_changes(self, changes: List[FileChange]) -> str:
        """Format previous changes for context."""
        if not changes:
            return "No previous changes in this session."
        
        parts = []
        for c in changes[-5:]:  # Only show last 5 changes for context
            parts.append(f"- {c.action.value}: {c.file_path} — {c.description}")
        
        return "\n".join(parts)


coder_agent = CoderAgent()
