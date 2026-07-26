---
'@scalar/schemas': patch
'@scalar/types': patch
---

feat: add Arazzo 1.1 schema

Hand-written `@scalar/validation` schema for the Arazzo Specification 1.1.0 (workflow, step, criterion, success/failure action, source description, and related objects), generating `ArazzoDocument` and friends in `@scalar/types/arazzo/1.1`. Schema only — nothing in the workspace store or reference renderer consumes it yet.
