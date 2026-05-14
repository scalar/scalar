---
'scalar-app': patch
---

feat: handle workspace uid and slug reconciliation

App is updated to treat workspaceUid / teamUid as canonical, to reconcile server-driven team slug changes against persisted records (and clear stale tab metadata where needed), and to route workspace resume flows through a clearer resumeOrGetStarted API. migrate-to-indexdb (localStorage → IndexedDB) writes new records using the same UID + local team model.

