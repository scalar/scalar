---
'@scalar/api-reference': patch
---

Show a composed schema's own description when it has no properties of its own. A schema that only carries `allOf` plus a top-level `description` dropped that description and rendered the first `allOf` member's description instead, which was visible when browsing the schema standalone in the Models section.
