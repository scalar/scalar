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

| Value         | Layout                                                                           |
| ------------- | -------------------------------------------------------------------------------- |
| `"default"`   | The header and sidebar span the window. The same as leaving `preset` unset       |
| `"minimal"`   | The header, sidebar, content and table of contents share one centered column     |
| `"contained"` | The content scrolls inside a raised panel, with the header and sidebar behind it |

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

`"minimal"` puts the header, sidebar, content and table of contents in one centered column of a fixed width. On a wide screen the page keeps a calm shape instead of stretching to fill it. Pages without a table of contents keep the same width, so the header and sidebar stay in place as you move between pages.

<scalar-image
  src="/layouts-minimal.png"
  src-dark="/layouts-minimal-dark.png"
  alt="A documentation site on the minimal layout, with the header, sidebar, content and table of contents in one centered column"
  size="full">
</scalar-image>

The minimal layout also quiets the chrome around your content:

- **Header:** The header is a little taller. Its links use the main text color, and the link under the pointer and the link to the current page get a rounded background instead of an underline. Buttons and the search box in the header are fully rounded.
- **Sidebar:** The sidebar draws no borders, and marks the current page and the row under the pointer by their text alone. When search is in the sidebar, Search and Ask AI are rows at its top, styled like the pages under them.
- **Scrolling:** The sidebar scrolls as one. Search and Ask AI scroll away with the pages, and the links at the foot of the sidebar follow the last page instead of staying pinned to the bottom of the window.
- **Table of contents:** The table of contents draws no guide line or marker. The current heading stands out by its color and weight.

#### Light and dark mode

The minimal layout has no light/dark toggle. Pages follow your site's [`colorScheme.default`](site-config.md#color-scheme), or the visitor's system setting when it is unset or set to `"system"`. `layout.colorSchemeToggle` has no effect on this layout, whether you set it in the site config or in a page's [layout options](navigation.md#layout-options).

A light or dark choice a visitor made elsewhere, such as on another of your projects on the same domain, is not read on this layout. It stays saved for those projects.

### Contained

`"contained"` shows the content in a raised panel that scrolls by itself, while the header and sidebar stay in place on a backdrop behind it. If your site has [tabs](navigation.md#tabs), they span the window under the header, as on the default layout, and the panel starts a small gap below them.

<scalar-image
  src="/layouts-contained.png"
  src-dark="/layouts-contained-dark.png"
  alt="A documentation site on the contained layout, with the content in a raised panel and the header and sidebar on a backdrop behind it"
  size="full">
</scalar-image>

The header and sidebar share the backdrop, so they mark the current page the same way: header links get a rounded background in the sidebar's colors instead of an underline. Buttons and the search box in the header are fully rounded.

Because the panel scrolls rather than the page, the window itself does not scroll on this layout. If a [custom script](site-config.md#scripts) listens for scrolling, have it listen on the page's `<main>` element as well as the window, which still scrolls on [small screens](#small-screens).

## Small screens

Layouts apply to screens wider than 1000px. At 1000px and below, the sidebar becomes a menu and every site uses the default layout, whatever its preset. The minimal layout still has no light/dark toggle at those widths.

A contained page also prints as the default layout, so the whole page prints rather than the part the panel is showing.

## Other layout options

The other [layout options](site-config.md#layout) still apply on top of a preset. You can hide the header, move the search box, turn off the table of contents or [condense it](site-config.md#table-of-contents-layout), and a page can override those options in its own [layout options](navigation.md#layout-options).

## Customizing a layout

You can adjust a layout with these CSS variables in a [custom theme](themes.md):

| Variable                   | Layout      | Default                                                                                                    | Description                                                        |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `--scalar-layout-width`    | `minimal`   | The sidebar, the reading column and the table of contents together: `1340px` with the default sizes        | The width of the centered column                                   |
| `--scalar-layout-backdrop` | `contained` | Halfway between `--scalar-background-1` and `--scalar-background-2` in light mode, near-black in dark mode | The layer behind the panel. The header and sidebar take this color |
| `--scalar-layout-gutter`   | `contained` | `12px`                                                                                                     | The space between the panel and the edges of the window            |

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

On the minimal layout, the column follows your theme. If your theme changes `--scalar-sidebar-width`, `--scalar-container-width` or `--scalar-toc-width`, the column grows or shrinks with it. A page that sets these variables in a `<style>` block of its own, to widen its content, does not move the column, so the header and sidebar stay in place on that page.

The page's `<body>` carries a `data-layout` attribute with the name of the preset, `minimal` or `contained`, so your CSS can target one layout. The default layout has no attribute. Sizes that do not change with the color mode can go there:

```css
/* theme.css */
body[data-layout='contained'] {
  --scalar-layout-gutter: 16px;
}

body[data-layout='minimal'] {
  --scalar-layout-width: 1400px;
}
```
