/** Zustand store for pipeline state. */
import { create } from 'zustand';
import type {
    PipelineStage,
    TaskPlan,
    TaskResult,
    ReviewReport,
} from '../types';
import { createSession, planPipeline, executePipeline, applyChanges, getFileTree } from '../services/api';
import { connectWebSocket, disconnectWebSocket, onMessage } from '../services/websocket';
import { useRepoStore } from './repoStore';

interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'active';
}

interface StreamingUpdate {
    taskIndex: number;
    taskTitle: string;
    message: string;
    totalTasks: number;
    changedFiles: string[];
    completedTasks: number;
}

interface PlanningProgress {
    step: string;
    message: string;
    progress: number;
    files?: string[];
    languageStats?: Record<string, number>;
    totalFiles?: number;
}

interface PipelineState {
    // State
    sessionId: string | null;
    stage: PipelineStage;
    goal: string;
    plan: TaskPlan | null;
    results: TaskResult[];
    review: ReviewReport | null;
    logs: LogEntry[];
    isLoading: boolean;
    error: string | null;
    streaming: StreamingUpdate | null;
    planningProgress: PlanningProgress | null;
    changesApplied: boolean;

    // Actions
    setGoal: (goal: string) => void;
    startPlanning: (repoId: string) => Promise<void>;
    executeCode: () => Promise<void>;
    applyAllChanges: () => Promise<void>;
    addLog: (message: string, type?: LogEntry['type']) => void;
    reset: () => void;
}

const now = () => new Date().toLocaleTimeString('en-US', { hour12: false });

