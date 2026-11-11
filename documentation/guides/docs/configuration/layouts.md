# Layouts

A layout sets how your documentation site is arranged: where the header, sidebar, tabs and content sit, and how much of the window they take up. A [theme](themes.md) sets the colors and fonts, and a layout sets the structure they are applied to. Any theme works with any layout.

## Configuration

Set `layout.preset` in the `siteConfig` object of your `scalar.config.json` file:

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "layout": {
      "preset": "contained"
    }
  }
}
```

The preset applies to the whole site. Pages cannot set their own, because every page shares the header and sidebar that a preset moves.

## Available layouts

### Default

The header and sidebar span the window, with a table of contents beside the content. This is the layout you get when you leave `preset` unset or set it to `"default"`.

<scalar-image
  src="/layouts-default.png"
  src-dark="/layouts-default-dark.png"
  alt="A documentation site on the default layout, with the header and sidebar spanning the window"
  size="full">
</scalar-image>

### Minimal

`"minimal"` puts the header, sidebar and content in one centered column, as wide as the sidebar and the reading column with its padding. On a wide screen the page keeps a calm, narrow shape instead of stretching to fill it.

The column has no room for a table of contents, so this layout has none: `layout.toc` is ignored, on individual pages too. The sidebar scrolls as one, so the links at its foot follow the last page in it instead of staying pinned to the bottom of the window.

<scalar-image
  src="/layouts-minimal.png"
  src-dark="/layouts-minimal-dark.png"
  alt="A documentation site on the minimal layout, with the header, sidebar and content in one centered column"
  size="full">
</scalar-image>

### Contained

`"contained"` shows the content in a raised panel that scrolls by itself, while the header and sidebar stay in place on a layer behind it. The tabs run along the top of the panel and stay there as the content scrolls underneath them. Header links mark the current page with a rounded background, like the rows in the sidebar beside them.

<scalar-image
  src="/layouts-contained.png"
  src-dark="/layouts-contained-dark.png"
  alt="A documentation site on the contained layout, with the content in a raised panel and the tabs along its top"
  size="full">
</scalar-image>

#### Pages with tabs and no header

On a page with tabs but no [header](navigation.md#header), your logo becomes the first row of the sidebar, level with the tabs, and the panel runs to the top of the window beside it. If your site has more than one [version](versions.md), the version selector follows the logo.

On a page with no sidebar either, the logo stays with the tabs at the top of the panel.

<scalar-image
  src="/layouts-contained-no-header.png"
  src-dark="/layouts-contained-no-header-dark.png"
  alt="A page on the contained layout with tabs and no header, where the logo is the first row of the sidebar"
  size="full">
</scalar-image>

## Small screens

Layouts apply to screens wider than 1000px. At 1000px and below, the sidebar becomes a menu and every site uses the default layout, whatever its preset.

## Other layout options

The other [layout options](site-config.md#layout) still apply on top of a preset. You can hide the header, move the search box, or turn off the table of contents on the contained layout, and a page can override those options in its own [layout options](navigation.md#layout-options). The one exception is `toc` on the minimal layout, which has no table of contents to show.

## Customizing a layout

You can adjust a layout with these CSS variables in a [custom theme](themes.md):

| Variable                   | Layout      | Default                                                              | Description                                                                 |
| -------------------------- | ----------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `--scalar-layout-width`    | `minimal`   | The sidebar width plus the reading column and its padding            | The width of the centered column                                            |
| `--scalar-layout-backdrop` | `contained` | `--scalar-background-2` in light mode, a near-black in dark mode     | The layer behind the panel. The header and sidebar take this color          |
| `--scalar-layout-gutter`   | `contained` | `12px`                                                               | The space between the panel and the edges of the window                     |

The backdrop is a color, so set it on `.light-mode` and `.dark-mode` like the rest of your theme's colors:

```css
/* theme.css */
.light-mode {
  --scalar-layout-backdrop: #f4f1ea;
}
.dark-mode {
  --scalar-layout-backdrop: #0b0b0c;
}
```

On the contained layout, the header and sidebar use `--scalar-layout-backdrop` instead of their own background colors, so set it if your theme tints either one.

The page's `<body>` carries a `data-layout` attribute with the name of the preset, `minimal` or `contained`, so your CSS can target one layout. The default layout has no attribute. Sizes that do not change with the color mode can go there:

```css
/* theme.css */
body[data-layout='contained'] {
  --scalar-layout-gutter: 16px;
}
```
