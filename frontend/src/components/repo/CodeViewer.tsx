import { useState, useRef } from 'react'
import { useRepoStore } from '../../stores/repoStore'
import { explainCode } from '../../services/api'
import { FileCode, Loader2, X } from 'lucide-react'
import MistralIcon from '../MistralIcon'

export default function CodeViewer() {
    const { repo, selectedFile, fileContent, isLoadingFile } = useRepoStore()
    const [explanation, setExplanation] = useState<string | null>(null)
    const [explaining, setExplaining] = useState(false)
    const [showExplanation, setShowExplanation] = useState(false)
    const explanationCache = useRef<Map<string, string>>(new Map())

    const handleExplain = async () => {
        if (!repo || !selectedFile) return

        // Check cache first
        const cached = explanationCache.current.get(selectedFile)
        if (cached) {
            setExplanation(cached)
            setShowExplanation(true)
            return
        }

        setExplaining(true)
        setShowExplanation(true)
        try {
            const res = await explainCode(repo.repo_id, selectedFile)
            setExplanation(res.explanation)
            explanationCache.current.set(selectedFile, res.explanation)
        } catch (err) {
            setExplanation(`Error: ${err instanceof Error ? err.message : 'Failed to explain'}`)
        } finally {
            setExplaining(false)
        }
    }

    if (isLoadingFile) {
        return (
            <div className="empty-state">
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                <span>Loading file…</span>
            </div>
        )
    }

    if (!selectedFile || !fileContent) {
        return (
            <div className="empty-state">
                <FileCode size={48} className="empty-state-icon" />
                <div>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: 4 }}>
                        No file selected
                    </p>
                    <p style={{ fontSize: '0.8125rem' }}>
                        Select a file from the explorer to view its contents
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* File tab */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-4)',
                    background: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-primary)',
                    fontSize: '0.8125rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                }}
            >
                <FileCode size={14} />
                <span style={{ flex: 1 }}>{selectedFile}</span>
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleExplain}
                    disabled={explaining}
                    style={{ fontSize: '0.75rem', gap: 4 }}
                    id="explain-code-btn"
                >
                    {explaining ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : (
                        <MistralIcon model="codestral" size={14} />
                    )}
                    Explain
                </button>
            </div>

            {/* AI Explanation panel */}
            {showExplanation && (
                <div className="explain-panel">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-2)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <MistralIcon model="codestral" size={16} />
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>AI Explanation</span>
                        </div>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setShowExplanation(false)}
                            style={{ padding: 2 }}
                        >
                            <X size={12} />
                        </button>
                    </div>
                    {explaining ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                            <Loader2 size={14} className="animate-spin" />
                            Analyzing code...
                        </div>
                    ) : (
                        <div
                            style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}
                            dangerouslySetInnerHTML={{
                                __html: formatMarkdown(explanation || '')
                            }}
                        />
                    )}
                </div>
            )}

            {/* Code content */}
            <div
                style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: 'var(--space-4)',
                    background: 'var(--bg-primary)',
                }}
            >
                <pre
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8125rem',
                        lineHeight: 1.7,
                        color: 'var(--text-primary)',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}
                >
                    {fileContent.content.split('\n').map((line, i) => (
                        <div key={i} style={{ display: 'flex', minHeight: '1.7em' }}>
                            <span
                                style={{
                                    minWidth: 48,
                                    textAlign: 'right',
                                    paddingRight: 16,
                                    color: 'var(--text-muted)',
                                    userSelect: 'none',
                                    flexShrink: 0,
                                }}
                            >
                                {i + 1}
                            </span>
                            <span>{line || ' '}</span>
                        </div>
                    ))}
                </pre>
            </div>
        </div>
    )
}

function formatMarkdown(text: string): string {
    let formatted = text
        .replace(/^### (.+)$/gm, '<h4 style="margin: 16px 0 8px; font-size: 0.8125rem; font-weight: 700; color: var(--text-primary)">$1</h4>')
        .replace(/^#### (.+)$/gm, '<h5 style="margin: 12px 0 6px; font-size: 0.75rem; font-weight: 700; color: var(--text-primary)">$1</h5>')
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color: var(--text-primary)">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background: var(--bg-tertiary); padding: 1px 4px; border-radius: 3px; font-size: 0.75rem; font-family: var(--font-mono)">$1</code>')
        .replace(/^- (.+)$/gm, '<div style="padding: 1px 0 1px 12px; position: relative"><span style="position: absolute; left: 2px; color: var(--accent-primary)">•</span>$1</div>')
        .replace(/^\d+\. (.+)$/gm, '<div style="padding: 2px 0 2px 12px">$1</div>')

    formatted = formatted.replace(/\n{2,}/g, '<br /><br />')
    formatted = formatted.replace(/\n/g, '<br />')

    // Remove extra <br> tags immediately around heading block elements
    formatted = formatted.replace(/(?:<br \/>)+(\s*<h[2-5])/g, '$1')
    formatted = formatted.replace(/(<\/h[2-5]>)\s*(?:<br \/>)+/g, '$1')

    return formatted
}
