# Scalar for Developer Portals

A developer portal is the front door to your API: the reference, the guides, the client libraries, and the tools a developer needs to make a first call. Scalar builds all of that from the OpenAPI document your team already maintains. The API reference, the SDKs, the hosted MCP server, and the guides around them ship from one platform and stay in sync as your API changes.

This page describes what a developer portal on Scalar includes, how it compares to ReadMe and Mintlify, and what it costs. Real portals built on Scalar are linked at the bottom, so you can judge the output rather than the pitch.

## At a glance

| Portal component | On Scalar |
| --- | --- |
| API reference | Generated from your OpenAPI document, with built-in request testing |
| Guides and landing pages | Markdown and MDX, synced from GitHub with preview deployments |
| API client | Built into the reference; also a standalone open-source client |
| SDKs | Generated from the same OpenAPI document, published through your own repositories |
| MCP servers | Docs MCP at `your-domain/mcp`, plus hosted MCP servers for calling your API |
| AI assistant | Ask AI, enabled by default on every Scalar Docs project |
| Versioning | Multiple documentation versions with a version selector |
| Custom domains | Included on Pro, plus a free subdomain on `apidocumentation.com` |
| Access control | Email domain access groups on Pro; SSO/SAML and RBAC on Enterprise |

## What a Scalar developer portal includes

**An API reference generated from OpenAPI.** [Scalar Docs](../guides/docs/index.md) renders your OpenAPI document into interactive documentation with request testing built in. The renderer is MIT licensed, so you can theme it with CSS variables, add custom HTML, CSS, and JavaScript, or fork it outright if you need behaviour we did not anticipate.

**Guides written in Markdown or MDX.** Product guides, tutorials, and landing pages live beside the reference in one navigation. Content is pulled from GitHub, every pull request gets a preview deployment, and merges deploy automatically — or you publish from the CLI. All of scalar.com, including this page, is built with Scalar Docs from a single `scalar.config.json`.

**A built-in API client.** Developers test endpoints directly in the reference — no separate tool to install, no context switch. Scalar also ships a standalone, open-source [API client](../guides/app/index.md) for desktop and web, with environments, collections, and Postman-compatible scripting, so the testing workflow developers start in your docs continues after they leave them.

**SDKs in the languages your users ask for.** The [SDK Generator](../guides/sdks/index.mdx) produces idiomatic, type-safe client libraries — TypeScript, Python, C#, Java, PHP, Go, Ruby, Rust, Swift, and Dart — from the same OpenAPI document that renders the reference, and publishes them from your own repositories through pull requests you control.

**MCP servers for AI clients.** Scalar exposes [two MCP surfaces](../guides/agent/index.md): a Docs MCP at `your-docs-domain/mcp` that lets tools like Cursor and Claude Code search and read your published documentation, and hosted MCP servers that let AI clients call the API endpoints you select, with delegated authentication so agents never receive your upstream credentials.

**Ask AI.** An AI assistant is enabled by default on every Scalar Docs project. It searches your published documentation and combines information from multiple pages into a short, sourced answer — no setup required.

## One document keeps it in sync

Most portal stacks assemble these pieces from separate vendors: a docs platform, an SDK vendor, an API client, an MCP gateway. Each one holds its own copy of your API description, and each copy drifts.

On Scalar, the single source of truth is literal. In the SDK generator, `docs` is a build target alongside the language targets — one generation run emits the SDKs, a static API reference, and the exact OpenAPI artifact the SDKs were generated from. Your reference and your client libraries cannot describe different APIs, because they are produced from the same compiled document in the same run. With Git sync, one commit to your OpenAPI document updates the reference, regenerates the SDKs, and refreshes the MCP server together.

## Who it is for

- **API-first companies** whose product is the API, and whose portal is the product page, the manual, and the toolbox at once.
- **Developer tools companies** where documentation quality is judged by developers who read a lot of documentation.
- **Teams shipping public APIs** that need the surrounding infrastructure: multiple documentation [versions](../guides/docs/configuration/versions.md) with a version selector, [custom domains](../guides/docs/configuration/domains.md), and access control — from email domain access groups on Pro to SSO/SAML and RBAC on Enterprise.

## How it compares to ReadMe and Mintlify

Both are credible choices for a developer portal, and the honest comparison is about product shape rather than quality.

**ReadMe** specializes in developer hubs with real API usage data inside them. Their [Developer Dashboard](https://docs.readme.com/main/docs/developer-dashboard) shows who is calling your API, personalized docs surface each developer's own API keys and logs, and their [API metrics](https://readme.com/metrics) report call volume, endpoint usage, and errors. Scalar does not have an equivalent of those API analytics dashboards today. ReadMe offers a per-project [MCP server](https://docs.readme.com/main/docs/readmes-mcp-server) for searching and reading docs content, and their [`api`](https://api.readme.dev/docs/getting-started) tool generates TypeScript SDKs; Scalar's SDK generator covers ten languages with publishing to package registries, and its hosted MCP servers can call your API with delegated authentication.

**Mintlify** focuses on documentation polish: strong theming, localization across 30+ locales, and unlimited editor seats on a flat price. Mintlify does not generate SDKs — it renders code samples from third-party generators such as [Speakeasy](https://www.mintlify.com/docs/integrations/sdks/speakeasy) and [Stainless](https://www.mintlify.com/docs/integrations/sdks/stainless). We publish a detailed [Scalar vs Mintlify](../compare/mintlify.md) comparison.

**Scalar** is the option in this group that also generates SDKs and hosts MCP servers from the same OpenAPI document that renders the reference, ships a standalone open-source API client alongside the docs, and licenses the documentation renderer under MIT so the portal layer is yours to keep.

## Pricing

Scalar publishes its prices, so you can work out what a portal costs without talking to sales. Full details are on the [pricing page](../guides/pricing.md).

- **Free ($0)** — hosted OpenAPI docs, the built-in API client, and one editor seat. Enough to put a real reference online.
- **Pro ($72/month)** — the full developer portal: custom domains and subdomains, Git Sync, Markdown and MDX, guides, versions, landing pages, email domain access control, and hosted MCP servers. Each SDK language is a $100/month add-on.
- **Enterprise (custom)** — adds SSO/SAML, RBAC, priority support with SLAs, migration services, and a dedicated Slack or Teams channel. [Book a demo](https://scalar.cal.com/).

## Portals built on Scalar

The clearest way to evaluate a portal platform is to use a portal built on it:

- **[Bobcat developer portal](https://developer.bobcat.com/)** — the American manufacturer of farm and construction equipment runs its public developer portal on Scalar.
- **[Thomson Reuters developer platform](https://developers.thomsonreuters.com/pages/api-reference/19232a0d-5cf9-53a9-a215-efe481550832)** — API references for the provider of software and decision tools for legal and accounting companies.
- **[Clerk](https://clerk.com/docs/reference/frontend-api)** — the authentication and user management platform renders its API reference with Scalar.
- **[PAR developer portal](https://developers.partech.com)** — PAR Technology's portal for the Punchh Loyalty platform, migrated from a legacy platform to Scalar with a docs-as-code workflow in GitHub. The full story is in the [PAR case study](../guides/customers/partech.md).

## Get started

[Start free](https://dashboard.scalar.com/register), review [pricing](../guides/pricing.md), or [book a demo](https://scalar.cal.com/) and we will walk through your portal with you.

---

*This page describes Scalar's developer portal capabilities as of July 2026, based on Scalar's own documentation and pricing. Claims about ReadMe and Mintlify link to their public documentation. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
