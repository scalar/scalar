---
'@scalar/snippetz': patch
'@scalar/types': patch
'@scalar/code-highlight': patch
'@scalar/components': patch
'@scalar/workspace-store': patch
---

Add Julia (HTTP.jl) as a code example target. The new `julia/http` client generates HTTP.jl snippets, including headers, query parameters, cookies, basic auth, JSON bodies (as `Dict`s serialized with `JSON.json`), url-encoded bodies and `HTTP.Form` multipart uploads. Julia syntax highlighting and a Julia icon are included, so the client shows up in the code example picker like any other language.
