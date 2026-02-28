import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRepoStore } from '../stores/repoStore'
import { usePipelineStore } from '../stores/pipelineStore'
import FileTree from '../components/repo/FileTree'
import CodeViewer from '../components/repo/CodeViewer'
import GoalInput from '../components/pipeline/GoalInput'
import PlanView from '../components/pipeline/PlanView'
import ExecutionLog from '../components/pipeline/ExecutionLog'
import DiffViewer from '../components/pipeline/DiffViewer'
import ReviewPanel from '../components/review/ReviewPanel'
import SummaryPanel from '../components/pipeline/SummaryPanel'
import ChatPanel from '../components/pipeline/ChatPanel'
import ResizeHandle from '../components/ResizeHandle'
import {
    PanelLeftClose,
    PanelLeft,
    Rocket,
    FileCode,
    Eye,
    ListChecks,
    FileText,
    MessageCircle,
} from 'lucide-react'

type PanelTab = 'goal' | 'changes' | 'review' | 'log' | 'summary' | 'chat'

export default function WorkspacePage() {
    const navigate = useNavigate()
    const { repo } = useRepoStore()
    const { stage } = usePipelineStore()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [activeTab, setActiveTab] = useState<PanelTab>('goal')
    const sidebarRef = useRef<HTMLElement>(null)
    const panelRef = useRef<HTMLElement>(null)

    // Redirect if no repo loaded
    useEffect(() => {
        if (!repo) navigate('/')
    }, [repo, navigate])

    // Auto-switch tabs based on pipeline stage
    useEffect(() => {
        if (stage === 'coding' || stage === 'completed') {
            setActiveTab('changes')
        }
        if (stage === 'completed') {
            setActiveTab('review')
        }
    }, [stage])

    if (!repo) return null

    const stageLabel: Record<string, string> = {
        idle: 'Ready',
        analyzing: 'Analyzing…',
        planning: 'Planning…',
        coding: 'Coding…',
        reviewing: 'Reviewing…',
        completed: 'Completed',
        failed: 'Failed',
    }

    const stageColor: Record<string, string> = {
        idle: 'idle',
        analyzing: 'active',
        planning: 'active',
        coding: 'active',
        reviewing: 'active',
        completed: 'success',
        failed: 'error',
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Header */}
            <header className="header">
                <div className="header-left">
                    <a href="/" className="header-logo">
                        <div className="header-logo-icon">
                            <img src="/repopilot-logo.svg" alt="RepoPilot" style={{ width: '100%', height: '100%' }} />
                        </div>
                        <span className="header-logo-text">RepoPilot</span>
                    </a>
                    <div className="header-separator" />
                    <span className="header-repo-name">{repo.name}</span>
                    <span className="badge badge-neutral">{repo.total_files} files</span>
                </div>
                <div className="header-right">
                    <div className="progress-steps">
                        {['Analyze', 'Plan', 'Code', 'Review'].map((s, i) => {
                            const stages = ['analyzing', 'planning', 'coding', 'reviewing']
                            const idx = stages.indexOf(stage)
                            const isComplete = i < idx || stage === 'completed'
                            const isActive = stages[i] === stage
                            return (
                                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {i > 0 && (
                                        <div
                                            className={`progress-step-line ${isComplete ? 'completed' : isActive ? 'active' : ''}`}
                                        />
                                    )}
                                    <span
                                        className={`progress-step ${isComplete ? 'completed' : isActive ? 'active' : ''}`}
                                    >
                                        {s}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </header>

            {/* Workspace */}
            <div className="workspace">
                {/* Sidebar */}
                <aside ref={sidebarRef} className={`workspace-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
                    <div className="workspace-sidebar-header">
                        <span>Explorer</span>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSidebarOpen(false)}
                            id="collapse-sidebar-btn"
                        >
                            <PanelLeftClose size={14} />
                        </button>
                    </div>
                    <div className="workspace-sidebar-content">
                        <FileTree nodes={repo.file_tree} />
                    </div>
                    {sidebarOpen && <ResizeHandle side="left" targetRef={sidebarRef} minWidth={160} maxWidth={500} />}
                </aside>

                {/* Toggle sidebar button when collapsed */}
                {!sidebarOpen && (
                    <button
                        className="btn btn-ghost"
                        onClick={() => setSidebarOpen(true)}
                        style={{ position: 'absolute', left: 4, top: 72, zIndex: 10 }}
                        id="expand-sidebar-btn"
                    >
                        <PanelLeft size={16} />
                    </button>
                )}

                {/* Main code area */}
                <main className="workspace-main">
                    <CodeViewer />
                </main>

                <aside ref={panelRef} className="workspace-panel">
                    <ResizeHandle side="right" targetRef={panelRef} minWidth={280} maxWidth={700} />
                    <div className="panel-tabs">
                        <button
                            className={`panel-tab ${activeTab === 'goal' ? 'active' : ''}`}
                            onClick={() => setActiveTab('goal')}
                            id="tab-goal"
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Rocket size={14} /> Goal
                            </span>
                        </button>
                        <button
                            className={`panel-tab ${activeTab === 'changes' ? 'active' : ''}`}
                            onClick={() => setActiveTab('changes')}
                            id="tab-changes"
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FileCode size={14} /> Changes
                            </span>
                        </button>
                        <button
                            className={`panel-tab ${activeTab === 'review' ? 'active' : ''}`}
                            onClick={() => setActiveTab('review')}
                            id="tab-review"
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Eye size={14} /> Review
                            </span>
                        </button>
                        <button
                            className={`panel-tab ${activeTab === 'summary' ? 'active' : ''}`}
                            onClick={() => setActiveTab('summary')}
                            id="tab-summary"
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FileText size={14} /> Summary
                            </span>
                        </button>
                        <button
                            className={`panel-tab ${activeTab === 'chat' ? 'active' : ''}`}
                            onClick={() => setActiveTab('chat')}
                            id="tab-chat"
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <MessageCircle size={14} /> Chat
                            </span>
                        </button>
                        <button
                            className={`panel-tab ${activeTab === 'log' ? 'active' : ''}`}
                            onClick={() => setActiveTab('log')}
                            id="tab-log"
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <ListChecks size={14} /> Log
                            </span>
                        </button>
                    </div>

                    <div className="panel-content">
                        <div style={{ display: activeTab === 'goal' ? 'block' : 'none', height: '100%' }}>
                            <div className="animate-fadeIn" style={{ height: '100%' }}>
                                <GoalInput />
                                {usePipelineStore.getState().plan && <PlanView />}
                            </div>
                        </div>
                        <div style={{ display: activeTab === 'changes' ? 'block' : 'none', height: '100%' }}>
                            <div className="animate-fadeIn" style={{ height: '100%' }}>
                                <DiffViewer />
                            </div>
                        </div>
                        <div style={{ display: activeTab === 'review' ? 'block' : 'none', height: '100%' }}>
                            <div className="animate-fadeIn" style={{ height: '100%' }}>
                                <ReviewPanel />
                            </div>
                        </div>
                        <div style={{ display: activeTab === 'summary' ? 'block' : 'none', height: '100%' }}>
                            <div className="animate-fadeIn" style={{ height: '100%' }}>
                                <SummaryPanel />
                            </div>
                        </div>
                        <div style={{ display: activeTab === 'chat' ? 'block' : 'none', height: '100%' }}>
                            <div className="animate-fadeIn" style={{ height: '100%' }}>
                                <ChatPanel />
                            </div>
                        </div>
                        <div style={{ display: activeTab === 'log' ? 'block' : 'none', height: '100%' }}>
                            <div className="animate-fadeIn" style={{ height: '100%' }}>
                                <ExecutionLog />
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Status Bar */}
            <div className="status-bar">
                <div className="status-bar-left">
                    <div className="status-indicator">
                        <div className={`status-dot ${stageColor[stage] || 'idle'}`} />
                        <span>{stageLabel[stage] || stage}</span>
                    </div>
                </div>
                <div className="status-bar-right">
                    <a
                        href="https://mistral.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        Powered by Mistral AI
                    </a>
                </div>
            </div>
        </div>
    )
}
