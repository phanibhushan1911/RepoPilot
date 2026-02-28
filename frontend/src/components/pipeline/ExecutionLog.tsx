import { usePipelineStore } from '../../stores/pipelineStore'
import { ListChecks } from 'lucide-react'
import MistralIcon, { getLogIconModel } from '../MistralIcon'

export default function ExecutionLog() {
    const { logs } = usePipelineStore()

    if (logs.length === 0) {
        return (
            <div className="empty-state">
                <ListChecks size={40} className="empty-state-icon" />
                <p style={{ fontSize: '0.875rem' }}>No activity yet</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Logs will appear here as the pipeline runs
                </p>
            </div>
        )
    }

    return (
        <div className="execution-log">
            {logs.map((entry, i) => (
                <div key={i} className={`log-entry ${entry.type}`}>
                    <span className="log-timestamp">{entry.timestamp}</span>
                    <MistralIcon model={getLogIconModel(entry.type)} size={14} />
                    <span>{entry.message}</span>
                </div>
            ))}
        </div>
    )
}
