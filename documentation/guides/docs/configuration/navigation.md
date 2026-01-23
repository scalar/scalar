# Navigation

The navigation configuration defines the structure and content of your documentation sidebar. You can organize your content using pages, API references, groups, and external links to create a clear and intuitive navigation experience for your users.

All navigation is configured within the `navigation.routes` object in your `scalar.config.json` file. Each route is defined by its URL path as the key and a configuration object as the value.

**Example**

```json
// scalar.config.json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
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

## Header

The `navigation.header` array defines links that appear in the top navigation bar of your documentation site. These are typically used for authentication links, external resources, or call-to-action buttons.

### Example

```json
// scalar.config.json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "navigation": {
    "header": [
      {
        "title": "Log in",
        "url": "https://dashboard.scalar.com/login"
      },
      {
        "title": "Register",
        "style": "button",
        "icon": "phosphor/regular/user-plus",
        "newTab": true,
        "url": "https://dashboard.scalar.com/register"
      }
    ],
    "routes": {
      // ...
    }
  }
}
```

### Properties

| Property | Type                 | Required | Description                           |
| -------- | -------------------- | -------- | ------------------------------------- |
| `title`  | `string`             | Yes      | The display text for the header link  |
| `url`    | `string`             | Yes      | The URL the link points to            |
| `style`  | `"button" \| "link"` | No       | Display style (defaults to `"link"`)  |
| `icon`   | `string`             | No       | An icon to display next to the link   |
| `newTab` | `boolean`            | No       | Whether to open the link in a new tab |

## Sidebar

The `navigation.sidebar` array defines links that appear at the bottom of the sidebar navigation. These are useful for adding authentication links, support resources, or other important links that should be easily accessible from any page.

### Example

```json
// scalar.config.json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "navigation": {
    "sidebar": [
      {
        "title": "Log in",
        "url": "https://dashboard.scalar.com/login",
        "style": "button",
        "newTab": true
      }
    ],
    "routes": {
      // ...
    }
  }
}
```

### Properties

| Property | Type                 | Required | Description                           |
| -------- | -------------------- | -------- | ------------------------------------- |
| `title`  | `string`             | Yes      | The display text for the sidebar link |
| `url`    | `string`             | Yes      | The URL the link points to            |
| `style`  | `"button" \| "link"` | No       | Display style (defaults to `"link"`)  |
| `newTab` | `boolean`            | No       | Whether to open the link in a new tab |

## Tabs

The `navigation.tabs` array defines tabs that appear in the navigation area. Tabs provide a way to organize and highlight specific sections of your documentation, such as API references, that you want users to access quickly.

### Example

```json
// scalar.config.json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "navigation": {
    "tabs": [
      {
        "title": "API",
        "path": "/api",
        "icon": "phosphor/regular/plug"
      }
    ],
    "routes": {
      // ...
    }
  }
}
```

### Properties

| Property | Type     | Required | Description                        |
| -------- | -------- | -------- | ---------------------------------- |
| `title`  | `string` | Yes      | The display text for the tab       |
| `path`   | `string` | Yes      | The URL path the tab links to      |
| `icon`   | `string` | No       | An icon to display next to the tab |

### Multiple Tabs

You can define multiple tabs to provide quick access to different sections:

```json
"tabs": [
  {
    "title": "API",
    "path": "/tools/api",
    "icon": "phosphor/regular/plug"
  },
  {
    "title": "SDKs",
    "path": "/products/sdks",
    "icon": "phosphor/regular/package"
  }
]
```

## Pages

Pages render markdown content from files in your repository. They are the most common route type and form the foundation of your documentation.

```json
"/getting-started": {
  "type": "page",
  "title": "Getting Started",
  "filepath": "docs/getting-started.md"
}
```

### Properties

| Property      | Type     | Required | Description                         |
| ------------- | -------- | -------- | ----------------------------------- |
| `type`        | `"page"` | Yes      | Must be `"page"`                    |
| `title`       | `string` | Yes      | The display text in the navigation  |
| `filepath`    | `string` | Yes      | Relative path to the markdown file  |
| `description` | `string` | No       | A description for SEO and metadata  |
| `icon`        | `string` | No       | An icon to display next to the page |
| `layout`      | `object` | No       | Layout configuration options        |

### Layout Options

Pages support layout configuration to customize how they are displayed:

```json
"/introduction": {
  "type": "page",
  "title": "Introduction",
  "filepath": "docs/introduction.md",
  "layout": {
    "toc": false,
    "sidebar": false
  }
}
```

| Option    | Type      | Default | Description                            |
| --------- | --------- | ------- | -------------------------------------- |
| `toc`     | `boolean` | `true`  | Whether to show the table of contents  |
| `sidebar` | `boolean` | `true`  | Whether to show the sidebar navigation |

### Example with All Options

```json
"/pricing": {
  "type": "page",
  "title": "Pricing",
  "filepath": "documentation/guides/pricing.md",
  "description": "Explore our pricing plans",
  "icon": "phosphor/regular/coin-vertical",
  "layout": {
    "toc": false
  }
}
```

## API References

Scalar supports three ways to generate API references from OpenAPI documents:

1. using a local file,
2. the [Scalar Registry](../../registry/getting-started.md), or
3. remote URLs.

### 1. Files

Reference an OpenAPI file stored in your repository by specifying a relative path from your configuration root:

```json
{
  "/api": {
    "type": "openapi",
    "title": "My API",
    "filepath": "docs/api-reference/openapi.yaml",
    "icon": "phosphor/regular/plug"
  }
}
```

### 2. Scalar Registry

Upload your OpenAPI document to the [Scalar Registry](../../registry/getting-started.md), then reference it by namespace and slug:

```bash
scalar auth login
scalar registry publish ./openapi.yaml \
  --namespace my-organization \
  --slug my-api
