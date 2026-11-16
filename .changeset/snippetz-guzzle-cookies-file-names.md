---
'@scalar/snippetz': patch
---

fix(snippetz): make Guzzle cookie and file upload examples run

The `php/guzzle` example now passes cookies as a `\GuzzleHttp\Cookie\CookieJar` scoped to the request host, because Guzzle throws when the `cookies` option is a plain array. Multipart file names are now escaped inside `fopen(...)`, so a name containing `'` or `\` no longer produces invalid PHP.
