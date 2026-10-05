---
'@scalar/themes': minor
'@scalar/components': minor
'@scalar/api-client': patch
'@scalar/api-reference': patch
'scalar-app': patch
'@scalar/hono-api-reference': patch
---

Floating surfaces now paint their own background, border, and shadow instead of using an absolutely positioned backdrop layer. The `#backdrop` slot on `ScalarDropdown`, `ScalarPopover`, `ScalarListbox`, and `ScalarCombobox` is removed; style the floating element with `class` instead. `ScalarFloatingBackdrop`, `--scalar-lifted-brightness`, and the `brightness-lifted` utility are deprecated in favor of `bg-b-1 dark:bg-b-1.5`. `ScalarFloatingBackdrop` itself now uses the same surface styles, so it no longer clips its slot or draws a real border. A new `inset-shadow-border` utility draws the hairline border so it can stack with `shadow-*` without taking up layout space; Tailwind's default `inset-shadow-*` sizes are reset, matching the other theme namespaces.
