---
"@scalar/components": patch
"@scalar/themes": patch
---

fix(components): add `highlighted` Tailwind variant for Radix menu item highlight state

Adds a new `highlighted` custom Tailwind variant (matching `[data-highlighted]`) to `@scalar/themes` and uses it in `ScalarDropdownButton` to restore the hover and keyboard-navigation highlight in the workspace and team picker dropdowns.
