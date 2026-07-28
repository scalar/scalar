---
"@scalar/components": patch
"@scalar/themes": patch
---

Fix the tooltip rendering with a dark background in light mode. The light-mode tooltip tokens were hard-coded to a dark fill with light text, so the tooltip stayed black regardless of the active color mode. They now derive from `--scalar-background-1` and `--scalar-color-1`, so the tooltip follows the theme in both modes.

The tooltip surface is also polished to match the rest of the system: a standard hairline border and base shadow in both color modes (replacing the dark-mode-only inset border), a large radius, regular font weight, and tighter vertical padding. Horizontal and vertical padding are now separate variables so the placement offset applies to the correct axis.
