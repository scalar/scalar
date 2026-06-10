---
'@scalar/mock-server': patch
---

Fix security checking: evaluate `security` as OR-of-ANDs, inherit document-level security when an operation defines none, and validate credential shape (well-formed Basic and Bearer)
