# Best API documentation tools (2026)

*Last updated: September 2026*

The best API documentation tool for you is the one that renders your OpenAPI document faithfully, lets readers send a real request from the page, and fits how your team already writes and ships, and in 2026 that shortlist is Scalar, Mintlify, ReadMe, Redocly, Fern, GitBook, Stoplight, Swagger UI, Redoc, Docusaurus, Bump.sh, and Document360.

This roundup is written by Scalar, and Scalar is on the list. Read it with that in mind. We have tried to make it useful anyway: every price and licence below links to the vendor's own pricing page, documentation, or repository, checked on 26 September 2026, and each entry says who the tool is actually best for, including the many cases where that is not us. If something here is wrong, [open an issue](https://github.com/scalar/scalar/issues) and we will fix it.

## How we evaluated these tools

"API documentation tool" covers three different kinds of product, and mixing them up is the most common way teams pick the wrong one.

1. **Renderers.** Open-source components that turn an OpenAPI document into a reference page: Swagger UI, Redoc, the Scalar API reference, Stoplight Elements. You host them yourself, often inside the API server.
2. **Hosted docs platforms.** A full site with guides, navigation, search, versioning, analytics, and an API reference: Mintlify, ReadMe, Redocly, Fern, GitBook, Bump.sh, Document360, Scalar Docs.
3. **Static site generators with an OpenAPI plugin.** Docusaurus is the obvious one. You own the build and the hosting, and the API reference is one plugin among many.

We scored each tool against the same six questions:

- **OpenAPI support.** Which versions it reads (Swagger 2.0, OpenAPI 3.0, 3.1, 3.2), and whether the reference is generated from the document rather than written by hand.
- **Try-it console.** Can a reader send an authenticated request from the page, without copying a cURL command into another tool?
- **Open source.** Is the renderer under an open-source licence, so you can self-host, fork, or audit it?
- **Published pricing.** Can you work out the cost without a sales call?
- **Where the docs live.** Hosted only, self-hostable, or embeddable inside your own application.
- **What else comes from the same document.** SDKs, an API client, an MCP server for AI agents, `llms.txt`.

We did not score design, because it is subjective, and every tool on this list can look good in the right hands. We also did not invent star ratings: where we quote a number, it comes from the vendor or from GitHub.

## Comparison table

Prices are the lowest paid tier as published on 26 September 2026. "Custom" means the vendor does not publish a number.

