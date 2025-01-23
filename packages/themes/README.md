# Scalar Themes

[![Version](https://img.shields.io/npm/v/%40scalar/themes)](https://www.npmjs.com/package/@scalar/themes)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/themes)](https://www.npmjs.com/package/@scalar/themes)
[![License](https://img.shields.io/npm/l/%40scalar%2Fthemes)](https://www.npmjs.com/package/@scalar/themes)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Scalar Themes provides a library of themes for all Scalar products and components. It also contains the base set of Scalar CSS variables and an associated [Tailwind](https://tailwindcss.com) preset which leverages those variables.

To see a list of available themes, see the [`presets`](./src/index.ts#L65) export.

## CSS Layers

The themes package uses two [CSS Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) to apply the theme styles

- `scalar-base`: A copy of the core Scalar CSS variables and default theme
- `scalar-theme`: Optionally overrides `scalar-base` with theme styles

Any styles added outside of these layers will override all the styles in the layers which allows you to extend or customize a theme.

## Scoping

Because many Scalar applications are embedded into other websites the reset is scoped to the `scalar-app` class. This means you need to add this class to the root element of your application where you want the theme to apply. If you are using the themes in a standalone application, you can just add this class to the `body` element.

```html
<body class="scalar-app">
  <!-- Your application content -->
</body>
```

## Installation

```bash
pnpm i @scalar/themes
```

### Usage via CSS Import (Basic)

To import the basic theme styles into your project, you can just import `style.css` which imports the reset, scrollbars, and a copy of the base [Scalar CSS variables](./src/variables.css) and [default theme](./src/presets/default.css).

```ts
import '@scalar/themes/styles.css'
```

To add a theme, you can import the theme from the presets directory.

```ts
import '@scalar/themes/presets/alternate.css'
```

### Usage via JavaScript

To use the themes package via JavaScript, you can use the [`getThemeStyles`](./src/index.ts#L123) function from the package. The function will generate CSS style string which you can then add to the head of your document.

```ts
import { getThemeStyles } from '@scalar/themes'

const styles = getThemeStyles('alternate', { layer: 'scalar-theme' })
document.head.insertAdjacentHTML('beforeend', `<style>${styles}</style>`)
```

The function allows you to pass in a theme ID and an optional options object to configure the layer (default: `scalar-theme`) and whether to include the default fonts (default: `true`).

### Usage via Tailwind

To use the themes package with Tailwind, you first need to inject the import the styles either via CSS or JavaScript (see above). You can also import them alongside your global Tailwind styles.

```css
@import '@scalar/themes/style.css';
@tailwind components;
@tailwind utilities;
@tailwind variants;
```

Then you can use the [tailwind preset](https://tailwindcss.com/docs/presets) in your `tailwind.config.js` to expose the [theme colors and variables](./src/tailwind.ts).

```ts
import scalarPreset from '@scalar/themes/tailwind'
import { type Config } from 'tailwindcss'

export default {
  presets: [scalarPreset],
  // Your tailwind config
  theme: {
    extend: {
      // Extend the preset
    },
    // Override the preset
  },
} satisfies Config
```
