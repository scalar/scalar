---
'@scalar/api-client': minor
---

Treat an OAuth2 flow alongside a declared HTTP bearer scheme as a
token-acquisition source rather than a competing auth method.

- An oauth2 scheme that no operation declares is kept out of the auth
  dropdown (so it can't collide with bearer by multi-select). A new
  `getOauth2AcquisitionTarget` helper finds the first interactive
  (authorization-code / implicit) oauth2 flow for the bearer form to use.
- The bearer scheme's form gains an inline **Authorize via OAuth2**
  shortcut (and, for authorization-code, **Refresh**) that run the flow and
  write the resulting access token onto the bearer scheme — so the panel
  never switches to oauth2 and the request sends `Authorization: Bearer`.
  A gear opens the oauth2 configuration in a modal (`OAuth2.hideActions`).
- `runOAuth2Authorize` + `storeOAuth2Tokens` route the access token to the
  bearer scheme and the refresh token to the oauth2 scheme.
