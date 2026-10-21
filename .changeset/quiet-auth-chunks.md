---
"@scalar/workspace-store": patch
---

Preserve security schemes when expanding a compact chunk index, allowing authentication definitions to load with the initial document. Existing security schemes take precedence over chunk references with the same name.
