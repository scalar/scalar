---
'@scalar/openapi-upgrader': patch
---

fix: keep schema members named "example" during the 3.0 to 3.1 upgrade

Members named `example` inside a map of named subschemas (`properties`, `patternProperties`, `$defs`, `definitions`, and `components/schemas`) are names, not the `example` keyword, so they are no longer rewritten into an `examples` array.
