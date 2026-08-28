---
'@scalar/server-side-rendering': patch
'@scalar/use-hooks': patch
'@scalar/themes': patch
---

Resolve the color mode from CSS at first paint, so a server-rendered page no longer flashes white before hydration.

Theme tokens are scoped to the `dark-mode` / `light-mode` class on `<body>`, so until JavaScript added that class there was nothing to resolve and the page painted white. `@scalar/themes` now declares `color-scheme: light dark` on `:root` with `light-dark()` values for the tokens that paint large areas, which the browser resolves against the operating system before any script runs. An explicit choice still wins: `useColorMode` pins `color-scheme` on `<html>` for a chosen mode and clears it for `system`, and `renderApiReference` writes it into the markup when `darkMode` or `forceDarkModeState` is set — so a configured reference paints correctly even when the inline script never runs.

The class layer is unchanged and still wins inside `<body>`, so rendering after hydration is identical and customer themes selecting against `.dark-mode` keep working. Browsers without `light-dark()` fall back to the previous behavior.
