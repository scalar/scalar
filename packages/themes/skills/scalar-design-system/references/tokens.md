# Scalar tokens & theming — full reference

Source of truth — the **`@scalar/themes`** package. Read these from `node_modules/@scalar/themes/`:

- `@scalar/themes/style.css` — the compiled theme: reset, base tokens (radius, typography), and the default theme's light/dark variables.
- `@scalar/themes/tailwind.css` — the `--scalar-*` → Tailwind `@theme` mapping.
- `@scalar/themes` (package root) — JS API: `getThemeStyles`, `presets`, `themeIds`, `themeLabels`, `Theme`, `ThemeId`.

## How the system works

- **CSS variables.** Everything is a `--scalar-*` custom property. Components consume them through Tailwind classes (see the mapping below).
- **Scoping.** All styles (and the reset) apply only under the `.scalar-app` class. Put `class="scalar-app"` on the root.
- **Light / dark.** A `.light-mode` or `.dark-mode` class on a container selects the value set. Each preset defines both blocks.
- **Layers.** `@layer scalar-base` holds base variables + the default theme; `@layer scalar-theme` holds optional preset overrides (applied via `getThemeStyles(id, { layer: 'scalar-theme' })` or importing a preset). Unlayered CSS beats both.

## Base tokens

Mode-agnostic (`:root`):

| Variable | Value |
|---|---|
| `--scalar-border-width` | `0.5px` |
| `--scalar-radius` | `3px` (the knob every other radius derives from) |
| `--scalar-radius-md` | `3px` (the base, capped at `--scalar-radius-max`) |
| `--scalar-radius-lg` | `6px` (derived: `--scalar-radius` × 2, capped) |
| `--scalar-radius-xl` | `8px` (derived, capped) |
| `--scalar-radius-2xl` | `12px` (derived, capped) |
| `--scalar-radius-3xl` | `16px` (derived, capped) |
| `--scalar-radius-full` | pill (derived, uncapped) |
| `--scalar-radius-max` | `20px` — ceiling so a big radius cannot swallow a container's content |
| `--scalar-font` | Inter stack (`"Inter", -apple-system, …, sans-serif`) |
| `--scalar-font-code` | JetBrains Mono stack (`"JetBrains Mono", ui-monospace, …, monospace`) |
| `--scalar-heading-1…6` | `24, 20, 16, 16, 16, 16` px |
| `--scalar-page-description` | `16px` |
| `--scalar-paragraph` | `16px` |
| `--scalar-small` / `--scalar-mini` / `--scalar-micro` | `14 / 13 / 12` px |
| `--scalar-font-size-1…7` | `21, 16, 14, 13, 12, 12, 10` px (interactive UI text) |
| `--scalar-line-height-1…5` | `32, 24, 20, 18, 16` px |
| `--scalar-bold` / `--scalar-semibold` / `--scalar-regular` | `600 / 500 / 400` |
| `--scalar-font-normal` / `--scalar-font-medium` / `--scalar-font-bold` | `400 / 500 / 700` |
| `--scalar-text-decoration` / `-hover` | `none` / `underline` |
| `--scalar-sidebar-indent` / `--scalar-sidebar-padding` | `20px` / `12px` |

Mode-specific base values (defined on `.light-mode` / `.dark-mode`):

| Variable | Light | Dark |
|---|---|---|
| `--scalar-button-1` | `rgba(0,0,0,1)` | `rgba(255,255,255,1)` |
| `--scalar-button-1-hover` | `rgba(0,0,0,0.8)` | `rgba(255,255,255,0.9)` |
| `--scalar-button-1-color` | `#fff` | `black` |
| `--scalar-shadow-1` | `0 1px 3px 0 rgba(0,0,0,0.11)` | `0 1px 3px 0 rgba(0,0,0,0.1)` |
| `--scalar-shadow-2` | lifted multi-shadow | lifted multi-shadow |
| `--scalar-lifted-brightness` | `1` | `1.45` |
| `--scalar-backdrop-brightness` | `1` | `0.5` |
| `--scalar-scrollbar-color` / `-active` | `rgba(0,0,0,.18/.36)` | `rgba(255,255,255,.18/.36)` |

