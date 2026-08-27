---
'@scalar/mock-server': patch
---

fix: escape spec-derived path keys and route path keys that carry a query string

Path keys such as `/v1/messages?beta=true` used to be registered verbatim as routes, where the query string was read as routing syntax. On a parameterized path that made the router compile an invalid regular expression and every single request failed with an empty `500`. The query is now peeled off and matched against the incoming request, so `/v1/messages?beta=true` answers only requests that send `beta=true` and `/v1/messages` keeps answering the rest.

Characters that would otherwise be read as routing syntax (`:`, `*`, `|`, and braces outside a path parameter) are escaped, so a path key can no longer act as a pattern. Note that this also applies to `*`: a path key ending in `*` is now served as a literal path instead of matching everything below it.

One limitation is worth knowing: Hono allows a single parameter per path segment, so a segment that mixes a path parameter with escaped literal text (`/v1/jobs/{jobId}:cancel`) routes to the right operation but does not bind `jobId` by name. Request validation reads it as missing, so a document describing such a path needs the server-wide `validateRequest: false` for now.
