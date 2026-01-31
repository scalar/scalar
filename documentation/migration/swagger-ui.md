# Scalar API Reference vs. Swagger UI

Swagger UI used to be the most widely used tool for rendering OpenAPI documentation. It has been around since 2011 and has a massive ecosystem. Scalar API Reference is a modern alternative that offers a more polished developer experience while remaining fully compatible with your existing OpenAPI documents.

When you migrate to Scalar, you unlock additional tools to enhance your API workflow:

- A modern, open-source API testing client, embedded in your API reference
- Instant search functionality built-in

## Why Migrate?

### Modern UI/UX

Scalar offers a cleaner, more intuitive interface with a modern design that looks great out of the box. The UI is responsive, supports dark mode, and provides better navigation for large APIs.

### Better Performance

Scalar is built with modern web technologies and optimized for performance. Large OpenAPI documents render faster and the interface remains smooth even with hundreds of endpoints.

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
| OpenAPI 3.1.2 Support          |                                                   ✓                                                   |                                                                                                              |
| OpenAPI 3.2 Support            |                                              in progress                                              |                                                 not in sight                                                 |
| Swagger 2.0 Support            |                                                   ✓                                                   |                                                      ✓                                                       |
| Try It Out / Test Requests     |                                                   ✓                                                   |                                            simple implementation                                             |
| Multiple Documents             |                                                   ✓                                                   |                                                      ✓                                                       |
| **User Interface**             |                                                                                                       |                                                                                                              |
| Modern Layout                  |                                                   ✓                                                   |                                                                                                              |
| Classic (Swagger-style) Layout |                                                   ✓                                                   |                                                      ✓                                                       |
| Dark Mode                      |                                                   ✓                                                   |                                                                                                              |
| Built-in Themes                |                                               11 themes                                               |                                                                                                              |
| Custom CSS Support             |                                                   ✓                                                   |                                                      ✓                                                       |
| Sidebar Navigation             |                                                   ✓                                                   |                                                                                                              |
| Search                         |                                                   ✓                                                   |                                               plugin required                                                |
| **Code Snippets**              |                                                                                                       |                                                                                                              |
| Code Snippet Generation        |                                             25+ languages                                             |                                                   limited                                                    |
| Custom Code Examples           |                                                   ✓                                                   |                                                                                                              |
| **Authentication**             |                                                                                                       |                                                                                                              |
| OAuth 2.0 Support              |                                                   ✓                                                   |                                                      ✓                                                       |
| API Key Support                |                                                   ✓                                                   |                                                      ✓                                                       |
| Persist Auth Credentials       |                                                   ✓                                                   |                                                      ✓                                                       |
| Pre-fill Auth Credentials      |                                                   ✓                                                   |                                                through hooks                                                 |
| **Integrations**               |                                                                                                       |                                                                                                              |
| React Component                |                                                   ✓                                                   |                                                      ✓                                                       |
| Vue Component                  |                                                   ✓                                                   |                                                                                                              |
| **Advanced Features**          |                                                                                                       |                                                                                                              |
| CORS Proxy                     |                                                   ✓                                                   |                                                                                                              |
| Quick Share                    |                                                   ✓                                                   |                                                                                                              |
| Desktop API Client             |                                                   ✓                                                   |                                                                                                              |
| **Community**                  |                                                                                                       |                                                                                                              |
| PRs merged (2025)              | [2,075](https://github.com/scalar/scalar/pulls?q=is%3Apr+is%3Amerged+merged%3A2025-01-01..2025-12-31) | [176](https://github.com/swagger-api/swagger-ui/pulls?q=is%3Apr+is%3Amerged+merged%3A2025-01-01..2025-12-31) |
| Discord                        |                             [discord.gg/scalar](http://discord.gg/scalar)                             |

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

**Scalar API Reference**

```html
<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
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

Here's how common Swagger UI options map to Scalar:

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

You can use one of our [many integrations](../guides/api-references/getting-started.md) for basically any programming language and framework.

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
| `onBeforeRequest`   | Modify requests before they are sent           |
| `authentication`    | Pre-fill authentication credentials            |
