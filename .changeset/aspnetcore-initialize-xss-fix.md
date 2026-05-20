---
'@scalar/aspnetcore': patch
---

fix(aspnetcore): JSON-encode the request path and `JavaScriptConfiguration` option before interpolating them into the inline `initialize(...)` script, so a crafted request path cannot break out of the JS string literal
