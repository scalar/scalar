# API documentation for your framework

Pick your framework and add an interactive Scalar API reference in minutes, from the OpenAPI document your code already produces.

Most web frameworks can describe their routes as an OpenAPI document, either built in (FastAPI, ASP.NET Core on .NET 9 and later) or through a well-known library (`@nestjs/swagger`, Zod OpenAPI Hono, `swagger-jsdoc`, springdoc-openapi). What they rarely ship is a good way to read it. Scalar fills that gap with a small package per framework that serves an open-source, MIT-licensed API reference next to your API, usually in one line of code.

## Framework guides

Each guide covers a three-step setup, a live demo, what you get beyond the reference, and how to migrate from Swagger UI or Redoc.

| Framework | Language | Guide |
| --- | --- | --- |
| ASP.NET Core | C# | [.NET API documentation](/docs-for/dotnet) |
| FastAPI | Python | [FastAPI API documentation](/docs-for/fastapi) |
| NestJS | TypeScript | [NestJS API documentation](/docs-for/nestjs) |
| Hono | TypeScript | [Hono API documentation](/docs-for/hono) |
| Express | JavaScript, TypeScript | [Express API documentation](/docs-for/express) |
| Fastify | JavaScript, TypeScript | [Fastify API documentation](/docs-for/fastify) |
| Laravel | PHP | [Laravel API documentation](/docs-for/laravel) |
| Django REST Framework | Python | [Django API documentation](/docs-for/django) |
| Spring Boot | Java, Kotlin | [Spring Boot API documentation](/docs-for/spring-boot) |
| Ruby on Rails | Ruby | [Rails API documentation](/docs-for/rails) |

## More integrations

These frameworks have a Scalar integration guide with setup instructions and configuration options:

| Framework | Language | Integration guide |
| --- | --- | --- |
| Next.js | TypeScript | [Next.js integration](/products/api-references/integrations/nextjs) |
| Nuxt | TypeScript | [Nuxt integration](/products/api-references/integrations/nuxt) |
| ElysiaJS | TypeScript | [ElysiaJS integration](/products/api-references/integrations/elysiajs) |
| Go | Go | [Go integration](/products/api-references/integrations/go) |
| Axum | Rust | [Axum integration](/products/api-references/integrations/rust/axum) |
| Flask | Python | [Flask integration](/products/api-references/integrations/flask) |
| Symfony | PHP | [Symfony integration](/products/api-references/integrations/symfony) |
| Phoenix | Elixir | [Elixir integration](/products/api-references/integrations/elixir) |

Not listed? The [HTML/JS integration](/products/api-references/integrations/html-js) renders a reference from any OpenAPI URL with a single script tag, so it works with any stack that can serve a static page.

## Why start from your framework

Generating the OpenAPI document from code keeps the documentation honest. When a route, parameter or response model changes, the document changes with it, and so does the reference. There is no second copy to update by hand.

The same document then feeds everything else Scalar builds:

- An interactive [API reference](/products/api-references) with a built-in request client, search, themes and code samples.
- The [API client](/products/api-client) as a desktop and web app for your team.
- [SDKs](/products/sdk-generator) for TypeScript, Python, Go and CLI (generally available), plus experimental targets such as Java, C#, Ruby and PHP.
- A [hosted MCP server](/products/agent/mcp) so AI agents can call your API, with OAuth.

Serving the reference from your framework is free. Publish the document to the [Scalar Registry](/products/registry) when you want hosted docs, SDKs or MCP; see [pricing](/pricing) for plans.

## Frequently asked questions

<scalar-detail title="Do I need to change how my framework generates OpenAPI?">

No. Scalar reads the OpenAPI document you already produce. Each guide shows how to point Scalar at it, whether it comes from a built-in generator or a library.

</scalar-detail>

<scalar-detail title="Which OpenAPI versions does Scalar support?">

Scalar renders OpenAPI 3.0 and 3.1. Swagger 2.0 documents are upgraded on load, so older generators work without a conversion step.

</scalar-detail>

<scalar-detail title="Is the API reference open source?">

Yes. The API reference and the API client are MIT licensed and developed in the open at [github.com/scalar/scalar](https://github.com/scalar/scalar).

</scalar-detail>

<scalar-detail title="Can I host the documentation outside my app?">

Yes. Publish the document to the Scalar Registry and Scalar hosts the reference for you, with your own domain on paid plans. See [Scalar Docs](/products/docs).

</scalar-detail>

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [What is an API reference?](/learn/openapi/what-is-an-api-reference)
- **Docs:** [API reference integrations](/products/api-references/integrations/html-js)
- **Product:** [API References](/products/api-references) — the open-source reference every framework guide above installs
