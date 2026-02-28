import { usePipelineStore } from '../../stores/pipelineStore'
import { FilePlus, FileEdit, FileX, FileCode, Loader2 } from 'lucide-react'
import MistralIcon from '../MistralIcon'

const actionIcon = (action: string) => {
    switch (action) {
        case 'create': return <FilePlus size={14} color="var(--success)" />
        case 'modify': return <FileEdit size={14} color="var(--warning)" />
        case 'delete': return <FileX size={14} color="var(--error)" />
        default: return <FileCode size={14} />
    }
}

const actionLabel: Record<string, string> = {
    create: 'NEW',
    modify: 'MODIFIED',
    delete: 'DELETED',
}

export default function DiffViewer() {
    const { results, applyAllChanges, isLoading, stage, streaming, changesApplied } = usePipelineStore()

    // Show streaming progress while coding
    if ((stage === 'coding' || stage === 'reviewing') && streaming) {
        return (
            <div style={{ padding: 'var(--space-4)' }}>
                {/* Progress header */}
                <div className="glass-card" style={{
                    padding: 'var(--space-5)',
                    marginBottom: 'var(--space-4)',
                    textAlign: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                        {stage === 'coding' ? (
                            <MistralIcon model="codestral" size={28} className="animate-pulse" />
                        ) : (
                            <MistralIcon model="large" size={28} className="animate-pulse" />
                        )}
                        <span style={{ fontSize: '1rem', fontWeight: 600 }}>
                            {stage === 'coding' ? 'AI is coding...' : 'AI is reviewing...'}
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{
                        width: '100%',
                        height: 6,
                        background: 'var(--bg-secondary)',
                        borderRadius: 3,
                        overflow: 'hidden',
                        marginBottom: 'var(--space-3)',
                    }}>
                        <div style={{
                            width: `${streaming.totalTasks > 0 ? (streaming.completedTasks / streaming.totalTasks) * 100 : 0}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                            borderRadius: 3,
                            transition: 'width 0.5s ease',
                        }} />
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {streaming.completedTasks} / {streaming.totalTasks} tasks completed
                    </div>
                </div>

                {/* Current activity */}
                <div className="glass-card" style={{
                    padding: 'var(--space-4)',
                    marginBottom: 'var(--space-4)',
                    borderLeft: '3px solid var(--accent-primary)',
                }}>
                    <div style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        marginBottom: 'var(--space-1)',
                    }}>
                        {streaming.taskTitle}
                    </div>
                    <div style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-tertiary)',
                    }}>
                        {streaming.message}
                    </div>
                </div>

                {/* Files changed so far */}
                {streaming.changedFiles.length > 0 && (
                    <div>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: 'var(--space-2)',
                        }}>
                            Files changed so far ({streaming.changedFiles.length})
                        </div>
                        {streaming.changedFiles.map((file, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                                padding: 'var(--space-1) var(--space-2)',
                                fontSize: '0.8125rem',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--text-secondary)',
                            }}>
                                <FileCode size={12} color="var(--accent-secondary)" />
                                {file}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    if (!results || results.length === 0) {
        return (
            <div className="empty-state">
                <FileCode size={40} className="empty-state-icon" />
                <p style={{ fontSize: '0.875rem' }}>No changes yet</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Execute the plan to generate code changes
                </p>
            </div>
        )
    }

    const allChanges = results.flatMap((r) =>
        r.changes.map((c) => ({ ...c, taskTitle: r.task_title }))
    )

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-4)',
            }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {allChanges.length} file changes
                </span>
                {stage === 'completed' && (
                    <button
                        className={`btn btn-${changesApplied ? 'ghost' : 'success'} btn-sm`}
                        onClick={applyAllChanges}
                        disabled={isLoading || changesApplied}
                        id="apply-changes-btn"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Applying…
                            </>
                        ) : changesApplied ? (
                            'Changes Applied'
                        ) : (
                            'Apply All Changes'
                        )}
                    </button>
                )}
            </div>

            {/* Change cards */}
            {allChanges.map((change, i) => (
                <div key={i} className="animate-fadeInUp" style={{ marginBottom: 'var(--space-4)' }}>
                    {/* File header */}
                    <div className="diff-file-header">
                        {actionIcon(change.action)}
                        <span style={{ flex: 1 }}>{change.file_path}</span>
                        <span className={`badge badge-${change.action === 'create' ? 'success' :
                            change.action === 'delete' ? 'error' : 'warning'
                            }`}>
                            {actionLabel[change.action] || change.action}
                        </span>
                    </div>

                    {/* Description */}
                    <div style={{
                        padding: 'var(--space-2) var(--space-4)',
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-tertiary)',
                        borderLeft: '1px solid var(--border-primary)',
                        borderRight: '1px solid var(--border-primary)',
                    }}>
                        {change.description}
                    </div>

                    {/* Diff content */}
                    {change.new_content && (
                        <div className="diff-content" style={{ maxHeight: 300 }}>
                            {(change.diff_preview || change.new_content).split('\n').slice(0, 50).map((line, j) => {
                                let cls = ''
                                if (line.startsWith('+') && !line.startsWith('+++')) cls = 'added'
                                else if (line.startsWith('-') && !line.startsWith('---')) cls = 'removed'

                                return (
                                    <div key={j} className={`diff-line ${cls}`}>
                                        {line}
                                    </div>
                                )
                            })}
                            {(change.diff_preview || change.new_content).split('\n').length > 50 && (
                                <div className="diff-line" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    … {(change.diff_preview || change.new_content).split('\n').length - 50} more lines
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
