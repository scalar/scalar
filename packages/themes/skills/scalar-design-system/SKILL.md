---
name: scalar-design-system
description: Scalar's design system — design tokens, theming (@scalar/themes), CSS variables, and the @scalar/components library. Use when designing or implementing Scalar UI, especially with Paper (code-to-design / design-to-code), so output matches real Scalar tokens, colors, typography, spacing, and components instead of generic defaults.
---

# Scalar Design System

This skill is Scalar's design system, distilled for two jobs:

1. **Designing Scalar UI in Paper** (`code-to-design`) — so a design uses Scalar's real palette, type, spacing, and component shapes from the first stroke, with no invented "design brief."
2. **Turning a Paper design into code** (`design-to-code`) — so the output maps back to the correct `--scalar-*` variables, Tailwind classes, and `@scalar/components`.

It complements the `code-to-design` and `design-to-code` plugin skills; this one supplies the Scalar-specific knowledge they lack.

> **Prerequisite for Paper work:** Paper Desktop must be running with a file open. If the Paper MCP connection fails, ask the user to open Paper Desktop first.

The values below are a curated snapshot of the **default** theme — enough to design and implement directly. For the full variable catalog, all 13 theme presets, and the complete component list, read the reference files:

- [`references/tokens.md`](./references/tokens.md) — every `--scalar-*` variable, the Tailwind mapping, and all theme presets.
- [`references/components.md`](./references/components.md) — all 34 components, their variants/props, and the subpath import map.
- [`references/paper.md`](./references/paper.md) — bidirectional Paper ↔ Scalar mapping tables for round-tripping designs.

## Brand essentials

Scalar's look is a clean, modern developer-tool aesthetic: high-contrast typography, restrained color, hairline borders, and small radii. Treat it as a product/clarity system, not a marketing/expressive one.

- **Type:** `Inter` for UI and prose, `JetBrains Mono` for code.
- **Accent:** `#0099ff` (one deliberate accent; everything else is neutral).
- **Mode:** light mode by default (`#fff` ground, `#1b1b1b` text).
- **Borders:** hairline `0.5px`, color `#dfdfdf`.
- **Radii:** small — `3px` default, `6px` large, `8px` extra-large.
- **Shape:** information lives directly on surfaces; reserve cards/elevation for genuine grouping.

## Foundations

- **Scoping:** every Scalar style lives under the `.scalar-app` class. Any markup must be inside an element with `class="scalar-app"`.
- **Light / dark:** a `.light-mode` or `.dark-mode` class on a container selects the value set. Default to `.light-mode`.
- **Layers:** themes load in two CSS layers — `scalar-base` (base variables + default theme) and `scalar-theme` (preset overrides). Unlayered CSS overrides both.

## Design tokens (default theme)

Reference `--scalar-*` variables in CSS; in components, prefer the Tailwind classes (next section).

**Color — text** (`--scalar-color-*`)
| Variable | Light | Dark | Role |
|---|---|---|---|
| `--scalar-color-1` | `#1b1b1b` | `#e7e7e7` | Primary text |
| `--scalar-color-2` | `#757575` | `#a4a4a4` | Secondary text |
| `--scalar-color-3` | `#8e8e8e` | `#797979` | Muted text |
| `--scalar-color-accent` | `#0099ff` | `#00aeff` | Accent / interactive |

**Color — background** (`--scalar-background-*`)
| Variable | Light | Dark | Role |
|---|---|---|---|
| `--scalar-background-1` | `#fff` | `#0f0f0f` | Base surface |
| `--scalar-background-2` | `#f6f6f6` | `#1a1a1a` | Raised surface / hover |
| `--scalar-background-3` | `#e7e7e7` | `#272727` | Highest contrast surface |
| `--scalar-background-accent` | `#8ab4f81f` | `#3ea6ff1f` | Tinted accent fill |

