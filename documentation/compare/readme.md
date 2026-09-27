# Scalar vs ReadMe

*Last updated: September 2026*

ReadMe has been rendering OpenAPI documents into developer hubs since 2014, and a lot of what the category now takes for granted — interactive API references, personalized onboarding, developer metrics — they shipped first. If you are choosing a developer portal platform, they belong on your shortlist.

This page is written by Scalar, so read it with that in mind. Every claim we make about ReadMe links to their own documentation, pricing page, or public repositories. If we have something wrong, tell us and we will fix it.

The short version: ReadMe is a hosted developer hub with the best built-in API analytics in the category. Scalar is a platform where the documentation layer is MIT licensed and embeddable in the application you already run, shipped alongside a standalone API client and native SDK generation. Which matters more depends on whether you need to observe your developers or own your docs.

## At a glance

| | Scalar | ReadMe |
| --- | --- | --- |
| Docs renderer | MIT, self-hostable on any plan | Closed; hosted only |
| Interactive API reference | Yes | Yes |
| Standalone API client | Yes, open source | No — in-docs API explorer |
| SDK generation | Native. Generally available: TypeScript, Python, Go, CLI; more targets experimental | TypeScript/JavaScript via the `api` CLI |
| API analytics | — | Yes — Developer Dashboard and Metrics |
| Personalized docs with user API keys | Yes | Yes |
| Hosted MCP server | Yes | Yes |
| Git sync | Yes | Yes, bi-directional |
| Versioning | Yes | Yes — 1 version free, unlimited on Pro |
| Framework integrations | 35 | None |
| Entry paid tier | $150/month | $250/month, billed annually |

## Where ReadMe is stronger

We would rather you hear this from us than find out after switching.

