# Theme helpers (`@scalar/helpers/theme`)

Utilities for reading **CSS custom properties** from theme stylesheets that use Scalar’s **`.light-mode`** and **`.dark-mode`** class selectors.

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