export const usePipelineStore = create<PipelineState>((set, get) => ({
    sessionId: null,
    stage: 'idle',
    goal: '',
    plan: null,
    results: [],
    review: null,
    logs: [],
    isLoading: false,
    error: null,
    streaming: null,
    planningProgress: null,
    changesApplied: false,

    setGoal: (goal: string) => set({ goal }),

    startPlanning: async (repoId: string) => {
        const { goal } = get();
        if (!goal.trim()) return;

        set({
            isLoading: true,
            error: null,
            stage: 'analyzing',
            planningProgress: {
                step: 'creating_session',
                message: 'Creating session...',
                progress: 5,
            },
        });
        get().addLog('Starting pipeline...', 'active');

        try {
            // Step 1: Create session
            const session = await createSession(repoId, goal);
            set({ sessionId: session.session_id });

            // Step 2: Connect WebSocket before planning
            connectWebSocket(session.session_id);
            setupWebSocketHandlers();

            // Small delay to ensure WS is connected
            await new Promise((resolve) => setTimeout(resolve, 300));

            set({ stage: 'planning' });
            get().addLog('Generating development plan...', 'active');

            // Step 3: Call plan (real-time progress via WebSocket)
            const response = await planPipeline(session.session_id);

            set({
                stage: 'planning',
                plan: response.plan,
                isLoading: false,
                planningProgress: null,
            });

            get().addLog(
                `Plan ready — ${response.plan.tasks.length} tasks identified`,
                'success'
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Planning failed';
            set({ isLoading: false, error: msg, stage: 'failed', planningProgress: null });
            get().addLog(msg, 'error');
        }
    },

    executeCode: async () => {
        const { sessionId } = get();
        if (!sessionId) return;

        set({
            isLoading: true,
            error: null,
            stage: 'coding',
            streaming: {
                taskIndex: 0,
                taskTitle: 'Starting...',
                message: 'Starting code generation...',
                totalTasks: get().plan?.tasks.length || 0,
                changedFiles: [],
                completedTasks: 0,
            },
        });
        get().addLog('Executing tasks — generating code...', 'active');

        try {
            const response = await executePipeline(sessionId);

            set({
                results: response.results,
                review: response.review,
                stage: response.stage,
                isLoading: false,
                streaming: null,
            });

            const changedFilePaths = response.results.flatMap(
                (r) => r.changes.map((c) => c.file_path)
            );
            useRepoStore.getState().setChangedFiles(changedFilePaths);

            const totalChanges = response.results.reduce(
                (sum, r) => sum + r.changes.length,
                0
            );
            get().addLog(
                `Coding complete — ${totalChanges} file changes generated`,
                'success'
            );
            get().addLog(
                `Review score: ${response.review.overall_score}/10`,
                response.review.overall_score >= 7 ? 'success' : 'error'
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Execution failed';
            set({ isLoading: false, error: msg, stage: 'failed', streaming: null });
            get().addLog(msg, 'error');
        }
    },

    applyAllChanges: async () => {
        const { sessionId } = get();
        if (!sessionId) return;

        set({ isLoading: true, error: null });
        get().addLog('Applying changes to repository...', 'active');

        try {
            const response = await applyChanges(sessionId);

            get().addLog(
                `Applied ${response.total_applied} changes successfully`,
                'success'
            );

            if (response.errors.length > 0) {
                response.errors.forEach((e) =>
                    get().addLog(`Error in ${e.file}: ${e.error}`, 'error')
                );
            }

            // Refresh file tree
            const repoState = useRepoStore.getState();
            if (repoState.repo) {
                try {
                    const tree = await getFileTree(repoState.repo.repo_id);
                    useRepoStore.setState({ fileTree: tree });
                    get().addLog('File tree refreshed', 'info');
                } catch {
                    get().addLog('Could not refresh file tree', 'error');
                }

                // Re-read currently selected file
                if (repoState.selectedFile) {
                    repoState.selectFile(repoState.selectedFile);
                }
            }

            set({ isLoading: false, changesApplied: true });

        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Apply failed';
            set({ isLoading: false, error: msg });
            get().addLog(msg, 'error');
        }
    },

    addLog: (message: string, type: LogEntry['type'] = 'info') =>
        set((state) => ({
            logs: [...state.logs, { timestamp: now(), message, type }],
        })),

    reset: () => {
        disconnectWebSocket();
        set({
            sessionId: null,
            stage: 'idle',
            goal: '',
            plan: null,
            results: [],
            review: null,
            logs: [],
            isLoading: false,
            error: null,
            streaming: null,
            planningProgress: null,
            changesApplied: false,
        });
    },
}));


/** Set up WebSocket message handlers to update the store in real-time. */
function setupWebSocketHandlers() {
    onMessage((type, data) => {
        const store = usePipelineStore.getState();
        const msg = (data.message as string) || '';

        switch (type) {
            // ── Planning progress ──
            case 'planning_progress':
                store.addLog(msg, 'active');
                usePipelineStore.setState({
                    planningProgress: {
                        step: data.step as string,
                        message: msg,
                        progress: data.progress as number,
                        files: data.files as string[] | undefined,
                        languageStats: data.language_stats as Record<string, number> | undefined,
                        totalFiles: data.total_files as number | undefined,
                    },
                });
                break;

            case 'planning_complete':
                store.addLog(msg, 'success');
                usePipelineStore.setState({ planningProgress: null });
                break;

            // ── Coding progress ──
            case 'task_start':
                store.addLog(msg, 'active');
                usePipelineStore.setState({
                    streaming: {
                        taskIndex: data.task_index as number,
                        taskTitle: data.task_title as string,
                        message: msg,
                        totalTasks: data.total_tasks as number,
                        changedFiles: usePipelineStore.getState().streaming?.changedFiles || [],
                        completedTasks: data.task_index as number,
                    },
                });
                break;

            case 'coding':
                store.addLog(msg, 'active');
                usePipelineStore.setState((s) => ({
                    streaming: s.streaming
                        ? { ...s.streaming, message: msg }
                        : null,
                }));
                break;

            case 'task_complete':
                store.addLog(msg, 'success');
                usePipelineStore.setState((s) => ({
                    streaming: s.streaming
                        ? {
                            ...s.streaming,
                            message: msg,
                            completedTasks: (data.task_index as number) + 1,
                            changedFiles: [
                                ...s.streaming.changedFiles,
                                ...((data.changed_files as string[]) || []),
                            ],
                        }
                        : null,
                }));
                break;

            case 'review_start':
                store.addLog(msg, 'active');
                usePipelineStore.setState({ stage: 'reviewing' });
                break;

            case 'pipeline_complete':
                store.addLog(msg, 'success');
                break;

            case 'error':
                store.addLog(msg, 'error');
                break;
        }
    });
}
