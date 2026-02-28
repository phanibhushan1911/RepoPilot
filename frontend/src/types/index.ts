/** Shared TypeScript types for RepoPilot frontend. */

// ── Repository ────────────────────────────────────────

export interface FileTreeNode {
    name: string;
    path: string;
    is_dir: boolean;
    children?: FileTreeNode[];
    size?: number;
    extension?: string;
}

export interface RepoInfo {
    repo_id: string;
    name: string;
    url: string;
    file_tree: FileTreeNode[];
    summary?: string;
    language_stats?: Record<string, number>;
    total_files: number;
    cloned_at: string;
}

export interface FileContent {
    path: string;
    content: string;
    language?: string;
}

// ── Pipeline ──────────────────────────────────────────

export type PipelineStage =
    | 'idle'
    | 'analyzing'
    | 'planning'
    | 'coding'
    | 'reviewing'
    | 'completed'
    | 'failed';

export type FileAction = 'create' | 'modify' | 'delete';

export type ReviewVerdict = 'pass' | 'warn' | 'fail';

export interface Task {
    id: string;
    title: string;
    description: string;
    target_files: string[];
    dependencies: string[];
    complexity: string;
    status: string;
}

export interface TaskPlan {
    goal: string;
    analysis: string;
    tasks: Task[];
    estimated_total_changes: number;
}

export interface FileChange {
    file_path: string;
    action: FileAction;
    original_content?: string;
    new_content: string;
    description: string;
    diff_preview?: string;
}

export interface TaskResult {
    task_id: string;
    task_title: string;
    status: string;
    changes: FileChange[];
    error?: string;
}

export interface ReviewIssue {
    severity: string;
    file_path?: string;
    description: string;
    suggestion?: string;
}

export interface ReviewReport {
    overall_score: number;
    goal_alignment: ReviewVerdict;
    summary: string;
    issues: ReviewIssue[];
    suggestions: string[];
    per_file_reviews: Record<string, string>;
}

export interface PipelineState {
    session_id: string;
    repo_id: string;
    goal: string;
    stage: PipelineStage;
    plan?: TaskPlan;
    results: TaskResult[];
    review?: ReviewReport;
    created_at: string;
    error?: string;
}

// ── API Responses ─────────────────────────────────────

export interface StartPipelineResponse {
    session_id: string;
    stage: PipelineStage;
    plan: TaskPlan;
}

export interface ExecuteResponse {
    session_id: string;
    stage: PipelineStage;
    results: TaskResult[];
    review: ReviewReport;
}

export interface ApplyResponse {
    applied: string[];
    errors: Array<{ file: string; error: string }>;
    total_applied: number;
}

// ── AI Features ──────────────────────────────────────

export interface SummaryResponse {
    summary: string;
}

export interface ExplainResponse {
    explanation: string;
    file_path: string;
}

export interface ChatMessageType {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    response: string;
}
