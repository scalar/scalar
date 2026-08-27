---
'@scalar/mock-server': patch
---

Fix JSON responses for primitive string bodies. A response declaring `application/json` with a `type: string` schema (or a plain string example) was written to the wire verbatim, so clients received the bare characters `string` instead of `"string"` and could not parse the payload.

A string body is now JSON-encoded whenever the negotiated media type carries a single JSON document, which includes suffixed types such as `application/problem+json` and parameterized ones such as `application/json; charset=utf-8`. Two things keep their raw string: every other media type, where the characters are already the payload (`text/plain`, `text/event-stream`, XML, and the line-delimited JSON types), and a body that is already the value the schema describes — anything that parses when the schema declares a non-string type, or a JSON object or array when the schema says nothing, both of which are documents the author serialized by hand.

XML is now matched on the parsed media type subtype rather than by substring, so only a genuine XML type is serialized as an XML document. A media type that merely contains `xml` somewhere, such as one carrying it in a parameter, no longer is.