**Borders & shadows**
- `--scalar-border-color` — `#dfdfdf` (light) / `#2d2d2d` (dark); `--scalar-border-width` — `0.5px`.
- `--scalar-shadow-1` (subtle), `--scalar-shadow-2` (lifted).

**Semantic colors** (`--scalar-color-{green,red,yellow,blue,orange,purple}`, plus `--scalar-color-danger` / `--scalar-color-alert` and matching `--scalar-background-*`). Light: green `#069061`, red `#ef0006`, yellow `#edbe20`, blue `#0082d0`, orange `#ff5800`, purple `#5203d1`.

**Radii:** `--scalar-radius` `3px`, `--scalar-radius-md` `3px`, `--scalar-radius-lg` `6px`, `--scalar-radius-xl` `8px`, `--scalar-radius-2xl` `12px`, `--scalar-radius-3xl` `16px`, `--scalar-radius-full` pill. All derive from `--scalar-radius`, so overriding it on `:root` rescales every corner, and `0` makes the interface square. Everything except `-full` clamps to `--scalar-radius-max` (`20px`) so a large radius cannot swallow a container's content. Reach for `--scalar-radius-md` rather than `--scalar-radius` on anything that holds content.

**Typography**
- Content sizes: heading-1 `24px`, heading-2 `20px`, heading-3–6 `16px`, paragraph `16px`, small `14px`, mini `13px`, micro `12px`.
- UI app sizes: `--scalar-font-size-1…7` = `21, 16, 14, 13, 12, 12, 10` px.
- Line heights: `--scalar-line-height-1…5` = `32, 24, 20, 18, 16` px.
- Weights: regular `400`, semibold `500`, bold `600`.

## Tailwind class mapping

Scalar maps `--scalar-*` variables onto a custom Tailwind theme. In components, **use these classes** rather than raw variables. Source of truth: `@scalar/themes/tailwind.css`.

- **Background:** `bg-b-1`, `bg-b-1.5`, `bg-b-2`, `bg-b-3`, `bg-b-accent`, `bg-b-btn`, `bg-b-tooltip`, `bg-b-danger`, `bg-b-alert`.
- **Text:** `text-c-1`, `text-c-2`, `text-c-3`, `text-c-accent`, `text-c-ghost`, `text-c-disabled`, `text-c-btn`, `text-c-tooltip`, `text-c-danger`, `text-c-alert`.
- **Themed:** `text-green` / `bg-green`, plus `red`, `yellow`, `blue`, `orange`, `purple`.
- **Border:** `border` (uses `--scalar-border-color`, default width `0.5px`); `shadow-border` for an inset hairline.
- **Shadow:** `shadow` / `shadow-md` (shadow-1), `shadow-lg` (shadow-2), `shadow-sm`.
- **Radius:** `rounded` & `rounded-md` (3px), `rounded-lg` (6px), `rounded-xl` (8px), `rounded-2xl` (12px), `rounded-3xl` (16px), `rounded-full` (pill). No `rounded-sm`.
- **Type:** `font-sans` (Inter), `font-code` (JetBrains Mono); sizes `text-3xs` 10, `text-xxs`/`text-xs` 12, `text-sm` 13, `text-base` 14, `text-lg` 16, `text-xl` 21; weights `font-normal` 400, `font-medium` 500, `font-bold` 600.
- **Spacing:** base unit is `4px`, so `p-1` = 4px, `p-2` = 8px, `gap-3` = 12px, etc. `h-header` = 48px.
- **Breakpoints:** `xs` 400, `sm` 600, `md` 800, `lg` 1000, `xl` 1200.

## Components — `@scalar/components`

A Vue 3 library (34 components) scoped to `.scalar-app`, styled with the Tailwind classes above via `cva` variants, and customizable through Tailwind class overrides (`useBindCx`). Import from the **subpath**, not the barrel:

```ts
import { ScalarButton } from '@scalar/components/button'
import { ScalarIconAcorn } from '@scalar/icons'
```

Headline components (full list in [`references/components.md`](./references/components.md)):

