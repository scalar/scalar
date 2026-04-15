---
name: scalar-docs
description: Skill for writing and updating scalar.config.json — Scalar Docs configuration reference for users and LLMs.
---

# Scalar Docs Configuration Skill — scalar.config.json

Reference for writing and updating `scalar.config.json`, the central configuration file for [Scalar Docs](https://docs.scalar.com). Use this when creating, editing, or validating Docs configuration for any project.

## Overview

- **File**: `scalar.config.json` (or `scalar.config.json5`)
- **Location**: Repository root by default; path can be overridden in [Scalar Dashboard](https://dashboard.scalar.com/)
- **Schema**: `https://registry.scalar.com/@scalar/schemas/config` — enables autocomplete in VS Code/Cursor when `json.schemaDownload.enable` is true
- **Version**: Use `"scalar": "2.0.0"` for the latest format

## Quick Start

Create a minimal config:

```bash
npx @scalar/cli project init
```

Minimal structure:

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

Validate config: `npx @scalar/cli project check-config`

---

## Root Properties

| Property     | Type     | Description                                                                 |
| ------------ | -------- | --------------------------------------------------------------------------- |
| `$schema`    | `string` | JSON Schema URL for editor autocomplete and validation                      |
| `scalar`     | `string` | Configuration version. Use `"2.0.0"`                                       |
| `info`       | `object` | Project metadata (title, description)                                       |
| `navigation` | `object` | Navigation structure (header, routes, sidebar, tabs)                        |
| `siteConfig` | `object` | Site-level settings (domain, theme, head, logo, routing)                    |
| `assetsDir`  | `string` | Relative path to assets folder from config root                             |

---

## info

Project metadata displayed across the site:

```json
{
  "info": {
    "title": "My Documentation",
    "description": "Comprehensive guides for our API"
  }
}
```

---

## navigation

All navigation is in `navigation.routes`. Each route key is the URL path; the value is a config object.

### navigation.header

Links in the top bar. Use `type: "spacer"` to push items before it left and after it right.

```json
"header": [
  { "type": "link", "title": "Home", "to": "/" },
  { "type": "spacer" },
  { "type": "link", "title": "Log in", "to": "https://dashboard.example.com/login", "newTab": true },
  { "type": "link", "title": "Register", "style": "button", "icon": "phosphor/regular/user-plus", "to": "https://...", "newTab": true }
]
```

Properties: `title`, `type` (`"link"` | `"spacer"`), `to`, `style` (`"button"` | `"link"`), `icon`, `newTab`

### navigation.sidebar

Links at the bottom of the sidebar:

```json
"sidebar": [
  { "title": "Log in", "url": "https://...", "style": "button", "newTab": true }
]
```

### navigation.tabs

Tabs for quick access to sections:

```json
"tabs": [
  { "title": "API", "path": "/api", "icon": "phosphor/regular/plug" }
]
```

### Route Types

#### Page (`type: "page"`)

Markdown/MDX content from a file:

```json
"/getting-started": {
  "type": "page",
  "title": "Getting Started",
  "filepath": "docs/getting-started.md",
  "description": "Optional SEO description",
  "icon": "phosphor/regular/rocket",
  "layout": { "toc": true, "sidebar": true }
}
```

Layout: `toc` (default `true`), `sidebar` (default `true`).

#### OpenAPI (`type: "openapi"`)

API reference from file, Registry, or URL:

**File:**
```json
"/api": {
  "type": "openapi",
  "title": "My API",
  "filepath": "docs/api-reference/openapi.yaml",
  "icon": "phosphor/regular/plug"
}
```

**Registry:**
```json
"/api": {
  "type": "openapi",
  "title": "My API",
  "namespace": "my-organization",
  "slug": "your-api"
}
```

**URL:**
```json
"/api": {
  "type": "openapi",
  "title": "My API",
  "url": "https://example.com/openapi.json"
}
```

Display modes: `folder` (default), `flat`, `nested`.

API Reference options (authentication, theme, etc.) go in a `config` object — same options as the [API Reference configuration](https://docs.scalar.com/configuration).

#### Group (`type: "group"`)

Collapsible section with children:

```json
"/products": {
  "type": "group",
  "title": "Products",
  "mode": "flat",
  "icon": "phosphor/regular/package",
  "children": {
    "/docs": { "type": "page", "title": "Documentation", "filepath": "docs/documentation.md" },
    "/api": { "type": "openapi", "title": "API Reference", "filepath": "openapi.yaml" }
  }
}
```

Modes: `flat`, `nested`, `folder` (default).

#### Link (`type: "link"`)

External URL:

```json
"/github": {
  "type": "link",
  "title": "GitHub",
  "url": "https://github.com/org/repo",
  "icon": "phosphor/regular/github-logo"
}
```

---

## siteConfig

### branding

**Logo** — single URL or per mode:

```json
"logo": "https://example.com/logo.svg"
// or
"logo": {
  "darkMode": "https://example.com/logo-dark.svg",
  "lightMode": "https://example.com/logo-light.svg"
}
```

**Theme** — one of: `default`, `alternate`, `moon`, `purple`, `solarized`, `bluePlanet`, `deepSpace`, `saturn`, `kepler`, `mars`, `laserwave`, `none`

```json
"theme": "purple"
```

### domain

**Subdomain** (free): `https://<subdomain>.apidocumentation.com`

```json
"subdomain": "your-docs"
```

**Custom domain** (Pro): `https://docs.example.com`

```json
"customDomain": "docs.example.com"
```

**Subpath** — for multiple projects on same domain:

```json
"subpath": "/guides"
```

### layout

```json
"layout": {
  "toc": true,
  "header": true
}
```

### head

Inject scripts, styles, meta tags, and links:

```json
"head": {
  "title": "My Documentation",
  "meta": [
    { "name": "description", "content": "API documentation" },
    { "property": "og:image", "content": "https://example.com/og.png" }
  ],
  "styles": [{ "path": "docs/assets/custom.css", "tagPosition": "head" }],
  "scripts": [{ "path": "docs/assets/analytics.js", "tagPosition": "bodyClose" }],
  "links": [{ "rel": "icon", "href": "/favicon.png" }]
}
```

For `scripts` and `styles`: path relative to config root. For `links` (favicon): root-relative (`/favicon.png`).

`tagPosition`: `"head"` | `"bodyOpen"` | `"bodyClose"`.

### footer

```json
"footer": {
  "filepath": "docs/footer.html",
  "belowSidebar": true
}
```

### routing

**Redirects:**

```json
"routing": {
  "redirects": [
    { "from": "/old-path", "to": "/new-path" },
    { "from": "/old-path/:wildcard", "to": "/new-path" },
    { "from": "/old-path/:pathMatch(.*)*", "to": "/new-path" }
  ]
}
```

**Path patterns:**

```json
"routing": {
  "guidePathPattern": "/docs/:slug",
  "referencePathPattern": "/api/:slug"
}
```

---

## assetsDir

Relative path to assets folder. Assets are served from site root.

```json
"assetsDir": "docs/assets"
```

In Markdown: `![Image](/screenshot.png)` or `![Image](../assets/screenshot.png)`.

In `siteConfig.head`: use full path relative to config root for scripts/styles; root-relative for links.

---

## Migration from Docs 1.0

Docs 1.0 used `guides` and `references` arrays. Docs 2.0 uses `navigation.routes`.

Upgrade:

```bash
npx @scalar/cli project upgrade
```

Check result:

```bash
npx @scalar/cli project preview
```

---

## CLI Commands

| Command | Description |
| ------- | ----------- |
| `npx @scalar/cli project init` | Create scalar.config.json |
| `npx @scalar/cli project check-config` | Validate config |
| `npx @scalar/cli project preview` | Local preview (port 7971) |
| `npx @scalar/cli project publish` | Publish from local files |
| `npx @scalar/cli project publish --github` | Publish from linked GitHub repo |
| `npx @scalar/cli project upgrade` | Migrate from Docs 1.0 |

---

## Common Patterns

**Multi-project on same domain:** Same `customDomain` or `subdomain`, different `subpath` per repo.

**MDX:** Use `.mdx` extension in `filepath`; same structure as Markdown pages.

**Hide TOC on a page:** `"layout": { "toc": false }` on that route.

**API Reference auth:** Add `config` under the openapi route with `authentication` (same options as API Reference config).

**Custom domain DNS:** CNAME host `docs` → `dns.scalar.com` (DNS-only, no proxy).

---

## References

- [Docs Getting Started](https://docs.scalar.com/products/docs/getting-started)
- [Docs Starter Kit](https://github.com/scalar/starter)
- [Configuration reference](https://docs.scalar.com/products/docs/configuration/scalar.config.json)
- [Navigation](https://docs.scalar.com/products/docs/configuration/navigation)
- [Site config](https://docs.scalar.com/products/docs/configuration/site-config)
- [Themes](https://docs.scalar.com/products/docs/configuration/themes)
- [Domains](https://docs.scalar.com/products/docs/configuration/domains)
- [Redirects](https://docs.scalar.com/products/docs/configuration/redirects)
