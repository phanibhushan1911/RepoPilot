"""AI-powered routes — summary report, code explanation, and chat."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.session_manager import session_manager
from app.services.repo_service import repo_service
from app.services.ai.mistral_client import mistral_client
from app.services.ai.prompts import SUMMARY_SYSTEM_PROMPT, EXPLAIN_SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT
from app.config import settings


router = APIRouter()


# ── Summary Report ─────────────────────────────────────

@router.get("/{session_id}/summary")
async def generate_summary(session_id: str):
    """Generate an AI summary report of the pipeline results."""
    state = session_manager.get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")

    if not state.results:
        raise HTTPException(status_code=400, detail="No results to summarize")

    # Build context
    changes_summary = []
    for result in state.results:
        for change in result.changes:
            changes_summary.append(
                f"- **{change.action.value.upper()}** `{change.file_path}`: {change.description}"
            )

    plan_text = ""
    if state.plan:
        plan_text = f"Analysis: {state.plan.analysis}\n\nTasks:\n"
        for i, task in enumerate(state.plan.tasks):
            plan_text += f"{i+1}. {task.title}: {task.description}\n"

    review_text = ""
    if state.review:
        review_text = f"Score: {state.review.overall_score}/10\nSummary: {state.review.summary}"

    messages = [
        {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
        {"role": "user", "content": f"""## Development Goal
{state.goal}

## Task Plan
{plan_text}

## Code Changes
{chr(10).join(changes_summary)}

## Review Results
{review_text}

Please generate a comprehensive summary report."""}
    ]

    try:
        summary = await mistral_client.chat(
            model=settings.MISTRAL_LARGE_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=4096,
        )
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")


# ── Code Explanation ───────────────────────────────────

@router.post("/explain")
async def explain_code(request: dict):
    """Explain a code file using AI."""
    file_path = request.get("file_path", "")
    repo_id = request.get("repo_id", "")
    
    if not file_path or not repo_id:
        raise HTTPException(status_code=400, detail="file_path and repo_id are required")

    try:
        content = repo_service.read_file(repo_id, file_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    messages = [
        {"role": "system", "content": EXPLAIN_SYSTEM_PROMPT},
        {"role": "user", "content": f"""## File: {file_path}

```
{content[:6000]}
```

Please explain this code."""}
    ]

    try:
        explanation = await mistral_client.chat(
            model=settings.MISTRAL_LARGE_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=2048,
        )
        return {"explanation": explanation, "file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")


# ── AI Chat ───────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

@router.post("/{session_id}/chat")
async def chat_with_ai(session_id: str, request: ChatRequest):
    """Chat with AI about the codebase and changes."""
    state = session_manager.get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")

    # Build context from pipeline state
    context_parts = [f"Development Goal: {state.goal}"]

    if state.plan:
        context_parts.append(f"Plan: {state.plan.analysis}")
        for i, task in enumerate(state.plan.tasks):
            context_parts.append(f"Task {i+1}: {task.title} — {task.description}")

    if state.results:
        context_parts.append(f"\nCode changes made ({len(state.results)} tasks completed):")
        for result in state.results:
            for change in result.changes:
                context_parts.append(f"- {change.action.value}: {change.file_path} — {change.description}")

    if state.review:
        context_parts.append(f"\nReview: Score {state.review.overall_score}/10 — {state.review.summary}")

    context = "\n".join(context_parts)

    # Build messages
    messages = [
        {"role": "system", "content": f"{CHAT_SYSTEM_PROMPT}\n\n## Current Context\n{context}"},
    ]

    # Add conversation history
    for msg in request.history[-10:]:  # Keep last 10 messages
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": request.message})

    try:
        response = await mistral_client.chat(
            model=settings.MISTRAL_LARGE_MODEL,
            messages=messages,
            temperature=0.4,
            max_tokens=4096,
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
