/**
 * MistralIcon — renders a Mistral model icon as an inline <img>.
 *
 * Usage:
 *   <MistralIcon model="large" size={16} />
 *   <MistralIcon model="codestral" />
 */

const MISTRAL_ICON_URLS: Record<string, string> = {
    large: 'https://mistral.ai/static/branding/mistral-models/Large.png',
    medium: 'https://mistral.ai/static/branding/mistral-models/Medium.png',
    small: 'https://mistral.ai/static/branding/mistral-models/Small.png',
    codestral: 'https://mistral.ai/static/branding/mistral-models/Codestral.png',
    'codestral-embed': 'https://mistral.ai/static/branding/mistral-models/Codestral%20Embed.png',
    devstral: 'https://mistral.ai/static/branding/mistral-models/Devstral.png',
    magistral: 'https://mistral.ai/static/branding/mistral-models/Magistral.png',
    mathstral: 'https://mistral.ai/static/branding/mistral-models/Mathstral.png',
    ministral: 'https://mistral.ai/static/branding/mistral-models/Ministral.png',
    moderation: 'https://mistral.ai/static/branding/mistral-models/Mistral%20Moderation.png',
    nemo: 'https://mistral.ai/static/branding/mistral-models/Mistral%20Nemo.png',
    pixtral: 'https://mistral.ai/static/branding/mistral-models/Pixtral.png',
    saba: 'https://mistral.ai/static/branding/mistral-models/SABA.png',
    classifier: 'https://mistral.ai/static/branding/mistral-models/Classifier.png',
    'mistral-embed': 'https://mistral.ai/static/branding/mistral-models/Mistral%20Embed.png',
}

interface MistralIconProps {
    model: string
    size?: number
    className?: string
    style?: React.CSSProperties
}

export default function MistralIcon({ model, size = 16, className, style }: MistralIconProps) {
    const url = MISTRAL_ICON_URLS[model]
    if (!url) return null

    return (
        <img
            src={url}
            alt={model}
            className={className}
            style={{
                width: size,
                height: size,
                objectFit: 'contain',
                imageRendering: 'pixelated',
                flexShrink: 0,
                ...style,
            }}
        />
    )
}

/**
 * Maps a log entry type to its corresponding Mistral icon model key.
 * Used by ExecutionLog to render icons alongside log text.
 */
export function getLogIconModel(type: 'info' | 'success' | 'error' | 'active'): string {
    switch (type) {
        case 'active':
            return 'large'
        case 'success':
            return 'ministral'
        case 'error':
            return 'moderation'
        case 'info':
        default:
            return 'small'
    }
}
