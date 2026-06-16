---
'@scalar/api-reference': patch
---

Fix an SSR hydration mismatch on the root element: the obtrusive-scrollbar class is now resolved after mount so the first client render matches the server.
