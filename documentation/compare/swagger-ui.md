# Scalar vs Swagger UI

*Last updated: September 2026*

Swagger UI is the renderer most developers picture when they hear "OpenAPI docs". It has been around [since 2011](https://github.com/swagger-api/swagger-ui), it is Apache-2.0 licensed, it is maintained by SmartBear, and it ships by default in frameworks such as [FastAPI](https://fastapi.tiangolo.com/features/). If you have an OpenAPI document, you have almost certainly seen it rendered in Swagger UI.

This page is written by Scalar, so read it with that in mind. Every claim we make about Swagger UI links to its own repository or documentation. If we have something wrong, tell us and we will fix it.

The short version: both are free, open-source renderers that take the same OpenAPI document and turn it into an interactive page. Swagger UI is a mature, dependable testing surface with a plugin system. Scalar is a more complete reading and testing experience out of the box, with search, themes, dark mode, a full API client, and 35+ framework integrations, and it also sits on top of a hosted platform if you later want SDKs, a docs site, or an MCP server from the same document.

If you are already sure and want the steps, go straight to the [Swagger UI migration guide](/resources/migration/swagger-ui).

## At a glance

| | Scalar API Reference | Swagger UI |
| --- | --- | --- |
| Licence | [MIT](https://github.com/scalar/scalar) | [Apache-2.0](https://github.com/swagger-api/swagger-ui) |
| Maintainer | Scalar | [SmartBear](https://github.com/swagger-api/swagger-ui) |
| OpenAPI versions | Swagger 2.0, OpenAPI 3.0, 3.1; 3.2 features [landing incrementally](https://github.com/scalar/scalar/blob/main/packages/api-reference/CHANGELOG.md) | [2.0, 3.0.x, 3.1.x, 3.2.0](https://github.com/swagger-api/swagger-ui#compatibility) (5.32.0 and later) |
| Try it out | Full API client: environments, auth flows, cookies, history | ["Try it out" section](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/) per operation |
| Search | Built in, full text | [Tag filter box](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/) (`filter`) |
| Code snippets | Dozens of languages and HTTP clients | [cURL for bash, PowerShell, and CMD](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/) by default |
| Dark mode and themes | Yes, 11 built-in themes plus CSS variables | Syntax-highlight themes; no documented UI dark mode option |
| Framework integrations | 35+ (Express, Fastify, NestJS, FastAPI, ASP.NET Core, Laravel, Rails, and more) | npm modules, [React component](https://github.com/swagger-api/swagger-ui), Docker, and community wrappers |
| Extensibility | Configuration, CSS, plugins, Vue slots | [Plugin API](https://github.com/swagger-api/swagger-ui) and custom layouts |
| Hosted docs, SDKs, MCP | Optional paid platform | Not part of Swagger UI |

## Where Swagger UI is stronger

Honest version first.

**Ubiquity.** Swagger UI is everywhere. Swashbuckle, springdoc, FastAPI, and a long list of other tools wire it up for you. Your users already know where the "Try it out" button is. Familiarity is a real feature, and nothing we say below changes that.

**Maturity and a very long compatibility record.** The README keeps a [compatibility table](https://github.com/swagger-api/swagger-ui#compatibility) going back to 2011. It is battle-tested against fifteen years of real OpenAPI documents, including a lot of strange ones.

**Early OpenAPI 3.2 support.** Swagger UI [5.32.0](https://github.com/swagger-api/swagger-ui#compatibility), released 27 February 2026, lists OpenAPI 3.2.0 as supported. Scalar is adding 3.2 features one by one (`in: querystring` parameters, `additionalOperations`, streaming item schemas, and others are in the [changelog](https://github.com/scalar/scalar/blob/main/packages/api-reference/CHANGELOG.md)), and we would rather not claim full 3.2 coverage until it is true.

**A plugin system designed for deep changes.** Swagger UI is built as a set of plugins, and you can replace the [top-level layout](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/) with a component of your own. If you want to rewrite how an operation renders, that architecture was built for you.

**The SmartBear ecosystem.** If your organisation already runs SwaggerHub or other SmartBear tools, Swagger UI is the renderer those tools share, and staying inside one vendor's world has procurement advantages.

## Swagger UI vs Scalar

Both tools do the same core job. The differences show up when a developer tries to find something, understand it, and call it.

### Reading and finding

Swagger UI renders operations as collapsible rows grouped by tag. Its `filter` option adds an edit box that [filters the tagged operations](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/) shown. That works well for a small API. On a large one, finding a specific field in a specific response is a scroll-and-expand exercise.

Scalar renders a sidebar navigation, full-text search across operations and schemas (with a keyboard shortcut), Markdown descriptions with headings that appear in the navigation, and schema views that expand in place. If you like the Swagger look, set `layout: 'classic'` for a layout that will feel familiar.

### Testing a request

Swagger UI's "Try it out" is a form on each operation. You click the button, fill the parameters, execute, and see the response and a cURL command. `persistAuthorization` [keeps credentials](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/) across reloads. It is simple, and simple is often what you want.

Scalar opens a full API client on each operation. It is the same open-source client Scalar ships as a [desktop and web app](/products/api-client): environments and variables, OAuth 2.0 flows (authorization code, client credentials, password), API keys, cookies, request history, streamed responses, and code generation for many languages and HTTP clients. A reader who likes the request can keep working on it in the standalone client.

### CORS

Both tools send requests from the browser, so both hit CORS when the API does not allow the docs origin. Swagger UI offers `withCredentials` for [credentialed CORS requests](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/); you still need the API to allow the origin. Scalar has a `proxyUrl` option that routes requests through a proxy, including a free hosted one, which makes "Try it" work against APIs you do not control.

### Code examples

By default Swagger UI generates [cURL snippets for bash, PowerShell, and CMD](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/). You can add generators through `requestSnippets`. Scalar generates examples for JavaScript, Python, Go, Java, C#, PHP, Ruby, Swift, Kotlin, shell, and more, across several HTTP clients each, and respects `x-codeSamples` if you have written your own.

### Look and feel

Swagger UI's configuration documents syntax-highlight themes (agate, monokai, nord, and others) but no UI-wide dark mode option. Most teams restyle it with custom CSS. Scalar ships light and dark mode, 11 themes, and CSS variables for colour, font, and spacing, so matching your brand is usually a few lines.

## Setup: side by side

Swagger UI from a CDN:

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

Scalar from a CDN:

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

Inside a framework, it is usually one line. In ASP.NET Core, Microsoft's own [OpenAPI documentation](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents) has a section called "Use Scalar for interactive API documentation" next to the Swagger UI one:

```csharp
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.Run();
```

In Express:

```ts
import { apiReference } from '@scalar/express-api-reference'

app.use(
  '/reference',
  apiReference({
    url: '/openapi.json',
  }),
)
```

Other integrations are listed under [API reference integrations](/products/api-references/getting-started), including [FastAPI](/products/api-references/integrations/fastapi), [NestJS](/products/api-references/integrations/nestjs), [Django](/products/api-references/integrations/django), [Laravel](/products/api-references/integrations/laravel), [Spring Boot](/products/api-references/integrations/spring-boot), and [Rails](/products/api-references/integrations/ruby-on-rails). Scalar is also the default reference UI in Effect, ElysiaJS, HappyX, Litestar, Nitro, oRPC, Platformatic, and Spry.

## Beyond the renderer

Swagger UI is a renderer, and it does that job without asking anything of you. That is part of its appeal.

Scalar's renderer is also free and MIT licensed, and you can stop there. If you later want more, the same OpenAPI document can drive a hosted [docs site](/products/docs) with Markdown guides and custom domains, [SDKs](/products/sdk-generator) in TypeScript, Python, and Go (with more languages experimental), a [registry](/products/registry) with Spectral linting, and a hosted [MCP server](/products/agent/mcp) for AI agents. None of that is required to use the reference.

## Project health and pace

Both projects are actively maintained, so this is not a "dead project" argument. They simply move at different speeds and in different directions.

Swagger UI is a stable, conservative codebase. It merged [176 pull requests in 2025](https://github.com/swagger-api/swagger-ui/pulls?q=is%3Apr+is%3Amerged+merged%3A2025-01-01..2025-12-31), and its releases focus on specification support and fixes. That is a virtue if what you want is a component that rarely changes under you.

Scalar's monorepo, which holds the API reference, the API client, and the framework integrations, merged [2,075 pull requests in 2025](https://github.com/scalar/scalar/pulls?q=is%3Apr+is%3Amerged+merged%3A2025-01-01..2025-12-31). The reference is under heavy active development, which means new features arrive quickly and the UI changes more often. If you need a frozen UI, pin a version; the CDN and every integration accept one.

Neither number measures quality. They tell you what kind of project you are adopting: a mature, slow-moving standard, or a fast-moving product with a company behind it.

## When a renderer is not enough

Teams usually start looking beyond Swagger UI for one of three reasons, and it is worth checking which one is yours before you migrate anything.

**The docs need to be a site, not a page.** Swagger UI renders one OpenAPI document. Guides, a getting-started page, changelogs, and multiple APIs live somewhere else, usually in a separate static site generator that links out to the reference. Scalar Docs puts Markdown guides and one or more API references in the same site from a single `scalar.config.json`, with Git sync and a custom domain.

**Developers keep asking for an SDK.** Once a reference is good, the next request is a client library. With Scalar, the same OpenAPI document that renders your reference can generate TypeScript, Python, and Go SDKs, so the examples in the docs and the methods in the SDK come from the same source.

**Agents are calling the API.** A growing share of API traffic comes from AI agents. Scalar can host an MCP server generated from your OpenAPI document, with OAuth, so an agent can call the operations you choose without you deploying anything.

If none of those apply, the renderer comparison above is the whole story, and either tool is a reasonable choice.

## Pricing

| | Scalar | Swagger UI |
| --- | --- | --- |
| Open-source renderer | Free, [MIT](https://github.com/scalar/scalar) | Free, [Apache-2.0](https://github.com/swagger-api/swagger-ui) |
| Self-hosting | Free, any plan or no plan | Free |
| Hosted docs | Free plan: up to 3 APIs, 1 editor seat | Not part of Swagger UI |
| Paid tiers | [Pro $150/month](/pricing) ($125/month yearly), [Business $600/month](/pricing) ($500/month yearly), Enterprise custom | Not applicable |

If all you want is a reference page mounted in your app, both cost nothing. The paid Scalar plans are for the hosted platform: custom domains, Git sync, SDKs, MCP servers, SSO, and seats.

## Migration path

Moving from Swagger UI to Scalar does not require changing your OpenAPI document. In most setups it is a package swap and a handful of renamed options.

<scalar-steps>
  <scalar-step id="sw-swap" title="Swap the package or script tag">

Replace `swagger-ui-dist` or your framework's Swagger UI middleware with the matching Scalar integration. For Swashbuckle users on .NET 9 and later, use `Scalar.AspNetCore` with `MapOpenApi()` as shown above.

  </scalar-step>

  <scalar-step id="sw-options" title="Map your configuration">

Most options have a direct equivalent: `url` stays `url`, `urls` becomes `sources`, `persistAuthorization` becomes `persistAuth: true`, and `supportedSubmitMethods: []` becomes `hideTestRequestButton: true`. The full table is in the [migration guide](/resources/migration/swagger-ui#configuration-mapping).

  </scalar-step>

  <scalar-step id="sw-style" title="Pick a layout and theme">

Keep the familiar look with `layout: 'classic'`, or use the default modern layout. Choose one of the built-in themes or set a few CSS variables.

  </scalar-step>

  <scalar-step id="sw-check" title="Check auth and CORS">

Pre-fill security schemes with `authentication`, and set `proxyUrl` if your API does not allow requests from the docs origin.

  </scalar-step>
</scalar-steps>

Running a large internal fleet of Swagger UI instances? [Book a migration call](https://scalar.cal.com/) and we will help you plan it.

## Which should you choose?

**Stay on Swagger UI if** you need full OpenAPI 3.2 rendering today, you rely on custom Swagger UI plugins or layouts, or your users are used to it and the page does its job. There is no reason to switch a tool that works.

**Choose Scalar if** you want search, dark mode, and themes without custom CSS, a real API client in the docs rather than a form, code examples beyond cURL, or a path to hosted docs, SDKs, and MCP from the same document.

[Try it with your OpenAPI document](https://dashboard.scalar.com/register) or [talk to us](https://scalar.cal.com/).

## Frequently asked questions

<scalar-detail title="Is Scalar a drop-in replacement for Swagger UI?">
For most setups, yes. Both read the same OpenAPI document, and most Swagger UI options have a Scalar equivalent listed in the [migration guide](/resources/migration/swagger-ui). Custom Swagger UI plugins do not carry over and need to be rebuilt or dropped.
</scalar-detail>

<scalar-detail title="Is Swagger UI still maintained?">
Yes. It is maintained by SmartBear under the swagger-api GitHub organisation, and the npm package `swagger-ui-dist` published version [5.33.0](https://www.npmjs.com/package/swagger-ui-dist) in September 2026.
</scalar-detail>

<scalar-detail title="Does Swagger UI support OpenAPI 3.1 and 3.2?">
Yes. According to its [compatibility table](https://github.com/swagger-api/swagger-ui#compatibility), Swagger UI 5.19.0 and later support OpenAPI 3.1.0 through 3.1.2, and 5.32.0 and later add 3.2.0.
</scalar-detail>

<scalar-detail title="Is Scalar free like Swagger UI?">
The Scalar API reference and API client are MIT licensed and free to self-host, with no account. Paid plans cover the hosted platform, such as custom domains, SDKs, and MCP servers.
</scalar-detail>

<scalar-detail title="Can I keep the Swagger UI look in Scalar?">
Yes. Set `layout: 'classic'` for a layout that is close to Swagger UI, and pick a theme or override CSS variables to match your brand.
</scalar-detail>

<scalar-detail title="Should I expose Swagger UI or Scalar in production?">
Microsoft's [ASP.NET Core guidance](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents) recommends, as a security best practice for limiting information disclosure, enabling OpenAPI UIs (Swagger UI, ReDoc, and Scalar alike) only in development environments. That advice applies equally to both tools. If your API is public and documentation is the goal, a hosted or published reference is the usual answer.
</scalar-detail>

## Related

- **Learn:** [OpenAPI vs Swagger](/learn/openapi/openapi-vs-swagger) · [What is an API reference?](/learn/openapi/what-is-an-api-reference)
- **Docs:** [Migrate from Swagger UI](/resources/migration/swagger-ui) · [Swagger UI alternatives](/alternatives/swagger-ui) · [.NET API documentation](/docs-for/dotnet)
- **Product:** [API References](/products/api-references) — the open-source renderer, with a full API client built in

---

*This comparison is based on Swagger UI's public repository, npm releases, and configuration documentation as of September 2026, and on Scalar's own source. Both projects release frequently. We have made a genuine effort to be accurate and to state where Swagger UI is better. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
