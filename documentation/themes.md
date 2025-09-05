# Themes

You don't like the color scheme? We've prepared some themes for you:

```vue
/* theme?: 'alternate' | 'default' | 'moon' | 'purple' | 'solarized' |
'bluePlanet' | 'saturn' | 'kepler' | 'mars' | 'deepSpace' | 'laserwave' | 'none' */
<ApiReference :configuration="{ theme: 'moon' }" />
```

> [!NOTE]
> The `default` theme is … the default theme.
> If you want to make sure **no** theme is applied, pass `none`.

Wow, still nothing that fits your brand? Reach out to <support@scalar.com> and we'll make you a custom theme, just for you.

## Layouts

We support two layouts at the moment, a `modern` layout (the default) and a Swagger UI inspired
`classic` layout (we jazzed it up a bit though).

![layouts](https://github.com/scalar/scalar/assets/6374090/a28b89e0-8d3b-477f-a02f-bcf39f7830f0)

## Advanced: Styling

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

#### Theme Prefix Changes

We've migrated our `--theme-*` CSS variables to `--scalar-*` to avoid conflicts with other CSS variables in
applications consuming the Scalar references or themes.
If you're injecting your custom CSS through the [`customCss`](https://guides.scalar.com/scalar/scalar-api-references/configuration) configuration option we will automatically
migrate your variable prefixes but display a warning in the console.

We recommend updating your theme variables as soon as possible:

- `--theme-*` → `--scalar-*`
- `--sidebar-*` → `--scalar-sidebar-*`

