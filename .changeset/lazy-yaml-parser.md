---
'@scalar/json-magic': patch
'@scalar/api-reference': patch
---

Keep the YAML parser out of the API reference's initial load. The URL fetching plugins load it only when a response is YAML, the reference parses an inline document when it loads rather than when it reads the configuration, and a YAML download is converted on demand. JSON documents never load the parser. `normalizeConfigurations` still parses inline documents synchronously.