- **Buttons & inputs:** `ScalarButton` (variant `solid` | `outlined` | `ghost` | `gradient` | `danger`; size `xs` | `sm` | `md`), `ScalarIconButton`, `ScalarTextInput`, `ScalarTextArea`, `ScalarToggle`, `ScalarCheckbox`, `ScalarSearchInput`, `ScalarFileUpload`.
- **Selection / floating:** `ScalarCombobox`, `ScalarListbox`, `ScalarDropdown`, `ScalarPopover`, `ScalarTooltip` (all positioned with Floating UI).
- **Overlays:** `ScalarModal` (sizes `xxs`–`full`).
- **Layout / nav:** `ScalarHeader`, `ScalarSidebar`, `ScalarMenu`.
- **Content:** `ScalarCard`, `ScalarCodeBlock`, `ScalarMarkdown`, `ScalarForm`, `ScalarLoading`.

**Icons** come from `@scalar/icons` (1,500+ Phosphor icons as `ScalarIcon<Name>` components). Size with `size-*` (`size-4`, `size-5`) and color with `text-*`. `ScalarButton` takes an `:icon` prop.

## Working in Paper

### code-to-design — build Scalar UI in Paper

Paper writes literal HTML/CSS to the canvas with `px` sizes and hex colors, so translate Scalar tokens into concrete values:

- Ground `#fff`, text `#1b1b1b` (secondary `#757575`), accent `#0099ff`, borders `0.5px` `#dfdfdf`, radii 3–8px.
- `Inter` for everything except code (`JetBrains Mono`); body text 16px, small 14px.
- Spacing on a 4px grid (4, 8, 12, 16, 24…).
- Default to light mode. Mirror the real component shapes (buttons, cards, sidebar rows) using these values.
- Because the design system is specified here, **skip Paper's invented design brief** and design directly in Scalar's system.

### design-to-code — turn a Paper design into Scalar code

1. **Extract exact values from Paper** with `get_jsx` / `get_computed_styles` / `get_fill_image` — never read sizes or colors off a screenshot.
2. **Map values back to tokens / Tailwind:** e.g. `#0099ff` → `--scalar-color-accent` / `text-c-accent`; `#fff` → `bg-b-1`; `#1b1b1b` → `text-c-1`; `0.5px #dfdfdf` border → `border`; `3px` radius → `rounded`; 16px Inter → `text-lg font-sans`. See [`references/paper.md`](./references/paper.md) for the full table.
3. **Map elements to components:** button → `ScalarButton` (pick variant + size); card → `ScalarCard`; menu/select → `ScalarDropdown` / `ScalarListbox` / `ScalarCombobox`; dialog → `ScalarModal`; icon → an `@scalar/icons` `ScalarIcon*`. Import each from its subpath.
4. **Where the component docs are** (to confirm a component, its props, and variants):
   - `@scalar/components` `package.json` `exports` — the subpath → component map.
   - The bundled TypeScript declarations (`*.d.ts`) shipped with each component — props, variants, and JSDoc.
   - The `@scalar/components` Storybook — live variants and controls.
5. **Output conventions:** wrap rendered output in `.scalar-app`; override styles with Tailwind classes via `useBindCx` (do not hand-write CSS); follow the `vue-components` skill for component code style.

## Source of truth

When exact or current values matter, go to the package that owns them — read these from `node_modules/<package>/` (or the package on npm):

- **Tokens & theming — `@scalar/themes`:** the compiled variables and the Tailwind `@theme` mapping ship as `@scalar/themes/style.css` and `@scalar/themes/tailwind.css`; the JS API (`getThemeStyles`, `presets`, `themeIds`, `ThemeId`) is exported from the package root (`@scalar/themes`).
- **Components — `@scalar/components`:** the subpath import map is in the package's `package.json` `exports`; the full export list and per-component props/variants live in the bundled type declarations (`*.d.ts`).
- **Icons — `@scalar/icons`:** the `ScalarIcon*` set is exported from the package root (`@scalar/icons`).
