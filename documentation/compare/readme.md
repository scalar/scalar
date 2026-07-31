# Scalar vs ReadMe

ReadMe has been rendering OpenAPI documents into developer hubs since 2014, and a lot of what the category now takes for granted — interactive API references, personalized onboarding, developer metrics — they shipped first. If you are choosing a developer portal platform, they belong on your shortlist.

This page is written by Scalar, so read it with that in mind. Every claim we make about ReadMe links to their own documentation, pricing page, or public repositories. If we have something wrong, tell us and we will fix it.

The short version: ReadMe is a hosted developer hub with the best built-in API analytics in the category. Scalar is a platform where the documentation layer is MIT licensed and embeddable in the application you already run, shipped alongside a standalone API client and native SDK generation. Which matters more depends on whether you need to observe your developers or own your docs.

## At a glance

| | Scalar | ReadMe |
| --- | --- | --- |
| Docs renderer | MIT, self-hostable on any plan | Closed; hosted only |
| Interactive API reference | Yes | Yes |
| Standalone API client | Yes, open source | No — in-docs API explorer |
| SDK generation | Native — TypeScript, Python, C#, Java, PHP, Go | TypeScript/JavaScript via the `api` CLI |
| API analytics | — | Yes — Developer Dashboard and Metrics |
| Personalized docs with user API keys | Yes | Yes |
| Hosted MCP server | Yes | Yes |
| Git sync | Yes | Yes, bi-directional |
| Versioning | Yes | Yes — 1 version free, unlimited on Pro |
| Framework integrations | 35 | None |
| Entry paid tier | $72/month | $250/month, billed annually |

## Where ReadMe is stronger

We would rather you hear this from us than find out after switching.

**API analytics is ReadMe's flagship, and nothing on our side matches it.** ReadMe's [Developer Dashboard](https://docs.readme.com/main/docs/developer-dashboard) shows which endpoints get called, which return errors, and which developers are struggling — filterable by API key, email, company, and endpoint, with trends across day, week, month, quarter, and year. Your developers see their own recent API logs directly in the hub, which makes troubleshooting a support conversation shorter or unnecessary. The honest caveat is that the data does not appear by itself: you integrate ReadMe's Metrics SDK into your backend (Node, PHP, and Python are documented) so your API forwards request logs to ReadMe. Scalar has no equivalent of this today. If per-developer API observability inside your docs is the thing you are buying, ReadMe is the product that has it.

**Free-tier generosity.** ReadMe's [Starter plan](https://readme.com/pricing) is $0 and includes a custom domain, the interactive API reference, bi-directional Git sync, usage metrics, and an MCP server. That is a lot of product before anyone pays.

## Documentation

Both products render an OpenAPI document into a documentation site with an interactive playground, support [bi-directional Git sync](https://docs.readme.com/main/docs/bi-directional-sync) (ReadMe through GitHub or GitLab and the open-source [`rdme` CLI](https://github.com/readmeio/rdme), Scalar through Git Sync on Pro), and support [versioned docs](https://docs.readme.com/main/docs/versions). The differences are in ownership and placement.

**Scalar's renderer is MIT licensed.** You get themes and CSS variables, arbitrary custom HTML, CSS, and JavaScript, and the option to fork the renderer outright if you need behaviour we did not anticipate. ReadMe's platform is hosted-only with no self-hosted distribution; the one piece of the rendering stack that was public, the legacy [`api-explorer`](https://github.com/readmeio/api-explorer), was archived in November 2022 when ReadMe redesigned its reference guide. Custom MDX components, CSS, and HTML are available on ReadMe's Pro plan and above, but the ceiling is whatever the platform exposes.

**Scalar's docs can live inside your application.** Thirty-five framework integrations — Express, Fastify, Hono, NestJS, Next.js, Nuxt, Laravel, Django, Rails, Go, Rust, ASP.NET Core, Spring Boot, and more. You mount the reference inside the app you already run, at whatever route you choose. ReadMe has no framework middleware; your hub lives on a ReadMe-hosted domain (custom domains included, on every plan).

**The site you are reading is the product.** scalar.com — this page, the pricing page, the guides, the API reference, and the blog — is built and hosted entirely on [Scalar Docs](/products/docs) from a single `scalar.config.json`. We do not maintain a separate marketing stack.

## SDKs

Scalar generates SDKs natively in TypeScript, Python, C#, Java, PHP, and Go from the same OpenAPI document that renders your reference, in the same run, so your docs and your client libraries cannot describe different APIs. Each language target is a published [$100/month add-on](/pricing).

ReadMe's SDK story is narrower. Their open-source [`api` package](https://api.readme.dev/docs/getting-started) generates a TypeScript or JavaScript client from an OpenAPI definition — but it is a CLI your API consumers run themselves, in one language family, not a managed pipeline that generates, versions, and publishes packages to registries on your behalf. Teams on ReadMe who want multi-language SDKs typically add a third-party generator such as [APIMatic](https://www.apimatic.io/integrations/readme), which brings back the separate-vendor problem: your documentation's code samples then depend on a company you did not choose.

## The API client

Scalar ships a standalone, open-source API client — desktop and web, offline-first, with environments, Postman-compatible scripting, and code generation for 40+ HTTP clients. ReadMe's [API explorer](https://docs.readme.com/main/docs/openapi) lets developers make authenticated requests directly inside the documentation — it is a good in-docs experience. The difference is whether your users get a tool they can keep using once they have left the docs. There is no ReadMe client to download.

## MCP servers and AI

Both products ship this. ReadMe generates [an MCP server from your documentation](https://docs.readme.com/main/docs/readmes-mcp-server) with a toggle, on every plan, so AI coding assistants can list endpoints, inspect schemas, and call your API. Their Ask AI chat is a [$150/month add-on](https://readme.com/pricing). Scalar hosts MCP servers on the [Pro plan](/pricing), alongside `llms.txt` generation and docs chat, metered through Agent Scalar credits. If MCP hosting is on your checklist, neither product decides it for you.

## Pricing

Scalar: Free at $0, [Pro at $72/month](/pricing), SDK language targets at $100/month each, Enterprise custom.

ReadMe: [Starter at $0, Pro at $250/month billed annually, Enterprise from $3,000/month](https://readme.com/pricing), with Ask AI as a $150/month add-on. Team collaboration, private docs, custom MDX, and CSS/HTML all start at Pro, so the realistic entry point for a team is $250/month. You may find older ReadMe pricing quoted around the web at $99/month; that reflects a previous pricing model, so check their current page.

Both companies publish their numbers, which we appreciate — you can work out what either costs without talking to sales.

## Which should you choose?

**Choose ReadMe if** built-in API analytics and per-developer observability are what you are buying, or their free tier already covers what you need.

**Choose Scalar if** you want a documentation layer you own outright under MIT, you want docs mounted inside your existing application rather than only on a hosted site, you want SDKs in six languages generated from the same OpenAPI document as your docs, you want a real API client alongside your reference, or you want a paid tier that starts at $72 rather than $250.

[Start free](https://dashboard.scalar.com/register) or [talk to us](https://scalar.cal.com/).

---

*This comparison is based on ReadMe's publicly available documentation, pricing page, and public GitHub repositories as of July 2026, and on Scalar's own source. Products in this category change quickly. We have made a genuine effort to be accurate and to state where ReadMe is better. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
