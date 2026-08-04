# Site Config

The site configuration defines global settings for your documentation site: branding, custom head elements, footer content, and routing rules. These settings apply across your entire documentation site.

All site settings are configured within the `siteConfig` object in your `scalar.config.json` file.

**Example**

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "logo": "https://example.com/logo.svg",
    "theme": "default"
  }
}
```

## Logo

The `logo` property defines your site's logo. You can provide a single URL for all modes, or separate logos for light and dark themes.

### Where the Logo Appears

Your logo renders on the first of these surfaces your site has:

1. The **header**, if `navigation.header` has any items
2. The **tabs**, if you have `navigation.tabs` but no header
3. The **sidebar**, if you have neither

To put your logo in the header, add at least one item to [`navigation.header`](navigation.md#header) — a single spacer is enough. If a page hides all three surfaces through its [layout options](navigation.md#layout-options), the logo does not render on that page.

If you do not set a `logo`, your project title from `info.title` renders in the same place instead.

### Single Logo

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "logo": "https://example.com/logo.svg"
  }
}
```

### Light and Dark Mode

For better visibility across themes, provide different logos for light and dark modes:

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "logo": {
      "darkMode": "https://example.com/logo-dark.svg",
      "lightMode": "https://example.com/logo-light.svg"
    }
  }
}
```

### Properties

| Property         | Type     | Required | Description                             |
| ---------------- | -------- | -------- | --------------------------------------- |
| `logo`           | `string` | No       | URL to a single logo for all themes     |
| `logo.darkMode`  | `string` | No       | URL to the logo displayed in dark mode  |
| `logo.lightMode` | `string` | No       | URL to the logo displayed in light mode |

## Theme

The `theme` property sets a platform-defined theme for your documentation site.

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "theme": "purple"
  }
}
```

### Properties

| Property | Type     | Required | Description                       |
| -------- | -------- | -------- | --------------------------------- |
| `theme`  | `string` | No       | Slug for a platform-defined theme |

## Color Scheme

The `colorScheme` property controls the light/dark mode appearance and toggle behavior for your documentation site.

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "colorScheme": {
      "default": "system",
      "showToggle": true
    }
  }
}
```

### Properties

| Property     | Type                             | Default    | Description                                |
| ------------ | -------------------------------- | ---------- | ------------------------------------------ |
| `default`    | `"light" \| "dark" \| "system"` | `"system"` | Default color scheme on page load          |
| `showToggle` | `boolean`                        | `true`     | Whether to show the color scheme toggle    |

### Examples

#### Force Light Mode

Force your documentation to always display in light mode without a toggle:

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "colorScheme": {
      "default": "light",
      "showToggle": false
    }
  }
}
```

#### Force Dark Mode

Force your documentation to always display in dark mode without a toggle:

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "colorScheme": {
      "default": "dark",
      "showToggle": false
    }
  }
}
```

#### System Preference with Toggle

Respect the user's system preference while allowing them to override it:

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "colorScheme": {
      "default": "system",
      "showToggle": true
    }
  }
}
```

## Layout

The `layout` property controls global layout options that apply to all pages unless overridden at the page level.

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "layout": {
      "toc": true,
      "header": true,
      "pageTitle": true,
      "pageActions": true,
      "search": {
        "enabled": true,
        "position": "header"
      }
    }
  }
}
```

### Properties

| Property      | Type      | Default  | Description                                    |
| ------------- | --------- | -------- | ---------------------------------------------- |
| `toc`         | `boolean` | `true`   | Whether to show the table of contents globally |
| `header`      | `boolean` | `true`   | Whether to show the header globally            |
| `pageTitle`   | `boolean` | `true`   | Whether to show page titles globally           |
| `pageActions` | `boolean` | `true`   | Whether to show page actions globally          |
| `search`      | `object`  | —        | Search bar configuration                       |

### Search Configuration

The `search` object within `layout` controls the global search behavior.

| Property   | Type                        | Default    | Description                           |
| ---------- | --------------------------- | ---------- | ------------------------------------- |
| `enabled`  | `boolean`                   | `true`     | Enable or disable search globally     |
| `position` | `"header" \| "sidebar"`    | `"header"` | Where to display the search bar       |

#### Disable Search

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "layout": {
      "search": {
        "enabled": false
      }
    }
  }
}
```

#### Move Search to Sidebar

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "layout": {
      "search": {
        "position": "sidebar"
      }
    }
  }
}
```

## Head

The `head` property allows you to inject custom elements into the HTML `<head>` of your documentation pages. This is useful for adding custom styles, scripts, meta tags, and favicon links.

### Example

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "head": {
      "title": "My Documentation",
      "meta": [
        {
          "name": "description",
          "content": "Documentation for my API"
        },
        {
          "property": "og:image",
          "content": "https://example.com/og-image.png"
        }
      ],
      "styles": [
        {
          "path": "assets/custom-styles.css"
        }
      ],
      "scripts": [
        {
          "path": "assets/analytics.js"
        }
      ],
      "links": [
        {
          "rel": "icon",
          "href": "/favicon.png"
        }
      ]
    }
  }
}
```

### Properties

| Property  | Type              | Required | Description                            |
| --------- | ----------------- | -------- | -------------------------------------- |
| `title`   | `string`          | No       | The page title                         |
| `meta`    | `array \| object` | No       | Meta tags for SEO and social sharing   |
| `styles`  | `array`           | No       | CSS files to include                   |
| `scripts` | `array`           | No       | JavaScript files to include            |
| `links`   | `array`           | No       | Link elements (favicon, preload, etc.) |

