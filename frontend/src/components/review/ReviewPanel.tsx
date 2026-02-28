import { usePipelineStore } from '../../stores/pipelineStore'
import { CheckCircle, AlertTriangle, XCircle, Eye, Info } from 'lucide-react'
import MistralIcon from '../MistralIcon'

export default function ReviewPanel() {
    const { review } = usePipelineStore()

    if (!review) {
        return (
            <div className="empty-state">
                <Eye size={40} className="empty-state-icon" />
                <p style={{ fontSize: '0.875rem' }}>No review yet</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    The AI review will appear here after code generation
                </p>
            </div>
        )
    }

    const scoreClass = review.overall_score >= 7 ? 'high' : review.overall_score >= 5 ? 'medium' : 'low'
    const verdictIcon = {
        pass: <CheckCircle size={18} color="var(--success)" />,
        warn: <AlertTriangle size={18} color="var(--warning)" />,
        fail: <XCircle size={18} color="var(--error)" />,
    }

    return (
        <div className="animate-fadeIn">
            {/* Score */}
            <div className="review-score">
                <div className={`score-circle ${scoreClass}`}>
                    {review.overall_score}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
                    {verdictIcon[review.goal_alignment]}
                    <span style={{ fontWeight: 600 }}>
                        Goal Alignment: {review.goal_alignment.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Summary */}
            <div style={{
                padding: 'var(--space-4)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-4)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
            }}>
                {review.summary}
            </div>

            {/* Issues */}
            {review.issues.length > 0 && (
                <>
                    <h4 style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: 'var(--space-2)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}>
                        Issues ({review.issues.length})
                    </h4>

                    {review.issues.map((issue, i) => (
                        <div key={i} className="review-issue">
                            <div className={`issue-severity ${issue.severity}`} />
                            <div>
                                <div style={{ fontWeight: 500, marginBottom: 2, color: 'var(--text-primary)' }}>
                                    {issue.description}
                                </div>
                                {issue.file_path && (
                                    <div style={{
                                        fontSize: '0.75rem',
                                        fontFamily: 'var(--font-mono)',
                                        color: 'var(--text-muted)',
                                        marginBottom: 2,
                                    }}>
                                        {issue.file_path}
                                    </div>
                                )}
                                {issue.suggestion && (
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                                        <MistralIcon model="mathstral" size={14} style={{ marginTop: 2 }} /> {issue.suggestion}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </>
            )}

            {/* Suggestions */}
            {review.suggestions.length > 0 && (
                <>
                    <h4 style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginTop: 'var(--space-4)',
                        marginBottom: 'var(--space-2)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}>
                        Suggestions
                    </h4>

                    {review.suggestions.map((s, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 'var(--space-2)',
                            padding: 'var(--space-2)',
                            fontSize: '0.8125rem',
                            color: 'var(--text-secondary)',
                        }}>
                            <Info size={14} style={{ marginTop: 2, flexShrink: 0 }} color="var(--info)" />
                            {s}
                        </div>
                    ))}
                </>
            )}

            {/* Per-file reviews */}
            {Object.keys(review.per_file_reviews).length > 0 && (
                <>
                    <h4 style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginTop: 'var(--space-4)',
                        marginBottom: 'var(--space-2)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}>
                        File Reviews
                    </h4>

                    {Object.entries(review.per_file_reviews).map(([path, comment]) => (
                        <div key={path} style={{
                            padding: 'var(--space-3)',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-2)',
                        }}>
                            <div style={{
                                fontSize: '0.75rem',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--accent-tertiary)',
                                marginBottom: 'var(--space-1)',
                            }}>
                                {path}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {comment}
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    )
}
