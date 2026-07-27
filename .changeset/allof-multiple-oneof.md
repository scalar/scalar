---
"@scalar/api-reference": patch
"@scalar/workspace-store": patch
---

Render every `oneOf`/`anyOf` group of an `allOf` in place. Previously, when one object composed several mutually-exclusive choices as sibling `oneOf`/`anyOf` under `allOf`, only the first group was shown and the rest were silently dropped. Each choice group now renders its own selector in the position it was declared, and the generated request example stays in sync per group.
