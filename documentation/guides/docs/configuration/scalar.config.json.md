# scalar.config.json

The `scalar.config.json` file is the central configuration file for Docs. It defines your project's metadata, navigation structure, site settings, and deployment options.

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
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
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
  "json.schemaDownload.trustedDomains": {
    "https://registry.scalar.com/": true,
  }
}
```

The `$schema` property in your configuration file tells the editor where to find the schema:

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config"
}
```

Your editor will now provide autocomplete suggestions and highlight invalid properties.

## Configuration reference

### Root properties

| Property              | Type      | Description                                                                                                     |
| --------------------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| `$schema`             | `string`  | JSON Schema URL for editor autocomplete and validation                                                          |
| `scalar`              | `string`  | Configuration version. Use `"2.0.0"` for the latest format                                                      |
| `info`                | `object`  | Project metadata (title, description)                                                                           |
| `navigation`          | `object`  | Navigation structure (header links, routes, sidebar, tabs). See [Navigation](navigation.md) for details         |
| `versions`            | `object`  | Multi-version navigation structure. Use instead of `navigation` for versioned docs. See [Versions](versions.md) |
| `siteConfig`          | `object`  | Site-level configuration (domain, theme, head, logo, access control)                                            |
| `assetsDir`           | `string`  | Path to the assets directory (relative to repository root)                                                      |
| `root`                | `string`  | Directory that route `filepath` values resolve against, relative to the configuration file                      |
| `publishOnMerge`      | `boolean` | Publish the site when commits land on the tracked branch. See [Publishing](#publishing)                         |
| `publishPreviews`     | `boolean` | Build a preview deployment for every pull request. See [Publishing](#publishing)                                |
| `pullRequestComments` | `boolean` | Post the preview URL as a comment on each pull request. See [Publishing](#publishing)                           |
| `ruleset`             | `object`  | Default Spectral ruleset and publish policy for every OpenAPI route. See [ruleset](#ruleset)                    |

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

| Property         | Type                | Description                                                                                                                 |
| ---------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `subdomain`      | `string`            | Subdomain to publish to, as in `<subdomain>.apidocumentation.com`. Must be unique on Scalar. See [Domains](domains.md)      |
| `customDomain`   | `string`            | Custom domain for the site. See [Domains](domains.md)                                                                       |
| `subpath`        | `string`            | URL subpath for multi-project deployments (e.g., `/guides`, `/api`)                                                         |
| `isPrivate`      | `boolean`           | Require visitors to sign in. See [Access Control](site-config.md#access-control)                                            |
| `accessGroups`   | `string[]`          | Slugs of the access groups allowed to view a private site. See [Access Control](site-config.md#access-control)              |
| `loginPortal`    | `string`            | Slug of a custom login portal for a private site. See [Access Control](site-config.md#access-control)                       |
| `theme`          | `string`            | Visual theme (`default`, `alternate`, `moon`, `purple`, `solarized`, `bluePlanet`, `deepSpace`, `saturn`, `kepler`, `mars`) |
| `logo`           | `object`            | Logo URLs for dark and light modes                                                                                          |
| `head`           | `object`            | Custom scripts, styles, meta tags, and links                                                                                |
| `routing`        | `object`            | URL redirects configuration                                                                                                 |
| `colorScheme`    | `object`            | Light/dark mode appearance settings. See [Site](site-config.md#color-scheme)                                                |
| `layout`         | `object`            | Global layout options including search configuration. See [Site](site-config.md#layout)                                     |
| `agent`          | `object`            | Ask AI button settings. See [Ask AI](ask-ai.md)                                                                             |
| `footer`         | `object`            | Custom HTML footer. See [Site](site-config.md#footer)                                                                       |
| `rss`            | `object` or `array` | RSS feeds for changelog-style pages. See [Site](site-config.md#rss)                                                         |
| `contentSignals` | `object` or `false` | Search and AI crawler preferences for `robots.txt`. See [Site](site-config.md#content-signals)                              |

### Publishing

When your project is connected to a GitHub or Bitbucket repository, three root properties control when Scalar publishes. The toggles under **Settings → Git Sync** in the dashboard read and write these same properties, so a change in either place shows up in the other.

```json
{
  "publishOnMerge": true,
  "publishPreviews": true,
  "pullRequestComments": true
}
```

| Property              | Type      | Default | Description                                                                                                                      |
| --------------------- | --------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `publishOnMerge`      | `boolean` | `true`  | Publish the live site when commits land on the tracked branch. See [Automatic Deployment](../deployment/automatic-deployment.md) |
| `publishPreviews`     | `boolean` | `false` | Build a preview deployment for every pull request. See [Preview Deployments](../deployment/preview-deployments.md)               |
| `pullRequestComments` | `boolean` | `false` | Post the preview URL as a comment on each pull request                                                                           |

If a property is missing from the file, Scalar falls back to the setting stored on the repository connection. The tracked branch itself is set in the dashboard, not in `scalar.config.json`.

### ruleset

Lint every OpenAPI route with a [Spectral ruleset](../../registry/rules.md), and optionally block publishing when it finds problems. Point at a ruleset file in your repository, or at a ruleset in your team's registry:

```json
{
  "ruleset": {
    "filepath": "rules/spectral.yaml",
    "blockPublishOn": "error"
  }
}
```

```json
{
  "ruleset": {
    "namespace": "acme",
    "slug": "api-guidelines",
    "version": "1.2.0"
  }
}
```

| Property         | Type      | Description                                                                                                                         |
| ---------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `filepath`       | `string`  | Path to a Spectral ruleset file, relative to the configuration root                                                                 |
| `namespace`      | `string`  | Namespace of the ruleset in your team registry                                                                                      |
| `slug`           | `string`  | Slug of the ruleset in your team registry                                                                                           |
| `version`        | `string`  | Version of the ruleset in your team registry                                                                                        |
| `disableSync`    | `boolean` | When `filepath` is set alongside registry coordinates, do not publish the file to the registry each time the docs publish           |
| `blockPublishOn` | `string`  | Lowest severity that blocks publishing: `error`, `warning`, `info`, `hint`, or `none`. Omit it to use the registry ruleset's policy |

An OpenAPI route can set its own `ruleset`. Its keys override the project-level ones one at a time, so a route can change `blockPublishOn` and keep the default ruleset.

### navigation

For detailed navigation configuration, see [Navigation](navigation.md).

## Full example

Here is a more complete example showing common configuration options:

```json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "info": {
    "title": "Acme API Documentation",
    "description": "Everything you need to integrate with Acme"
  },
  "assetsDir": "docs/assets",
  "publishOnMerge": true,
  "publishPreviews": true,
  "pullRequestComments": true,
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
      { "type": "link", "title": "Dashboard", "to": "https://dashboard.example.com" }
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
