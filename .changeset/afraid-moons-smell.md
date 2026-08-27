---
'@scalar/mock-server': patch
---

fix: route path keys that carry a query string

A path key such as `/v1/messages?beta=true` reached the router with the `?` intact, where it was read as a regular expression quantifier — the router then threw while building its matcher, and every request to the document failed with an empty `500`.

The query string is now split off the path key and matched against the request instead. Path keys stay registered in document order, and the key whose query parameters the request carries is the one that answers, the most specific match winning. Because such a query string tells two operations apart rather than describing something a client has to send, a route whose keys all carry one still answers a request without it.