**API analytics is ReadMe's flagship, and nothing on our side matches it.** ReadMe's [Developer Dashboard](https://docs.readme.com/main/docs/developer-dashboard) shows which endpoints get called, which return errors, and which developers are struggling — filterable by API key, email, company, and endpoint, with trends across day, week, month, quarter, and year. Your developers see their own recent API logs directly in the hub, which makes troubleshooting a support conversation shorter or unnecessary. The honest caveat is that the data does not appear by itself: you integrate ReadMe's Metrics SDK into your backend (Node, PHP, and Python are documented) so your API forwards request logs to ReadMe. Scalar has no equivalent of this today. If per-developer API observability inside your docs is the thing you are buying, ReadMe is the product that has it.

**Free-tier generosity.** ReadMe's [Starter plan](https://readme.com/pricing) is $0 and includes a custom domain, the interactive API reference, bi-directional Git sync, usage metrics, and an MCP server. That is a lot of product before anyone pays.

## Documentation

Both products render an OpenAPI document into a documentation site with an interactive playground, support [bi-directional Git sync](https://docs.readme.com/main/docs/bi-directional-sync) (ReadMe through GitHub, GitLab, or Bitbucket and the open-source [`rdme` CLI](https://github.com/readmeio/rdme), Scalar through Git Sync on Pro), and support [versioned docs](https://docs.readme.com/main/docs/versions). The differences are in ownership and placement.

**Scalar's renderer is MIT licensed.** You get themes and CSS variables, arbitrary custom HTML, CSS, and JavaScript, and the option to fork the renderer outright if you need behaviour we did not anticipate. ReadMe's platform is hosted-only with no self-hosted distribution; the one piece of the rendering stack that was public, the legacy [`api-explorer`](https://github.com/readmeio/api-explorer), was archived in November 2022 when ReadMe redesigned its reference guide. Custom MDX components, CSS, and HTML are available on ReadMe's Pro plan and above, but the ceiling is whatever the platform exposes.

**Scalar's docs can live inside your application.** Thirty-five framework integrations — Express, Fastify, Hono, NestJS, Next.js, Nuxt, Laravel, Django, Rails, Go, Rust, ASP.NET Core, Spring Boot, and more. You mount the reference inside the app you already run, at whatever route you choose. ReadMe has no framework middleware; your hub lives on a ReadMe-hosted domain (custom domains included, on every plan).

**The site you are reading is the product.** scalar.com — this page, the pricing page, the guides, the API reference, and the blog — is built and hosted entirely on [Scalar Docs](../guides/docs/index.md) from a single `scalar.config.json`. We do not maintain a separate marketing stack.

## SDKs

Scalar generates SDKs natively from the same OpenAPI document that renders your reference, in the same run, so your docs and your client libraries cannot describe different APIs. TypeScript, Python, Go, and a CLI are generally available; Java, Kotlin, Ruby, C#, PHP, Rust, Swift, Dart, and C++ are experimental. One language target is included with every plan; additional targets start at a published [$150/month each](../guides/pricing.md).

ReadMe's SDK story is narrower. Their open-source [`api` package](https://api.readme.dev/docs/getting-started) generates a TypeScript or JavaScript client from an OpenAPI definition — but it is a CLI your API consumers run themselves, in one language family, not a managed pipeline that generates, versions, and publishes packages to registries on your behalf. Teams on ReadMe who want multi-language SDKs typically add a third-party generator such as [APIMatic](https://www.apimatic.io/integrations/readme), which brings back the separate-vendor problem: your documentation's code samples then depend on a company you did not choose.

## The API client

Scalar ships a standalone, open-source API client — desktop and web, offline-first, with environments, Postman-compatible scripting, and code generation for 40+ HTTP clients. ReadMe's [API explorer](https://docs.readme.com/main/docs/openapi) lets developers make authenticated requests directly inside the documentation — it is a good in-docs experience. The difference is whether your users get a tool they can keep using once they have left the docs. There is no ReadMe client to download.

## MCP servers and AI

Both products ship this. ReadMe generates [an MCP server for your API](https://docs.readme.com/main/docs/generate-your-own-mcp-server) with a toggle. The OpenAPI tools, which let AI coding assistants list endpoints, inspect schemas, and call your API, are available on every plan; the documentation search tools need ReadMe's AI add-on. Their Ask AI chat is a [$150/month add-on](https://readme.com/pricing). Scalar hosts MCP servers on the [Pro plan](../guides/pricing.md), alongside `llms.txt` generation and docs chat, metered through Agent Scalar credits. If MCP hosting is on your checklist, neither product decides it for you.

## Pricing

Scalar: Free at $0, [Pro at $150/month](../guides/pricing.md) with one SDK target and 5 editor seats included, Business at $600/month with SSO and 10 seats, additional SDK targets at $150/month each for up to 100 endpoints or $600/month each for 101–250 endpoints, Enterprise custom. Business teams can use both price bands, and the included SDK applies to the most expensive band first.

ReadMe: [Starter at $0, Pro at $250/month billed annually, and Enterprise on a custom quote with annual billing only](https://readme.com/pricing), with Ask AI as a $150/month add-on. Team collaboration, private docs, custom MDX, and CSS/HTML all start at Pro, so the realistic entry point for a team is $250/month. You may find older ReadMe pricing quoted around the web at $99/month; that reflects a previous pricing model, so check their current page.

| Plan | Scalar ([pricing](https://scalar.com/pricing)) | ReadMe ([pricing](https://readme.com/pricing)) |
| --- | --- | --- |
| Free | $0: 1 editor seat, up to 3 APIs, 1 SDK up to 25 endpoints | Starter, $0: custom domain, API reference, Git sync, usage metrics, MCP server, 1 version |
| Entry paid | Pro, $150/month ($125/month billed yearly), 5 editor seats, 1 SDK | Pro, $250/month billed annually: collaboration, private docs, custom MDX, CSS/HTML, unlimited versions |
| Mid tier | Business, $600/month ($500/month billed yearly), 10 editor seats, SSO | — |
| Top tier | Enterprise, custom | Enterprise, contact us, annual billing only |
| AI add-ons | Agent Scalar credits included on every plan | Ask AI, $150/month |

Prices checked on 26 September 2026.

Both companies publish their self-serve prices, which we appreciate — you can work out what the entry tiers cost without talking to sales.

## ReadMe vs Scalar

If you are on ReadMe today, the thing to protect is your metrics. If your support and developer relations teams live in the Developer Dashboard, look up a customer by API key, and read their recent requests before replying to a ticket, that workflow is ReadMe's and Scalar does not replace it. Stay on ReadMe if that is the job your docs do.

Scalar is the better fit when the docs themselves are the constraint. Common reasons teams move: they want the reference to live inside their own application instead of on a hosted hub, they want an MIT-licensed renderer they can fork, or they need SDKs in more than one language family and would rather not add a separate SDK vendor to keep ReadMe's code samples current.

Moving the content is straightforward in principle. Your OpenAPI document renders in Scalar as it is, and ReadMe guides are Markdown that you sync from Git. Code samples you attached with `x-readme.code-samples` are read by Scalar's reference and carry across. ReadMe-specific MDX components and custom CSS will need rewriting. Plan the move around those, not around the API reference.

## Which should you choose?

**Choose ReadMe if** built-in API analytics and per-developer observability are what you are buying, or their free tier already covers what you need.

**Choose Scalar if** you want a documentation layer you own outright under MIT, you want docs mounted inside your existing application rather than only on a hosted site, you want SDKs generated from the same OpenAPI document as your docs, in more than one language family, you want a real API client alongside your reference, or you want a paid tier that starts at $150 rather than $250.

[Start free](https://dashboard.scalar.com/register) or [talk to us](https://scalar.cal.com/).

## Frequently asked questions

<scalar-detail title="How much does ReadMe cost?">

As of September 2026, [ReadMe's pricing page](https://readme.com/pricing) lists Starter at $0, Pro at $250 per month billed annually, and Enterprise on a custom quote with annual billing only. Ask AI is a $150 per month add-on. Scalar Pro is $150 per month, or $125 per month billed yearly.

</scalar-detail>

<scalar-detail title="Does Scalar have API analytics like ReadMe's Developer Dashboard?">

No. ReadMe's [Developer Dashboard](https://docs.readme.com/main/docs/developer-dashboard), fed by its Metrics SDK, shows per-developer API usage and errors inside your docs. Scalar has no equivalent today. If that is what you are buying, ReadMe is the better choice.

</scalar-detail>

<scalar-detail title="Can I self-host ReadMe?">

ReadMe is hosted only. Scalar's API reference is MIT licensed and can be self-hosted on any plan, or mounted inside your own application through one of its framework integrations.

</scalar-detail>

<scalar-detail title="Will my ReadMe code samples work in Scalar?">

Yes, if they live in your OpenAPI document. Scalar's reference reads `x-readme.code-samples` alongside `x-codeSamples`, so custom samples show up without edits. ReadMe-specific MDX components and custom CSS need to be rebuilt.

</scalar-detail>

<scalar-detail title="Does ReadMe generate SDKs?">

ReadMe's open-source [`api` package](https://api.readme.dev/docs/getting-started) generates a TypeScript or JavaScript client that your API consumers run themselves. For managed multi-language SDKs, ReadMe customers usually add a separate generator. Scalar generates and publishes SDKs from the same OpenAPI document as your docs.

</scalar-detail>

## Related

- **Learn:** [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [API documentation best practices](/learn/openapi/api-documentation-best-practices)
- **Docs:** [Scalar Docs guide](../guides/docs/index.md) · [ReadMe alternatives](/alternatives/readme)
- **Product:** [Scalar Docs](/products/docs) — hosted or self-hosted docs with an MIT renderer, SDKs and MCP from the same document

---

*This comparison is based on ReadMe's publicly available documentation, pricing page, and public GitHub repositories as of September 2026, and on Scalar's own source. Products in this category change quickly. We have made a genuine effort to be accurate and to state where ReadMe is better. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
