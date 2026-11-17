---
'scalar-app': patch
---

Import cURL data flags as the request body and default the method to POST, as curl does, so Chrome's copy as cURL for a POST is no longer a GET and a body before the URL is no longer a query parameter. Only `-G` or `--get`, also inside a bundle such as `-sG`, puts the data in the query string, repeated data flags are joined with an ampersand, `--data-urlencode` percent-encodes its content, `--json` sends JSON with its headers, attached flags such as `-XPOST` or `--request=PUT` are read, a Content-Type header of the command is kept in any case, `-d ''` no longer swallows the URL, commands copied from Chrome or Firefox for cmd.exe are read with their carets and quote escapes removed, and `-F`, `--form` and `--form-string` send a multipart form body with a POST method even with `-G`, unless the command sets a method or a Content-Type.