| Tool | Type | Renderer open source | Try-it console | Entry paid price |
| --- | --- | --- | --- | --- |
| Scalar | Renderer + hosted platform | Yes, MIT | Yes, every plan | $150/month ([pricing](/pricing)) |
| Mintlify | Hosted platform | No | Yes, every plan | $450/month billed annually ([pricing](https://www.mintlify.com/pricing)) |
| ReadMe | Hosted platform | No | Yes | $250/month billed annually ([pricing](https://readme.com/pricing)) |
| Redocly | Hosted platform + Redoc CE | Redoc CE is MIT | Paid products only | $10/seat/month ([pricing](https://redocly.com/pricing)) |
| Fern | Hosted platform | No public renderer | Yes | Free tier; Enterprise custom ([pricing](https://buildwithfern.com/pricing.md)) |
| GitBook | Hosted knowledge base | No | Yes, via Scalar | $65/site/month billed annually ([pricing](https://www.gitbook.com/pricing)) |
| Stoplight | Hosted design + docs | Elements is Apache-2.0 | Yes | $44/month billed annually ([pricing](https://stoplight.io/pricing)) |
| Swagger UI | Renderer | Yes, Apache-2.0 | Yes | Free |
| Redoc | Renderer | Yes, MIT | No | Free |
| Docusaurus | Static site generator | Yes, MIT | Via plugin | Free |
| Bump.sh | Hosted platform | No | Pro plan and up | $50/month ([pricing](https://bump.sh/pricing)) |
| Document360 | Hosted knowledge base | No | Yes | Custom ([pricing](https://document360.com/pricing/)) |

## 1. Scalar

**What it is.** An MIT-licensed API reference and API client, plus a hosted docs platform (Scalar Docs), an SDK generator, a registry, and hosted MCP servers, all driven by the same OpenAPI document. The reference ships as [framework integrations](/products/api-references/integrations/express) for Express, Fastify, Hono, NestJS, FastAPI, Django, Laravel, Rails, ASP.NET Core, Spring Boot and more, so you can mount it inside the application you already run. It is the default API reference UI in Effect, ElysiaJS, HappyX, Litestar, Nitro, oRPC, Platformatic, and Spry, and Microsoft Learn's ASP.NET Core OpenAPI page has a section on [using Scalar for interactive API documentation](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents).

**Pricing.** Free $0, Pro $150 per month, Business $600 per month, Enterprise custom. Yearly billing brings Pro to $125 per month and Business to $500 per month. Free covers hosted docs, the API client, landing pages, up to 3 APIs, and 1 SDK up to 25 endpoints. See [pricing](/pricing).

**Open source.** The API reference and API client are MIT licensed at [github.com/scalar/scalar](https://github.com/scalar/scalar), which has 15.7k stars. The SDK generator is not open source.

**OpenAPI support.** Swagger 2.0 (upgraded on load), OpenAPI 3.0 and 3.1, with OpenAPI 3.2 features such as nested tags supported. AsyncAPI is supported too. See the [OpenAPI reference](/products/api-references/openapi).

**Try-it console.** Every operation has a "Test Request" button that opens the full API client, with authentication, environments, and code samples for many HTTP clients and languages.

**Best for.** Engineering-led teams who want to own the documentation layer, mount it inside their app, and generate SDKs and an MCP server from the same document.

**Watch out for.** Scalar does not offer localization across many languages the way Mintlify does, and our SDK generator is newer than the incumbents.

## 2. Mintlify

**What it is.** A hosted documentation platform with an MDX-based content model, a web editor, an API playground, and a growing set of AI features (assistant, writing agent, automations). Mintlify [raised a $45M Series B at a $500M valuation](https://mintlify.com/blog/series-b) in April 2026.

**Pricing.** Starter is $0 with 5 editor seats. Pro is $450 per month billed annually with unlimited editor seats and 10,000 AI credits per month. Enterprise is custom. White labeling and self-hosting are Enterprise only ([pricing](https://www.mintlify.com/pricing)). We keep a monthly-updated breakdown at [Mintlify pricing and reviews](/library/mintlify-reviews-pricing-alternatives).

**Open source.** No. The renderer is closed. [Self-hosting requires an Enterprise plan](https://www.mintlify.com/docs/deploy/self-host).

**OpenAPI support.** Generates API pages from an OpenAPI document.

**Try-it console.** Yes. The [API playground](https://www.mintlify.com/docs/api-playground/overview) sends real requests, through Mintlify's proxy by default or directly from the browser.

**Best for.** Teams where writers, product, or marketing own the docs and want a polished hosted site with unlimited editors on Pro.

**Watch out for.** No SDK generation and no standalone API client. AI features are not on Starter. Our head-to-head is at [Scalar vs Mintlify](/resources/compare/mintlify), and we list options at [Mintlify alternatives](/alternatives/mintlify).

## 3. ReadMe

**What it is.** One of the longest-running hosted developer hubs, with an interactive API reference, guides, changelog, recipes, and forums, plus API usage metrics.

**Pricing.** Starter is $0 with one project and one published version. Pro is $250 per month billed annually. Enterprise is quoted and annual only. Ask AI is a $150 per month add-on on every plan ([pricing](https://readme.com/pricing)).

**Open source.** No, the platform is proprietary.

**OpenAPI support.** [OpenAPI 3.0 and 3.1, Swagger 2.0](https://docs.readme.com/main/docs/openapi), and Postman collections, which are converted to OpenAPI.

**Try-it console.** Yes. Readers can make authenticated requests from the reference.

**Best for.** Companies that want a mature, all-in-one developer hub with API usage metrics tied to their docs.

**Watch out for.** Removing ReadMe branding is listed under Enterprise. See [Scalar vs ReadMe](/resources/compare/readme) and [ReadMe alternatives](/alternatives/readme).

## 4. Redocly

**What it is.** The company behind Redoc, now selling a hosted docs platform (Reunite, with Revel, Reef, and Realm products) plus open-source tools including Redoc CE and Redocly CLI.

**Pricing.** Pro is $10 per seat per month, Enterprise $24 per seat per month, Enterprise+ custom. Some products are add-ons priced per seat ([pricing](https://redocly.com/pricing)).

**Open source.** [Redoc](https://github.com/Redocly/redoc) (the community edition) is MIT licensed. The hosted platform is not.

**OpenAPI support.** OpenAPI 3.1, 3.0, and Swagger 2.0.

**Try-it console.** In the paid products, through [Replay](https://redocly.com/docs/end-user/test-apis-replay). Redoc CE has no try-it console.

**Best for.** Teams already using Redocly CLI for linting and bundling who want per-seat pricing and a docs-as-code workflow.

**Watch out for.** Per-seat pricing grows with the number of editors. Compare at [Scalar vs Redocly](/resources/compare/redocly).

## 5. Fern

**What it is.** A docs and SDK platform. Fern [was acquired by Postman in January 2026](https://buildwithfern.com/post/postman-acquires-fern) and says the product and brand are not changing.

**Pricing.** Docs are free for up to 10 team members and 1,000 pages, with an API explorer and web editor included. Enterprise is custom and adds SSO, custom CSS, JavaScript and React components, and self-hosting. Postman Team customers get a larger free tier ([pricing](https://buildwithfern.com/pricing.md)).

**Open source.** The SDK generators in [fern-api/fern](https://github.com/fern-api/fern) are Apache-2.0. We could not find a public repository for the docs renderer.

**OpenAPI support.** OpenAPI, plus AsyncAPI, gRPC, and OpenRPC as inputs.

**Try-it console.** Yes, through the API explorer.

**Best for.** Teams who want docs and SDKs from one vendor, particularly if they already pay for Postman.

**Watch out for.** Custom CSS and JavaScript are Enterprise. See [Scalar vs Fern](/resources/compare/fern).

## 6. GitBook

**What it is.** A general-purpose knowledge base and docs platform with OpenAPI blocks for API reference content. GitBook's "Test it" feature is [powered by Scalar](https://www.gitbook.com/blog/gitbook-open-source-and-scalar).

**Pricing.** Free is $0 per site with one user. Premium is $65 per site per month and Ultimate $249 per site per month, both billed annually, with additional users at $12 per user per month. Enterprise is custom ([pricing](https://www.gitbook.com/pricing)).

**Open source.** No, the platform is proprietary.

**OpenAPI support.** OpenAPI blocks generate method pages from your document.

**Try-it console.** Yes, interactive API playgrounds on every plan.

**Best for.** Companies whose API reference is a smaller part of a larger product knowledge base, written by non-engineers in a block editor.

**Watch out for.** GitBook is a knowledge base first. If your reference is the main event, a dedicated API tool gives you more control. See [GitBook alternatives](/alternatives/gitbook).

## 7. Stoplight

**What it is.** A design-first API platform with a visual OpenAPI editor, mock servers, style guides, and hosted docs. Stoplight is part of SmartBear; its [pricing page](https://stoplight.io/pricing) footer reads "© 2026 SmartBear Software". The open-source renderer is [Stoplight Elements](https://github.com/stoplightio/elements).

**Pricing.** Free for one user and one project. Basic is $44 per month billed annually, Startup $113, Pro Team $362, Enterprise custom, with per-user fees above the included users ([pricing](https://stoplight.io/pricing)).

**Open source.** Elements is Apache-2.0. The platform is not.

**OpenAPI support.** Elements supports OpenAPI 2.0, 3.0, and 3.1.

**Try-it console.** Yes, in both the platform and Elements.

**Best for.** Teams that design the API before writing code and want the editor, mocks, and docs in one tool.

**Watch out for.** If you only need the docs half, you are paying for a design platform. Moving off? See [migrate from Stoplight](/resources/migration/stoplight).

## 8. Swagger UI

**What it is.** The original OpenAPI renderer, maintained by SmartBear, and still the default in many frameworks.

**Pricing.** Free.

**Open source.** [Apache-2.0](https://github.com/swagger-api/swagger-ui), about 29,000 GitHub stars.

**OpenAPI support.** Swagger 2.0, OpenAPI 3.0 and 3.1, with 3.2.0 listed for the 5.32 release line in the README's compatibility table.

**Try-it console.** Yes, "Try it out" on every operation.

**Best for.** Internal APIs where the goal is a working reference with zero setup, and nobody is judging the design.

**Watch out for.** No guides, search across pages, or hosting. The single-column layout gets hard to navigate on large APIs. See [Swagger UI alternatives](/alternatives/swagger-ui) and [migrate from Swagger UI](/resources/migration/swagger-ui).

## 9. Redoc

**What it is.** A three-panel OpenAPI renderer from Redocly, known for readable schema documentation.

**Pricing.** Free.

**Open source.** [MIT](https://github.com/Redocly/redoc), about 25,900 GitHub stars.

**OpenAPI support.** OpenAPI 3.1, 3.0, and Swagger 2.0.

**Try-it console.** No. Redocly reserves the try-it console for its paid products.

**Best for.** Read-only public references where you want a clean layout and do not need readers to send requests.

**Watch out for.** No request sending. See [Redoc alternatives](/alternatives/redoc).

## 10. Docusaurus

**What it is.** Meta's open-source static site generator for documentation. It has no API reference built in; you add one with a plugin such as the community [docusaurus-openapi-docs](https://github.com/PaloAltoNetworks/docusaurus-openapi-docs), or embed a renderer. Scalar has a [Docusaurus integration](/products/api-references/integrations/docusaurus).

**Pricing.** Free. You pay for hosting.

**Open source.** [MIT](https://github.com/facebook/docusaurus), about 66,000 GitHub stars. docusaurus-openapi-docs is also MIT.

**OpenAPI support.** Through the plugin, Swagger 2.0 and OpenAPI 3.x.

**Try-it console.** The plugin's theme includes a "Send API Request" panel.

**Best for.** Teams with front-end capacity who want full control of the build and already run a Docusaurus site.

**Watch out for.** You maintain the plugin stack, upgrades, search, and hosting yourself. See [Docusaurus alternatives](/alternatives/docusaurus).

## 11. Bump.sh

**What it is.** A hosted API docs and change-tracking platform with automatic changelogs and, more recently, hosted MCP servers built from workflow definitions.

**Pricing.** Basic is $50 per month with 10 API docs. Pro is $120 per month with 30 API docs, the API Explorer, and automatic changelogs. Custom plans add SSO and embed mode ([pricing](https://bump.sh/pricing)).

**Open source.** No.

**OpenAPI support.** OpenAPI, AsyncAPI, and Arazzo.

**Try-it console.** The API Explorer is on Pro and above, not Basic.

**Best for.** Teams with many APIs, including event-driven ones, who care most about change tracking and diffing.

**Watch out for.** The cheapest plan has no try-it. Moving off? See [migrate from Bump.sh](/resources/migration/bump).

## 12. Document360

**What it is.** A knowledge base platform for product and support documentation, with an API documentation module.

**Pricing.** No published prices. Document360 quotes each customer based on seats, workspaces, languages, SSO, privacy model, and AI usage, with a 14-day free trial ([pricing](https://document360.com/pricing/)).

**Open source.** No.

**OpenAPI support.** Generates API reference content from an OpenAPI document.

**Try-it console.** Yes, [Try It!](https://docs.document360.com/docs/api-documentation-tool) sends real requests from the published reference.

**Best for.** Support and product teams who already run their help centre on Document360 and want the API reference in the same place.

**Watch out for.** You cannot price it without talking to sales.

## When another tool is the better choice

We would rather you pick the right tool than pick us for the wrong reason. Here is when we would point you elsewhere:

- **You need localization in many languages.** Mintlify productizes it; we do not match that today.
- **Writers, not engineers, own the docs, and you want unlimited editors on a flat price.** Mintlify Pro or GitBook suit that model.
- **You want API usage metrics tied to docs.** ReadMe has done this for years.
- **You design APIs visually before writing code.** Stoplight is built for that workflow.
- **Your API is gRPC or JSON-RPC first.** Fern accepts gRPC and OpenRPC.
- **You need a read-only reference and nothing else.** Redoc or Swagger UI is free and fine.
- **You already run Docusaurus and have the front-end time.** Adding a plugin may be cheaper than a new platform.

## How to choose in practice

Start with where the docs must live. If the reference has to ship inside your API server, you need a renderer with a framework integration (Scalar, Swagger UI, Redoc). If it must be a standalone site with guides, you need a hosted platform or a static site generator.

Then check the try-it story. Readers who can send a real request understand an API faster, and several tools gate the console behind a higher plan (Redocly, Bump.sh) or leave it out (Redoc).

Then price it honestly for your team size. Per-seat pricing (Redocly, Stoplight above the included users, GitBook) and per-site pricing behave very differently from flat plans. Model twelve months, including AI add-ons.

Finally, ask what else you need from the same OpenAPI document. If SDKs, an API client, or an MCP server are on your roadmap, one vendor that generates them all from one document saves you a sync problem later. That is the case for Scalar. If they are not on your roadmap, weigh the other criteria more heavily.

## Frequently asked questions

<scalar-detail title="What is the best free API documentation tool?">
For a self-hosted reference, the free options are Scalar's API reference (MIT), Swagger UI (Apache-2.0), and Redoc (MIT). Of those, Scalar and Swagger UI include a try-it console and Redoc does not. For a free hosted site, Scalar, Mintlify, ReadMe, Fern, and GitBook all have free plans with different limits, listed above.
</scalar-detail>

<scalar-detail title="Which API documentation tools are open source?">
The renderers: Scalar's API reference and API client (MIT), Swagger UI (Apache-2.0), Redoc CE (MIT), Stoplight Elements (Apache-2.0), and Docusaurus with the docusaurus-openapi-docs plugin (both MIT). The hosted platforms on this list are proprietary, although Fern's SDK generators are Apache-2.0.
</scalar-detail>

<scalar-detail title="Do I need OpenAPI to use these tools?">
For the API reference, yes, in practice. Every tool here generates reference pages from an OpenAPI document (some also read AsyncAPI). If you do not have one yet, most frameworks can generate it from your code. Start with [what is OpenAPI](/learn/openapi/what-is-openapi).
</scalar-detail>

<scalar-detail title="What is the difference between Swagger UI and Redoc?">
Both are open-source OpenAPI renderers. Swagger UI shows operations in one column with a "Try it out" button. Redoc uses a three-panel layout that is easier to read but has no try-it console in its open-source edition. Scalar's reference combines a three-panel layout with a built-in API client.
</scalar-detail>

<scalar-detail title="Which API documentation tool is best for AI agents and LLMs?">
Look for `llms.txt` generation, Markdown versions of pages, and an MCP server. Scalar generates `llms.txt` and exposes a docs MCP server; Mintlify offers a [docs search MCP server on every plan](https://www.mintlify.com/docs/ai/model-context-protocol), and Fern publishes an [`llms.txt`](https://buildwithfern.com/llms.txt) for its own site. Scalar also hosts MCP servers that call your API endpoints, generated from the same OpenAPI document; see [MCP servers](/products/agent/mcp).
</scalar-detail>

<scalar-detail title="How much does API documentation software cost?">
From $0 for open-source renderers to custom enterprise contracts. On 26 September 2026 the lowest published paid tiers ranged from $10 per seat per month (Redocly Pro) to $450 per month billed annually (Mintlify Pro). Document360 and several enterprise tiers do not publish prices.
</scalar-detail>

## Related

- **Learn:** [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [API documentation best practices](/learn/openapi/api-documentation-best-practices)
- **Docs:** [API reference getting started](/products/api-references/getting-started)
- **Product:** [Scalar Docs](/products/docs) — hosted API docs from your OpenAPI document, with an open-source reference you can also self-host

---

*Prices, licences, and features for third-party tools are taken from each vendor's public pricing page, documentation, or GitHub repository as of 26 September 2026, and are linked inline. GitHub star counts were read the same day. This page is written by Scalar, which is one of the tools listed. We have tried to be accurate and to say where other tools are the better choice. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
