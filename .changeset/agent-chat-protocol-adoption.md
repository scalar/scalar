---
'@scalar/agent-chat': patch
---

Adopt @scalar/chat-protocol for error parsing and the approval policy: the JSON-in-Error.message parsing and the inline GET heuristic are replaced by the shared parseChatError() and the declared policy registry, and a facade contract test locks the public Chat surface
