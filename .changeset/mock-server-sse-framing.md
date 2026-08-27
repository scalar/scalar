---
'@scalar/mock-server': minor
---

Frame `text/event-stream` responses as Server-Sent Events instead of returning a single JSON body with an SSE content type. Each event is written as a `data:` line terminated by a blank line, then the stream closes.

- Named `examples` are read as the sequence of events the endpoint emits, in declaration order (`Prefer: example=<name>` still pins the stream to one event).
- An array example or array schema is read as the event sequence too.
- An example that already spells out SSE framing (`data: {"type":"edit"}`) is written verbatim instead of being wrapped in a second `data:` line.
- With no example, the schema-generated payload is emitted three times so the stream has more than one event to iterate.
