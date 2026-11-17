---
'scalar-app': patch
---

Import cURL data flags as the request body and default the method to POST, as curl does, so Chrome's copy as cURL for a POST is no longer a GET and a body before the URL is no longer a query parameter. Only `-G` or `--get`, also inside a bundle such as `-sG`, puts the data in the query string, repeated data flags are joined with an ampersand, `--json` sends JSON with its headers, attached short flags such as `-XPOST` are read, and `-d ''` no longer swallows the URL.
