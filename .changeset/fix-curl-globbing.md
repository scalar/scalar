---
'@scalar/snippetz': patch
---

Add `--globoff` to generated curl commands whose URL contains square brackets, so snippets for bracket-notation query parameters such as `filter[user_id]=me` can be pasted into a shell and run as they are
