"""Planner Agent — analyzes repository and creates structured task plans."""
import json
from typing import Dict, Any, List
from app.services.ai.mistral_client import mistral_client
from app.services.ai.prompts import PLANNER_SYSTEM_PROMPT
from app.models.schemas import TaskPlan, Task
from app.config import settings


class PlannerAgent:
    """Uses Mistral Large to break a development goal into actionable tasks."""
    
    async def create_plan(
        self,
        goal: str,
        repo_summary: Dict[str, Any],
        file_tree_text: str,
    ) -> TaskPlan:
        """Generate a development plan for the given goal."""
        
        # Build context message
        context = self._build_context(repo_summary, file_tree_text)
        
        messages = [
            {"role": "system", "content": PLANNER_SYSTEM_PROMPT},
            {"role": "user", "content": f"""## Development Goal
{goal}

## Repository Context
{context}

Please analyze this repository and create a structured task plan to achieve the goal.
Respond with valid JSON only."""}
        ]
        
        result = await mistral_client.chat_json(
            model=settings.MISTRAL_LARGE_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=4096,
        )
        
        # Parse into TaskPlan
        tasks = []
        for i, task_data in enumerate(result.get("tasks", [])):
            tasks.append(Task(
                title=task_data.get("title", f"Task {i + 1}"),
                description=task_data.get("description", ""),
                target_files=task_data.get("target_files", []),
                complexity=task_data.get("complexity", "medium"),
                dependencies=[str(d) for d in task_data.get("dependencies", [])],
            ))
        
        return TaskPlan(
            goal=goal,
            analysis=result.get("analysis", ""),
            tasks=tasks,
            estimated_total_changes=result.get("estimated_total_changes", len(tasks)),
        )
    
    def _build_context(self, repo_summary: Dict[str, Any], file_tree_text: str) -> str:
        """Build a context string from repo summary."""
        parts = []
        
        # File tree
        parts.append(f"### File Structure\n```\n{file_tree_text}\n```")
        
        # Language stats
        lang_stats = repo_summary.get("language_stats", {})
        if lang_stats:
            stats_str = ", ".join(f"{k}: {v} files" for k, v in sorted(lang_stats.items(), key=lambda x: -x[1])[:8])
            parts.append(f"\n### Languages\n{stats_str}")
        
        # Key files content
        key_contents = repo_summary.get("key_file_contents", {})
        if key_contents:
            parts.append("\n### Key Files")
            for path, content in list(key_contents.items())[:5]:
                truncated = content[:1500]
                parts.append(f"\n**{path}**:\n```\n{truncated}\n```")
        
        return "\n".join(parts)


planner_agent = PlannerAgent()