### Meta Tags

Meta tags can be provided as an array of objects or as a key-value object:

**Array Format**

```json
"meta": [
  {
    "name": "description",
    "content": "My API documentation"
  },
  {
    "property": "og:title",
    "content": "My API"
  }
]
```

**Object Format**

```json
"meta": {
  "description": "My API documentation",
  "og:title": "My API"
}
```

### Styles

Include custom CSS files in your documentation:

```json
"styles": [
  {
    "path": "assets/custom-styles.css",
    "tagPosition": "head"
  }
]
```

| Property      | Type                                  | Required | Description                   |
| ------------- | ------------------------------------- | -------- | ----------------------------- |
| `path`        | `string`                              | Yes      | Relative path to the CSS file |
| `tagPosition` | `"head" \| "bodyOpen"` \| "bodyClose" | No       | Where to inject the style tag |

### Scripts

Include custom JavaScript files:

```json
"scripts": [
  {
    "path": "assets/analytics.js",
    "tagPosition": "bodyEnd"
  }
]
```

| Property      | Type                                  | Required | Description                          |
| ------------- | ------------------------------------- | -------- | ------------------------------------ |
| `path`        | `string`                              | Yes      | Relative path to the JavaScript file |
| `tagPosition` | `"head" \| "bodyOpen"` \| "bodyClose" | No       | Where to inject the style tag        |

### Links

Add link elements for favicons, preloading resources, or other purposes:

```json
"links": [
  {
    "rel": "icon",
    "type": "image/png",
    "href": "/favicon.png"
  },
  {
    "rel": "preconnect",
    "href": "https://fonts.googleapis.com"
  }
]
```

| Property | Type     | Description                           |
| -------- | -------- | ------------------------------------- |
| `rel`    | `string` | The relationship type (icon, preload) |
| `href`   | `string` | The URL or path to the resource       |
| `type`   | `string` | The MIME type of the resource         |

## Footer

The `footer` property allows you to add a custom footer to your documentation site.

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "footer": {
      "filepath": "docs/footer.html"
    }
  }
}
```

### Properties

| Property   | Type     | Description                                |
| ---------- | -------- | ------------------------------------------ |
| `filepath` | `string` | Relative path to a custom HTML footer file |

## RSS

The `rss` property publishes an RSS feed for your changelog, so readers can subscribe to your releases in a feed reader.

Point `path` at the route your changelog lives on. The feed is written to `rss.xml` under that route — a changelog at `/changelog` publishes its feed at `/changelog/rss.xml`.

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "rss": {
      "path": "/changelog",
      "title": "Scalar Changelog",
      "description": "Every Scalar release, as a feed"
    }
  }
}
```

### Properties

| Property      | Type     | Required | Description                                                                         |
| ------------- | -------- | -------- | ----------------------------------------------------------------------------------- |
| `path`        | `string` | Yes      | Route of your changelog, for example `/changelog`                                   |
| `title`       | `string` | No       | Title of the feed, shown in feed readers. Defaults to your site title plus `Changelog` |
| `description` | `string` | No       | Description of the feed, shown in feed readers                                      |

### Writing Entries

Each entry in the feed comes from a heading that carries a date in `YYYY-MM-DD` form:

```markdown
## 1.2.0 (2026-07-24)

Added a dark mode toggle to the header.

## 1.1.0 (2026-07-10)

Introduced page actions: copy as Markdown, open in editor, and report an issue.
```

The heading becomes the item title, and the content below it becomes the item description. Headings without a date are not entries of their own — they belong to the entry above them, so you can use subheadings inside a release without splitting it apart.

If a heading looks dated but the date is not real (`## 2.0.0 (2026-13-01)`), that release is left out of the feed and the build warns you, since a typo is the only way to get there.

### Multiple Products

A changelog split across several pages works too. Every page at `path` or beneath it contributes its entries, and the feed merges them newest-first:

```
/changelog                 <- index page, lists the products
/changelog/api-client      <- entries
/changelog/api-reference   <- entries
```

An index page with no dated headings contributes nothing of its own, which is what you want when it only links to the products.

Hidden pages are skipped. A page kept out of the sidebar and the sitemap stays out of the feed as well.

### Discovery

Every page on your site advertises the feed in its `<head>`, so feed readers and browser extensions can find it from any URL:

```html
<link rel="alternate" type="application/rss+xml" href="https://example.com/changelog/rss.xml">
```

Pages at `path` and beneath it also show a subscribe button in the page header, next to Copy Page.

## Routing

The `routing` property configures URL redirects and path patterns for your documentation.

### Redirects

Set up redirects to handle URL changes or aliases:

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "routing": {
      "redirects": [
        {
          "from": "/old-path",
          "to": "/new-path"
        },
        {
          "from": "/docs/v1",
          "to": "/docs/latest"
        }
      ]
    }
  }
}
```

### Properties

| Property               | Type     | Description                         |
| ---------------------- | -------- | ----------------------------------- |
| `redirects`            | `array`  | Array of redirect rules             |
| `guidePathPattern`     | `string` | URL pattern for guide pages         |
| `referencePathPattern` | `string` | URL pattern for API reference pages |

### Redirect Object

| Property | Type     | Required | Description              |
| -------- | -------- | -------- | ------------------------ |
| `from`   | `string` | Yes      | The source path to match |
| `to`     | `string` | Yes      | The destination path     |

### Path Patterns

Customize the URL structure for guides and API references:

```json
"routing": {
  "guidePathPattern": "/docs/:slug",
  "referencePathPattern": "/api/:slug"
}
```
