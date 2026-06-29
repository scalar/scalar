---
'@scalar/api-client': minor
---

feat(api-client): support an injectable OAuth2 redirect capture for interactive flows

Adds an optional `captureOAuth2Callback` option so environments that cannot use browser-popup polling (notably the Electron desktop app, where the renderer runs on `file://`) can run the authorization-code and implicit flows through the system browser and a host-owned redirect target. The desktop app uses this to capture the redirect on a `127.0.0.1` loopback server (RFC 8252).