## Default theme — semantic tokens

| Variable | Light | Dark |
|---|---|---|
| `--scalar-background-1` | `#fff` | `#0f0f0f` |
| `--scalar-background-2` | `#f6f6f6` | `#1a1a1a` |
| `--scalar-background-3` | `#e7e7e7` | `#272727` |
| `--scalar-background-accent` | `#8ab4f81f` | `#3ea6ff1f` |
| `--scalar-color-1` | `#1b1b1b` | `#e7e7e7` |
| `--scalar-color-2` | `#757575` | `#a4a4a4` |
| `--scalar-color-3` | `#8e8e8e` | `#797979` |
| `--scalar-color-accent` | `#0099ff` | `#00aeff` |
| `--scalar-border-color` | `#dfdfdf` | `#2d2d2d` |

Advanced / semantic palette (light → dark):

| Variable | Light | Dark |
|---|---|---|
| `--scalar-color-green` | `#069061` | `#00b648` |
| `--scalar-color-red` | `#ef0006` | `#dc1b19` |
| `--scalar-color-yellow` | `#edbe20` | `#ffc90d` |
| `--scalar-color-blue` | `#0082d0` | `#4eb3ec` |
| `--scalar-color-orange` | `#ff5800` | `#ff8d4d` |
| `--scalar-color-purple` | `#5203d1` | `#b191f9` |

`--scalar-color-danger` / `--scalar-color-alert` and `--scalar-background-danger` / `--scalar-background-alert` are derived with `color-mix()` from red/orange. Themes that support wide gamut also define P3 variants under `@supports (color: color(display-p3 …))`.

**Sidebar group** (default theme maps these to the base palette, so they inherit unless a theme overrides them): `--scalar-sidebar-background-1`, `--scalar-sidebar-color-1/2`, `--scalar-sidebar-border-color`, `--scalar-sidebar-item-hover-background`, `--scalar-sidebar-item-active-background`, `--scalar-sidebar-color-active`, `--scalar-sidebar-search-background/color/border-color`.

## Tailwind mapping

In component code, prefer these classes over raw variables.

**Backgrounds:** `bg-b-1`, `bg-b-1.5` (mix of 1+2), `bg-b-2`, `bg-b-3`, `bg-b-accent`, `bg-b-btn`, `bg-b-tooltip`, `bg-b-danger`, `bg-b-alert`.
**Text colors:** `text-c-1`, `text-c-2`, `text-c-3`, `text-c-accent`, `text-c-ghost`, `text-c-disabled`, `text-c-btn`, `text-c-tooltip`, `text-c-danger`, `text-c-alert`.
**Hover:** `bg-h-btn`.
**Sidebar:** `bg-sidebar-b-1`, `text-sidebar-c-1/2`, `bg-sidebar-b-hover`, `bg-sidebar-b-active`, `border-sidebar-*` (each falls back to the matching base token).
**Themed colors:** `green`, `red`, `yellow`, `blue`, `orange`, `purple` (e.g. `text-red`, `bg-green`); plus `white`/`black`.
**Utility colors:** `border` (= `--scalar-border-color`), `backdrop`, `backdrop-dark`, `border-tooltip`, `brand`.
**Radius:** `rounded` & `rounded-md` = 3px, `rounded-lg` = 6px, `rounded-xl` = 8px, `rounded-2xl` = 12px, `rounded-3xl` = 16px, `rounded-px` = 1px, `rounded-full` (pill). Every step except `rounded-px` derives from `--scalar-radius`, so a theme that sets it to `0` squares off the whole interface. There is no `rounded-sm` or `rounded-4xl`; those emit no CSS.
**Shadows:** `shadow`/`shadow-md` (shadow-1), `shadow-lg` (shadow-2), `shadow-sm`, `shadow-border` (inset hairline).
**Fonts:** `font-sans` (Inter), `font-code` (JetBrains Mono).
**Text sizes:** `text-3xs` 10, `text-xxs` 12, `text-xs` 12, `text-sm` 13, `text-base` 14, `text-lg` 16, `text-xl` 21.
**Font weights:** `font-normal` 400, `font-medium` 500, `font-bold` 600 (plus `font-weight-sidebar` / `-active`).
**Brightness:** `brightness-lifted`, `brightness-backdrop`.
**Spacing:** base unit `--spacing` = `4px` → `p-1` 4px, `p-2` 8px, `gap-3` 12px, `p-4` 16px, etc. Custom: `h-header` (`spacing-header`) = 48px, `spacing-border` = 0.5px.
**Breakpoints:** `xs` 400, `sm` 600, `md` 800, `lg` 1000, `xl` 1200.
**Containers:** `container-xs…7xl` (320…1280), `container-content` 720, `container-full`, `container-fit`.
**Z-index:** `z-10/20/50`, `z-context` 1000, `z-overlay` 10000, `z-tooltip` 99999.

