---
"@scalar/openapi-upgrader": patch
---

Convert Swagger 2.0 discriminator strings to Discriminator Objects so upgrades preserve the discriminating property name.

Preserve x-ms-discriminator-value and x-discriminator-value aliases from allOf subtypes in discriminator mappings, including inherited subtypes, without replacing authored mappings.
