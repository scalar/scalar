# Navigation

The navigation configuration defines the structure and content of your documentation sidebar. You can organize your content using pages, API references, groups, and external links to create a clear and intuitive navigation experience for your users.

All navigation is configured within the `navigation.routes` object in your `scalar.config.json` file. Each route is defined by its URL path as the key and a configuration object as the value.

**Example**

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
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

The `navigation.header` array defines the items that appear in the top navigation bar of your documentation site. These are typically used for authentication links, external resources, or call-to-action buttons.

The header renders whenever you declare `navigation.header`, and it is where your [logo](site-config.md#logo) appears. To override that, set `header` in your [site layout options](site-config.md#layout), `true` to always show the header or `false` to always hide it. You can also override the header visibility per page in its [layout options](#layout-options).

### Example

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "navigation": {
    "header": [
      {
        "type": "link",
        "title": "Home",
        "to": "/"
      },
      {
        "type": "link",
        "title": "Log in",
        "align": "end",
        "to": "https://dashboard.scalar.com/login"
      },
      {
        "type": "link",
        "title": "Register",
        "style": "button",
        "icon": "phosphor/regular/user-plus",
        "align": "end",
        "newTab": true,
        "to": "https://dashboard.scalar.com/register"
      }
    ],
    "routes": {
      // ...
    }
  }
}
```

### Alignment

The header lays out in three regions, and each item picks its region with `align`:

| Value             | Where the item sits                                |
| ----------------- | -------------------------------------------------- |
| `start` (Default) | Next to your logo                                  |
| `center`          | In the middle of the header next to the search bar |
| `end`             | At the far end of the header opposite your logo    |

Alignment is a property of top-level items. Items nested inside a [group](#group-dropdowns) ignore the `align` property.

### Item types

The header supports three types of item.

#### Header links

A link to a page on your site or to an external URL.

```json
{
  "type": "link",
  "title": "Log in",
  "align": "end",
  "to": "https://dashboard.scalar.com/login"
}
```

| Property | Type                              | Required | Description                                                     |
| -------- | --------------------------------- | -------- | --------------------------------------------------------------- |
| `type`   | `"link"`                          | Yes      | Must be `"link"`                                                |
| `title`  | `string`                          | Yes      | The display text for the header link                            |
| `to`     | `string`                          | Yes      | The route path or URL the link points to                        |
| `align`  | `"start" \| "center" \| "end"`    | No       | Which region the link sits in (defaults to `"start"`)           |
| `style`  | `"text" \| "button"`              | No       | Display style (defaults to `"text"`)                            |
| `icon`   | `string`                          | No       | An icon to display next to the link. Accepts a built-in [icon key](../components/icons.mdx#built-in-icons) (Phosphor or Simple Icons) or a [custom URL](../components/icons.mdx#custom-icons). |
| `newTab` | `boolean`                         | No       | Whether to open the link in a new tab (defaults to `false`)     |

#### Group dropdowns

A group collects several links into a single dropdown.

```json
{
  "type": "group",
  "title": "Resources",
  "icon": "phosphor/regular/books",
  "children": [
    {
      "type": "link",
      "title": "API Reference",
      "to": "/reference"
    },
    {
      "type": "link",
      "title": "Changelog",
      "to": "/changelog"
    }
  ]
}
```

| Property   | Type                           | Required | Description                                            |
| ---------- | ------------------------------ | -------- | ------------------------------------------------------ |
| `type`     | `"group"`                      | Yes      | Must be `"group"`                                      |
| `title`    | `string`                       | Yes      | The display text for the dropdown                      |
| `children` | `array`                        | Yes      | The links inside the dropdown                          |
| `align`    | `"start" \| "center" \| "end"` | No       | Which region the group sits in (defaults to `"start"`) |
| `icon`     | `string`                       | No       | An icon to display next to the group. Accepts a built-in [icon key](../components/icons.mdx#built-in-icons) (Phosphor or Simple Icons) or a [custom URL](../components/icons.mdx#custom-icons). |

`children` accepts link items only. Each child takes the same properties as a [header link](#header-links).

#### Version selector

Places the [version](versions.md) dropdown at a specific position in the header.

```json
{
  "type": "version-selector",
  "align": "end"
}
```

| Property | Type                           | Required | Description                                               |
| -------- | ------------------------------ | -------- | --------------------------------------------------------- |
| `type`   | `"version-selector"`           | Yes      | Must be `"version-selector"`                              |
| `align`  | `"start" \| "center" \| "end"` | No       | Which region the selector sits in (defaults to `"start"`) |

The selector only renders when your project defines more than one version. If you do not add this item, it renders next to your logo.

## Sidebar

The `navigation.sidebar` array defines links that appear in the footer of the sidebar navigation. These are useful for adding authentication links, support resources, or other important links that should be easily accessible from any page.

### Example

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "navigation": {
    "sidebar": [
      {
        "title": "Log in",
        "to": "https://dashboard.scalar.com/login",
        "icon": "phosphor/regular/sign-in"
      }
    ],
    "routes": {
      // ...
    }
  }
}
```

