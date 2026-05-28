---
'@scalar/api-client': minor
'@scalar/oas-utils': minor
---

feat: add WebSocket session transport and plugin hooks for AsyncAPI

Add WebSocketSession with connect, send, and close helpers, plus connectWebSocket orchestration using Result-based errors. Extend ClientPlugin with optional webSocketHooks (beforeConnect, onWebSocketMessage, onWebSocketClose).
