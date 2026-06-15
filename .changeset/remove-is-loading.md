---
'@scalar/types': patch
'@scalar/schemas': patch
---

Remove the unused `isLoading` configuration option. It was never wired to a consumer, so it had no effect on the rendered references.
