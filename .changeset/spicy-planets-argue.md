---
'scalar-app': patch
---

test(scalar-app): add snapshot tests for the sync conflict editor

Adds a test-only harness route that renders the sync conflict (three-way merge) editor with a deterministic fixture, plus a Playwright suite that snapshots the initial and resolved conflict states and asserts the applied merge payload.
