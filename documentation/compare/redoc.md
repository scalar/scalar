# Scalar vs Redoc

*Last updated: September 2026*

Redoc is the open-source OpenAPI renderer behind the familiar three-panel reference: navigation on the left, documentation in the middle, request and response examples on the right. It is MIT licensed, maintained by Redocly, and ships by default in frameworks such as [FastAPI](https://fastapi.tiangolo.com/features/). For a clean, static, read-only reference, it is still one of the best-looking options there is.

This page is written by Scalar, so read it with that in mind. Every claim we make about Redoc links to its own repository, documentation, or package registry. If we have something wrong, tell us and we will fix it.

**A note on scope.** This page compares the two open-source renderers: Redoc and the Scalar API Reference, both of which you can drop into any page for free. Redocly the company also sells a commercial platform (Realm, Revel, Reef, and Redocly CLI tooling) with a try-it console, governance, and hosted portals. That is a different comparison, and it has its own page: [Scalar vs Redocly](/resources/compare/redocly).

The short version: Redoc is a polished, read-focused renderer. Scalar is a renderer with a full API client inside it. If your readers only need to read, Redoc does that very well. If they need to send a request from the docs, the open-source Redoc does not do that, and Scalar does.

## At a glance

| | Scalar API Reference | Redoc (community edition) |
| --- | --- | --- |
| Licence | [MIT](https://github.com/scalar/scalar) | [MIT](https://github.com/Redocly/redoc) |
| Maintainer | Scalar | [Redocly](https://github.com/Redocly/redoc) |
| OpenAPI versions | Swagger 2.0, OpenAPI 3.0, 3.1; 3.2 features [landing incrementally](https://github.com/scalar/scalar/blob/main/packages/api-reference/CHANGELOG.md) | [Swagger 2.0, OpenAPI 3.0, 3.1](https://github.com/Redocly/redoc) |
| Layout | Modern (sidebar + content) or classic | [Three-panel, responsive](https://github.com/Redocly/redoc) |
| Try-it console | Yes, a full API client | No; a [hosted Redocly feature](https://github.com/Redocly/redoc) |
| Automatic code samples | Yes, many languages and HTTP clients | No; hand-written via [`x-codeSamples`](https://github.com/Redocly/redoc), automatic samples are a hosted feature |
| Search | Yes | Yes |
| Theming | Light and dark mode, 11 themes, CSS variables | Configurable `theme` option |
| Deployment | CDN script, 35+ framework integrations, React, Vue, Docker, CLI | [HTML tag, React component, Docker image, CLI](https://github.com/Redocly/redoc) |
| Latest release | Continuous; see [npm](https://www.npmjs.com/package/@scalar/api-reference) | [2.5.4 on npm](https://www.npmjs.com/package/redoc), September 2026 |

## Where Redoc is stronger

**The reading experience is excellent.** Redoc's three-panel layout, with examples pinned alongside the text as you scroll, is a design many teams specifically want. Long descriptions, nested schemas, and discriminated unions read very well. It was designed for reading, and it shows.

**Static by design.** Redoc does not send requests, which also means there is nothing to configure for CORS, no proxy, and no question about credentials in the browser. If your security team would rather your public docs never make a call to your API, Redoc's model is the simpler one to approve.

**`x-tagGroups` and friends.** Redoc popularised vendor extensions such as [`x-tagGroups`](https://github.com/Redocly/redoc) for grouping tags in the side menu and `x-codeSamples` for hand-written examples. Many OpenAPI documents in the wild already use them, and they work out of the box. Scalar reads both too, so this is a shared strength rather than a gap, but Redoc got there first.

**Longevity.** The repository dates back to 2015 and has around 25,900 stars. It has rendered a very large number of real-world OpenAPI documents, including a lot of malformed ones.

**A clear roadmap.** Redoc's README announces that ["Redoc 3.0 is coming"](https://github.com/Redocly/redoc) as one renderer for OpenAPI 3.2, AsyncAPI, GraphQL, and MCP. If that lands as described, the gap on newer formats will narrow. As of September 2026 the latest npm release is in the 2.x line.

## Redoc vs Scalar

### Reading versus doing

This is the whole comparison in one sentence: Redoc's community edition documents an API, and Scalar's documents an API and lets the reader call it.

Redoc's README lists the try-it console, automated code samples, fully custom styles, a mock server, AsyncAPI, and GraphQL as [features of the hosted product](https://github.com/Redocly/redoc) rather than the community edition. None of that is hidden. It is a reasonable business model. It does mean that if you want interactive docs on open source, Redoc is not the tool, and teams often end up running Swagger UI next to it for testing.

Scalar puts an API client on every operation. It is the same open-source [API client](/products/api-client) Scalar ships as a desktop and web app: environments and variables, OAuth 2.0 flows, API keys, cookies, request history, streamed responses, and code snippets in many languages. There is no paid tier needed for any of that in the renderer.

### Code samples

Redoc shows code samples you write yourself, through `x-codeSamples`. That gives you total control over what developers copy, and it is the right approach if you have an official SDK and want every example to use it.

Scalar generates request examples automatically for JavaScript, Python, Go, Java, C#, PHP, Ruby, Swift, Kotlin, shell, and more, across multiple HTTP clients each. It also reads `x-codeSamples`, so hand-written samples such as SDK usage appear in the same example picker. If you use the [Scalar SDK generator](/products/sdk-generator), SDK usage samples are injected into your OpenAPI document as `x-codeSamples` automatically.

### Layout

Redoc's three panels suit wide screens and long, prose-heavy descriptions. Scalar's default layout puts navigation on the left and pairs each operation's description with its request and response examples, with a client one click away. There is also a `classic` layout. Which reads better is honestly a matter of taste, and we would suggest rendering your own document in both before deciding. It takes about five minutes.

### Theming

Redoc accepts a `theme` option for colours, typography, and spacing, which is flexible and means you describe your look in configuration. Scalar ships light and dark mode, 11 built-in themes, and CSS variables, so brand colours are a few lines.

### Where the docs live

Redoc offers four [deployment options](https://github.com/Redocly/redoc): the `@redocly/cli build-docs` command that writes a static HTML file, an HTML tag with a standalone bundle, a React component, and a Docker image. The static HTML build in particular is pleasantly simple and needs no server at all.

Scalar covers the same ground (CDN script, React and Vue components, a [Docker image](/products/api-references/integrations/docker), and static output) and adds 35+ framework integrations, so the reference can be served by the app that produces the OpenAPI document. See [Express](/products/api-references/integrations/express), [FastAPI](/products/api-references/integrations/fastapi), [NestJS](/products/api-references/integrations/nestjs), [ASP.NET Core](/products/api-references/integrations/aspnetcore/integration), [Laravel](/products/api-references/integrations/laravel), and [Django](/products/api-references/integrations/django).

## Setup: side by side

Redoc from a CDN, using the HTML tag documented in its README:

```html
<!doctype html>
<html>
  <head>
    <title>Redoc</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <redoc spec-url="/openapi.json"></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
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

In FastAPI, which ships both Swagger UI and Redoc by default, adding Scalar is a separate route next to them:

```python
from fastapi import FastAPI
from scalar_fastapi import add_scalar_reference

app = FastAPI()

add_scalar_reference(app)  # serves the reference at /scalar
```

You can run all three side by side while you decide, then turn the others off with `redoc_url=None` and `docs_url=None`.

## Keeping hand-written extensions

If your OpenAPI document is tuned for Redoc, most of that work carries over.

| Redoc extension | In Scalar |
| --- | --- |
| `x-tagGroups` | Supported; groups tags in the sidebar |
| `x-codeSamples` | Supported, along with `x-code-samples` |
| `x-displayName` on tags | Supported |
| `x-enumDescriptions` | Use `x-enum-descriptions` (same shape) |

Check anything else you rely on against the [OpenAPI extensions reference](/products/api-references/openapi) before migrating. If something important is missing, [open an issue](https://github.com/scalar/scalar/issues); extension support is one of the areas where we move quickly.

## Beyond the renderer

Both renderers are free, and you can stop at the renderer with either.

On the Redoc side, the upgrade path is Redocly's commercial platform, which adds the try-it console, governance, and hosted portals, priced per seat. That is covered on [Scalar vs Redocly](/resources/compare/redocly).

On the Scalar side, the same OpenAPI document can drive a hosted [docs site](/products/docs) with Markdown guides, [SDKs](/products/sdk-generator) (TypeScript, Python, and Go generally available, more languages experimental), a [registry](/products/registry) with Spectral linting, and a hosted [MCP server](/products/agent/mcp). None of it is needed to use the reference.

## Pricing

| | Scalar | Redoc |
| --- | --- | --- |
| Open-source renderer | Free, [MIT](https://github.com/scalar/scalar) | Free, [MIT](https://github.com/Redocly/redoc) |
| Try-it in the free renderer | Included | Not included; [hosted Redocly feature](https://github.com/Redocly/redoc) |
| Hosted entry tier | Free plan (up to 3 APIs); [Pro $150/month](/pricing) flat with 5 editor seats | [Redocly Pro $10 per seat/month](https://redocly.com/pricing), 1 project, 100 pages |
| Next tier | [Business $600/month](/pricing): SSO, subpath hosting, 10 seats | [Redocly Enterprise $24 per seat/month](https://redocly.com/pricing): 500 pages, SSO, RBAC |
| Top tier | Enterprise, custom | [Enterprise+](https://redocly.com/pricing), custom, billed yearly |

Scalar Pro is $125/month and Business $500/month when billed yearly. Redocly lists a [30-day free trial](https://redocly.com/pricing) on paid plans. For a small team that only needs hosted reference docs with try-it, Redocly Pro can be cheaper; the fuller analysis is on the [Redocly page](/resources/compare/redocly).

## Migration path

<scalar-steps>
  <scalar-step id="rd-render" title="Render your document in Scalar">

Paste your OpenAPI URL into the CDN snippet above, or add the Scalar integration for your framework next to your existing Redoc route. Nothing in your OpenAPI document has to change.

  </scalar-step>

  <scalar-step id="rd-extensions" title="Check the extensions you use">

Compare your `x-` extensions against the table above. `x-tagGroups` and `x-codeSamples` work as-is.

  </scalar-step>

  <scalar-step id="rd-look" title="Match the look">

Pick a theme, set brand colours with CSS variables, and choose the modern or classic layout.

  </scalar-step>

  <scalar-step id="rd-auth" title="Set up try-it">

Because Scalar sends real requests, configure pre-filled `authentication` for your security schemes and set `proxyUrl` if your API does not allow browser requests from the docs origin.

  </scalar-step>

  <scalar-step id="rd-switch" title="Switch the route">

When you are happy, point your docs route at Scalar and remove the Redoc bundle.

  </scalar-step>
</scalar-steps>

Moving a hosted Redocly portal rather than a Redoc embed is a bigger job. [Book a migration call](https://scalar.cal.com/) and we will plan it with you.

## Which should you choose?

**Stay on Redoc if** your docs are read-only by design, you love the three-panel layout, your code samples are all hand-written through `x-codeSamples`, or your security team prefers docs that never send requests.

**Choose Scalar if** you want readers to test the API from the docs without a paid tier, you want generated code examples in many languages, you want dark mode and themes without writing a theme object, or you want the reference mounted inside your framework with a path to hosted docs, SDKs, and MCP.

[Try it with your OpenAPI document](https://dashboard.scalar.com/register) or [talk to us](https://scalar.cal.com/).

## Frequently asked questions

<scalar-detail title="What is the difference between Redoc and Redocly?">
Redoc is the open-source, MIT-licensed renderer. Redocly is the company that maintains it and sells a commercial platform built around it, including a try-it console, governance tooling, and hosted developer portals. See [Scalar vs Redocly](/resources/compare/redocly) for the platform comparison.
</scalar-detail>

<scalar-detail title="Does Redoc have a try-it-out feature?">
Not in the open-source community edition. Redoc's README lists the [try-it console](https://github.com/Redocly/redoc) as a feature of Redocly's hosted product. Scalar's open-source renderer includes a full API client on every operation.
</scalar-detail>

<scalar-detail title="Does Redoc support OpenAPI 3.1?">
Yes. Redoc supports [OpenAPI 3.1, 3.0, and Swagger 2.0](https://github.com/Redocly/redoc). Its README says Redoc 3.0 will add OpenAPI 3.2, AsyncAPI, GraphQL, and MCP.
</scalar-detail>

<scalar-detail title="Can Scalar use my x-tagGroups and x-codeSamples?">
Yes. Scalar reads both. Tag groups appear in the sidebar, and hand-written code samples appear in the example picker. See the [OpenAPI extensions reference](/products/api-references/openapi) for details.
</scalar-detail>

<scalar-detail title="Can I run Redoc and Scalar at the same time?">
Yes. They read the same OpenAPI document, so you can serve each on its own route while you compare them. FastAPI users can keep `/redoc` and add a `/scalar` route.
</scalar-detail>

<scalar-detail title="Is Scalar free like Redoc?">
The Scalar API reference and API client are MIT licensed and free to self-host with no account. Paid plans cover hosted docs, custom domains, SDKs, and MCP servers.
</scalar-detail>

## Related

- **Learn:** [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [API documentation best practices](/learn/openapi/api-documentation-best-practices)
- **Docs:** [API reference getting started](/products/api-references/getting-started) · [Redoc alternatives](/alternatives/redoc) · [Scalar vs Redocly](/resources/compare/redocly)
- **Product:** [API References](/products/api-references) — the open-source renderer, with try-it built in rather than sold separately

---

*This comparison is based on Redoc's public repository, README, and npm releases as of September 2026, and on Scalar's own source. It covers the open-source Redoc renderer only; Redocly's commercial products are compared separately. We have made a genuine effort to be accurate and to state where Redoc is better. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
