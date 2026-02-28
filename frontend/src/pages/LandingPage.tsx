import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRepoStore } from '../stores/repoStore'
import {
    Loader2,
    ArrowRight,
} from 'lucide-react'

const MISTRAL_ICONS = [
    { name: 'Mistral Large', url: 'https://mistral.ai/static/branding/mistral-models/Large.png' },
    { name: 'Mistral Medium', url: 'https://mistral.ai/static/branding/mistral-models/Medium.png' },
    { name: 'Mistral Small', url: 'https://mistral.ai/static/branding/mistral-models/Small.png' },
    { name: 'Codestral', url: 'https://mistral.ai/static/branding/mistral-models/Codestral.png' },
]

export default function LandingPage() {
    const [url, setUrl] = useState('')
    const { cloneRepository, isCloning, error, clearError } = useRepoStore()
    const navigate = useNavigate()

    const handleClone = async () => {
        if (!url.trim()) return
        clearError()
        try {
            await cloneRepository(url.trim())
            navigate('/workspace')
        } catch {
            // error is set in store
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleClone()
        }
    }

    return (
        <div className="landing">
            <div className="landing-content">
                {/* Logo */}
                <div className="landing-logo">
                    <div className="landing-logo-icon">
                        <img
                            src="/repopilot-logo.svg"
                            alt="RepoPilot Logo"
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                    <span className="landing-logo-text">RepoPilot</span>
                </div>

                {/* Tagline */}
                <p className="landing-tagline">
                    Your <strong>AI autonomous developer</strong> that analyzes your codebase,
                    plans engineering tasks, writes code across multiple files, and reviews its own work.
                </p>

                {/* Clone Form */}
                <div className="landing-form">
                    <div className="landing-input-group">
                        <input
                            className="input"
                            type="url"
                            placeholder="https://github.com/user/repo"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isCloning}
                            id="github-url-input"
                        />
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleClone}
                            disabled={isCloning || !url.trim()}
                            id="clone-btn"
                        >
                            {isCloning ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Cloning…
                                </>
                            ) : (
                                <>
                                    Import <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div
                            style={{
                                color: 'var(--error)',
                                fontSize: '0.875rem',
                                textAlign: 'left',
                                padding: '0 var(--space-2)',
                            }}
                        >
                            {error}
                        </div>
                    )}
                </div>

                {/* Feature Cards */}
                <div className="landing-features">
                    <div className="feature-card glass-card">
                        <div className="feature-icon" style={{ background: 'transparent' }}>
                            <img src="https://mistral.ai/static/branding/mistral-models/Ministral.png" alt="Ministral" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
                        </div>
                        <div className="feature-title">Analyze</div>
                        <div className="feature-desc">
                            Deep understanding of your repo structure and codebase
                        </div>
                    </div>

                    <div className="feature-card glass-card">
                        <div className="feature-icon" style={{ background: 'transparent' }}>
                            <img src="https://mistral.ai/static/branding/mistral-models/Devstral.png" alt="Devstral" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
                        </div>
                        <div className="feature-title">Plan & Code</div>
                        <div className="feature-desc">
                            AI breaks goals into tasks and generates multi-file edits
                        </div>
                    </div>

                    <div className="feature-card glass-card">
                        <div className="feature-icon" style={{ background: 'transparent' }}>
                            <img src="https://mistral.ai/static/branding/mistral-models/Codestral%20Embed.png" alt="Codestral Embed" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
                        </div>
                        <div className="feature-title">Self-Review</div>
                        <div className="feature-desc">
                            Automated quality review before any changes are applied
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="landing-footer">
                <div className="static-model-icons">
                    {MISTRAL_ICONS.map((icon, i) => (
                        <div key={i} className="static-model-icon" title={icon.name}>
                            <img src={icon.url} alt={icon.name} />
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div className="Developed-by">
                        Developed by <a href="https://phanibhushan.tech" target="_blank" rel="noopener noreferrer">Phani Bhushan</a>
                    </div>
                    <div style={{ width: '1px', height: '12px', background: 'var(--border-secondary)' }}></div>
                    <a
                        href="https://mistral.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="powered-by-mistral"
                        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                    >
                        <span>Powered by</span>
                        <img src="https://mistral.ai/static/branding/mistral-logo/mistral-logo-black.png" alt="Mistral AI" className="mistral-logo" />
                    </a>
                </div>
            </div>
        </div>
    )
}
