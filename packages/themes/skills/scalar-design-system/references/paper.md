# Paper ↔ Scalar mapping

Tables for round-tripping designs between Paper and the Scalar codebase. Use alongside [`tokens.md`](./tokens.md) and [`components.md`](./components.md).

> Paper Desktop must be running with a file open for any Paper MCP call.

## Reading a design out of Paper

Get **exact** values from Paper — never read sizes or colors off a screenshot (use screenshots only to verify the final result).

| Need | Paper MCP tool |
|---|---|
| Element structure + CSS as JSX | `get_jsx` |
| Precise computed CSS (batchable by node) | `get_computed_styles` |
| Image fills / exported assets | `get_fill_image` |
| Font availability / weights | `get_font_family_info` |
| Artboard + font context | `get_basic_info` |

## Value → token / Tailwind (design-to-code)

Default theme, light mode. Map the nearest Scalar token; if a Paper value has no close match, keep the literal value and flag it.

**Colors**

| Paper value | `--scalar-*` | Tailwind |
|---|---|---|
| `#fff` background | `--scalar-background-1` | `bg-b-1` |
| `#f6f6f6` background | `--scalar-background-2` | `bg-b-2` |
| `#e7e7e7` background | `--scalar-background-3` | `bg-b-3` |
| `#1b1b1b` text | `--scalar-color-1` | `text-c-1` |
| `#757575` text | `--scalar-color-2` | `text-c-2` |
| `#8e8e8e` text | `--scalar-color-3` | `text-c-3` |
| `#0099ff` (accent) | `--scalar-color-accent` | `text-c-accent` / `bg-b-accent` |
| `#dfdfdf` border | `--scalar-border-color` | `border` |
| black button fill | `--scalar-button-1` | `bg-b-btn` + `text-c-btn` |

**Radius / border / shadow**

| Paper value | Tailwind |
|---|---|
| radius `3px` | `rounded` |
| radius `6px` | `rounded-lg` |
| radius `8px` | `rounded-xl` |
| radius `12px` | `rounded-2xl` |
| radius `16px` | `rounded-3xl` |
| fully rounded | `rounded-full` |
| `0.5px` solid `#dfdfdf` border | `border` |
| subtle drop shadow | `shadow` |
| lifted drop shadow | `shadow-lg` |

**Typography** (`Inter`, px)

| Paper size | Tailwind | Token |
|---|---|---|
| 10px | `text-3xs` | `--scalar-font-size-7` |
| 12px | `text-xs` / `text-xxs` | `--scalar-font-size-5/6` |
| 13px | `text-sm` | `--scalar-font-size-4` / `--scalar-mini` |
| 14px | `text-base` | `--scalar-font-size-3` / `--scalar-small` |
| 16px | `text-lg` | `--scalar-font-size-2` / `--scalar-paragraph` |
| 21px | `text-xl` | `--scalar-font-size-1` |
| 24px heading | — | `--scalar-heading-1` |
| weight 400 / 500 / 600 | `font-normal` / `font-medium` / `font-bold` | `--scalar-regular/semibold/bold` |
| `Inter` | `font-sans` | `--scalar-font` |
| `JetBrains Mono` | `font-code` | `--scalar-font-code` |

**Spacing** — Scalar is on a 4px grid. Round Paper gaps/padding to the nearest multiple and use the Tailwind step (`4→p-1`, `8→p-2`, `12→p-3`, `16→p-4`, `24→p-6`).

## Element → component (design-to-code)

| Paper element | Scalar component (subpath) |
|---|---|
| Button | `ScalarButton` (`/button`) — pick `variant` + `size` |
| Icon-only button | `ScalarIconButton` (`/icon-button`) |
| Text field | `ScalarTextInput` (`/text-input`) / `ScalarTextArea` (`/text-area`) |
| Checkbox / toggle | `ScalarCheckbox*` (`/checkbox-input`) / `ScalarToggle` (`/toggle`) |
| Search field | `ScalarSearchInput` (`/search-input`) |
| Select / single-choice menu | `ScalarListbox` (`/listbox`) |
| Searchable / multi-select | `ScalarCombobox` (`/combobox`) |
| Action / context menu | `ScalarDropdown` (`/dropdown`) |
| Popover | `ScalarPopover` (`/popover`) |
| Tooltip | `ScalarTooltip` (`/tooltip`) |
| Dialog / sheet | `ScalarModal` (`/modal`) |
| Card / panel | `ScalarCard` (`/card`) |
| Code block | `ScalarCodeBlock` (`/code-block`) |
| App header | `ScalarHeader` (`/header`) |
| Side navigation | `ScalarSidebar` (`/sidebar`) |
| Workspace / team picker | `ScalarMenu` (`/menu`) |
| Icon | `@scalar/icons` `ScalarIcon<Name>` (`size-*`, `text-*`) |

Pick a `ScalarButton` variant by how it reads in the design: solid dark fill → `solid`; bordered on light → `outlined`; text-only → `ghost`; subtle gradient → `gradient`; red/destructive → `danger`.

To confirm a component's exact props and variants, read the bundled type declarations (`*.d.ts`) shipped with `@scalar/components`.

## Token → Paper value (code-to-design)

When building a Scalar design in Paper, use these concrete defaults (light mode):

- Ground `#fff`; text `#1b1b1b` (secondary `#757575`, muted `#8e8e8e`); accent `#0099ff`.
- Hairline borders `0.5px` `#dfdfdf`; radii 3 / 6 / 8 px; subtle shadows only.
- `Inter` 16px body / 14px small / 13px labels; headings 20–24px; `JetBrains Mono` for code.
- 4px spacing grid; surfaces over boxes; one accent moment, lots of neutral.
- Wrap the design's conceptual root as `.scalar-app` (light mode) when it matters for export.

Because this is a fully specified system, skip Paper's invented design brief and design directly in Scalar's tokens.
