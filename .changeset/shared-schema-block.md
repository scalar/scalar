---
'@scalar/blocks': minor
'@scalar/api-reference': patch
'@scalar/helpers': patch
---

Extract the schema renderer into @scalar/blocks so other Scalar surfaces can reuse the schema tree while preserving API Reference behavior.

Keep the public API Reference Schema and SchemaProperty exports connected to extension plugins and deep-link navigation when mounted outside ApiReference.

Expose shared presentation components through @scalar/blocks/shared, group host integration APIs under schema/helpers and schema/expansion, and keep schema stories and visual regression coverage with Blocks.

Preserve literal toolbar icon types so Storybook previews can be type checked.
