# API documentation generator from OpenAPI

<div class="flex gap-2">
<a href="https://www.npmjs.com/@scalar/api-reference" aria-label="View @scalar/api-reference on NPM"><img alt="NPM Version" src="https://img.shields.io/npm/v/@scalar/api-reference"></a>
<a href="https://www.npmjs.com/@scalar/api-reference" aria-label="View NPM downloads for @scalar/api-reference"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@scalar/api-reference"></a>
<a href="https://discord.gg/scalar" aria-label="Join Scalar community on Discord"><img alt="Discord" src="https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2"></a>
</div>

Turn the OpenAPI document you already have into interactive API documentation that developers can read, search, and send requests from, for free.

The Scalar API Reference is open source and MIT licensed. Point it at an OpenAPI or AsyncAPI document and it renders modern documentation with built-in request testing from just a few lines of code. Swagger 2.0 documents load too, so older APIs do not need a rewrite first.

It works from a single HTML page, a CDN script, or one of the many framework integrations for Express, Fastify, Hono, NestJS, Next.js, Nuxt, ASP.NET Core, FastAPI, and more.

<div class="flex gap-2">
  <a class="t-editor__button button__primary" href="/products/api-references/getting-started">Get started</a>
  <a class="t-editor__button button__secondary" href="https://dashboard.scalar.com/register">Host it for free</a>
</div>

## Why developers already use it

- **15.7k stars on GitHub.** The reference is built in the open at [github.com/scalar/scalar](https://github.com/scalar/scalar), next to the API client it ships with.
- **Documented by Microsoft.** The ASP.NET Core OpenAPI guide on Microsoft Learn has a section called [Use Scalar for interactive API documentation](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents#use-scalar-for-interactive-api-documentation), built on the `Scalar.AspNetCore` package and `app.MapScalarApiReference()`.
- **The default UI in eight frameworks.** Effect, ElysiaJS, HappyX, Litestar, Nitro, oRPC, Platformatic, and Spry render their API documentation with Scalar out of the box.

## Interactive documentation, not a static page

Every operation gets a **Test Request** button that opens the [Scalar API Client](/products/api-client) in place. Developers fill in parameters, pick an authentication scheme, and see the real response without leaving your docs. Generated code samples cover cURL, JavaScript, Python, Go, and many more languages, so the first working call is a copy and paste away. Search, dark mode, and deep links to every operation and schema come built in.

## OpenAPI, Swagger 2.0, and AsyncAPI

Scalar reads OpenAPI 3.0 and 3.1 in JSON or YAML. Swagger 2.0 is upgraded on load, and [AsyncAPI documents](../../asyncapi.md) render with channels, operations, and messages instead of paths and responses. Your API description stays the single source of truth; the documentation is generated from it every time it loads.

## Themes that match your brand

Pick one of the built-in [themes](../../themes.md) or override the CSS variables yourself. Layout, sidebar, and authentication defaults are all [configurable](../../configuration.md), and [plugins](../../plugins.md) cover the cases configuration does not.

## Drop it into your framework

Most teams never write the HTML by hand. There are integrations for more than 40 frameworks and platforms, and we wrote framework guides for the most common ones: [.NET API documentation](/docs-for/dotnet), [FastAPI API documentation](/docs-for/fastapi), and [NestJS API documentation](/docs-for/nestjs). If you are new to the format itself, the [learn hub](/learn) explains OpenAPI from the ground up.

## When you outgrow a single page

The open-source reference is free forever. When you need hosting, custom domains, guides next to the reference, or several APIs in one portal, the same renderer powers [Scalar Docs](/products/docs). Teams such as Thomson Reuters, Clerk, Lufthansa, Zoom, and PAR publish their developer documentation with it; read [the PAR story](/customers/partech) or browse [all customers](/customers).

Ready to render your first reference? Follow the [Getting Started guide](getting-started.md), [start free](https://dashboard.scalar.com/register) on the hosted plan, or [book a demo](https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a).

## Go further

- [Configuration](../../configuration.md) — customize behavior, authentication, and layout
- [Themes](../../themes.md) — match the reference to your brand
- [Plugins](../../plugins.md) — extend the reference with custom features
- [AsyncAPI](../../asyncapi.md) — render event-driven APIs described with AsyncAPI

## Frequently asked questions

<scalar-detail title="Is the Scalar API Reference free?">

Yes. The API Reference is open source under the MIT license, and you can self-host it anywhere at no cost. Hosted documentation on Scalar also has a Free plan; paid plans add things like custom domains and Git Sync. See [pricing](/pricing) for the details.

</scalar-detail>

<scalar-detail title="How do I generate API documentation from an OpenAPI document?">

Load `@scalar/api-reference` from a CDN and call `Scalar.createApiReference('#app', { url: '/openapi.json' })`, or install the integration for your framework. The [Getting Started guide](getting-started.md) has a complete HTML example you can paste into a file and open.

</scalar-detail>

<scalar-detail title="Does Scalar support Swagger 2.0?">

Yes. Swagger 2.0 documents are upgraded to OpenAPI on load, so they render without a manual conversion. OpenAPI 3.0 and 3.1 are supported natively, in JSON or YAML.

</scalar-detail>

<scalar-detail title="Can I replace Swagger UI or Redoc with Scalar?">

Yes, and it is usually a one-line change because Scalar reads the same OpenAPI document. The framework guides for [.NET](/docs-for/dotnet), [FastAPI](/docs-for/fastapi), and [NestJS](/docs-for/nestjs) show the swap step by step.

</scalar-detail>

<scalar-detail title="Can developers send requests from the documentation?">

Yes. Every operation has a Test Request button that opens the built-in API client with the parameters, servers, and authentication schemes from your document already filled in.

</scalar-detail>

<scalar-detail title="What is the difference between the API Reference and Scalar Docs?">

The API Reference renders one API description, and you host it yourself. [Scalar Docs](/products/docs) is the hosted platform around it: guides in Markdown or MDX, several API references in one site, custom domains, Git Sync, and access control.

</scalar-detail>

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0)
- **Docs:** [Getting started with the API Reference](/products/api-references/getting-started)
- **Product:** [Scalar Docs](/products/docs) — host your reference next to guides on your own domain
