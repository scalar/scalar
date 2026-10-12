---
name: scalar-api-reference
description: Install, configure, and troubleshoot Scalar API Reference in an application, including framework integrations, API description loading, authentication, themes, and migration from Swagger UI or Redoc. Use for the embedded or self-hosted reference, rather than hosted Scalar Docs site configuration or standalone API Client development.
---

# Scalar API Reference

Add interactive API documentation to an existing application with the integration that matches its framework. Scalar renders an API description; preserve the application's existing description generator and API routes.

## Choose the integration

Inspect the application's framework, package versions, routing conventions, and existing API description endpoint. Determine whether the user needs a standalone documentation route or a component embedded in the application layout.

Read the relevant entry in [framework integrations](#framework-integrations), then consult its linked guide for options specific to that integration. Use the project's package manager. Match the installed version's exports and types instead of assuming every wrapper accepts the same option names.

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

For bundler-based JavaScript, import `createApiReference` from `@scalar/api-reference`. For Vue and React components, include the integration's stylesheet as shown in [Vue and React styles](#vue-and-react-styles).

## Framework integrations

Read only the guide for the application's framework. These are routing hints and minimal entry points, not a replacement for the installed package's API. The linked guides live under `documentation/integrations/` in the Scalar repository when local sources are available.

| Application | Package | Entry point and guide |
| --- | --- | --- |
| HTML or vanilla JavaScript | `@scalar/api-reference` | `createApiReference('#app', { url })`; [HTML/JS](https://scalar.com/products/api-references/integrations/html-js) |
| Vue | `@scalar/api-reference` | `ApiReference` component with a `configuration` prop; [Vue](https://scalar.com/products/api-references/integrations/vue) |
| React | `@scalar/api-reference-react` | `ApiReferenceReact` with a `configuration` prop; [React](https://scalar.com/products/api-references/integrations/react) |
| Next.js standalone route | `@scalar/nextjs-api-reference` | `ApiReference` returns a route handler; [Next.js](https://scalar.com/products/api-references/integrations/nextjs) |
| Nuxt | `@scalar/nuxt` | Nuxt module with `scalar` configuration; [Nuxt](https://scalar.com/products/api-references/integrations/nuxt) |
| Express | `@scalar/express-api-reference` | `app.use('/reference', apiReference({ url }))`; [Express](https://scalar.com/products/api-references/integrations/express) |
| Fastify | `@scalar/fastify-api-reference` | Register plugin with `routePrefix` and nested `configuration`; [Fastify](https://scalar.com/products/api-references/integrations/fastify) |
| Hono | `@scalar/hono-api-reference` | `app.get('/scalar', Scalar({ url }))`; [Hono](https://scalar.com/products/api-references/integrations/hono) |
| NestJS | `@scalar/nestjs-api-reference` | `apiReference({ content: document })` with existing SwaggerModule output; [NestJS](https://scalar.com/products/api-references/integrations/nestjs) |
| FastAPI | `scalar-fastapi` | `add_scalar_reference(app)` or `get_scalar_api_reference`; [FastAPI](https://scalar.com/products/api-references/integrations/fastapi) |
| ASP.NET Core | `Scalar.AspNetCore` | `app.MapScalarApiReference()` alongside an OpenAPI document endpoint; [ASP.NET Core](https://scalar.com/products/api-references/integrations/aspnetcore/integration) |

For other frameworks, find the matching guide in the [integration catalog](https://scalar.com/products/api-references). Do not substitute a similarly named package without checking its framework support.

### Vue and React styles

Vue:

```vue
<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import '@scalar/api-reference/style.css'
</script>

<template>
  <ApiReference :configuration="{ url: '/openapi.json' }" />
</template>
```

React:

```tsx
import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'

export const Reference = () => (
  <ApiReferenceReact configuration={{ url: '/openapi.json' }} />
)
```

### Next.js: choose a route or a page

For a standalone HTML document, create `app/scalar/route.ts` (under `src/` if the application uses it):

```typescript
import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference({ url: '/openapi.json' })
```

This does not inherit the application's layout or React providers. For an embedded page, use the React component in a Client Component with `'use client'`, imported by the page. Define browser callbacks in that Client Component. Do not create both `page.tsx` and `route.ts` at the same route. See the Next.js guide for metadata, CSP, and renderer version pinning.

### Server integration differences

- Fastify nests universal options under `configuration`. With `@fastify/swagger` already registered, it can use that generated description when no explicit `content` or `url` is supplied.
- NestJS can keep `SwaggerModule.createDocument` while replacing the UI. With the Fastify adapter, consult its `withFastify` option.
- FastAPI's Python wrapper uses names such as `openapi_url`, `scalar_proxy_url`, and `custom_css`. Do not paste JavaScript option names directly into Python keyword arguments. `add_scalar_reference(app)` registers `/scalar` by default and reads the app's OpenAPI URL.
- ASP.NET Core uses its own fluent configuration API. Read its guide for the project's .NET version and document generator before translating JavaScript options.

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
