# API Reference vs. Swagger UI

*Last updated: September 2026*

Swagger UI is one of the most widely used tools for rendering OpenAPI documentation. Its [compatibility table](https://github.com/swagger-api/swagger-ui#compatibility) goes back to 2011, it is Apache 2.0 licensed, and it is still actively maintained by SmartBear, with [5.33.0 released in September 2026](https://github.com/swagger-api/swagger-ui/releases). Scalar's API Reference is a modern alternative that offers a more polished developer experience while remaining fully compatible with your existing OpenAPI documents.

When you migrate to Scalar, you unlock additional tools to enhance your API workflow:

- A modern, open-source API testing client, embedded in your API reference
- Instant search functionality built-in

## Why Migrate?

### Modern UI/UX

Scalar offers a cleaner, more intuitive interface with a modern design that looks great out of the box. The UI is responsive, has a sidebar and full-text search, and provides better navigation for large APIs. Swagger UI [added a dark mode in 5.31.0](https://github.com/swagger-api/swagger-ui/releases/tag/v5.31.0) (December 2025), so that alone is no longer a reason to switch.

### Better Performance

Scalar is built with modern web technologies and tuned for large documents, so the interface stays responsive even with hundreds of endpoints. Try it with your own document; that is the only benchmark that matters.

### Interactive API Client

While Swagger UI has "Try it out" functionality, Scalar's built-in API client is more powerful—supporting environment variables, request history, code snippet generation in 25+ languages, and a standalone desktop application (optional).

### Extensive Customization

Scalar offers 11 built-in themes and extensive CSS customization options. You can style everything from colors and fonts to sidebar layouts and component spacing.

## Feature Comparison

| Feature                        |                                                Scalar                                                 |                                                  Swagger UI                                                  |
| ------------------------------ | :---------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------: |
| **Core Features**              |                                                                                                       |                                                                                                              |
| OpenAPI 3.0 Support            |                                                   ✓                                                   |                                                      ✓                                                       |
| OpenAPI 3.1 Support            |                                                   ✓                                                   |                                                      ✓                                                       |
| OpenAPI 3.1.2 Support | ✓ | ✓ (since [5.19.0](https://github.com/swagger-api/swagger-ui#compatibility)) |
| OpenAPI 3.2 Support | ✓ ([docs](/products/api-references/openapi)) | basic support since [5.32.0](https://github.com/swagger-api/swagger-ui/releases/tag/v5.32.0) |
| Swagger 2.0 Support            |                                                   ✓                                                   |                                                      ✓                                                       |
| Try It Out / Test Requests     |                                                   ✓                                                   |                                            simple implementation                                             |
| Multiple Documents             |                                                   ✓                                                   |                                                      ✓                                                       |
| **User Interface**             |                                                                                                       |                                                                                                              |
| Modern Layout                  |                                                   ✓                                                   |                                                                                                              |
| Classic (Swagger-style) Layout |                                                   ✓                                                   |                                                      ✓                                                       |
| Dark Mode | ✓ | ✓ (since [5.31.0](https://github.com/swagger-api/swagger-ui/releases/tag/v5.31.0)) |
| Built-in Themes                |                                               11 themes                                               |                                                                                                              |
| Custom CSS Support             |                                                   ✓                                                   |                                                      ✓                                                       |
| Sidebar Navigation             |                                                   ✓                                                   |                                                                                                              |
| Search | ✓ | tag filter ([`filter`](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/)) |
| **Code Snippets**              |                                                                                                       |                                                                                                              |
| Code Snippet Generation | 25+ languages | cURL for bash, PowerShell, CMD ([`requestSnippets`](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/)) |
| Custom Code Examples           |                                                   ✓                                                   |                                                                                                              |
| **Authentication**             |                                                                                                       |                                                                                                              |
| OAuth 2.0 Support              |                                                   ✓                                                   |                                                      ✓                                                       |
| API Key Support                |                                                   ✓                                                   |                                                      ✓                                                       |
| Persist Auth Credentials       |                                                   ✓                                                   |                                                      ✓                                                       |
| Pre-fill Auth Credentials | ✓ | via `preauthorizeApiKey` / `initOAuth` |
| **Integrations**               |                                                                                                       |                                                                                                              |
| React Component                |                                                   ✓                                                   |                                                      ✓                                                       |
| Vue Component                  |                                                   ✓                                                   |                                                                                                              |
| **Advanced Features**          |                                                                                                       |                                                                                                              |
| CORS Proxy                     |                                                   ✓                                                   |                                                                                                              |
| Quick Share                    |                                                   ✓                                                   |                                                                                                              |
| Desktop API Client             |                                                   ✓                                                   |                                                                                                              |
| **Community**                  |                                                                                                       |                                                                                                              |
| PRs merged (2025)              | [2,075](https://github.com/scalar/scalar/pulls?q=is%3Apr+is%3Amerged+merged%3A2025-01-01..2025-12-31) | [176](https://github.com/swagger-api/swagger-ui/pulls?q=is%3Apr+is%3Amerged+merged%3A2025-01-01..2025-12-31) |
| Discord                        | [discord.gg/scalar](https://discord.gg/scalar) | |

## Migrate from Swagger UI to Scalar

Migration is straightforward. In most cases, you can swap out Swagger UI for Scalar in minutes while keeping your existing OpenAPI document unchanged.

### Basic HTML Migration

**Swagger UI**

```html
<!doctype html>
<html>
  <head>
    <title>Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
      })
    </script>
  </body>
</html>
```

**API Reference**

```html
<!doctype html>
<html>
  <head>
    <title>API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script>
      Scalar.createApiReference('#app', {
        url: '/openapi.json',
      })
    </script>
  </body>
</html>
```

### Configuration Mapping

Here is how common Swagger UI options map to Scalar:

| Swagger UI                     | Scalar                                   |
| ------------------------------ | ---------------------------------------- |
| `url`                          | `url`                                    |
| `spec`                         | `content`                                |
| `urls`                         | `sources`                                |
| `dom_id`                       | First argument to `createApiReference()` |
| `deepLinking`                  | Enabled by default                       |
| `displayOperationId`           | `showOperationId: true`                  |
| `defaultModelsExpandDepth: -1` | `hideModels: true`                       |
| `defaultModelExpandDepth`      | `expandAllModelSections: true`           |
| `docExpansion: 'none'`         | `defaultOpenAllTags: false` (default)    |
| `docExpansion: 'list'`         | `defaultOpenAllTags: false` (default)    |
| `docExpansion: 'full'`         | `defaultOpenAllTags: true`               |
| `filter`                       | Search enabled by default                |
| `filter: false`                | `hideSearch: true`                       |
| `tryItOutEnabled`              | Enabled by default                       |
| `supportedSubmitMethods: []`   | `hideTestRequestButton: true`            |
| `operationsSorter: 'alpha'`    | `operationsSorter: 'alpha'`              |
| `operationsSorter: 'method'`   | `operationsSorter: 'method'`             |
| `tagsSorter: 'alpha'`          | `tagsSorter: 'alpha'`                    |
| `persistAuthorization`         | `persistAuth: true`                      |

### Integrations

You can use one of our [many integrations](/products/api-references/getting-started) for basically any programming language and framework.

## Theme and Styling

### Using a Classic Layout

If you prefer the traditional Swagger UI layout, Scalar offers a classic layout option, that is not too different:

```javascript
Scalar.createApiReference('#app', {
  url: '/openapi.json',
  layout: 'classic',
})
```

### Built-in Themes

Scalar includes built-in themes:

- `default`
- `alternate`
- `moon`
- `purple`
- `solarized`
- `bluePlanet`
- `saturn`
- `kepler`
- `mars`
- `deepSpace`
- `laserwave`

```javascript
Scalar.createApiReference('#app', {
  url: '/openapi.json',
  theme: 'moon',
})
```

### Custom Styling

Override CSS variables to match your brand:

```html
<style>
  :root {
    --scalar-font: 'Your Font', sans-serif;
    --scalar-color-accent: #0a85d1;
  }
  .dark-mode {
    --scalar-background-1: #1a1a1a;
    --scalar-color-1: rgba(255, 255, 255, 0.9);
  }
  .light-mode {
    --scalar-background-1: #ffffff;
    --scalar-color-1: #121212;
  }
</style>
```

## Additional Scalar Features

These features have no Swagger UI equivalent:

| Feature             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `proxyUrl`          | Avoid CORS issues with a proxy server          |
| `hiddenClients`     | Control which code snippet languages are shown |
| `defaultHttpClient` | Set the default code snippet language          |
| `searchHotKey`      | Customize the keyboard shortcut for search     |
| `baseServerURL`     | Prefix all relative server URLs                |
| `pathRouting`       | Use path-based routing instead of hash-based   |
| `onBeforeRequest`   | Run before send; prefer mutating the request builder (`requestBuilder`). See [Configuration: onBeforeRequest](../configuration.md#onbeforerequest). |
| `authentication`    | Pre-fill authentication credentials            |

## Frequently asked questions

<scalar-detail title="Can I use Scalar with the same OpenAPI document as Swagger UI?">
Yes. Scalar reads Swagger 2.0, OpenAPI 3.0, 3.1, and 3.2 documents as they are. Point `url` at the same file Swagger UI loads and you are done; nothing in the document needs to change.
</scalar-detail>

<scalar-detail title="Does Swagger UI support OpenAPI 3.2?">
Yes, at a basic level. Swagger UI [5.32.0](https://github.com/swagger-api/swagger-ui/releases/tag/v5.32.0), released in February 2026, added basic OpenAPI 3.2.0 support, and its [compatibility table](https://github.com/swagger-api/swagger-ui#compatibility) lists 3.2.0. Scalar also [supports OpenAPI 3.2](/products/api-references/openapi), including nested tags and whole-query parameters.
</scalar-detail>

<scalar-detail title="Is Swagger UI still maintained?">
Yes. SmartBear ships regular releases; [5.33.0](https://github.com/swagger-api/swagger-ui/releases) came out in September 2026. If Swagger UI does everything you need, there is no urgency to move. People usually switch for the built-in API client, sidebar navigation and search, or code snippets beyond cURL.
</scalar-detail>

<scalar-detail title="Can I keep the classic Swagger UI look?">
Mostly. Set `layout: 'classic'` to get a single-column layout close to Swagger UI, and pick one of the built-in themes or override the CSS variables to match your brand.
</scalar-detail>

<scalar-detail title="Is Scalar's API Reference free and open source?">
Yes. The API Reference and API Client are MIT licensed on [GitHub](https://github.com/scalar/scalar), and you can self-host them from a CDN script or one of the framework integrations. Hosted docs, SDKs, and MCP servers are optional paid products.
</scalar-detail>

## Related

- **Learn:** [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [OpenAPI vs Swagger](/learn/openapi/openapi-vs-swagger)
- **Docs:** [Swagger UI alternatives](/alternatives/swagger-ui) · [Scalar vs Swagger UI comparison](/resources/compare/swagger-ui) · [API reference configuration](/products/api-references/configuration)
- **Product:** [Scalar API References](/products/api-references) — the open-source renderer you are migrating to

---

*Swagger UI details on this page come from its [GitHub repository](https://github.com/swagger-api/swagger-ui), [release notes](https://github.com/swagger-api/swagger-ui/releases), and [configuration docs](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/) as checked on September 26, 2026. Swagger UI is actively developed and may have changed since. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