```

```json
"/api": {
  "type": "openapi",
  "title": "My API",
  "namespace": "my-organization",
  "slug": "my-api",
  // "version": "1.0.0"
}
```

### 3. URL

Fetch an OpenAPI document from a remote URL. The document is fetched on each page load, keeping your documentation in sync with your live API:

```json
"/api": {
  "type": "openapi",
  "title": "My API",
  "url": "https://example.com/openapi.json"
}
```

### Display Modes

- `folder` (default): Shows a single level of links with a folder icon
- `flat` Shows a single level of links with a section title
- `nested` Shows a sub-sidebar with breadcrumbs for deep navigation

## Groups

Groups allow you to organize related pages, API references, and links into collapsible sections in your navigation. They can be nested to create multi-level hierarchies.

```json
"/products": {
  "type": "group",
  "title": "Products",
  "mode": "flat",
  "icon": "phosphor/regular/package",
  "children": {
    "/docs": {
      "type": "page",
      "title": "Documentation",
      "filepath": "docs/documentation.md"
    },
    "/api": {
      "type": "openapi",
      "title": "API Reference",
      "filepath": "openapi.yaml"
    }
  }
}
```

### Properties

| Property   | Type                             | Required | Description                          |
| ---------- | -------------------------------- | -------- | ------------------------------------ |
| `type`     | `"group"`                        | Yes      | Must be `"group"`                    |
| `title`    | `string`                         | Yes      | The display text in the navigation   |
| `children` | `object`                         | Yes      | An object containing nested routes   |
| `mode`     | `"flat" \| "nested" \| "folder"` | No       | How the group is displayed           |
| `icon`     | `string`                         | No       | An icon to display next to the group |

### Display Modes

Groups support three display modes:

- **`flat`**: Shows a section title with child links directly beneath it. Ideal for top-level categories.
- **`nested`**: Shows a sub-sidebar with breadcrumbs for deep navigation. Good for complex documentation structures.
- **`folder`** (default): Shows a single level of links with a folder icon. Suitable for simple groupings.

### Nesting Groups

Groups can contain other groups to create deep navigation hierarchies:

```json
"/products": {
  "type": "group",
  "title": "Products",
  "mode": "flat",
  "children": {
    "/docs": {
      "type": "group",
      "title": "Scalar Docs",
      "mode": "nested",
      "icon": "phosphor/regular/book",
      "children": {
        "getting-started": {
          "type": "page",
          "title": "Getting Started",
          "filepath": "docs/getting-started.md"
        },
        "configuration": {
          "type": "group",
          "title": "Configuration",
          "mode": "flat",
          "children": {
            "navigation": {
              "type": "page",
              "title": "Navigation",
              "filepath": "docs/configuration/navigation.md"
            }
          }
        }
      }
    }
  }
}
```

## Links

Links allow you to add external URLs to your navigation. Unlike pages that render content from files, links redirect users to external resources.

```json
"/github": {
  "type": "link",
  "title": "GitHub",
  "url": "https://github.com/scalar/scalar",
  "icon": "phosphor/regular/github-logo"
}
```

### Properties

| Property | Type     | Required | Description                         |
| -------- | -------- | -------- | ----------------------------------- |
| `type`   | `"link"` | Yes      | Must be `"link"`                    |
| `title`  | `string` | Yes      | The display text in the navigation  |
| `url`    | `string` | Yes      | The external URL to link to         |
| `icon`   | `string` | No       | An icon to display next to the link |

### Example

Here is an example of a group containing multiple links:

```json
"/contact": {
  "type": "group",
  "title": "Let's Chat",
  "mode": "flat",
  "children": {
    "/github": {
      "title": "GitHub",
      "icon": "phosphor/regular/github-logo",
      "url": "https://github.com/scalar/scalar",
      "type": "link"
    },
    "/email": {
      "title": "Support",
      "icon": "phosphor/regular/envelope",
      "url": "mailto:support@scalar.com",
      "type": "link"
    },
    "/demo": {
      "title": "Book a Demo",
      "icon": "phosphor/regular/monitor",
      "url": "https://scalar.cal.com/scalar/chat-with-scalar",
      "type": "link"
    }
  }
}
```

Links can also be used for `mailto:` URLs to create email links, or any other valid URL scheme.
