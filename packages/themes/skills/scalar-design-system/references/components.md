# Scalar components — full reference

Source of truth — the **`@scalar/components`** package (icons in **`@scalar/icons`**). Read these from `node_modules/`:

- `@scalar/components` `package.json` `exports` — the subpath → component map (below).
- `@scalar/components` (package root) — the full list of named exports.
- The bundled TypeScript declarations (`*.d.ts`) shipped with each component — props, variants, and JSDoc.
- The `@scalar/components` Storybook — live variants and controls.
- `@scalar/icons` (package root) — the `ScalarIcon*` set.

## Conventions

- **Vue 3** library, **scoped to `.scalar-app`**. Rendered markup must sit inside a `.scalar-app` root.
- **Import from the subpath**, never the barrel: `import { ScalarButton } from '@scalar/components/button'`.
- **Styling** uses the Tailwind classes from [`tokens.md`](./tokens.md) via `cva` variants. Each component allows Tailwind class overrides through `useBindCx` (pass `class="…"`), so prefer overriding classes over writing CSS.
- **Icons** come from `@scalar/icons` (1,500+ Phosphor icons), not the (deprecated) `ScalarIcon` component. Use `import { ScalarIconMagnifyingGlass } from '@scalar/icons'`, size with `size-*`, color with `text-*`.

## Subpath → component map (34 subpaths)

Several subpaths export sub-components alongside the headline component; confirm exact named exports from the package's bundled type declarations (`*.d.ts`).

| Subpath | Primary component(s) |
|---|---|
| `@scalar/components/button` | `ScalarButton` |
| `@scalar/components/icon-button` | `ScalarIconButton` |
| `@scalar/components/card` | `ScalarCard` (+ `ScalarCardHeader`, `ScalarCardSection`, `ScalarCardFooter`) |
| `@scalar/components/checkbox-input` | `ScalarCheckbox*` (checkbox, group, radio group) |
| `@scalar/components/code-block` | `ScalarCodeBlock` (+ copy) |
| `@scalar/components/color-mode-toggle` | `ScalarColorModeToggle` |
| `@scalar/components/combobox` | `ScalarCombobox`, `ScalarComboboxMultiselect` |
| `@scalar/components/copy` | `ScalarCopy` |
| `@scalar/components/dropdown` | `ScalarDropdown` (+ menu/item/divider parts) |
| `@scalar/components/error-boundary` | `ScalarErrorBoundary` |
| `@scalar/components/file-upload` | `ScalarFileUpload` |
| `@scalar/components/floating` | `ScalarFloating`, `ScalarFloatingBackdrop` |
| `@scalar/components/form` | `ScalarForm` (+ field/input/section/error parts) |
| `@scalar/components/header` | `ScalarHeader`, `ScalarHeaderButton` |
| `@scalar/components/hotkey` | `ScalarHotkey`, `ScalarHotkeyTooltip` |
| `@scalar/components/icon` | `ScalarIcon` (legacy — prefer `@scalar/icons`) |
| `@scalar/components/listbox` | `ScalarListbox` |
| `@scalar/components/loading` | `ScalarLoading` (+ `useLoadingState`) |
| `@scalar/components/markdown` | `ScalarMarkdown`, `ScalarMarkdownSummary` |
| `@scalar/components/menu` | `ScalarMenu` (+ workspace/team/product parts) |
| `@scalar/components/modal` | `ScalarModal` (+ `useModal`) |
| `@scalar/components/popover` | `ScalarPopover` |
| `@scalar/components/save-prompt` | `ScalarSavePrompt` |
| `@scalar/components/search-input` | `ScalarSearchInput` |
| `@scalar/components/search-results` | `ScalarSearchResults` (+ list/item) |
| `@scalar/components/sidebar` | `ScalarSidebar` (+ section/group/item/search parts) |
| `@scalar/components/teleport` | `ScalarTeleport` (+ `useTeleport`) |
| `@scalar/components/text-area` | `ScalarTextArea` |
| `@scalar/components/text-input` | `ScalarTextInput`, `ScalarTextInputCopy` |
| `@scalar/components/theme-swatches` | `ScalarThemeSwatches` |
| `@scalar/components/toggle` | `ScalarToggle`, `ScalarToggleGroup`, `ScalarToggleInput` |
| `@scalar/components/tooltip` | `ScalarTooltip` (+ `useTooltip`) |
| `@scalar/components/virtual-text` | `ScalarVirtualText` |
| `@scalar/components/wrapping-text` | `ScalarWrappingText` |

