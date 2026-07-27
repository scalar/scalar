---
'@scalar/api-client': minor
---

Add an OAuth2 token-acquisition shortcut to HTTP bearer schemes, so a bearer
token can be obtained through an OAuth2 flow without switching auth methods.

- The bearer scheme's form gains an inline **Authorize via OAuth2** shortcut
  (and, for authorization-code, **Refresh**) that runs the flow and writes the
  resulting access token onto the bearer scheme — so the panel never switches
  to oauth2 and the request sends `Authorization: Bearer`. A gear opens the
  oauth2 configuration in a modal (`OAuth2.hideActions`).
- A new `getOauth2AcquisitionTarget` helper finds the oauth2 flow the shortcut
  uses, preferring the authorization-code grant (which can refresh) over
  implicit. Every defined security scheme, oauth2 included, stays selectable in
  the auth dropdown — the shortcut is purely additive.
- `runOAuth2Authorize` + `storeOAuth2Tokens` route the access token to the
  bearer scheme and the refresh token to the oauth2 scheme.
