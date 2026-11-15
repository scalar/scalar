---
'@scalar/snippetz': patch
---

fix(snippetz): keep Ruby request bodies as written

The `ruby/native` JSON body now uses a quoted heredoc (`<<~'JSON'`), so Ruby no longer turns `\"` into `"`, `\\` into `\`, or runs `#{}` inside the payload. String bodies (the JSON fallback, `application/octet-stream` and other text types) also escape a `#` that would start `#{}`, `#$` or `#@` interpolation.
