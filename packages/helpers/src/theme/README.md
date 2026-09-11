# Theme helpers (`@scalar/helpers/theme`)

Utilities for Scalar’s color modes, which every theme ships as a pair of **`.light-mode`** and **`.dark-mode`** class selectors rather than as a media query.

## `color-mode` (`./color-mode`)

### `applyColorMode(mode: DarkLightMode, target?: HTMLElement)`

Applies a color mode to an element by swapping the two mode classes. Both are toggled rather than only the one being added, so the element never ends up carrying `light-mode` and `dark-mode` at once. `target` defaults to `document.body`.

The caller is responsible for checking that a DOM exists. Reading the default argument touches `document`, so this throws under SSR rather than silently doing nothing.

### `getSystemColorMode()`

Reads the operating system preference via `prefers-color-scheme`, returning `'light' | 'dark'`.

Without a `window` it reports light, matching what the server renders. A `window` *without* `matchMedia` reports dark instead — inconsistent, but the behaviour predates this helper and is preserved so `useColorMode` keeps resolving the way it always has. Only a stubbed test environment reaches that branch.

### `DarkLightMode`

A **resolved** color mode, `'light' | 'dark'`. Deliberately narrower than the mode a user can pick, which also includes `'system'` — that one is a preference which has to be resolved against the operating system before anything can be rendered, so by the time a mode reaches the DOM it is always one of these two.

`@scalar/use-hooks/useColorMode` re-exports this type alongside its own `ColorMode`, and calls `applyColorMode` to do the class swap.

### Import

```ts
import { type DarkLightMode, applyColorMode, getSystemColorMode } from '@scalar/helpers/theme/color-mode'
```

## `load-css-variables` (`./load-css-variables`)

### `loadCssVariables(css: string)`

Parses a CSS string with the browser’s `CSSStyleSheet` API, walks `CSSStyleRule` rules whose selector is exactly `.light-mode` or `.dark-mode` (comma-separated lists are supported per selector), and returns:

```ts
{ light: Record<string, string>, dark: Record<string, string> }
```

Each map contains `--*` custom property names with **normalized** values where possible:

- `#RRGGBB`, `#RRGGBBAA`, and short `#RGB`
- `rgb()` / `rgba()` with comma-separated channels
- `var(--name)` / `var(--name, fallback)` kept as strings, then resolved in a second pass when the target name exists in the same mode map

Unsupported forms (for example space-separated `rgb()` or slash alpha syntax) are skipped.

### Other exports

- **`getColorModesFromSelectors`** — maps a selector list string to `'light' | 'dark'` for exact `.light-mode` / `.dark-mode` matches only (no compound selectors like `.light-mode .foo`).
- **`parseVariableValue`** — normalizes a single declaration value when it matches the supported patterns.
- **`resolveVariableValue`** / **`resolveVariables`** — resolve `var(--*)` chains against a flat variable map.

### Environment

`loadCssVariables` requires a **browser** (or **jsdom**) with `CSSStyleSheet`, `CSSStyleRule`, and related APIs. It is not suitable for plain Node without a DOM implementation.

### Import

```ts
import {
  loadCssVariables,
  parseVariableValue,
} from '@scalar/helpers/theme/load-css-variables'
```