### Properties

| Property | Type                 | Required | Description                              |
| -------- | -------------------- | -------- | ---------------------------------------- |
| `title`  | `string`             | Yes      | The display text for the sidebar link    |
| `to`     | `string`             | Yes      | The route path or URL the link points to |
| `icon`   | `string`             | No       | An icon to display next to the link. Accepts a built-in [icon key](../components/icons.mdx#built-in-icons) (Phosphor or Simple Icons) or a [custom URL](../components/icons.mdx#custom-icons). |
| `newTab` | `boolean`            | No       | Whether to open the link in a new tab    |

## Tabs

The `navigation.tabs` array defines tabs that appear in the navigation area. Tabs provide a way to organize and highlight specific sections of your documentation, such as API references, that you want users to access quickly.

Tabs and a header work together, and you do not need both. If you use tabs without a header, your [logo](site-config.md#logo) renders in the tab bar.

### Example

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "navigation": {
    "tabs": [
      {
        "title": "API",
        "to": "/api",
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

| Property | Type     | Required | Description                            |
| -------- | -------- | -------- | -------------------------------------- |
| `title`  | `string` | Yes      | The display text for the tab           |
| `to`     | `string` | Yes      | The route path or URL the tab links to |
| `icon`   | `string` | No       | An icon to display next to the tab. Accepts a built-in [icon key](../components/icons.mdx#built-in-icons) (Phosphor or Simple Icons) or a [custom URL](../components/icons.mdx#custom-icons). |

### Multiple Tabs

You can define multiple tabs to provide quick access to different sections:

```json
"tabs": [
  {
    "title": "API",
    "to": "/tools/api",
    "icon": "phosphor/regular/plug"
  },
  {
    "title": "SDKs",
    "to": "/products/sdk-generator",
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

| Property        | Type      | Required | Description                                               |
| --------------- | --------- | -------- | --------------------------------------------------------- |
| `type`          | `"page"`  | Yes      | Must be `"page"`                                          |
| `title`         | `string`  | No       | The display text in the navigation                        |
| `filepath`      | `string`  | Yes      | Relative path to the markdown file                        |
| `description`   | `string`  | No       | A description for SEO and metadata                        |
| `icon`          | `string`  | No       | An icon to display next to the page. Accepts a built-in [icon key](../components/icons.mdx#built-in-icons) (Phosphor or Simple Icons) or a [custom URL](../components/icons.mdx#custom-icons). |
| `showInSidebar` | `boolean` | No       | Whether to show the page in the sidebar (defaults `true`) |
| `hidden`        | `boolean` | No       | Fully hide the page: no sidebar entry, no sitemap entry, and `noindex` (defaults `false`) |
| `layout`        | `object`  | No       | Layout configuration options                              |

### Hidden pages

There are two ways to keep a page out of your navigation, depending on whether the page should still be discoverable by search engines.

#### Truly hidden pages with `hidden`

Set `hidden` to `true` to fully hide a page. The page is:

- removed from the sidebar navigation,
- excluded from the generated `sitemap.xml`, and
- rendered with a `<meta name="robots" content="noindex">` tag so search engines do not index it.

The page stays reachable at its URL, which makes it a good fit for unlisted content like internal notes, early drafts, or pages you only want to share by direct link.

```json
"/internal-notes": {
  "type": "page",
  "title": "Internal Notes",
  "filepath": "docs/internal-notes.md",
  "hidden": true
}
```

If you need to override the automatic `noindex` for a hidden page, an explicit `robots` meta tag in the page's `head` configuration takes precedence.

Note that the site's `robots.txt` intentionally keeps allowing crawlers: they must be able to fetch the page to see the `noindex` tag, and URLs blocked by `robots.txt` can still show up in search results (title-only) when external sites link to them.

#### Sidebar-only hiding with `showInSidebar`

Set `showInSidebar` to `false` to hide a page from the sidebar navigation only. This is purely cosmetic: the page remains in the sitemap and stays indexable by search engines. This is useful for special pages like landing pages, promotional content, or forms that should not clutter the main navigation but should still be found through search.

```json
"/enterprise": {
  "type": "page",
  "title": "Enterprise",
  "filepath": "docs/enterprise.md",
  "showInSidebar": false
}
```

Users can still navigate to `/enterprise` directly, but the page will not appear in the sidebar. To make a page visible in the sidebar again, remove the `showInSidebar` property or set it to `true`.

In short: use `hidden: true` when the page should be invisible to search engines, and `showInSidebar: false` when it should only be invisible in the sidebar.

### Layout Options

Pages support layout configuration to customize how they are displayed. These options override the site-wide defaults in [`siteConfig.layout`](site-config.md#layout) for a single page:

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

| Option        | Type      | Default | Description                              |
| ------------- | --------- | ------- | ---------------------------------------- |
| `toc`         | `boolean` | `true`  | Whether to show the table of contents    |
| `sidebar`     | `boolean` | `true`  | Whether to show the sidebar navigation   |
| `tabs`        | `boolean` | `true`  | Whether to show the navigation tabs      |
| `header`      | `boolean` | —       | Whether to show the header. Falls back to the site-level [`layout.header`](site-config.md#layout) option |
| `pageTitle`   | `boolean` | `true`  | Whether to show the page title           |
| `pageActions` | `boolean` | `true`  | Whether to show page actions             |
| `search`      | `object`  | —       | Search configuration for this page       |

### Search Options

You can configure the search behavior on a per-page basis:

```json
"/api-reference": {
  "type": "page",
  "title": "API Reference",
  "filepath": "docs/api-reference.md",
  "layout": {
    "search": {
      "enabled": true,
      "position": "sidebar"
    }
  }
}
```

| Option     | Type                      | Default    | Description                             |
| ---------- | ------------------------- | ---------- | --------------------------------------- |
| `enabled`  | `boolean`                 | `true`     | Enable or disable search for this page  |
| `position` | `"header" \| "sidebar"`  | `"header"` | The position of the search bar          |

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

Scalar supports three ways to generate API references:

1. using a local file,
2. the [Registry](../../registry/index.md), or
3. remote URLs.

An API reference entry accepts `type: "openapi"` or `type: "asyncapi"`. Use whichever matches your document — the format is detected automatically.

### 1. Files

Reference an API document stored in your repository by specifying a relative path from your configuration root:

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

### 2. Registry

Upload your API document to the [Registry](../../registry/index.md), then reference it by namespace and slug:

```bash
scalar auth login
scalar registry publish ./openapi.yaml \
  --namespace my-organization \
  --slug your-api
```

```json
"/api": {
  "type": "openapi",
  "title": "My API",
  "namespace": "my-organization",
  "slug": "your-api",
  // "version": "1.0.0"
}
```

When someone updates that API document in the Registry, Scalar republishes any connected Docs project that references it. This keeps your API documentation up to date automatically.

### 3. URL

Fetch an API document from a remote URL. The document is fetched on each page load, keeping your documentation in sync with your live API:

```json
"/api": {
  "type": "openapi",
  "title": "My API",
  "url": "https://example.com/openapi.json"
}
```

### AsyncAPI

To document an event-driven API, use `type: "asyncapi"` and point it at your AsyncAPI document. This works with files, the Registry, or a remote URL, exactly like an `openapi` entry:

```json
"/events": {
  "type": "asyncapi",
  "title": "My Events API",
  "filepath": "docs/api-reference/asyncapi.yaml"
}
```

### Properties

| Property     | Type                             | Required | Description                                                      |
| ------------ | -------------------------------- | -------- | ---------------------------------------------------------------- |
| `type`       | `"openapi" \| "asyncapi"`        | Yes      | Marks the entry as an API reference                              |
| `title`      | `string`                         | No       | The display text in the navigation                               |
| `filepath`   | `string`                         | No       | Relative path to the API document                                |
| `url`        | `string`                         | No       | URL to fetch the API document from                               |
| `namespace`  | `string`                         | No       | Registry namespace (when using Registry)                         |
| `slug`       | `string`                         | No       | Registry slug (when using Registry)                              |
| `version`    | `string`                         | No       | Registry version (when using Registry)                           |
| `icon`       | `string`                         | No       | An icon to display next to the reference. Accepts a built-in [icon key](../components/icons.mdx#built-in-icons) (Phosphor or Simple Icons) or a [custom URL](../components/icons.mdx#custom-icons). |
| `mode`       | `"flat" \| "nested" \| "folder"` | No       | How the API reference is displayed in the sidebar                |
| `singlePage` | `boolean`                        | No       | Render all operations on a single page (defaults to `false`)     |
| `hidden`     | `boolean`                        | No       | Fully hide the API reference and all its generated pages (defaults to `false`) |
| `config`     | `object`                         | No       | API Reference configuration options                              |

### Display Modes

- `folder` (default): Shows a single level of links with a folder icon
- `flat`: Shows a single level of links with a section title
- `nested`: Shows a sub-sidebar with breadcrumbs for deep navigation

### Single Page Mode

By default, Docs creates a separate page for each API operation. Set `singlePage` to `true` to render all operations on a single page instead:

```json
"/api": {
  "type": "openapi",
  "title": "My API",
  "filepath": "docs/api-reference/openapi.yaml",
  "singlePage": true
}
```

This is useful when you want a scrollable, single-page API reference similar to traditional API documentation layouts.

### Hiding an API Reference

Set `hidden` to `true` to fully hide an API reference. The setting cascades to every page generated from the API document — all operation, tag, model, and webhook pages are removed from the sidebar, excluded from `sitemap.xml`, and rendered with a `noindex` meta tag. The pages stay reachable at their URLs, so you can still share them by direct link. See [Hidden pages](#hidden-pages) for details on how `hidden` compares to `showInSidebar`.

```json
"/internal-api": {
  "type": "openapi",
  "title": "Internal API",
  "filepath": "docs/internal-api/openapi.yaml",
  "hidden": true
}
```

### API Reference configuration

When you add an API reference route (`type: "openapi"` or `type: "asyncapi"`) in your navigation, you can pass API Reference options by adding a `config` object. The same options supported by the [API Reference configuration](../../../configuration.md) (e.g. `authentication`, `theme`) can be used here.

Example:

```json
// scalar.config.json
"/api": {
  "type": "openapi",
  "title": "My API",
  "url": "https://example.com/openapi.json",
  "mode": "nested",
  "config": {
    "authentication": {
      "preferredSecurityScheme": "httpBasic",
      "securitySchemes": {
        "httpBasic": {
          "type": "http",
          "scheme": "basic",
          "username": "my-username"
        }
      }
    }
  }
}
```

For all available options, see [Configuration](../../../configuration.md).

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

| Property   | Type                             | Required | Description                                                      |
| ---------- | -------------------------------- | -------- | ---------------------------------------------------------------- |
| `type`     | `"group"`                        | Yes      | Must be `"group"`                                                |
| `title`    | `string`                         | No       | The display text in the navigation                               |
| `children` | `object`                         | Yes      | An object containing nested routes                               |
| `mode`     | `"flat" \| "nested" \| "folder"` | No       | How the group is displayed                                       |
| `icon`     | `string`                         | No       | An icon to display next to the group. Accepts a built-in [icon key](../components/icons.mdx#built-in-icons) (Phosphor or Simple Icons) or a [custom URL](../components/icons.mdx#custom-icons). |
| `page`     | `object`                         | No       | A page to navigate to when clicking the folder (folder mode only) |
| `open`     | `boolean`                        | No       | Whether the folder is expanded by default (folder mode only)     |
| `hidden`   | `boolean`                        | No       | Fully hide the group and everything nested under it (defaults to `false`) |

### Display Modes

Groups support three display modes:

- **`flat`**: Shows a section title with child links directly beneath it. Ideal for top-level categories.
- **`nested`**: Shows a sub-sidebar with breadcrumbs for deep navigation. Good for complex documentation structures.
- **`folder`**: (default): Shows a single level of links with a folder icon. Suitable for simple groupings.

### Hiding Groups

Set `hidden` to `true` on a group to fully hide it along with everything nested under it — child pages, nested groups, and any API references. All affected pages are removed from the sidebar, excluded from `sitemap.xml`, and rendered with a `noindex` meta tag, while remaining reachable at their URLs. See [Hidden pages](#hidden-pages) for details on how `hidden` compares to `showInSidebar`.

This works at both levels: on a top-level route section directly under `navigation.routes` and on a group nested inside another group, with the same cascade to every page underneath. Since a top-level route section has no sidebar row of its own, `hidden` there only affects indexing — and any [tabs](#tabs) or [header links](#header) pointing at that section are configured separately and are not removed automatically.

```json
"/internal": {
  "type": "group",
  "title": "Internal",
  "hidden": true,
  "children": {
    "/runbooks": {
      "type": "page",
      "title": "Runbooks",
      "filepath": "docs/internal/runbooks.md"
    }
  }
}
```

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
      "title": "Docs",
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

### Folder Landing Pages

Folders can have an associated landing page using the `page` property. When a user clicks on the folder title in the sidebar, they navigate to this page instead of just expanding the folder. This is useful for sections that need both an overview page and child pages.

```json
"/company": {
  "type": "group",
  "title": "Company",
  "mode": "folder",
  "icon": "phosphor/regular/building",
  "page": {
    "type": "page",
    "title": "About Us",
    "filepath": "docs/company/index.md"
  },
  "children": {
    "/team": {
      "type": "page",
      "title": "Our Team",
      "filepath": "docs/company/team.md"
    },
    "/careers": {
      "type": "page",
      "title": "Careers",
      "filepath": "docs/company/careers.md"
    }
  }
}
```

In this example, clicking "Company" in the sidebar navigates to the "About Us" page (`docs/company/index.md`), while the folder can still be expanded to show "Our Team" and "Careers" as child pages.

The `page` property accepts the same configuration as a regular page route:

| Property      | Type      | Required | Description                        |
| ------------- | --------- | -------- | ---------------------------------- |
| `type`        | `"page"`  | Yes      | Must be `"page"`                   |
| `title`       | `string`  | No       | The display text for the page      |
| `filepath`    | `string`  | Yes      | Relative path to the markdown file |
| `description` | `string`  | No       | A description for SEO and metadata |

### Default Folder State

By default, folders start in a collapsed state. Use the `open` property to have a folder expanded when the page loads:

```json
"/guides": {
  "type": "group",
  "title": "Guides",
  "mode": "folder",
  "open": true,
  "children": {
    "/quickstart": {
      "type": "page",
      "title": "Quickstart",
      "filepath": "docs/guides/quickstart.md"
    },
    "/advanced": {
      "type": "page",
      "title": "Advanced Usage",
      "filepath": "docs/guides/advanced.md"
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
| `type`   | `"link"`  | Yes      | Must be `"link"`                    |
| `title`  | `string`  | No       | The display text in the navigation  |
| `url`    | `string`  | Yes      | The external URL to link to         |
| `icon`   | `string`  | No       | An icon to display next to the link. Accepts a built-in [icon key](../components/icons.mdx#built-in-icons) (Phosphor or Simple Icons) or a [custom URL](../components/icons.mdx#custom-icons). |
| `hidden` | `boolean` | No       | Hide the link from the sidebar (defaults to `false`) |

Since a link points to an external URL, there is no page to exclude from the sitemap or deindex — on links, `hidden: true` only removes the sidebar entry. The option exists on all route types for consistency.

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
      "url": "https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a",
      "type": "link"
    }
  }
}
```

Links can also be used for `mailto:` URLs to create email links, or any other valid URL scheme.
