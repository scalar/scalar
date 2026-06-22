---
'@scalar/mock-server': minor
---

Add `createAsyncApiMockServer` to mock event-driven APIs from an AsyncAPI 3.1 document. Channels are served over WebSocket and SSE, with messages generated from each message's payload schema (the same generator the REST mocker uses). Additional protocols (e.g. SignalR) can be added through the `transports` extension point. The Docker mock server now auto-detects AsyncAPI documents.
