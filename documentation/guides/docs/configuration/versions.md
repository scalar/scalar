# Versions

The `versions` property in your `scalar.config.json` allows you to create multiple versions of your documentation. This is useful for maintaining documentation for different API versions, product releases, or major updates while keeping everything organized under a single domain.

When you use the `versions` property, each version gets its own complete navigation structure, and users can switch between versions using a version selector in the UI.

## Basic structure

Instead of using the `navigation` property at the root level, you use `versions` which is an object where each key is the version identifier (displayed to users) and each value is a complete navigation configuration:

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "info": {
    "title": "My API Documentation"
  },
  "versions": {
    "v2": {
      "title": "Version 2.0",
      "routes": {
        "/": {
          "type": "page",
          "title": "Introduction",
          "filepath": "docs/v2/introduction.md"
        },
        "/api": {
          "type": "openapi",
          "title": "API Reference",
          "filepath": "docs/v2/openapi.yaml"
        }
      }
    },
    "v1": {
      "title": "Version 1.0",
      "routes": {
        "/": {
          "type": "page",
          "title": "Introduction",
          "filepath": "docs/v1/introduction.md"
        },
        "/api": {
          "type": "openapi",
          "title": "API Reference",
          "filepath": "docs/v1/openapi.yaml"
        }
      }
    }
  }
}
```

## Version configuration

Each version entry supports the same properties as a `navigation` object:

| Property  | Type     | Required | Description                                        |
| --------- | -------- | -------- | -------------------------------------------------- |
| `title`   | `string` | No       | Display title for the version in the selector      |
| `routes`  | `object` | Yes      | Navigation routes for this version                 |
| `header`  | `array`  | No       | Header links for this version                      |
| `sidebar` | `array`  | No       | Sidebar footer links for this version              |
| `tabs`    | `array`  | No       | Navigation tabs for this version                   |

The version key (e.g., `"v2"`, `"v1"`) is what users will see in the version selector dropdown. The optional `title` property can provide a more descriptive label.

## Example with shared and version-specific content

You can organize your documentation to share common pages across versions while keeping version-specific API references separate:

```json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "info": {
    "title": "Acme API"
  },
  "siteConfig": {
    "subdomain": "acme-api",
    "theme": "default"
  },
  "versions": {
    "v2.0": {
      "title": "Version 2.0 (Latest)",
      "tabs": [
        {
          "title": "API Reference",
          "path": "/api",
          "icon": "phosphor/regular/plug"
        }
      ],
      "routes": {
        "/": {
          "type": "group",
          "title": "Getting Started",
          "mode": "flat",
          "children": {
            "": {
              "type": "page",
              "title": "Introduction",
              "filepath": "docs/introduction.md"
            },
            "/quickstart": {
              "type": "page",
              "title": "Quickstart",
              "filepath": "docs/quickstart.md"
            },
            "/authentication": {
              "type": "page",
              "title": "Authentication",
              "filepath": "docs/v2/authentication.md"
            }
          }
        },
        "/api": {
          "type": "openapi",
          "title": "API Reference",
          "filepath": "docs/v2/openapi.yaml",
          "mode": "nested"
        }
      }
    },
    "v1.0": {
      "title": "Version 1.0 (Legacy)",
      "tabs": [
        {
          "title": "API Reference",
          "path": "/api",
          "icon": "phosphor/regular/plug"
        }
      ],
      "routes": {
        "/": {
          "type": "group",
          "title": "Getting Started",
          "mode": "flat",
          "children": {
            "": {
              "type": "page",
              "title": "Introduction",
              "filepath": "docs/introduction.md"
            },
            "/quickstart": {
              "type": "page",
              "title": "Quickstart",
              "filepath": "docs/v1/quickstart.md"
            },
            "/authentication": {
              "type": "page",
              "title": "Authentication",
              "filepath": "docs/v1/authentication.md"
            }
          }
        },
        "/api": {
          "type": "openapi",
          "title": "API Reference",
          "filepath": "docs/v1/openapi.yaml",
          "mode": "nested"
        }
      }
    }
  }
}
```

## Version ordering

Versions appear in the selector in the order they are defined in the configuration. Place your latest or most commonly used version first.

## URL structure

When using versions, the URL structure includes the version identifier:

- `https://your-docs.apidocumentation.com/v2/` — Introduction page for v2
- `https://your-docs.apidocumentation.com/v2/api/users` — Users endpoint in v2
- `https://your-docs.apidocumentation.com/v1/` — Introduction page for v1

The first version in your configuration is the default when users visit the root URL.

## When to use versions vs. multiple projects

Use **versions** when:

- You have multiple versions of the same API or product
- Users need to switch between versions frequently
- The documentation structure is similar across versions

Use **multiple projects** (separate repositories with `subpath`) when:

- You have completely different products or APIs
- The documentation structure is significantly different
- Teams manage documentation independently

## Migration from single navigation

To convert an existing configuration with `navigation` to use `versions`:

1. Rename `navigation` to `versions`
2. Wrap your existing navigation configuration in a version key
3. Add a `title` to describe the version

**Before:**

```json
{
  "scalar": "2.0.0",
  "navigation": {
    "routes": {
      "/": { "type": "page", "title": "Intro", "filepath": "docs/intro.md" }
    }
  }
}
```

**After:**

```json
{
  "scalar": "2.0.0",
  "versions": {
    "v1": {
      "title": "Version 1.0",
      "routes": {
        "/": { "type": "page", "title": "Intro", "filepath": "docs/intro.md" }
      }
    }
  }
}
```

You can then add additional versions as needed.
