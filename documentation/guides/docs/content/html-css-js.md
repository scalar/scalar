# HTML/CSS/JS

Scalar Docs supports custom HTML, CSS, and JavaScript to give you full control over your documentation pages. You can write raw HTML directly in Markdown files, add custom styles inline or via external stylesheets, and include JavaScript for interactivity.

## Writing HTML Pages

You can write raw HTML directly in your Markdown (`.md`) files. This is useful for creating custom landing pages, marketing pages, or any page that needs custom layout and styling.

**Example**

Create a Markdown file with HTML content:

```html
<!-- documentation/custom-page.md -->
<div class="hero">
  <h1>Welcome to My API</h1>
  <p>The best API for developers</p>
  <a href="/getting-started" class="button">Get Started</a>
</div>

<style>
.hero {
  text-align: center;
  padding: 80px 20px;
}
.button {
  display: inline-block;
  padding: 12px 24px;
  background: var(--scalar-color-accent);
  color: white;
  border-radius: 8px;
  text-decoration: none;
}
</style>
```

### Inline Styles

Add a `<style>` tag at the end of your Markdown file to include page-specific CSS:

```html
<style>
  .my-custom-class {
    padding: 20px;
  }
</style>
```

### Using Scalar CSS Variables

Scalar provides CSS variables for consistent theming. Use these in your custom styles:

**Colors**

