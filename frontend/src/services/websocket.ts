/** WebSocket service for real-time pipeline updates. */

type MessageHandler = (type: string, data: Record<string, unknown>) => void;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let handlers: MessageHandler[] = [];

export function connectWebSocket(sessionId: string) {
    // Close existing connection
    disconnectWebSocket();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws/${sessionId}`;

    ws = new WebSocket(url);

    ws.onopen = () => {
        console.log('[WS] Connected to session:', sessionId);
    };

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'heartbeat') return; // ignore keepalive

            handlers.forEach((handler) => handler(msg.type, msg.data));
        } catch {
            // ignore malformed messages
        }
    };

    ws.onclose = () => {
        console.log('[WS] Disconnected');
        // Auto-reconnect after 3s if not manually disconnected
        if (ws) {
            reconnectTimer = setTimeout(() => {
                connectWebSocket(sessionId);
            }, 3000);
        }
    };

    ws.onerror = () => {
        // Will trigger onclose
    };

    // Keep-alive ping every 20s
    const pingInterval = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send('ping');
        } else {
            clearInterval(pingInterval);
        }
    }, 20000);
}

export function disconnectWebSocket() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    if (ws) {
        const old = ws;
        ws = null; // prevent reconnect
        old.close();
    }
}

export function onMessage(handler: MessageHandler) {
    handlers.push(handler);
    // Return unsubscribe function
    return () => {
        handlers = handlers.filter((h) => h !== handler);
    };
}

export function isConnected() {
    return ws?.readyState === WebSocket.OPEN;
}
