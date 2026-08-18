# OpenAPI Documentation with Scalar

Scalar takes an OpenAPI document and turns it into an interactive API reference — and, from the same document, an API client, generated SDKs, and an MCP server. This page explains what happens to your OpenAPI document when you bring it to Scalar, which versions are supported, how the documentation stays in sync with the API, and what is open source.

If you are evaluating documentation tools around an existing OpenAPI document, this is the summary. The detailed guides are linked throughout.

## At a glance

| | |
| --- | --- |
| Input | OpenAPI 3.0, OpenAPI 3.1; Swagger 2.0 documents are upgraded on load |
| Output | Interactive API reference, API client, SDKs, MCP server — from one document |
| Renderer license | MIT, at [github.com/scalar/scalar](https://github.com/scalar/scalar) |
| Framework integrations | More than 35 — Express, Fastify, Hono, NestJS, Next.js, FastAPI, Django, Rails, Laravel, ASP.NET Core, Spring Boot, and more |
| Where it runs | Hosted on Scalar, self-hosted, or mounted inside your own application |
| Staying in sync | Automatic redeploys from Git or from the Scalar Registry |
| Price | Free hosted docs; Pro at $150/month with one SDK included; additional SDKs at $150/month each |

## What Scalar does with an OpenAPI document

Your OpenAPI document is the input for every interface Scalar produces:

- **An interactive API reference.** Every operation, schema, and example in the document is rendered as browsable documentation with code samples for popular HTTP clients and languages, and a "Test Request" button on every operation.
- **An API client.** A standalone, open-source client — desktop and web, offline-first, with environments, Postman-compatible scripting, and code generation for 40+ HTTP clients. It imports the same document your docs are built from.
- **SDKs.** The [SDK generator](../guides/sdks/getting-started.md) compiles the document into client libraries. `docs` is a build target alongside the language targets: one generation run emits the SDKs, a static API reference, and the exact augmented document both were produced from. The reference and the client libraries cannot describe different APIs, because they come from the same compiled document in the same run.
- **An MCP server.** Scalar spins up [MCP servers](../guides/agent/mcp.md) from your OpenAPI document, so AI agents can call the endpoints you choose to expose, with the authentication you configure.

The phrase "single source of truth" gets used loosely in this category. Here it is literal: the OpenAPI document is the artifact everything else is generated from, and there is no second copy to drift.

## OpenAPI 3.0, 3.1, and Swagger 2.0

Scalar renders documents that follow the Swagger 2.0, OpenAPI 3.0, or OpenAPI 3.1 specification. Swagger 2.0 documents are upgraded on load, so a legacy document works without a manual conversion step first.

The upgrade logic is itself an open tool: [`@scalar/openapi-upgrader`](../guides/openapi-upgrader/getting-started.md) converts Swagger 2.0 to OpenAPI 3.0 or 3.1 (with experimental support for OpenAPI 3.2), as an npm package or a one-line CLI command:

```bash
npx @scalar/cli document upgrade swagger.json --output openapi.json
```

Scalar also reads a set of [OpenAPI extensions](../openapi.md) — `x-codeSamples` for custom SDK snippets, `x-tagGroups` for sidebar grouping, `x-scalar-ignore` for hiding operations, and others — including extensions written by other tools such as Stainless and ReadMe, so a document generated elsewhere renders correctly without edits.

## How the documentation stays in sync

The reference updates whenever the OpenAPI document changes. There are a few ways to wire that up, documented in the [deployment guides](../guides/docs/deployment/automatic-deployment.md):

- **Git.** Keep the document in your repository and enable automatic deployment: every merge into your default branch republishes the docs. Preview deployments and a [GitHub Actions workflow](../guides/docs/deployment/github-actions.md) are available when you want more control.
- **The Registry.** If your docs reference an OpenAPI document from the [Scalar Registry](../guides/registry/getting-started.md), updating that Registry document also triggers the docs to publish again.
- **The CLI.** `npx @scalar/cli project publish` deploys from your terminal or any CI/CD environment, without granting repository access.

There is no step where documentation is written separately from the API description and then reconciled. The document changes; the reference follows.

## Runs inside the framework you already use

Scalar ships more than 35 framework integrations, so the reference can be mounted inside the application that serves the API, at whatever route you choose — instead of living only on a separate hosted site:

- **JavaScript and TypeScript**: Express, Fastify, Hono, NestJS, Next.js, Nuxt, AdonisJS, ElysiaJS, Hapi, Nitro, Platformatic, SvelteKit, Astro, Ts.ED
- **Python**: FastAPI, Django, Django Ninja, Flask
- **PHP**: Laravel
- **Ruby**: Ruby on Rails
- **.NET**: ASP.NET Core, Aspire
- **Java**: Spring Boot, Micronaut
- **Go**, **Rust** (Actix Web, Axum, warp), and **Elixir**

If your framework is not on the list, the plain [HTML integration](../integrations/html-js.md) is a single script tag:

```html
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
<script>
  Scalar.createApiReference('#app', {
    url: '/openapi.json',
  })
</script>
```

## Open source, precisely

The Scalar API reference renderer and the API client are MIT licensed, developed in the open at [github.com/scalar/scalar](https://github.com/scalar/scalar). You can run them offline, without an account, embed them in your own product, self-host them on any plan, or fork them outright. This is open enough that GitBook's interactive API explorer is [powered by Scalar](https://gitbook.com/docs/api-references/openapi) — another documentation company ships the component inside their own product.

To be precise about the boundary: the documentation stack is open source; the SDK generator is not.

## What it costs

Pricing is published in full on the [pricing page](https://scalar.com/pricing):

- **Free** — $0. Hosted OpenAPI docs, the built-in API client, viewer seats, and one SDK for APIs up to 25 endpoints.
- **Pro** — $150/month. Custom domains, Git Sync, Markdown and MDX guides, hosted MCP servers, automated GitHub workflows, 3 editor seats, and one SDK for APIs up to 100 endpoints.
- **Business** — $600/month. Everything in Pro, plus SSO, access groups, 10 editor seats, and APIs up to 250 endpoints.
- **SDKs** — one included with every plan; additional SDKs are $150/month each, with volume discounts as you add more.
- **Enterprise** — custom pricing, with SAML, RBAC, and SLAs.

The MIT-licensed renderer is free regardless of plan, on your own infrastructure.

## Where to go next

- [Scalar Docs](../guides/docs/getting-started.md) — hosted documentation sites with guides, versions, and Git Sync
- [API Reference quickstart](../guides/api-references/getting-started.md) — render an OpenAPI document in a few lines of code
- [Create a free account](https://dashboard.scalar.com/register) — hosted docs from your OpenAPI document, at $0

---

*This page describes Scalar's products as of July 2026, based on Scalar's own documentation and source code. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
