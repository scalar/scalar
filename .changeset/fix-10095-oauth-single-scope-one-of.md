---
'@scalar/api-reference': patch
---

Only show the "one of" hint above required OAuth scopes when there is more than one alternative scope group to choose between. A single group of required scopes is now listed plainly, even when a scope-free alternative (like an API key) also satisfies auth, since those scopes are required together rather than being a choice.
