---
'@scalar/api-client': patch
---

feat: add Preview/Raw tabs for JSON responses with true raw body view

JSON bodies now open on a formatted Preview tab (JSONC pretty-print without JSON.parse round-trip). The Raw tab shows the exact decoded response text. Other media types are unchanged; HTML, images, and other previews already used the same toggle pattern.
