---
'@scalar/components': minor
'@scalar/blocks': patch
'@scalar/api-reference': minor
---

feat: redesign code cards as a padded shell with the code on a lifted surface

This changes the default look of every `ScalarCard`, not only the cards in the API reference. `ScalarCard` drops its border and dividers for a 12px shell with 4px of padding, and each plain `ScalarCardSection` becomes an 8px surface lifted off it. If you use these components in your own app, check your cards after this bump:

- A card recolored to match its page (for example `bg-b-1` on a `bg-b-1` page) no longer has an edge. Pass `border` to bring it back, or give the card a fill that differs from the page.
- Two plain sections in a row are two surfaces with a 4px gap, where they were one box with a divider.
- Content placed straight in `ScalarCard` without a section sits inside the 4px padding. Pass `p-0` to remove it.

In the API reference, the request example, example responses, operations list and AsyncAPI cards all pick this up. The surface color is derived from `--scalar-background-2` and its shadow from `--scalar-shadow-1`; set `--scalar-card-surface` or `--scalar-card-surface-shadow` on `.scalar-card` to change them. Every class name is unchanged, and the new rules are single-class selectors, so existing theme and `customCss` rules keep winning.
