import { useRepoStore } from '../../stores/repoStore'
import { usePipelineStore } from '../../stores/pipelineStore'
import { Rocket, Loader2 } from 'lucide-react'
import MistralIcon from '../MistralIcon'

const stepIcons: Record<string, React.ReactNode> = {
    creating_session: <Rocket size={16} className="animate-spin" />,
    analyzing: <MistralIcon model="ministral" size={18} className="animate-pulse" />,
    reading_files: <MistralIcon model="codestral" size={18} className="animate-pulse" />,
    building_context: <MistralIcon model="mistral-embed" size={18} className="animate-pulse" />,
    ai_thinking: <MistralIcon model="large" size={18} className="animate-pulse" />,
    structuring: <MistralIcon model="magistral" size={18} className="animate-pulse" />,
}

export default function GoalInput() {
    const { repo } = useRepoStore()
    const { goal, setGoal, startPlanning, isLoading, stage, plan, planningProgress } = usePipelineStore()

    const handleSubmit = () => {
        if (!repo || !goal.trim()) return
        startPlanning(repo.repo_id)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const isPlanReady = plan !== null && stage !== 'idle'
    const isDisabled = isLoading || !goal.trim() || isPlanReady

    return (
        <div className="goal-input-container">
            <label
                htmlFor="goal-textarea"
                style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}
            >
                Development Goal
            </label>

            <textarea
                id="goal-textarea"
                className="input goal-textarea"
                placeholder={"Describe what you want to build or change…\n\nExample: Add user authentication with JWT tokens, including login and registration endpoints"}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isPlanReady}
                rows={5}
            />

            <div className="goal-actions">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {goal.length} chars · ⌘+Enter to submit
                </span>
                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={isDisabled}
                    id="start-planning-btn"
                >
                    {isLoading && (stage === 'analyzing' || stage === 'planning') ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Thinking…
                        </>
                    ) : isPlanReady ? (
                        '✓ Plan Generated'
                    ) : (
                        <>
                            <Rocket size={16} />
                            Generate Plan
                        </>
                    )}
                </button>
            </div>

            {/* Planning Progress */}
            {planningProgress && (
                <div className="animate-fadeIn" style={{ marginTop: 'var(--space-4)' }}>
                    {/* Progress bar */}
                    <div style={{
                        width: '100%',
                        height: 4,
                        background: 'var(--bg-secondary)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        marginBottom: 'var(--space-3)',
                    }}>
                        <div style={{
                            width: `${planningProgress.progress}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                            borderRadius: 2,
                            transition: 'width 0.6s ease',
                        }} />
                    </div>

                    {/* Current step */}
                    <div className="glass-card" style={{
                        padding: 'var(--space-3) var(--space-4)',
                        borderLeft: '3px solid var(--accent-primary)',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            color: 'var(--accent-primary)',
                            marginBottom: 'var(--space-1)',
                        }}>
                            {stepIcons[planningProgress.step] || <Loader2 size={16} className="animate-spin" />}
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                {planningProgress.message}
                            </span>
                        </div>

                        {/* Show key files being read */}
                        {planningProgress.files && planningProgress.files.length > 0 && (
                            <div style={{
                                marginTop: 'var(--space-2)',
                                paddingLeft: 'var(--space-5)',
                            }}>
                                {planningProgress.files.map((f, i) => (
                                    <div key={i} style={{
                                        fontSize: '0.75rem',
                                        fontFamily: 'var(--font-mono)',
                                        color: 'var(--text-muted)',
                                        padding: '1px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}>
                                        <MistralIcon model="codestral" size={12} style={{ marginRight: 4 }} /> {f}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Show language stats */}
                        {planningProgress.languageStats && (
                            <div style={{
                                display: 'flex',
                                gap: 'var(--space-2)',
                                flexWrap: 'wrap',
                                marginTop: 'var(--space-2)',
                                paddingLeft: 'var(--space-5)',
                            }}>
                                {Object.entries(planningProgress.languageStats)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 5)
                                    .map(([lang, count]) => (
                                        <span key={lang} className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                                            {lang}: {count}
                                        </span>
                                    ))}
                                {planningProgress.totalFiles && (
                                    <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                                        {planningProgress.totalFiles} total files
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
