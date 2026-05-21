---
'@scalar/pre-post-request-scripts': patch
'scalar-app': patch
---

chore: remove `'unsafe-eval'` from the desktop/web app CSP

Pre-request and post-response scripts run through `postman-sandbox`, which relies on `eval`. Instead of allowing `'unsafe-eval'` in the main application CSP, script execution now happens inside an isolated sandbox iframe (`sandbox.html`) that is loaded from a real same-origin URL and carries its own permissive CSP. The host talks to it over `postMessage`, so the main `script-src` no longer needs `'unsafe-eval'`.
