"""WebSocket endpoint for real-time pipeline streaming."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import asyncio

router = APIRouter()

# Active WebSocket connections per session
_connections: Dict[str, Set[WebSocket]] = {}


async def broadcast(session_id: str, message_type: str, data: dict):
    """Broadcast a message to all WebSocket clients for a session."""
    if session_id not in _connections:
        return
    
    msg = json.dumps({"type": message_type, "data": data})
    dead = set()
    
    for ws in _connections[session_id]:
        try:
            await ws.send_text(msg)
        except Exception:
            dead.add(ws)
    
    _connections[session_id] -= dead


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for streaming pipeline updates."""
    await websocket.accept()
    
    if session_id not in _connections:
        _connections[session_id] = set()
    _connections[session_id].add(websocket)
    
    try:
        # Send initial connected message
        await websocket.send_json({
            "type": "connected",
            "data": {"session_id": session_id}
        })
        
        # Keep connection alive and listen for client messages
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                # Handle client messages (ping/pong keepalive)
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                # Send keepalive
                try:
                    await websocket.send_json({"type": "heartbeat", "data": {}})
                except Exception:
                    break
                    
    except WebSocketDisconnect:
        pass
    finally:
        if session_id in _connections:
            _connections[session_id].discard(websocket)
            if not _connections[session_id]:
                del _connections[session_id]
