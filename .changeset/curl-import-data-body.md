---
'scalar-app': patch
---

Import cURL data flags as the request body and default the method to POST, as curl does. A command such as Chrome's copy as cURL for a POST, which has no `-X`, is no longer imported as a GET, a body placed before the URL is no longer turned into a query parameter, and a `-G` anywhere else in the command no longer counts as the flag. Data is added to the query string only with `-G` or `--get`, and repeated data flags are joined with an ampersand instead of keeping the last one.
