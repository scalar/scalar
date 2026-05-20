---
'@scalar/api-client': patch
---

fix(api-client): harden response body preview against XSS and referrer leakage

The response body preview now validates `src` against an allow-list of safe
protocols (`blob:`, `http:`, `https:`, and `data:` URIs limited to known media
types) before rendering, replaces the `<object>` fallback with a fully
sandboxed `<iframe>` (`sandbox=""`), and sets `referrerpolicy="no-referrer"`
on all media elements so untrusted response URLs cannot execute script in the
app origin or leak the user's location to third-party hosts.
