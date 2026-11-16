---
'@scalar/blocks': patch
'@scalar/snippetz': patch
---

fix(snippetz): send text-only multipart forms as multipart

Code examples for a `multipart/form-data` body with only text fields kept a bare `Content-Type: multipart/form-data` header with no boundary, so clients sent either two Content-Type headers or a body the server cannot split. The header is now left to the HTTP client for every structured multipart body, as it already was for file uploads.

Python `requests` and `httpx` examples now pass text-only fields through `files=` as `(None, value)` tuples, and `aiohttp` uses `FormData(default_to_multipart=True)`, because all three send plain text fields urlencoded otherwise.
