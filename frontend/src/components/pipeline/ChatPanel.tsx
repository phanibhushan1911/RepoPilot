import { useState, useRef, useEffect } from 'react'
import { usePipelineStore } from '../../stores/pipelineStore'
import { chatWithAI } from '../../services/api'
import { Send } from 'lucide-react'
import MistralIcon from '../MistralIcon'
import type { ChatMessageType } from '../../types'

export default function ChatPanel() {
    const { sessionId, stage } = usePipelineStore()
    const [messages, setMessages] = useState<ChatMessageType[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || !sessionId || loading) return

        const userMessage: ChatMessageType = { role: 'user', content: input.trim() }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            const res = await chatWithAI(sessionId, userMessage.content, messages)
            setMessages(prev => [...prev, { role: 'assistant', content: res.response }])
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error: ${err instanceof Error ? err.message : 'Failed to get response'}`
            }])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (!sessionId || stage === 'idle') {
        return (
            <div className="empty-state">
                <MistralIcon model="large" size={40} style={{ opacity: 0.4 }} />
                <p style={{ fontSize: '0.875rem' }}>Chat not available yet</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Start the pipeline to chat with AI about your codebase
                </p>
            </div>
        )
    }

    return (
        <div className="chat-panel">
            {/* Messages */}
            <div className="chat-messages" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="chat-welcome">
                        <MistralIcon model="large" size={32} />
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: '8px 0 4px' }}>
                            RepoPilot AI Chat
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            Ask me about the code changes, architecture decisions, or request improvements.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-3)', justifyContent: 'center' }}>
                            {[
                                'Explain the changes',
                                'What could be improved?',
                                'Are there any security concerns?',
                            ].map(suggestion => (
                                <button
                                    key={suggestion}
                                    className="btn btn-ghost btn-sm"
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={() => {
                                        setInput(suggestion)
                                    }}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`chat-message ${msg.role}`}>
                        <div className="chat-message-avatar">
                            {msg.role === 'assistant' ? (
                                <MistralIcon model="large" size={20} />
                            ) : (
                                <div className="chat-user-avatar">U</div>
                            )}
                        </div>
                        <div className="chat-message-content">
                            <div
                                className="chat-message-text"
                                dangerouslySetInnerHTML={{ __html: formatChat(msg.content) }}
                            />
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="chat-message assistant">
                        <div className="chat-message-avatar">
                            <MistralIcon model="large" size={20} className="animate-pulse" />
                        </div>
                        <div className="chat-message-content">
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="chat-input-container">
                <textarea
                    className="chat-input"
                    placeholder="Ask about the code changes..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    id="chat-input"
                />
                <button
                    className="btn btn-primary btn-sm chat-send-btn"
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    id="chat-send-btn"
                >
                    <Send size={14} />
                </button>
            </div>
        </div>
    )
}

function formatChat(text: string): string {
    let formatted = text
        .replace(/^### (.+)$/gm, '<h4 style="margin: 16px 0 8px; font-size: 0.8125rem; font-weight: 700; color: var(--text-primary)">$1</h4>')
        .replace(/^#### (.+)$/gm, '<h5 style="margin: 12px 0 6px; font-size: 0.75rem; font-weight: 700; color: var(--text-primary)">$1</h5>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background: var(--bg-tertiary); padding: 1px 4px; border-radius: 3px; font-size: 0.8125rem; font-family: var(--font-mono)">$1</code>')
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; overflow-x: auto; margin: 8px 0; font-size: 0.8125rem; font-family: var(--font-mono)"><code>$2</code></pre>')
        .replace(/^- (.+)$/gm, '<div style="padding: 1px 0 1px 12px">• $1</div>')
        .replace(/^\d+\. (.+)$/gm, '<div style="padding: 2px 0 2px 12px">$1</div>')

    formatted = formatted.replace(/\n{2,}/g, '<br /><br />')
    formatted = formatted.replace(/\n/g, '<br />')

    // Remove extra <br> tags immediately around block elements
    formatted = formatted.replace(/(?:<br \/>)+(\s*<h[2-5])/g, '$1')
    formatted = formatted.replace(/(<\/h[2-5]>)\s*(?:<br \/>)+/g, '$1')
    formatted = formatted.replace(/(?:<br \/>)+(\s*<pre)/g, '$1')
    formatted = formatted.replace(/(<\/pre>)\s*(?:<br \/>)+/g, '$1')

    return formatted
}
