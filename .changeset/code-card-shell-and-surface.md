---
'@scalar/components': minor
'@scalar/blocks': patch
'@scalar/api-reference': minor
---

feat: redesign code cards as a padded shell with the code on a lifted surface

`ScalarCard` drops its border and dividers for a 12px shell with 4px of padding, and each plain `ScalarCardSection` becomes an 8px surface lifted off it. The request example, example responses, operations list and AsyncAPI cards all pick this up. The surface color is derived from `--scalar-background-2` and can be set with `--scalar-card-surface`. Every class name is unchanged, and the new rules are single-class selectors, so existing theme and `customCss` rules keep winning.
