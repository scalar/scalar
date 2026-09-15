---
'@scalar/snippetz': patch
---

Add `--globoff` to generated curl commands whose URL contains square brackets, or curly braces in the query string, so snippets for bracket-notation query parameters such as `filter[user_id]=me` and glob-set values such as `ids={1,2,3}` can be pasted into a shell and run as they are. Curly braces in the path, which are almost always placeholders like `/users/{id}`, are left untouched.
