---
'@scalar/api-reference': minor
'@scalar/schemas': minor
'@scalar/themes': patch
'@scalar/types': minor
---

feat(api-reference): add the tree schema layout behind `schemaLayout`

A new `schemaLayout: 'legacy' | 'tree'` configuration option, defaulting to `legacy` so nothing changes for existing documents.

The tree layout replaces the bordered card per nesting level and the "Show Child Attributes" pill with the visual grammar of a tree: a continuous rail per depth that hangs from the parent property's text column, and a discrete disclosure control in each expandable property's own gutter. The control is a real button whose accessible name is the property name alone and whose child count rides `aria-describedby`; property descriptions stay visible instead of being swallowed into a button label. Types render as token runs — `array of Planet` instead of `array Planet[]`, with a `$ref` link as the type itself — collapsed objects show a preview of what they hold, short enums render inline in the type position or wrap as chips instead of a row per value, and a `$ref` cycle renders as a recursive chip instead of a toggle that descends forever. Rails fade with depth and the glyph knockout degrades to a plain ladder past depth four; below 480px of container width the tree reflows to a flat 8px indent and wraps rather than truncating. Collapsed subtrees that were opened once stay reachable with find-in-page via `hidden="until-found"` where the engine supports it, capped tree-wide, with Safari falling back to unmounting exactly as before.

Printing temporarily expands the whole tree and restores the reader's expansion state afterwards.

The option must reach the configuration through `@scalar/schemas`, which both the Zod duplicate in `@scalar/types` and the hand-written type now mirror.
