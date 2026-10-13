---
'@scalar/mock-server': patch
'@scalar/galaxy': patch
---

Register OAuth authorization, token, and refresh endpoints for AsyncAPI mock servers and point the Galaxy AsyncAPI example at its existing token endpoint for refresh requests.

Support OpenID Connect discovery and token routes in AsyncAPI mocks, return discovery endpoints on the mock origin, and accept form-encoded token exchanges and refresh requests.
