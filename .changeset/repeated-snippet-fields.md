---
'@scalar/snippetz': patch
---

Keep repeated query parameters and form fields in the axios, Guzzle and Laravel examples, so `ids=1&ids=2` is no longer sent as `ids[]=1&ids[]=2` or `ids[0]=1&ids[1]=2`.

Attach every multipart part in request order in Laravel examples, so a multipart body without a file is no longer sent as JSON.
