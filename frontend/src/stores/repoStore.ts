/** Zustand store for repository state. */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RepoInfo, FileTreeNode, FileContent } from '../types';
import { cloneRepo, readFile, getFileTree } from '../services/api';

interface RepoState {
    // State
    repo: RepoInfo | null;
    fileTree: FileTreeNode[];
    selectedFile: string | null;
    fileContent: FileContent | null;
    isCloning: boolean;
    isLoadingFile: boolean;
    error: string | null;
    changedFiles: string[];

    // Actions
    cloneRepository: (url: string) => Promise<void>;
    selectFile: (path: string) => Promise<void>;
    refreshFileTree: () => Promise<void>;
    setChangedFiles: (files: string[]) => void;
    clearRepo: () => void;
    clearError: () => void;
}

export const useRepoStore = create<RepoState>()(
    persist(
        (set, get) => ({
            repo: null,
            fileTree: [],
            selectedFile: null,
            fileContent: null,
            isCloning: false,
            isLoadingFile: false,
            error: null,
            changedFiles: [],

            cloneRepository: async (url: string) => {
                set({ isCloning: true, error: null });
                try {
                    const repo = await cloneRepo(url);
                    set({
                        repo,
                        fileTree: repo.file_tree,
                        isCloning: false,
                    });
                } catch (err) {
                    set({
                        isCloning: false,
                        error: err instanceof Error ? err.message : 'Failed to clone repository',
                    });
                    throw err;
                }
            },

            selectFile: async (path: string) => {
                const { repo } = get();
                if (!repo) return;

                set({ selectedFile: path, isLoadingFile: true });
                try {
                    const content = await readFile(repo.repo_id, path);
                    set({ fileContent: content, isLoadingFile: false });
                } catch (err) {
                    set({
                        isLoadingFile: false,
                        error: err instanceof Error ? err.message : 'Failed to read file',
                    });
                }
            },

            refreshFileTree: async () => {
                const { repo } = get();
                if (!repo) return;

                try {
                    const tree = await getFileTree(repo.repo_id);
                    set({ fileTree: tree });
                } catch (err) {
                    console.error('Failed to refresh file tree:', err);
                }
            },

            setChangedFiles: (files: string[]) => {
                set({ changedFiles: [...files] });
            },

            clearRepo: () => {
                set({
                    repo: null,
                    fileTree: [],
                    selectedFile: null,
                    fileContent: null,
                    error: null,
                    changedFiles: [],
                });
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'repopilot-repo',
            storage: {
                getItem: (name) => {
                    const str = sessionStorage.getItem(name);
                    return str ? JSON.parse(str) : null;
                },
                setItem: (name, value) => {
                    sessionStorage.setItem(name, JSON.stringify(value));
                },
                removeItem: (name) => {
                    sessionStorage.removeItem(name);
                },
            },
            partialize: (state) => ({
                repo: state.repo,
                fileTree: state.fileTree,
                changedFiles: state.changedFiles,
            } as unknown as RepoState),
        }
    )
);
