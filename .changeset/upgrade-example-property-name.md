---
'@scalar/openapi-upgrader': patch
---

fix: stop the 3.0 to 3.1 upgrade from mangling non-schema nodes

The upgrade applied its schema transforms to every object node, regardless of where it sat in the document. Three cases are now handled correctly:

- Members named `example` inside a map of named subschemas (`properties`, `patternProperties`, `$defs`, `definitions`, and `components/schemas`) are names, not the `example` keyword, so they are no longer rewritten into an `examples` array.
- Data held by the `example`, `default`, `const`, and `enum` keywords, and by an Example Object's `value`, is left untouched instead of being walked as if it were a schema (which turned `nullable: true` into a type array, collapsed `exclusiveMinimum`, renamed a nested `x-webhooks`, and so on).
- `x-webhooks` is only renamed to `webhooks` at the document root, not wherever a key happens to share that name.