## Theme presets

13 presets ship with the package (plus a `custom-theme-starter`). They are exposed via `presets`, `themePresets`, `themeIds`, and `themeLabels` from `@scalar/themes`. `themeIds` also includes `'none'` (base variables only, no color overrides).

`--scalar-color-1` / `--scalar-background-1` / `--scalar-color-accent` per mode:

| Theme | `slug` | Light (text / bg / accent) | Dark (text / bg / accent) |
|---|---|---|---|
| Default | `default` | `#1b1b1b` / `#fff` / `#0099ff` | `#e7e7e7` / `#0f0f0f` / `#00aeff` |
| Alternate | `alternate` | `#1b1b1b` / `#f9f9f9` / mono | `rgba(255,255,255,.9)` / `#131313` / mono |
| Moon | `moon` | `#000000` / `#ccc9b3` / `#645b0f` | `#fffef3` / `#313332` / `#c3b531` |
| Purple | `purple` | `#1b1b1b` / `#fff` / `#5469d4` | `#fafafa` / `#15171c` / `#5469d4` |
| Solarized | `solarized` | `#584c27` / `#fdf6e3` / `#b58900` | `#fff` / `#00212b` / `#007acc` |
| Blue Planet | `blue-planet` | `rgb(9,9,11)` / `#f0f2f5` / mono | `#fafafa` / `#000e23` / mono |
| Deep Space | `deep-space` | `rgb(9,9,11)` / `#fff` / mono | `#fafafa` / `#09090b` / mono |
| Saturn | `saturn` | `#1b1b1b` / `#f3f3ee` / `#1763a6` | `#fafafa` / `#09090b` / `#4eb3ec` |
| Kepler-11e | `kepler-11e` | `#1b1b1b` / `#fff` / `#7070ff` | `#f7f8f8` / `#000212` / `#828fff` |
| Mars | `mars` | `#c75549` / `#f9f6f0` / `#c75549` | `rgba(255,255,255,.9)` / `#140507` / mono |
| Laserwave | `laserwave` | `#322b3b` / `#fff` / `#40b4c4` | `#fff` / `#27212e` / `#ed78c2` |
| Elysia.js | `elysiajs` | `#1b1b1b` / `#fff` / `#f06292` | `rgba(255,255,255,.9)` / `#111728` / `#f06292` |
| Fastify | `fastify` | `#1c1e21` / `#fff` / `#2f8555` | `rgba(255,255,255,.9)` / `#1b1b1d` / `#27c2a0` |

"mono" = the theme sets `--scalar-color-accent: var(--scalar-color-1)`, i.e. a monochrome accent equal to the text color.

## Applying a theme in code

```ts
import { getThemeStyles } from '@scalar/themes'

// CSS string for a theme (+ base variables + optional fonts + optional layer)
const css = getThemeStyles('alternate', { layer: 'scalar-theme', variables: true, fonts: true })
document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`)
```

Or import the stylesheets directly: `@scalar/themes/style.css` (reset + base + default), `@scalar/themes/tailwind.css` (Tailwind integration), `@scalar/themes/fonts.css` (fonts only). A `ThemeId` is the type-safe union of all slugs; `presets[id].theme` is the raw CSS for one theme.