(Plus `@scalar/components/helpers` for utilities, and CSS exports `style.css`, `tailwind.config.css`, `vue-styles.css`.)

## Grouped overview

- **Buttons & selection:** `ScalarButton`, `ScalarIconButton`, `ScalarToggle` / `ScalarToggleGroup` / `ScalarToggleInput`.
- **Form inputs:** `ScalarTextInput` / `ScalarTextInputCopy`, `ScalarTextArea`, `ScalarCheckbox*`, `ScalarSearchInput`, `ScalarFileUpload`, `ScalarForm`.
- **Selection / floating:** `ScalarCombobox` / `ScalarComboboxMultiselect`, `ScalarListbox`, `ScalarDropdown`, `ScalarPopover`, `ScalarTooltip` (all built on `ScalarFloating` + Floating UI).
- **Overlays:** `ScalarModal`, `ScalarSavePrompt`, `ScalarFloatingBackdrop`.
- **Layout & navigation:** `ScalarHeader` / `ScalarHeaderButton`, `ScalarSidebar`, `ScalarMenu`.
- **Content:** `ScalarCard`, `ScalarCodeBlock`, `ScalarMarkdown`, `ScalarSearchResults`, `ScalarVirtualText`, `ScalarWrappingText`.
- **Utilities:** `ScalarLoading`, `ScalarHotkey`, `ScalarCopy`, `ScalarColorModeToggle`, `ScalarThemeSwatches`, `ScalarTeleport`, `ScalarErrorBoundary`.

## Headline components

### `ScalarButton` (`/button`)

Props:

- `variant`: `solid` (default) | `outlined` | `ghost` | `gradient` | `danger`
- `size`: `xs` | `sm` | `md` (default)
- `is`: render as another element/component (default `'button'`; e.g. `is="a"` for a link)
- `disabled`: visually disabled (does not block interaction; sets `aria-disabled`)
- `icon`: a `ScalarIconComponent` from `@scalar/icons`
- `loader`: a `LoadingState` from `useLoadingState()` — shows a spinner, hides text/icon

Variant → classes:

| Variant | Classes |
|---|---|
| `solid` | `bg-b-btn text-c-btn hover:bg-h-btn active:bg-b-btn` |
| `outlined` | `shadow-border bg-b-1 text-c-1 hover:bg-b-2` |
| `ghost` | `bg-transparent text-c-2 hover:text-c-1 active:text-c-1` |
| `gradient` | `shadow-border bg-b-1.5 bg-linear-to-b from-b-1 to-b-2` (reversed in dark) |
| `danger` | `bg-c-danger text-white hover:brightness-90` |

```vue
<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarIconAcorn } from '@scalar/icons'
</script>
<template>
  <ScalarButton variant="solid" size="md" :icon="ScalarIconAcorn">Save</ScalarButton>
</template>
```

### `ScalarModal` (`/modal`)

Dialog built on Headless UI. `size` ranges `xxs` → `full`; variants for `form` / `search` / `error` layouts. Open/close via the `useModal()` hook. Includes entrance/exit animations.

### `ScalarCard` (`/card`)

Surface with `ScalarCardHeader`, `ScalarCardSection`, and `ScalarCardFooter` slots/sub-components. Uses `bg-b-*`, `border`, `rounded-lg`, and `shadow`. Reserve for genuine grouping — prefer information directly on `bg-b-1`.

### Floating components (`/dropdown`, `/listbox`, `/combobox`, `/popover`, `/tooltip`)

All compose `ScalarFloating` (Floating UI) for positioning, support keyboard navigation and click-outside, and constrain width with `max-w-radix-popper`. Use `ScalarDropdown` for action menus, `ScalarListbox` for single-select, `ScalarCombobox` for searchable/multi-select.

### `ScalarSidebar` (`/sidebar`)

Nested navigation with section/group/item/indent/search/footer sub-components. Consumes the `--scalar-sidebar-*` tokens and `--scalar-sidebar-indent` (20px) / `--scalar-sidebar-padding` (12px).
