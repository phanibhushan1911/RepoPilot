"""Reviewer Agent — reviews all proposed changes for quality and goal alignment."""
import json
from typing import Dict, Any, List
from app.services.ai.mistral_client import mistral_client
from app.services.ai.prompts import REVIEWER_SYSTEM_PROMPT
from app.models.schemas import (
    ReviewReport, ReviewIssue, ReviewVerdict,
    TaskResult, FileChange,
)
from app.config import settings


class ReviewerAgent:
    """Uses Mistral Large to review all proposed code changes."""
    
    async def review_changes(
        self,
        goal: str,
        results: List[TaskResult],
    ) -> ReviewReport:
        """Review all code changes against the goal."""
        
        # Build changes summary
        changes_text = self._format_all_changes(results)
        
        messages = [
            {"role": "system", "content": REVIEWER_SYSTEM_PROMPT},
            {"role": "user", "content": f"""## Original Development Goal
{goal}

## Proposed Code Changes
{changes_text}

Please review all changes thoroughly and provide your assessment.
Respond with valid JSON only."""}
        ]
        
        try:
            result = await mistral_client.chat_json(
                model=settings.MISTRAL_LARGE_MODEL,
                messages=messages,
                temperature=0.2,
                max_tokens=4096,
            )
            
            # Parse issues
            issues = []
            for issue_data in result.get("issues", []):
                issues.append(ReviewIssue(
                    severity=issue_data.get("severity", "info"),
                    file_path=issue_data.get("file_path"),
                    description=issue_data.get("description", ""),
                    suggestion=issue_data.get("suggestion"),
                ))
            
            # Parse verdict
            verdict_str = result.get("goal_alignment", "pass").lower()
            try:
                verdict = ReviewVerdict(verdict_str)
            except ValueError:
                verdict = ReviewVerdict.PASS
            
            return ReviewReport(
                overall_score=min(10, max(0, int(result.get("overall_score", 7)))),
                goal_alignment=verdict,
                summary=result.get("summary", "Review completed."),
                issues=issues,
                suggestions=result.get("suggestions", []),
                per_file_reviews=result.get("per_file_reviews", {}),
            )
            
        except Exception as e:
            return ReviewReport(
                overall_score=0,
                goal_alignment=ReviewVerdict.FAIL,
                summary=f"Review failed: {str(e)}",
                issues=[ReviewIssue(
                    severity="error",
                    description=f"Review process failed: {str(e)}",
                )],
            )
    
    def _format_all_changes(self, results: List[TaskResult]) -> str:
        """Format all task results into a review-friendly string."""
        parts = []
        
        for result in results:
            parts.append(f"\n### Task: {result.task_title}")
            
            if result.error:
                parts.append(f"Task failed: {result.error}")
                continue
            
            for change in result.changes:
                parts.append(f"\n**{change.action.value.upper()}: {change.file_path}**")
                parts.append(f"Description: {change.description}")
                
                if change.new_content:
                    # Truncate very long files
                    content = change.new_content[:4000]
                    parts.append(f"```\n{content}\n```")
        
        return "\n".join(parts)


reviewer_agent = ReviewerAgent()
