"""Pipeline API routes – start, execute, and apply the AI pipeline."""
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    StartPipelineRequest, PipelineState, PipelineStage,
    FileAction,
)
from app.services.session_manager import session_manager
from app.services.repo_service import repo_service
from app.services.diff_service import diff_service
from app.services.ai.planner import planner_agent
from app.services.ai.coder import coder_agent
from app.services.ai.reviewer import reviewer_agent
from app.api.websocket import broadcast

router = APIRouter()


@router.post("/session")
async def create_session(request: StartPipelineRequest):
    """Create a pipeline session (step 1). Returns session_id for WebSocket connection."""
    try:
        repo_service.get_file_tree(request.repo_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Repository not found")

    state = session_manager.create_session(request.repo_id, request.goal)
    return {
        "session_id": state.session_id,
        "repo_id": request.repo_id,
        "goal": request.goal,
    }


@router.post("/{session_id}/plan")
async def plan_pipeline(session_id: str):
    """Generate a development plan with real-time progress (step 2)."""
    state = session_manager.get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")

    session_manager.update_stage(session_id, PipelineStage.ANALYZING)

    try:
        # Step 1: Analyzing repository
        await broadcast(session_id, "planning_progress", {
            "step": "analyzing",
            "message": "Analyzing repository structure...",
            "progress": 10,
        })

        summary = repo_service.get_repo_summary(state.repo_id)
        file_tree_text = summary.get("file_tree_text", "")

        # Step 2: Reading key files
        key_files = summary.get("key_files", [])
        await broadcast(session_id, "planning_progress", {
            "step": "reading_files",
            "message": f"Reading {len(key_files)} key files...",
            "files": key_files[:8],
            "progress": 25,
        })

        # Step 3: Building context
        lang_stats = summary.get("language_stats", {})
        primary_lang = max(lang_stats, key=lang_stats.get) if lang_stats else "unknown"
        await broadcast(session_id, "planning_progress", {
            "step": "building_context",
            "message": f"Building context — primary language: {primary_lang}",
            "language_stats": lang_stats,
            "total_files": summary.get("total_files", 0),
            "progress": 40,
        })

        session_manager.update_stage(session_id, PipelineStage.PLANNING)

        # Step 4: AI thinking
        await broadcast(session_id, "planning_progress", {
            "step": "ai_thinking",
            "message": "Analyzing your goal and planning tasks...",
            "progress": 55,
        })

        plan = await planner_agent.create_plan(
            goal=state.goal,
            repo_summary=summary,
            file_tree_text=file_tree_text,
        )

        # Step 5: Structuring plan
        await broadcast(session_id, "planning_progress", {
            "step": "structuring",
            "message": f"Structuring plan — {len(plan.tasks)} tasks identified",
            "task_count": len(plan.tasks),
            "progress": 90,
        })

        state = session_manager.get_session(session_id)
        state.plan = plan

        # Step 6: Complete
        await broadcast(session_id, "planning_complete", {
            "message": f"Plan ready — {len(plan.tasks)} tasks",
            "task_count": len(plan.tasks),
            "progress": 100,
        })

        return {
            "session_id": session_id,
            "stage": state.stage,
            "plan": plan.model_dump(),
        }

    except Exception as e:
        session_manager.set_error(session_id, str(e))
        await broadcast(session_id, "error", {
            "message": f"Planning failed: {str(e)}",
        })
        raise HTTPException(status_code=500, detail=f"Planning failed: {str(e)}")


# Keep backward compat
@router.post("/start")
async def start_pipeline(request: StartPipelineRequest):
    """Start the pipeline: analyze repo and generate a plan (legacy, use /session + /plan)."""
    try:
        repo_service.get_file_tree(request.repo_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Repository not found")

    state = session_manager.create_session(request.repo_id, request.goal)
    session_manager.update_stage(state.session_id, PipelineStage.ANALYZING)

    try:
        summary = repo_service.get_repo_summary(request.repo_id)
        file_tree_text = summary.get("file_tree_text", "")

        session_manager.update_stage(state.session_id, PipelineStage.PLANNING)

        plan = await planner_agent.create_plan(
            goal=request.goal,
            repo_summary=summary,
            file_tree_text=file_tree_text,
        )

        state = session_manager.get_session(state.session_id)
        state.plan = plan

        return {
            "session_id": state.session_id,
            "stage": state.stage,
            "plan": plan.model_dump(),
        }

    except Exception as e:
        session_manager.set_error(state.session_id, str(e))
        raise HTTPException(status_code=500, detail=f"Planning failed: {str(e)}")


@router.post("/{session_id}/execute")
async def execute_pipeline(session_id: str):
    """Execute the approved plan: generate code for each task."""
    state = session_manager.get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")

    if not state.plan:
        raise HTTPException(status_code=400, detail="No plan to execute. Start the pipeline first.")

    session_manager.update_stage(session_id, PipelineStage.CODING)

    try:
        all_changes = []
        results = []
        total_tasks = len(state.plan.tasks)

        for i, task in enumerate(state.plan.tasks):
            task.status = "in_progress"

            await broadcast(session_id, "task_start", {
                "task_index": i,
                "task_id": task.id,
                "task_title": task.title,
                "total_tasks": total_tasks,
                "message": f"Working on task {i + 1}/{total_tasks}: {task.title}",
            })

            await broadcast(session_id, "coding", {
                "task_index": i,
                "message": f"Generating code for: {task.title}",
                "target_files": task.target_files,
            })

            result = await coder_agent.execute_task(
                task=task,
                repo_id=state.repo_id,
                goal=state.goal,
                previous_changes=all_changes,
            )

            task.status = result.status
            results.append(result)
            all_changes.extend(result.changes)

            for change in result.changes:
                if change.action in (FileAction.MODIFY, FileAction.CREATE):
                    change.diff_preview = diff_service.generate_diff(
                        change.original_content,
                        change.new_content,
                        change.file_path,
                    )

            change_files = [c.file_path for c in result.changes]
            await broadcast(session_id, "task_complete", {
                "task_index": i,
                "task_id": task.id,
                "task_title": task.title,
                "status": result.status,
                "changes_count": len(result.changes),
                "changed_files": change_files,
                "message": f"Task {i + 1}/{total_tasks} complete — {len(result.changes)} file(s) changed",
            })

        state.results = results

        session_manager.update_stage(session_id, PipelineStage.REVIEWING)
        await broadcast(session_id, "review_start", {
            "message": "AI is reviewing all changes...",
            "total_changes": len(all_changes),
        })

        review = await reviewer_agent.review_changes(
            goal=state.goal,
            results=results,
        )
        state.review = review

        session_manager.update_stage(session_id, PipelineStage.COMPLETED)

        await broadcast(session_id, "pipeline_complete", {
            "message": f"Pipeline complete — Score: {review.overall_score}/10",
            "overall_score": review.overall_score,
            "goal_alignment": review.goal_alignment,
            "total_results": len(results),
            "total_changes": len(all_changes),
        })

        return {
            "session_id": session_id,
            "stage": state.stage,
            "results": [r.model_dump() for r in results],
            "review": review.model_dump(),
        }

    except Exception as e:
        session_manager.set_error(session_id, str(e))
        await broadcast(session_id, "error", {
            "message": f"Execution failed: {str(e)}",
        })
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")


@router.post("/{session_id}/apply")
async def apply_changes(session_id: str):
    """Apply all approved changes to the repository files."""
    state = session_manager.get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")

    if not state.results:
        raise HTTPException(status_code=400, detail="No changes to apply.")

    applied = []
    errors = []

    for result in state.results:
        for change in result.changes:
            try:
                if change.action == FileAction.CREATE or change.action == FileAction.MODIFY:
                    repo_service.write_file(state.repo_id, change.file_path, change.new_content)
                    applied.append(change.file_path)
                elif change.action == FileAction.DELETE:
                    repo_service.delete_file(state.repo_id, change.file_path)
                    applied.append(change.file_path)
            except Exception as e:
                errors.append({"file": change.file_path, "error": str(e)})

    return {
        "applied": applied,
        "errors": errors,
        "total_applied": len(applied),
    }


@router.get("/{session_id}/status")
async def get_pipeline_status(session_id: str):
    """Get the current pipeline status."""
    state = session_manager.get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")

    return state.model_dump()
