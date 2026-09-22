---
'@scalar/api-client': patch
---

Render data table rows inside a `tbody` so server-rendered tables hydrate. The HTML parser inserts a `tbody` around rows that sit directly under a `table`, so markup rendered without one handed the client a `tbody` where the component tree held the row, and the table — an auth form, for example — was discarded and rebuilt after hydration.
