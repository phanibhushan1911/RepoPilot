import type { RepoInfo, FileContent, StartPipelineResponse, ExecuteResponse, ApplyResponse, FileTreeNode, SummaryResponse, ExplainResponse, ChatResponse, ChatMessageType } from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `Request failed: ${res.status}`);
    }

    return res.json();
}

// ── Repository ────────────────────────────────────────

export async function cloneRepo(githubUrl: string): Promise<RepoInfo> {
    return request<RepoInfo>('/repo/clone', {
        method: 'POST',
        body: JSON.stringify({ github_url: githubUrl }),
    });
}

export async function getFileTree(repoId: string): Promise<FileTreeNode[]> {
    return request<FileTreeNode[]>(`/repo/${repoId}/tree`);
}

export async function getRepoSummary(repoId: string) {
    return request<Record<string, unknown>>(`/repo/${repoId}/summary`);
}

// ── Files ─────────────────────────────────────────────

export async function readFile(repoId: string, path: string): Promise<FileContent> {
    return request<FileContent>(`/files/${repoId}?path=${encodeURIComponent(path)}`);
}

// ── Pipeline ──────────────────────────────────────────

export async function createSession(repoId: string, goal: string): Promise<{ session_id: string }> {
    return request<{ session_id: string }>('/pipeline/session', {
        method: 'POST',
        body: JSON.stringify({ repo_id: repoId, goal }),
    });
}

export async function planPipeline(sessionId: string): Promise<StartPipelineResponse> {
    return request<StartPipelineResponse>(`/pipeline/${sessionId}/plan`, {
        method: 'POST',
    });
}

export async function startPipeline(repoId: string, goal: string): Promise<StartPipelineResponse> {
    return request<StartPipelineResponse>('/pipeline/start', {
        method: 'POST',
        body: JSON.stringify({ repo_id: repoId, goal }),
    });
}

export async function executePipeline(sessionId: string): Promise<ExecuteResponse> {
    return request<ExecuteResponse>(`/pipeline/${sessionId}/execute`, {
        method: 'POST',
    });
}

export async function applyChanges(sessionId: string): Promise<ApplyResponse> {
    return request<ApplyResponse>(`/pipeline/${sessionId}/apply`, {
        method: 'POST',
    });
}

export async function getPipelineStatus(sessionId: string) {
    return request<Record<string, unknown>>(`/pipeline/${sessionId}/status`);
}

// ── AI Features ───────────────────────────────────────

export async function generateSummary(sessionId: string): Promise<SummaryResponse> {
    return request<SummaryResponse>(`/ai/${sessionId}/summary`);
}

export async function explainCode(repoId: string, filePath: string): Promise<ExplainResponse> {
    return request<ExplainResponse>('/ai/explain', {
        method: 'POST',
        body: JSON.stringify({ repo_id: repoId, file_path: filePath }),
    });
}

export async function chatWithAI(sessionId: string, message: string, history: ChatMessageType[] = []): Promise<ChatResponse> {
    return request<ChatResponse>(`/ai/${sessionId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message, history }),
    });
}
