import { useCallback, useEffect, useRef } from 'react'

interface ResizeHandleProps {
    side: 'left' | 'right'
    targetRef: React.RefObject<HTMLElement | null>
    minWidth?: number
    maxWidth?: number
}

export default function ResizeHandle({ side, targetRef, minWidth = 160, maxWidth = 600 }: ResizeHandleProps) {
    const isDragging = useRef(false)
    const startX = useRef(0)
    const startWidth = useRef(0)

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        isDragging.current = true
        startX.current = e.clientX
        startWidth.current = targetRef.current?.offsetWidth || 280
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
    }, [targetRef])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current || !targetRef.current) return

            let delta = e.clientX - startX.current
            if (side === 'right') delta = -delta // Right panel resizes in opposite direction

            const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta))
            targetRef.current.style.width = `${newWidth}px`
            targetRef.current.style.transition = 'none'
        }

        const handleMouseUp = () => {
            if (!isDragging.current) return
            isDragging.current = false
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
            if (targetRef.current) {
                targetRef.current.style.transition = ''
            }
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [targetRef, side, minWidth, maxWidth])

    return (
        <div
            className={`resize-handle resize-handle-${side}`}
            onMouseDown={handleMouseDown}
        >
            <div className="resize-handle-line" />
        </div>
    )
}
