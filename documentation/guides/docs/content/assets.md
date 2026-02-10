# Assets

The `assetsDir` configuration allows you to specify a folder containing custom assets such as images, scripts, stylesheets, and other static files. These assets are served globally from the root path of your documentation site, making them accessible from any page.

**Example**

```json
// scalar.config.json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "assetsDir": "docs/assets",
  "navigation": {
    "routes": {
      // ...
    }
  }
}
```

## Configuration

The `assetsDir` property specifies a relative path to your assets folder from the location of your `scalar.config.json` file.

### Properties

| Property    | Type     | Required | Description                                                    |
| ----------- | -------- | -------- | -------------------------------------------------------------- |
| `assetsDir` | `string` | No       | Relative path to the assets folder from the configuration root |

## Referencing Assets

Once you've configured `assetsDir`, assets in that folder are served from the root path of your site. This means a file at `docs/assets/picture.png` will be accessible at `/picture.png`.

### In Markdown Files

You can reference assets in your markdown files using either absolute paths from the site root or relative paths:

**Absolute URLs** (root-relative):

```markdown
![Screenshot](/screenshots/example.png)

![API Client](/api-client-static.svg)

[Download PDF](/documentation.pdf)
```

**Relative paths**:

```markdown
![Screenshot](../assets/screenshots/example.png)

![API Client](../../assets/api-client-static.svg)
```

- Absolute paths (`/path/to/file.png`) are recommended when you want paths that work consistently regardless of the markdown file's location
- Relative paths (`../assets/file.png`) are useful when you want paths relative to the current markdown file's location

### In siteConfig.head

Assets can also be referenced in the `siteConfig.head` configuration for scripts, stylesheets, and other head elements:

```json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "assetsDir": "docs/assets",
  "siteConfig": {
    "head": {
      "scripts": [
        {
          "path": "docs/assets/analytics.js"
        }
      ],
      "styles": [
        {
          "path": "docs/assets/custom.css"
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

Note that when referencing assets in `siteConfig.head`:
- For `scripts` and `styles`, use the full path relative to your configuration root (e.g., `docs/assets/script.js`)
- For `links` like favicons, use the root-relative path (e.g., `/favicon.png`)

## Complete Example

Here's a complete example showing how to configure assets and use them throughout your site:

```json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "assetsDir": "docs/assets",
  "siteConfig": {
    "head": {
      "scripts": [
        {
          "path": "docs/assets/landing.js",
          "tagPosition": "head"
        },
        {
          "path": "docs/assets/analytics.js",
          "tagPosition": "bodyClose"
        }
      ],
      "styles": [
        {
          "path": "docs/assets/styles.css"
        }
      ],
      "links": [
        {
          "rel": "icon",
          "href": "/favicon.png"
        }
      ]
    }
  },
  "navigation": {
    "routes": {
      "/": {
        "type": "page",
        "title": "Introduction",
        "filepath": "docs/introduction.md"
      }
    }
  }
}
```

In your Markdown files, you can then reference these assets:

```markdown
# Introduction

![Hero Image](/hero_1500x500.jpeg)

Welcome to our documentation. Check out our [API Client](/api-client-static.svg) for more details.
```

