import { usePipelineStore } from '../../stores/pipelineStore'
import { Play, Loader2, CheckCircle, AlertCircle, FileCode } from 'lucide-react'

export default function PlanView() {
    const { plan, executeCode, isLoading, stage } = usePipelineStore()

    if (!plan) return null

    const canExecute = stage === 'planning' && !isLoading
    const isExecuting = isLoading && (stage === 'coding' || stage === 'reviewing')

    return (
        <div style={{ marginTop: 'var(--space-6)' }}>
            {/* Header */}
            <div className="plan-header">
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    Task Plan ({plan.tasks.length} tasks)
                </h3>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={executeCode}
                    disabled={!canExecute}
                    id="execute-plan-btn"
                >
                    {isExecuting ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Executing…
                        </>
                    ) : stage === 'completed' ? (
                        <>
                            <CheckCircle size={14} />
                            Done
                        </>
                    ) : (
                        <>
                            <Play size={14} />
                            Execute Plan
                        </>
                    )}
                </button>
            </div>

            {/* Analysis */}
            {plan.analysis && (
                <div className="plan-analysis">{plan.analysis}</div>
            )}

            {/* Task Cards */}
            {plan.tasks.map((task, index) => (
                <div
                    key={task.id}
                    className="task-card"
                    style={{ animationDelay: `${index * 80}ms` }}
                >
                    <div className="task-card-header">
                        <span className="task-number">{index + 1}</span>
                        <span className="task-title">{task.title}</span>
                        {task.status === 'completed' && (
                            <CheckCircle size={14} color="var(--success)" />
                        )}
                        {task.status === 'in_progress' && (
                            <Loader2 size={14} className="animate-spin" color="var(--accent-primary)" />
                        )}
                        {task.status === 'failed' && (
                            <AlertCircle size={14} color="var(--error)" />
                        )}
                    </div>
                    <p className="task-description">{task.description}</p>
                    <div className="task-meta">
                        <span className={`badge badge-${task.complexity === 'high' ? 'error' :
                                task.complexity === 'medium' ? 'warning' : 'success'
                            }`}>
                            {task.complexity}
                        </span>
                        {task.target_files.map((f) => (
                            <span key={f} className="task-file-tag">
                                <FileCode size={10} />
                                {f.split('/').pop()}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
