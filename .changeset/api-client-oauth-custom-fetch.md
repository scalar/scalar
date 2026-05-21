---
'@scalar/api-client': patch
---

feat: route OAuth2 token exchange/refresh and OpenID Connect discovery through the configured `customFetch`

The auth selector now forwards the client's `customFetch` to the OAuth2 and OpenID Connect flows. This lets the Electron desktop app pipe these requests over IPC (like regular API requests) instead of the renderer's network stack, so the desktop Content Security Policy can lock down `connect-src`. When no `customFetch` is provided the flows fall back to the global `fetch`, so web behavior is unchanged.