Defined in [theme presets](https://github.com/scalar/scalar/blob/main/packages/themes/src/presets/default.css)

| Variable                | Description          |
| ----------------------- | -------------------- |
| `--scalar-color-1`      | Primary text color   |
| `--scalar-color-2`      | Secondary text color |
| `--scalar-color-3`      | Tertiary text color  |
| `--scalar-color-accent` | Accent/brand color   |
| `--scalar-background-1` | Primary background   |
| `--scalar-background-2` | Secondary background |
| `--scalar-background-3` | Tertiary background  |
| `--scalar-border-color` | Border color         |

**Typography and Sizing**

Defined in [variables.css](https://github.com/scalar/scalar/blob/main/packages/themes/src/base/variables.css)

| Variable             | Description                     |
| -------------------- | ------------------------------- |
| `--scalar-font`      | Default font family             |
| `--scalar-font-code` | Monospace/code font family      |
| `--scalar-radius`    | Default border radius (3px)     |
| `--scalar-radius-lg` | Large border radius (6px)       |
| `--scalar-radius-xl` | Extra large border radius (8px) |
| `--scalar-paragraph` | Paragraph font size (16px)      |
| `--scalar-small`     | Small text font size (14px)     |

### Using Scalar Components

You can use Scalar's built-in components in your HTML:

```html
<!-- Headings with automatic anchor links -->
<scalar-heading level="2" slug="my-section">My Section Title</scalar-heading>

<!-- Icons from the Phosphor icon library -->
<scalar-icon src="phosphor/regular/rocket"></scalar-icon>

<!-- Icons from external URLs -->
<scalar-icon src="https://example.com/my-icon.svg"></scalar-icon>
```

### Dark Mode Support

Use CSS classes to show different content based on the color mode:

```html
<img class="light-image" src="/screenshot-light.png" />
<img class="dark-image" src="/screenshot-dark.png" />

<style>
.light-mode .dark-image {
  display: none;
}
.dark-mode .light-image {
  display: none;
}
</style>
```

### Hiding Default Page Elements

You can hide the table of contents via page configuration in `scalar.config.json`:

```json
{
  "navigation": {
    "routes": {
      "/my-landing-page": {
        "type": "page",
        "filepath": "documentation/landing.md",
        "layout": {
          // We don't want the table of contents here:
          "toc": false
        }
      }
    }
  }
}
```

## Site-Wide Head Configuration

The `siteConfig.head` configuration allows you to inject custom HTML elements into the `<head>` of your documentation pages. This enables you to add custom stylesheets, JavaScript files, meta tags for SEO and social sharing, and link elements like favicons.

All head configuration is done within the `siteConfig.head` object in your `scalar.config.json` file.

**Example**

```json
// scalar.config.json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "siteConfig": {
    "head": {
      "scripts": [
        {
          "path": "documentation/assets/analytics.js"
        }
      ],
      "styles": [
        {
          "path": "documentation/assets/styles.css"
        }
      ],
      "meta": [
        {
          "name": "description",
          "content": "Documentation for my API"
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

## Scripts

The `scripts` array allows you to include custom JavaScript files in your documentation. Scripts can be injected into the `<head>` or at the end of the `<body>` tag, depending on your needs.

### Example

```json
// scalar.config.json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "siteConfig": {
    "head": {
      "scripts": [
        {
          "path": "documentation/assets/analytics.js",
          "tagPosition": "bodyClose"
        }
      ]
    }
  }
}
```

### Properties

| Property      | Type                                  | Required | Description                                                       |
| ------------- | ------------------------------------- | -------- | ----------------------------------------------------------------- |
| `path`        | `string`                              | Yes      | Relative path to the JavaScript file from your configuration root |
| `tagPosition` | `"head" \| "bodyOpen" \| "bodyClose"` | No       | Where to inject the script tag (defaults to `"head"`)             |

### Tag Position

- `head`: Scripts are injected into the `<head>` element. Use this for scripts that need to load early, such as analytics initialization or critical functionality.
- `bodyOpen`: Scripts are injected immediately after the opening `<body>` tag. Use this for scripts that need to access the DOM as soon as possible but do not need to block page rendering.
- `bodyClose`: Scripts are injected just before the closing `</body>` tag. Use this for non-critical scripts or analytics that should not block page rendering.

## Styles

The `styles` array allows you to include custom CSS files to customize the appearance of your documentation site.

### Example

```json
// scalar.config.json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "siteConfig": {
    "head": {
      "styles": [
        {
          "path": "documentation/assets/styles.css"
        }
      ]
    }
  }
}
```

### Properties

| Property      | Type                                  | Required | Description                                                |
| ------------- | ------------------------------------- | -------- | ---------------------------------------------------------- |
| `path`        | `string`                              | Yes      | Relative path to the CSS file from your configuration root |
| `tagPosition` | `"head" \| "bodyOpen" \| "bodyClose"` | No       | Where to inject the style tag (defaults to `"head"`)       |

## Meta Tags

The `meta` array allows you to add meta tags for SEO, social sharing (Open Graph, Twitter Cards), and other metadata. Meta tags can be provided as an array of objects or as a key-value object.

### Array Format

```json
// scalar.config.json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "siteConfig": {
    "head": {
      "meta": [
        {
          "name": "description",
          "content": "Documentation for my API"
        },
        {
          "property": "og:title",
          "content": "My API Documentation"
        },
        {
          "property": "og:image",
          "content": "https://example.com/og-image.png"
        }
      ]
    }
  }
}
```

### Properties

| Property   | Type     | Required    | Description                                             |
| ---------- | -------- | ----------- | ------------------------------------------------------- |
| `name`     | `string` | Conditional | The meta `name` attribute (use for standard meta tags)  |
| `property` | `string` | Conditional | The meta `property` attribute (use for Open Graph tags) |
| `content`  | `string` | Yes         | The meta tag content value                              |

### Common Meta Tags

**SEO Meta Tags**

```json
"meta": [
  {
    "name": "description",
    "content": "Comprehensive API documentation"
  },
  {
    "name": "keywords",
    "content": "API, documentation, REST"
  }
]
```

**Open Graph Tags (for social sharing)**

```json
"meta": [
  {
    "property": "og:title",
    "content": "My API Documentation"
  },
  {
    "property": "og:description",
    "content": "Comprehensive API documentation"
  },
  {
    "property": "og:image",
    "content": "https://example.com/og-image.png"
  },
  {
    "property": "og:type",
    "content": "website"
  }
]
```

**Twitter Card Tags**

```json
"meta": [
  {
    "name": "twitter:card",
    "content": "summary_large_image"
  },
  {
    "name": "twitter:title",
    "content": "My API Documentation"
  },
  {
    "name": "twitter:image",
    "content": "https://example.com/twitter-image.png"
  }
]
```

## Links

The `links` array allows you to add link elements to the `<head>`, commonly used for favicons, preconnect hints, and other resource links.

### Example

```json
// scalar.config.json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "siteConfig": {
    "head": {
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
    }
  }
}
```

### Properties

| Property | Type     | Required | Description                                                      |
| -------- | -------- | -------- | ---------------------------------------------------------------- |
| `rel`    | `string` | Yes      | The relationship type (e.g., `icon`, `preconnect`, `stylesheet`) |
| `href`   | `string` | Yes      | The URL or path to the resource                                  |
| `type`   | `string` | No       | The MIME type of the resource (e.g., `image/png`)                |

### Common Link Types

**Favicon**

```json
"links": [
  {
    "rel": "icon",
    "type": "image/png",
    "href": "/favicon.png"
  }
]
```

**Preconnect (for performance optimization)**

```json
"links": [
  {
    "rel": "preconnect",
    "href": "https://fonts.googleapis.com"
  },
  {
    "rel": "preconnect",
    "href": "https://fonts.gstatic.com",
    "crossorigin": "anonymous"
  }
]
```

**Canonical URL**

```json
"links": [
  {
    "rel": "canonical",
    "href": "https://docs.example.com"
  }
]
```

## Common Use Cases

### Analytics Integration

Add analytics scripts like Fathom, Google Analytics, or other tracking tools:

```json
"scripts": [
  {
    "path": "documentation/assets/analytics.js",
    "tagPosition": "bodyClose"
  }
]
```

### Custom Branding and Styling

Override default styles to match your brand:

```json
"styles": [
  {
    "path": "documentation/assets/style.css"
  }
]
```

### SEO Optimization

Add comprehensive meta tags for better search engine visibility and social sharing:

```json
"meta": [
  {
    "name": "description",
    "content": "Your comprehensive API documentation"
  },
  {
    "property": "og:title",
    "content": "API Documentation"
  },
  {
    "property": "og:description",
    "content": "Your comprehensive API documentation"
  },
  {
    "property": "og:image",
    "content": "https://example.com/social-preview.png"
  }
]
```

### Favicon Configuration

Add custom favicons for your documentation site:

```json
"links": [
  {
    "rel": "icon",
    "type": "image/png",
    "href": "/favicon-32x32.png",
    "sizes": "32x32"
  },
  {
    "rel": "icon",
    "type": "image/png",
    "href": "/favicon-16x16.png",
    "sizes": "16x16"
  },
  {
    "rel": "apple-touch-icon",
    "href": "/apple-touch-icon.png"
  }
]
```

## Path References

When referencing files in `siteConfig.head`:

- For `scripts` and `styles`: Use the full path relative to your configuration root (e.g., `documentation/assets/script.js`)
- For `links` like favicons: Use root-relative paths (e.g., `/favicon.png`) since these files should be in your `assetsDir` and are served from the site root

Make sure your asset files are located in the directory specified by `assetsDir` or use absolute paths from your configuration root.
