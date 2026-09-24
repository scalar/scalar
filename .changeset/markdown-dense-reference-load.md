---
"@scalar/openapi-to-markdown": patch
---

Load densely cross-linked API descriptions with far less memory. References are now linked after coercion, so TypeBox no longer copies the reference graph each time it checks a union or array. Stripe's API description loads in about 2 seconds with a peak of about 190 MB, down from about 17 seconds and 1.4 GB, so it now loads and renders with a 768 MB heap limit.

Coercion now checks each reference target in its own position, not through every reference that points to it. Before, a target that failed a strict schema check (for example, a schema with `oneOf` references) could turn the reference into an empty schema and drop sibling `x-` extensions. Those references and extensions are now kept, so affected response schemas render in full.
