---
'@scalar/snippetz': patch
---

fix(snippetz): stop F# examples from adding Content-Type to request headers

The `fsharp/httpclient` example no longer calls `httpRequestMessage.Headers.Add("Content-Type", ...)` when the request has a body. .NET throws `Misused header name 'Content-Type'` for that call, and the generated `StringContent` or form content already sets the content type.
