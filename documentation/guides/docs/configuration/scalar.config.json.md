# scalar.config.json

The `scalar.config.json` file is the central configuration file for Scalar Docs. It defines your project's metadata, navigation structure, site settings, and deployment options.

## Creating the configuration file

You can create a configuration file manually or use the Scalar CLI:

```bash
npx @scalar/cli project init
```

This command creates a `scalar.config.json` file in your current directory with a basic structure to get you started.

## Basic structure

Here is a minimal configuration to get started:

```json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "info": {
    "title": "My Documentation",
    "description": "The best documentation you've read today"
  },
  "navigation": {
    "routes": {
      "/": {
        "title": "Introduction",
        "type": "page",
        "filepath": "docs/introduction.md"
      }
    }
  }
}
```

## Autocomplete in VS Code and Cursor

To get autocomplete and validation in your editor, enable JSON schema downloads in VS Code (or Cursor):

```json
// .vscode/settings.json
{
  "json.schemaDownload.enable": true
}
```

The `$schema` property in your configuration file tells the editor where to find the schema:

```json
// scalar.config.json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json"
}
```

Your editor will now provide autocomplete suggestions and highlight invalid properties.

## Configuration reference

### Root properties

| Property     | Type     | Description                                                                                                |
| ------------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| `$schema`    | `string` | JSON Schema URL for editor autocomplete and validation                                                     |
| `scalar`     | `string` | Configuration version. Use `"2.0.0"` for the latest format                                                 |
| `info`       | `object` | Project metadata (title, description)                                                                      |
| `navigation` | `object` | Navigation structure (header links, routes, sidebar, tabs). See [navigation.md](navigation.md) for details |
| `siteConfig` | `object` | Site-level configuration (domain, theme, head, logo)                                                       |
| `assetsDir`  | `string` | Path to the assets directory (relative to repository root)                                                 |

### info

Project metadata displayed in various places:

```json
{
  "info": {
    "title": "My Documentation",
    "description": "Comprehensive guides for our API"
  }
}
```

### siteConfig

Configure your site's domain, appearance, and custom assets:

```json
{
  "siteConfig": {
    "subdomain": "acme",
    "customDomain": "docs.example.com",
    "theme": "purple",
    "logo": {
      "darkMode": "https://example.com/logo-dark.svg",
      "lightMode": "https://example.com/logo-light.svg"
    },
    "head": {
      "scripts": [{ "path": "assets/analytics.js" }],
      "styles": [{ "path": "assets/custom.css" }],
      "meta": [{ "name": "description", "content": "My docs description" }],
      "links": [{ "rel": "icon", "href": "/favicon.png" }]
    },
    "routing": {
      "redirects": [
        { "from": "/old-path", "to": "/new-path" }
      ]
    }
  }
}
```

#### siteConfig properties

| Property  | Type     | Description                                                                                                                 |
| --------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| `theme`   | `string` | Visual theme (`default`, `alternate`, `moon`, `purple`, `solarized`, `bluePlanet`, `deepSpace`, `saturn`, `kepler`, `mars`) |
| `logo`    | `object` | Logo URLs for dark and light modes                                                                                          |
| `head`    | `object` | Custom scripts, styles, meta tags, and links                                                                                |
| `routing` | `object` | URL redirects configuration                                                                                                 |
| `subpath` | `string` | URL subpath for multi-project deployments (e.g., `/guides`, `/api`)                                                         |

### navigation

For detailed navigation configuration, see [Navigation](navigation.md).

## Full example

Here is a more complete example showing common configuration options:

```json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "info": {
    "title": "Acme API Documentation",
    "description": "Everything you need to integrate with Acme"
  },
  "assetsDir": "docs/assets",
  "siteConfig": {
    "subdomain": "acme",
    "theme": "default",
    "logo": {
      "darkMode": "https://example.com/logo-dark.svg",
      "lightMode": "https://example.com/logo-light.svg"
    },
    "head": {
      "meta": [
        { "name": "description", "content": "Acme API documentation and guides" }
      ],
      "links": [
        { "rel": "icon", "href": "/favicon.png" }
      ]
    }
  },
  "navigation": {
    "header": [
      { "title": "Dashboard", "url": "https://dashboard.example.com" }
    ],
    "routes": {
      "/": {
        "type": "group",
        "title": "Acme",
        "children": {
          "": {
            "type": "page",
            "title": "Introduction",
            "filepath": "docs/introduction.md",
            "icon": "phosphor/regular/house"
          },
          "/api": {
            "type": "openapi",
            "title": "API Reference",
            "url": "https://example.com/openapi.yaml",
            "icon": "phosphor/regular/notebook"
          }
        }
      }
    }
  }
}
```

## File location

By default, the `scalar.config.json` file should be placed in the root of your GitHub repository. If you need to place it in a different location, you can configure the path in the [Scalar Dashboard](https://dashboard.scalar.com/).

## Deploying multiple projects on the same domain

You can deploy multiple documentation projects on the same subdomain or custom domain by using the `subpath` property. Each project lives in its own repository with its own `scalar.config.json`, but they share the same domain.

For example, you might want to have:

- `docs.example.com/` — Your main documentation
- `docs.example.com/guides/` — Tutorial guides
- `docs.example.com/api/` — API reference

To set this up, create a separate repository for each project and configure them with the same `subdomain` or `customDomain` but a different `subpath`:

**Repository 1: Main documentation**

```json
// scalar.config.json
{
  "siteConfig": {
    "customDomain": "docs.example.com"
  }
}
```

**Repository 2: Guides**

```json
// scalar.config.json
{
  "siteConfig": {
    "customDomain": "docs.example.com",
    "subpath": "/guides"
  }
}
```

**Repository 3: API reference**

```json
// scalar.config.json
{
  "siteConfig": {
    "customDomain": "docs.example.com",
    "subpath": "/api"
  }
}
```

Each repository is deployed independently, but all projects appear under the same domain with their respective subpaths.
