import { useState } from 'react'
import { usePipelineStore } from '../../stores/pipelineStore'
import { generateSummary } from '../../services/api'
import { FileText, Sparkles } from 'lucide-react'
import MistralIcon from '../MistralIcon'

export default function SummaryPanel() {
    const { sessionId, stage, results } = usePipelineStore()
    const [summary, setSummary] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleGenerate = async () => {
        if (!sessionId) return
        setLoading(true)
        setError(null)
        try {
            const res = await generateSummary(sessionId)
            setSummary(res.summary)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate summary')
        } finally {
            setLoading(false)
        }
    }

    if (stage !== 'completed' || !results || results.length === 0) {
        return (
            <div className="empty-state">
                <FileText size={40} className="empty-state-icon" />
                <p style={{ fontSize: '0.875rem' }}>Summary not available yet</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Complete the pipeline to generate an AI summary report
                </p>
            </div>
        )
    }

    if (!summary && !loading) {
        return (
            <div className="empty-state">
                <MistralIcon model="large" size={48} style={{ opacity: 0.6 }} />
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Generate AI Summary</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: 280, lineHeight: 1.5 }}>
                    Mistral Large will analyze all changes and create a comprehensive report
                </p>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={handleGenerate}
                    style={{ marginTop: 'var(--space-2)' }}
                    id="generate-summary-btn"
                >
                    <Sparkles size={14} /> Generate Report
                </button>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="empty-state">
                <MistralIcon model="large" size={36} className="animate-pulse" />
                <p style={{ fontSize: '0.875rem' }}>Generating summary...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="empty-state">
                <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{error}</p>
                <button className="btn btn-ghost btn-sm" onClick={handleGenerate}>
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="summary-report">
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
                paddingBottom: 'var(--space-3)',
                borderBottom: '1px solid var(--border-primary)',
            }}>
                <MistralIcon model="large" size={20} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>AI Summary Report</span>
            </div>
            <div
                className="summary-content"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(summary!) }}
            />
        </div>
    )
}

function formatMarkdown(text: string): string {
    // Strip markdown code block wrappers if present
    let cleanText = text.replace(/^```(?:markdown)?\n([\s\S]*?)\n```$/g, '$1')

    let formatted = cleanText
        .replace(/^### (.+)$/gm, '<h4 style="margin: 16px 0 8px; font-size: 0.875rem; font-weight: 700; color: var(--text-primary)">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 style="margin: 20px 0 10px; font-size: 1rem; font-weight: 700; color: var(--text-primary)">$1</h3>')
        .replace(/^# (.+)$/gm, '<h2 style="margin: 0 0 12px; font-size: 1.125rem; font-weight: 800; color: var(--text-primary)">$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color: var(--text-primary)">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; overflow-x: auto; margin: 12px 0; font-size: 0.8125rem; font-family: var(--font-mono)"><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code style="background: var(--bg-tertiary); padding: 1px 5px; border-radius: 4px; font-size: 0.8125rem; font-family: var(--font-mono)">$1</code>')
        .replace(/^- (.+)$/gm, '<div style="padding: 2px 0 2px 16px; position: relative"><span style="position: absolute; left: 4px; color: var(--accent-primary)">•</span>$1</div>')
        .replace(/^\d+\. (.+)$/gm, '<div style="padding: 2px 0 2px 16px">$1</div>')

    formatted = formatted.replace(/\n{2,}/g, '<br /><br />')
    formatted = formatted.replace(/\n/g, '<br />')

    // Remove extra <br> tags immediately around block elements
    formatted = formatted.replace(/(?:<br \/>)+(\s*<h[2-5])/g, '$1')
    formatted = formatted.replace(/(<\/h[2-5]>)\s*(?:<br \/>)+/g, '$1')
    formatted = formatted.replace(/(?:<br \/>)+(\s*<pre)/g, '$1')
    formatted = formatted.replace(/(<\/pre>)\s*(?:<br \/>)+/g, '$1')

    return formatted
}
