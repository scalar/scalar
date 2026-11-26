---
'@scalar/snippetz': patch
---

Keep repeated query parameters and form fields in the axios, Guzzle and Laravel examples, so `ids=1&ids=2` is no longer sent as `ids[]=1&ids[]=2` or `ids[0]=1&ids[1]=2`.

Send Laravel multipart parts in request order, preserving repeated names and empty values and supporting bodies that contain only text fields.
