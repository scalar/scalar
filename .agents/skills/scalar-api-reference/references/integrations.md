# Framework integrations

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

## Vue and React styles

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

## Next.js: choose a route or a page

For a standalone HTML document, create `app/scalar/route.ts` (under `src/` if the application uses it):

```typescript
import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference({ url: '/openapi.json' })
```

This does not inherit the application's layout or React providers. For an embedded page, use the React component in a Client Component with `'use client'`, imported by the page. Define browser callbacks in that Client Component. Do not create both `page.tsx` and `route.ts` at the same route. See the Next.js guide for metadata, CSP, and renderer version pinning.

## Server integration differences

- Fastify nests universal options under `configuration`. With `@fastify/swagger` already registered, it can use that generated description when no explicit `content` or `url` is supplied.
- NestJS can keep `SwaggerModule.createDocument` while replacing the UI. With the Fastify adapter, consult its `withFastify` option.
- FastAPI's Python wrapper uses names such as `openapi_url`, `scalar_proxy_url`, and `custom_css`. Do not paste JavaScript option names directly into Python keyword arguments. `add_scalar_reference(app)` registers `/scalar` by default and reads the app's OpenAPI URL.
- ASP.NET Core uses its own fluent configuration API. Read its guide for the project's .NET version and document generator before translating JavaScript options.
