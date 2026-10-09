---
name: scalar-api-reference
description: Install, configure, and troubleshoot Scalar API Reference in an application, including framework integrations, API description loading, authentication, themes, and migration from Swagger UI or Redoc. Use for the embedded or self-hosted reference, rather than hosted Scalar Docs site configuration or standalone API Client development.
---

# Scalar API Reference

Add interactive API documentation to an existing application with the integration that matches its framework. Scalar renders an API description; preserve the application's existing description generator and API routes.

## Choose the integration

Inspect the application's framework, package versions, routing conventions, and existing API description endpoint. Determine whether the user needs a standalone documentation route or a component embedded in the application layout.

Read the relevant entry in [framework integrations](references/integrations.md), then consult its linked guide for options specific to that integration. Use the project's package manager. Match the installed version's exports and types instead of assuming every wrapper accepts the same option names.

For a plain HTML page, this is a minimal setup. Serve an API description at `/openapi.json` and serve the page over HTTP:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API Reference</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module">
      import { createApiReference } from 'https://cdn.jsdelivr.net/npm/@scalar/api-reference/esm.js'

      createApiReference('#app', { url: '/openapi.json' })
    </script>
  </body>
</html>
```

For bundler-based JavaScript, import `createApiReference` from `@scalar/api-reference`. For Vue and React components, include the integration's stylesheet as shown in the framework reference.

## Load the API description

Use the [configuration reference](https://scalar.com/products/api-references/configuration) for the exact option shape:

- `url`: a browser-accessible URL serving JSON or YAML, not a filesystem path or the HTML documentation page.
- `content`: an API description object or JSON/YAML string already available to the application.
- `sources`: multiple API descriptions with optional `title`, `slug`, and `default` selection. Choose `url` or `content` for each source.

For example, the universal JavaScript configuration can select between two APIs:

```javascript
{
  sources: [
    { title: 'Public API', slug: 'public', url: '/openapi.json', default: true },
    { title: 'Admin API', slug: 'admin', url: '/admin/openapi.json' },
  ],
}
```

Check how the browser resolves the description URL against the documentation page URL. A leading slash uses the origin root; a path without one is relative to the page, so account for deployment base paths. Check that the document endpoint returns the API description rather than a login page or an SPA fallback. Passing `content` includes that description in what the browser receives.

## Authentication and test requests

Distinguish access to the documentation page, access to the API description, and authentication for API requests. Configuring the request client's authentication does not protect the page or the description endpoint.

Use the API description's security scheme keys when setting `authentication.preferredSecurityScheme` and `authentication.securitySchemes`. Check the configuration reference for the relevant HTTP, API key, or OAuth flow; do not invent a generic `apiKey` option. Keep production secrets out of shipped browser configuration. Enable `persistAuth` only when requested; it stores credentials in browser local storage.

For request failures, inspect the selected server URL, request URL, headers, status, and browser console. A rendered reference does not prove that its API requests work. Prefer the API's intended CORS configuration; configure `proxyUrl` when a proxy is appropriate for the deployment. Requests and credentials pass through that proxy, so do not silently add a public proxy to an existing application.

## Appearance and code samples

Start with supported configuration: `theme`, `layout` (`modern` or `classic`), `showSidebar`, and `darkMode`. Use [theme variables](https://scalar.com/products/api-references/themes) or `customCss` for branding instead of depending on internal DOM selectors. For embedded references, check the theme guide's CSS layer ordering when Tailwind styles conflict.

Use `defaultHttpClient` with `targetKey` and `clientKey` to choose the initial code sample, and `hiddenClients` to limit the available clients. Consult the configuration reference for supported values and shapes. These settings change code sample choices, not the API's server implementation.

## Migrate from Swagger UI or Redoc

Reuse the existing API description URL or generator output. Replace the documentation renderer at the intended route and translate only the customization the user needs. Swagger UI and Redoc option names are not interchangeable with Scalar options.

Preserve description generation, route authorization, and server URLs. Remove the old renderer dependency only after checking its other usages. If changing the document itself is necessary, respect its declared OpenAPI version rather than upgrading it merely to switch renderers.

## Verify and troubleshoot

Check the documentation route and description endpoint separately. In the rendered reference, verify that operations appear, search finds a known operation, and requested theme or authentication settings are visible. When request testing is in scope, use a known safe endpoint or mock environment.

- Blank or unstyled page: check browser errors, the mount element, component CSS imports, and whether the renderer runs in a browser context.
- Description fails to load: inspect the fetch response, URL, access control, CORS, and unresolved external references.
- Requests target the wrong host: inspect the description's servers and any configured server overrides.
- CSP blocks initialization: consult the framework guide's nonce and bundle guidance; do not broadly weaken the application's policy to make the example work.
- CDN behavior differs from the installed wrapper: the wrapper and browser renderer can have separate versions. Check `bundle` or `cdn` in the integration guide when pinning is needed.

Run the host application's relevant checks. Report what was verified and any environment limitations; do not claim browser behavior was tested from compilation alone.
