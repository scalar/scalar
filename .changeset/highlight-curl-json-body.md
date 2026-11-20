---
'@scalar/highlight': patch
---

Highlight a curl request body as JSON, keep curl values intact across `'\''`, and mark a line-ending backslash as punctuation in curl and Bash. Curl flags are now plain text with no class of their own, so `true`, `false` and `null` in a body keep their colour.
