# NestJS API documentation

Keep `@nestjs/swagger` for generating your OpenAPI document and render it as an interactive Scalar API reference with one middleware.

In NestJS, "Swagger" usually means two things at once. The [`@nestjs/swagger`](https://docs.nestjs.com/openapi/introduction) module reads your controllers, DTOs and decorators and builds an OpenAPI document. `SwaggerModule.setup()` then serves that document through Swagger UI. Scalar replaces only the second part. Your decorators, `DocumentBuilder` and CLI plugin stay exactly as they are.

## Set up Scalar in NestJS

<scalar-steps>
  <scalar-step id="install" title="Install the middleware">

```bash
npm install @scalar/nestjs-api-reference
```

You also need `@nestjs/swagger` to generate the document. If you do not have it yet, follow the [NestJS OpenAPI introduction](https://docs.nestjs.com/openapi/introduction).

  </scalar-step>

  <scalar-step id="configure" title="Pass the document to apiReference">

In `main.ts`, build the document as usual and hand it to the `apiReference` middleware:

```typescript
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build()
  const document = SwaggerModule.createDocument(app, config)

  app.use(
    '/reference',
    apiReference({
      content: document,
    }),
  )

  await app.listen(3000)
}
void bootstrap()
```

Using the Fastify adapter instead of Express? Add `withFastify: true` to the options.

  </scalar-step>

  <scalar-step id="open" title="Start the app and open /reference">

Run `npm run start:dev` and open `http://localhost:3000/reference`.

  </scalar-step>
</scalar-steps>

A working version of this setup, for both the Express and Fastify adapters, lives in the Scalar repository under [`examples/nestjs`](https://github.com/scalar/scalar/tree/main/examples/nestjs).

## Try a live reference

The Scalar Galaxy example API below is rendered by the same API reference component the NestJS middleware serves. Open an operation and send a request from the built-in client.

<iframe src="https://galaxy.scalar.com" title="Scalar Galaxy example API reference" loading="lazy" width="100%" height="600"></iframe>

[Open the live demo in a new tab](https://galaxy.scalar.com)

## Serve the document by URL

If your app already serves the OpenAPI document as JSON, point the middleware at the URL instead of passing the object. The reference then loads the document in the browser, and the download button gives readers the same file your tooling uses:

```typescript
import { apiReference } from '@scalar/nestjs-api-reference'

app.use(
  '/reference',
  apiReference({
    url: '/openapi.json',
  }),
)
```

The middleware ships with a NestJS theme by default. Set `theme` to `purple`, `moon`, `solarized` or another built-in theme, or `none` to start from a blank slate. Every other option from the universal configuration object works too; see the [NestJS integration guide](/products/api-references/integrations/nestjs).

## What you get

The middleware and the reference it renders are MIT licensed. The OpenAPI document `@nestjs/swagger` produces is also the input for the rest of Scalar.

- **An interactive [API reference](/products/api-references).** Every controller, DTO and example, with search, themes, dark mode and request code samples in popular languages.
- **A built-in [API client](/products/api-client).** "Test Request" opens a full client with environments, authentication and history. It also runs as a desktop and web app.
- **[SDKs](/products/sdk-generator)** from the same document. TypeScript, Python, Go, Java, Kotlin, Ruby and CLI are generally available; C#, PHP, Rust, Swift, Dart and C++ are experimental. A TypeScript SDK generated from your NestJS API gives frontend teams typed calls without hand-written fetch wrappers.
- **A [hosted MCP server](/products/agent/mcp)** so AI agents can call the endpoints you choose, with OAuth. Scalar hosts it; there is nothing to deploy.

For SDKs and MCP, write the document to a file during your build (for example with `writeFileSync('openapi.json', JSON.stringify(document))` in a small script) and publish it to the [Scalar Registry](/products/registry) from CI:

```bash
npx @scalar/cli registry publish --namespace your-namespace --slug your-api ./openapi.json
```

Free hosted docs cover up to 3 APIs; Pro is $150 per month. See [pricing](/pricing).

## Migrating from Swagger UI

Most NestJS apps call `SwaggerModule.setup('api', app, document)`. That serves Swagger UI at `/api` and the raw document at `/api-json`. You have two clean ways to switch.

**Replace the call.** Remove `SwaggerModule.setup(...)` and mount `apiReference({ content: document })` at the same path, as in step 2. Use `'/api'` as the mount path if you want existing links to keep working.

**Keep the JSON endpoint, drop the UI.** `SwaggerCustomOptions` has a [`ui` option](https://docs.nestjs.com/openapi/introduction): set it to `false` and Nest keeps serving the document without Swagger UI. Then point Scalar at that endpoint:

```typescript
SwaggerModule.setup('api', app, document, { ui: false })

app.use(
  '/reference',
  apiReference({
    url: '/api-json',
  }),
)
```

This second option is handy when other tools (client generators, contract tests) already fetch `/api-json`.

Decorators such as `@ApiProperty`, `@ApiResponse`, `@ApiTags` and `@ApiBearerAuth` all end up in the OpenAPI document, so Scalar renders them without changes. If you customised Swagger UI with `customCss` or `swaggerOptions`, use Scalar's `theme`, `customCss` and configuration options instead. Coming from Redoc? The difference is the request client built into the page. The [Swagger UI migration guide](/resources/migration/swagger-ui) has a full feature comparison.

## Frequently asked questions

<scalar-detail title="Do I still need @nestjs/swagger?">

Yes, or another tool that produces an OpenAPI document. `@nestjs/swagger` generates the document from your decorators; Scalar renders it. Despite the package name, it outputs OpenAPI 3.x.

</scalar-detail>

<scalar-detail title="Does Scalar work with the NestJS Fastify adapter?">

Yes. Pass `withFastify: true` to `apiReference`. The Scalar repository has working examples for both the Express and Fastify adapters.

</scalar-detail>

<scalar-detail title="How do I show bearer auth in the reference?">

Add `.addBearerAuth()` to your `DocumentBuilder` and `@ApiBearerAuth()` to the controllers that need it. The security scheme ends up in the OpenAPI document, and Scalar shows an auth panel where readers paste a token before sending requests.

</scalar-detail>

<scalar-detail title="Is the NestJS integration free?">

Yes. `@scalar/nestjs-api-reference` and the API reference are open source under the MIT license. Paid plans cover hosted docs with more APIs and seats, SDKs, and MCP usage.

</scalar-detail>

<scalar-detail title="Can I run Scalar and Swagger UI side by side?">

Yes. Keep `SwaggerModule.setup('api', ...)` and mount Scalar on a different path such as `/reference`. Both read the same document, which makes it easy to compare before you switch.

</scalar-detail>

## Related

- **Learn:** [OpenAPI vs Swagger](/learn/openapi/openapi-vs-swagger) · [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi)
- **Docs:** [NestJS integration guide](/products/api-references/integrations/nestjs)
- **Product:** [API References](/products/api-references) — the open-source reference behind the NestJS middleware, also available hosted
