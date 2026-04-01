# Themes

You don't like the color scheme? We've prepared some themes for you:

* `alternate`
* `default`
* `moon`
* `purple`
* `solarized`
* `bluePlanet`
* `saturn`
* `kepler`
* `mars`
* `deepSpace`
* `laserwave`

Just pass the theme name to your [API Reference configuration](configuration.md):

```javascript
{
  theme: 'moon'
}
```

> [!NOTE]
> The `default` theme is … the default theme.
> If you want to make sure **no** theme is applied, pass `none`.

Wow, still nothing that fits your brand? Reach out to <support@scalar.com> and we'll make you a custom theme, just for you.

## Layouts

We support two layouts at the moment, a `modern` layout (the default) and a Swagger UI inspired
`classic` layout (we jazzed it up a bit though).

![layouts](https://github.com/scalar/scalar/assets/6374090/a28b89e0-8d3b-477f-a02f-bcf39f7830f0)

## Custom Styling

You can pretty much style everything you see.
[Here's an extreme example of what's possible.](https://windows98.apidocumentation.com/)

To get started, overwrite our CSS variables. We won't judge.

```html
<style>
  :root {
    --scalar-font: 'Comic Sans MS', 'Comic Sans', cursive;
    --scalar-font-code: 'Comic Sans MS', 'Comic Sans', cursive;
  }
</style>
```

> [!NOTE]
> By default, we're using Inter and JetBrains Mono, served by our in-house CDN.

If you want use a different font or want to use Google Fonts, pass `withDefaultFonts: false` to the configuration and overwrite the `--scalar-font` and `--scalar-font-code` CSS variables. You will also need to provide the source of your new font which can be local or served over the network.

Here is an example of how to use the `Roboto` font from Google Fonts with the CDN API reference.

```html
<!doctype html>
<html>
  <head>
    <!-- Link to the font on Google -->
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto"
      rel="stylesheet" />
    <!-- Overwrite the scalar font variable -->
    <style>
      :root {
        --scalar-font: 'Roboto', sans-serif;
        --scalar-font-code: 'Roboto', sans-serif;
      }
    </style>
  </head>
  <body>
    <!-- Pass the custom configuration object -->
    <script>
      var configuration = {
        theme: 'kepler',
        // Do not use the default fonts from the Scalar CDN
        withDefaultFonts: 'false',
      }
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
```

You can [use all variables](https://github.com/scalar/scalar/blob/main/packages/themes/src/base/variables.css) as well as overwrite the color theme.

To build your own color themes, overwrite the night mode and day mode variables.
Here are some basic variables to get you started:

![basic-scalar-variables](https://github.com/scalar/scalar/assets/6374090/f49256c4-4623-4797-87a1-24bdbc9b17fd)

```html
<style>
  .light-mode {
    --scalar-color-1: #121212;
    --scalar-color-2: rgba(0, 0, 0, 0.6);
    --scalar-color-3: rgba(0, 0, 0, 0.4);
    --scalar-color-accent: #0a85d1;
    --scalar-background-1: #fff;
    --scalar-background-2: #f6f5f4;
    --scalar-background-3: #f1ede9;
    --scalar-background-accent: #5369d20f;
    --scalar-border-color: rgba(0, 0, 0, 0.08);
  }
  .dark-mode {
    --scalar-color-1: rgba(255, 255, 255, 0.81);
    --scalar-color-2: rgba(255, 255, 255, 0.443);
    --scalar-color-3: rgba(255, 255, 255, 0.282);
    --scalar-color-accent: #8ab4f8;
    --scalar-background-1: #202020;
    --scalar-background-2: #272727;
    --scalar-background-3: #333333;
    --scalar-background-accent: #8ab4f81f;
  }
</style>
```

Or get more advanced by styling our sidebar!

![scalar-sidebar-variables](https://github.com/scalar/scalar/assets/6374090/5b1f0211-5c09-4092-a882-03d8241ad428)

```html
<style>
  .light-mode .sidebar {
    --scalar-sidebar-background-1: var(--scalar-background-1);
    --scalar-sidebar-item-hover-color: currentColor;
    --scalar-sidebar-item-hover-background: var(--scalar-background-2);
    --scalar-sidebar-item-active-background: var(--scalar-background-2);
    --scalar-sidebar-border-color: var(--scalar-border-color);
    --scalar-sidebar-color-1: var(--scalar-color-1);
    --scalar-sidebar-color-2: var(--scalar-color-2);
    --scalar-sidebar-color-active: var(--scalar-color-2);
    --scalar-sidebar-search-background: var(--scalar-background-2);
    --scalar-sidebar-search-border-color: var(--scalar-border-color);
    --scalar-sidebar-search-color: var(--scalar-color-3);
  }
  .dark-mode .sidebar {
    --scalar-sidebar-background-1: var(--scalar-background-1);
    --scalar-sidebar-item-hover-color: currentColor;
    --scalar-sidebar-item-hover-background: var(--scalar-background-2);
    --scalar-sidebar-item-active-background: var(--scalar-background-2);
    --scalar-sidebar-border-color: var(--scalar-border-color);
    --scalar-sidebar-color-1: var(--scalar-color-1);
    --scalar-sidebar-color-2: var(--scalar-color-2);
    --scalar-sidebar-color-active: var(--scalar-color-2);
    --scalar-sidebar-search-background: var(--scalar-background-2);
    --scalar-sidebar-search-border-color: var(--scalar-border-color);
    --scalar-sidebar-search-color: var(--scalar-color-3);
  }
</style>
```

## Embedding with CSS Frameworks

When you embed the Scalar API Reference in an existing application that already has its own CSS (for example, a project using Tailwind), Scalar's styles may interact with your application's styles. This section explains how Scalar's CSS is structured and how to make sure everything works together.

### How Scalar CSS Layers Work

Scalar uses [CSS cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) to organize its styles and to make them easy to override.

| Layer | Purpose |
|-------|---------|
| `scalar-base` | Core CSS variables and the default theme |
| `scalar-theme` | Theme-specific overrides (for example, the `moon` or `kepler` themes) |
| `scalar-config` | Configurable layout variables used by the API Reference component |

Layers defined earlier in the layer order have *lower* cascade priority. Any styles outside of these layers will override them, which makes it easy to customize.

The layer order is declared at the top of the Scalar theme stylesheet:

```css
@layer scalar-base, scalar-theme;
```

This works great on a standalone page, but when you embed the API Reference alongside another CSS framework that also uses `@layer`, you need to tell the browser the order of *all* layers so they don't conflict.

### Tailwind CSS

We love Tailwind and use it extensively in the API References. Where possible we've isolated our Tailwind styles and layers inside the API References to avoid conflicts with consuming projects that use Tailwind.

Tailwind CSS v4 introduced its own set of cascade layers (`theme`, `base`, `components`, `utilities`). When Scalar's styles and Tailwind's styles are both on the page, the browser determines layer priority based on [whichever `@layer` declaration it encounters first](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@layer).

If the ordering is not explicitly set, Scalar's layers may end up with *higher* priority than Tailwind's `utilities` layer. This can cause Scalar CSS variables (like `--leading-normal` or `--ease-in`) and other properties to override your Tailwind utility classes.

**The fix:** Declare the full layer order yourself, *before* importing Tailwind, so that Tailwind's layers always win over Scalar's layers.

In your main CSS file (for example, `src/index.css` or `src/app.css`):

```css
/* Set the layer order: Scalar layers first (lowest priority), then Tailwind layers (highest priority) */
@layer scalar-base, scalar-theme, scalar-config, theme, base, components, utilities;

/* Then import Tailwind as normal */
@import "tailwindcss";
```

This ensures that Tailwind's `utilities` layer has the highest cascade priority and your utility classes always take effect.

> [!NOTE]
> The `@layer` declaration above must come **before** `@import "tailwindcss"` in your CSS file. Tailwind v4 sets its own layer order [when it's imported](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/index.css), so you need to declare yours first to take precedence.

### Global HTML and Body Styles

In addition to being embeddable in an existing page, the API Reference is designed to work as a standalone page with no other CSS reset or normalize stylesheet. To support this, Scalar includes a small set of global rules on `html` and `body` (for example, `line-height`, `background-color`).

These rules are intentionally minimal and easy to override. If you set the CSS layer order as described above, Tailwind's preflight will automatically override most of these. For any remaining properties (like `background-color`), you can override them in your own CSS:

```css
body {
  background-color: var(--color-slate-900);
}
```

### Matching Scalar Colors to Your Theme

To make the API Reference blend in with the rest of your application, you can map Scalar's CSS variables to your own design tokens. For example, with Tailwind CSS:

```css
:root {
  --scalar-background-1: var(--color-slate-900);
  --scalar-background-2: var(--color-slate-800);
  --scalar-color-1: var(--color-white);
  --scalar-color-accent: var(--color-indigo-600);
}
```

See the full list of [available CSS variables](https://github.com/scalar/scalar/blob/main/packages/themes/src/base/variables.css).

### Other CSS Frameworks

If you use a different CSS framework that also relies on `@layer`, the same principle applies: declare the full layer order before any imports, with Scalar's layers listed first (lowest priority) and your framework's layers listed last (highest priority).

For frameworks that do not use `@layer`, Scalar's layered styles will naturally have lower priority than unlayered styles, so no additional configuration is needed.
