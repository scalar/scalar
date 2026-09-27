# Scalar vs Redocly

*Last updated: September 2026*

Redocly is the company behind Redoc, one of the original OpenAPI renderers — the repository dates back to [October 2015](https://github.com/Redocly/redoc) and has over 25,000 stars. A very large share of the API documentation on the internet has been rendered by Redoc at some point, and if you are evaluating OpenAPI documentation tooling, Redocly belongs on your list.

This page is written by Scalar, so read it with that in mind. Every claim we make about Redocly links to their own documentation, pricing page, or public repositories. If we have something wrong, tell us and we will fix it.

The short version: both companies ship an MIT-licensed OpenAPI renderer. The difference is what the open edition includes and what surrounds it. Redoc's community edition renders documentation but reserves the try-it console for the [commercial hosted product](https://github.com/Redocly/redoc#redoc-vs-hosted-redoc); Redocly's real depth is in API governance and the enterprise portal suite around the renderer. Scalar's open renderer ships with a full API client built in, mounts inside 35 web frameworks, and sits alongside SDK generation and hosted MCP servers driven by the same OpenAPI document.

## At a glance

| | Scalar | Redocly |
| --- | --- | --- |
| Docs renderer license | [MIT](https://github.com/scalar/scalar) | [MIT](https://github.com/Redocly/redoc) (Redoc community edition) |
| Try-it console in the open renderer | Yes — a full API client | No — [commercial feature](https://github.com/Redocly/redoc#redoc-vs-hosted-redoc) |
| API linting and governance | Spectral rules in the registry | [Redocly CLI](https://github.com/Redocly/redocly-cli), mature and configurable |
| Framework integrations | 35 | HTML tag, React component, Docker, CLI |
| SDK generation | Native, published pricing | [Experimental TypeScript client](https://github.com/Redocly/redocly-cli) in the CLI |
| Standalone API client | Yes, open source | No |
| Hosted MCP servers | Pro, $150/month | [Enterprise tier](https://redocly.com/pricing) |
| Entry paid tier | $150/month flat, 5 seats included | $10 per seat/month, 100-page limit |

## Where Redocly is stronger

We would rather you hear this from us than find out after switching.

**API governance and linting.** [Redocly CLI](https://github.com/Redocly/redocly-cli) is a genuinely excellent tool — linting with configurable rulesets, bundling multi-file descriptions, and decorators for transforming documents, with support for OpenAPI 3.x and 2.0, AsyncAPI 3.x and 2.6, and Arazzo 1.x. If your organization needs to enforce API design standards across many teams, Redocly has invested in this problem for years and it shows. Scalar's registry supports [Spectral rules](https://scalar.com/products/registry), but Redocly's governance tooling is deeper and more widely deployed.

**Longevity.** Redoc has been rendering OpenAPI since 2015. It is battle-tested against a decade of real-world API descriptions, including the malformed ones. That maturity is worth something.

**API contract testing and monitoring.** [Respect](https://redocly.com/respect) runs Arazzo workflows against your live API on a schedule and checks status codes, content types, headers, and response bodies against your OpenAPI description. The same engine is available as the `respect` command in [Redocly CLI](https://github.com/Redocly/redocly-cli). Hosted monitoring is [usage-priced](https://redocly.com/pricing), with the first 1,000 requests a month free. Scalar has no direct equivalent.

**The enterprise portal suite.** Redocly's commercial platform — [Realm](https://redocly.com/docs/realm), which combines Redoc, Revel (external developer hub), and Reef (internal API catalog), authored through Reunite — is a serious enterprise developer portal product with SSO, RBAC, and analytics on the [Enterprise tier](https://redocly.com/pricing).

## The try-it console is the fork in the road

Both renderers are MIT licensed. What differs is what the MIT edition does.

Redoc's community edition renders a three-panel reference with search, code samples via vendor extension, and schema documentation. It does not let a reader send a request. Redoc's own README lists the [try-it console, automated code samples, mock server, AsyncAPI, and GraphQL](https://github.com/Redocly/redoc#redoc-vs-hosted-redoc) as features of the commercial hosted product.

Scalar's open-source renderer includes an interactive client on every operation — and it is not a thin request form. It is the same open-source [API client](https://github.com/scalar/scalar) Scalar ships standalone: authentication including OAuth 2.0 flows, environments, cookie and header management, streaming responses, and code generation for 40+ HTTP clients. Your readers test the API in the docs, then keep the same tool on their desktop after they leave.

If interactive documentation matters to you and you want to stay on open source, this is the clearest single difference between the two products.

## Where the docs can live

Redoc CE deploys as an [HTML tag, a React component, a Docker image, or static HTML from the CLI](https://redocly.com/docs/redoc/deployment/intro). These are solid options, and the zero-dependency HTML tag in particular is pleasantly simple.

Scalar additionally ships 35 framework integrations — Express, Fastify, Hono, NestJS, Next.js, Nuxt, Laravel, Django, Rails, Go, Rust, ASP.NET Core, Spring Boot, and more. You mount the reference inside the application you already run, at whatever route you choose, and the docs update when your description does. If your OpenAPI document is generated by your framework, this removes an entire deployment step.

**The site you are reading is the product.** scalar.com — this page, the pricing page, the guides, the API reference, and the blog — is built and hosted entirely on Scalar Docs from a single `scalar.config.json`. We do not maintain a separate marketing stack.

## Beyond documentation: SDKs and MCP

Redocly is a documentation and governance company, and a good one. It does not offer a production SDK generator. Redocly CLI has an [experimental `generate-client` command](https://github.com/Redocly/redocly-cli) that emits a typed TypeScript client, clearly flagged as subject to change, with no other languages and no publishing workflow.

Scalar generates SDKs from the same OpenAPI document that renders your docs, with package publishing, automated GitHub workflows, and webhook support. TypeScript, Python, Go, and a CLI are generally available; Java, Kotlin, Ruby, C#, PHP, Rust, Swift, Dart, and C++ are experimental. One language target is included with every plan, and additional targets start at [$150/month each](https://scalar.com/pricing), published on the pricing page.

The same is true for MCP. Scalar hosts an MCP server generated from your OpenAPI document on the Pro plan at $150/month, so agents can call your API with the same source of truth your docs use. Redocly lists MCP servers on their [Enterprise tier](https://redocly.com/pricing) at $24 per seat/month.

If all you need is a reference page, this section does not matter. If you want docs, SDKs, and an MCP server that cannot drift apart because they come from one document in one pipeline, it is the core of the comparison.

## Pricing

Both companies publish their pricing, which we respect — much of this category does not.

| Plan | Scalar ([pricing](https://scalar.com/pricing)) | Redocly ([pricing](https://redocly.com/pricing)) |
| --- | --- | --- |
| Free | $0: 1 editor seat, up to 3 APIs, 1 SDK up to 25 endpoints | No free hosted plan listed; Redoc CE and Redocly CLI are free and open source |
| Entry paid | Pro, $150/month flat ($125/month billed yearly), 5 editor seats | Pro, $10 per seat/month, 1 project, 100 pages |
| Mid tier | Business, $600/month flat ($500/month billed yearly), 10 editor seats, SSO | Enterprise, $24 per seat/month, 500 pages, SSO, RBAC, MCP servers |
| Top tier | Enterprise, custom | Enterprise+, custom, billed yearly |
| Add-ons | Additional SDKs from $150/month each | Revel or Reef +$10 (Pro) / +$24 (Enterprise) per seat/month; Realm bundle +$18 / +$42 per seat/month; Respect monitoring usage-based |

Prices checked on 26 September 2026.

The models differ. [Redocly charges per seat](https://redocly.com/pricing): Pro is $10 per seat/month with one project and a 100-page limit; Enterprise is $24 per seat/month with 500 pages, SSO, RBAC, and MCP servers; Enterprise+ is custom, billed yearly, via sales. Revel and Reef are separate per-seat add-ons, and the full Realm bundle is $18 to $42 per seat/month on top.

[Scalar Pro is $150/month flat](https://scalar.com/pricing), with 5 editor seats and unlimited viewer seats included, custom domains, Git sync, Markdown and MDX, hosted MCP servers, and one SDK target. Additional SDK targets are $150/month each. Business at $600/month adds SSO/SAML, subpath hosting, 10 seats, and additional SDK targets priced by size: $150/month each for up to 100 endpoints or $600/month each for 101–250 endpoints. The included SDK applies to the most expensive band first. Enterprise adds RBAC and full developer portals, with custom SDK pricing. See [SDK pricing](../guides/pricing.md) for details.

To be honest about the math: a two-person team that only needs hosted reference docs is cheaper on Redocly Pro. The comparison shifts as the team grows, as page counts pass the tier limits, and as you add products — per-seat, per-product pricing compounds in a way a flat price does not. Run your own numbers for your own team size; both pricing pages give you enough to do it.

## Redocly vs Scalar

If you run Redocly today, the most likely reason is governance. You lint every API description in CI against a shared ruleset, you bundle multi-file documents, and your platform team has years of rules tuned to how your company designs APIs. None of that needs to change. Redocly CLI is MIT licensed, and it works on the same OpenAPI documents Scalar renders, so keeping it as your linter while you evaluate Scalar is a normal setup rather than a compromise.

Redocly stays the right call if the enterprise portal suite is what you are buying: an internal API catalog in Reef, scorecards, Respect monitoring, and per-page RBAC across a large organization.

Scalar is the better fit when the reference itself is the problem. Readers want to send a request from the docs without you paying for a hosted tier, your framework already generates the OpenAPI document and you want the reference mounted at a route in the same app, or you want SDKs and a hosted MCP server from that same document. Moving the reference is usually small: point Scalar at the OpenAPI document Redocly already uses. Common Redoc extensions such as `x-tagGroups` and `x-codeSamples` are read by Scalar's reference, so most documents render without edits.

## Which should you choose?

**Choose Redocly if** API governance is your primary problem — you want mature linting and rulesets enforced across many teams — or you want an established enterprise portal suite with an internal API catalog, or you rely on contract testing against your OpenAPI descriptions.

**Choose Scalar if** you want an open-source renderer where try-it is a real API client rather than a paid upgrade, you want docs mounted inside the framework you already run, you want SDKs and MCP servers generated from the same document as your docs, or you prefer one flat published price over per-seat, per-product tiers.

Start with [Scalar Docs](https://scalar.com/products/docs), check the [pricing](https://scalar.com/pricing), and [start free](https://dashboard.scalar.com/register) — or [talk to us](https://scalar.cal.com/).

## Frequently asked questions

<scalar-detail title="Is Redoc free?">

Yes. Redoc, the community edition, is [MIT licensed](https://github.com/Redocly/redoc) and free to self-host. The try-it console, automated code samples, mock server, AsyncAPI, and GraphQL support are [listed as features of Redocly's hosted product](https://github.com/Redocly/redoc#redoc-vs-hosted-redoc), which starts at $10 per seat per month on [Redocly Pro](https://redocly.com/pricing).

</scalar-detail>

<scalar-detail title="Does Scalar have a try-it console like Redocly?">

Yes, in the open-source renderer. Every operation in a Scalar API reference has a **Test Request** button that opens the full Scalar API client, with authentication, environments, and code generation for 40+ HTTP clients. It is MIT licensed and does not need a paid plan.

</scalar-detail>

<scalar-detail title="Can I keep using Redocly CLI for linting if I switch to Scalar?">

Yes. Redocly CLI works on plain OpenAPI documents and is MIT licensed, so you can keep running it in CI while Scalar renders the reference from the same file. Many teams keep their existing linter and change only the documentation layer.

</scalar-detail>

<scalar-detail title="Will my Redoc vendor extensions work in Scalar?">

The common ones do. Scalar's reference reads `x-tagGroups` for sidebar grouping and `x-codeSamples` for custom code samples, so a document written for Redoc usually renders without edits. Test your own document in the [Scalar sandbox](https://sandbox.scalar.com) to be sure.

</scalar-detail>

<scalar-detail title="Which is cheaper, Redocly or Scalar?">

It depends on team size. Redocly Pro is $10 per seat per month, so a two-person team that only needs hosted reference docs pays less on Redocly. Scalar Pro is $150 per month flat with 5 editor seats, and includes an SDK and hosted MCP servers. As seats, page counts, and add-ons grow, the flat price tends to come out ahead.

</scalar-detail>

## Related

- **Learn:** [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [OpenAPI linting](/learn/openapi/spectral-rules)
- **Docs:** [Scalar Docs guide](../guides/docs/index.md) · [Redocly alternatives](/alternatives/redocly) · [Scalar vs Redoc](/resources/compare/redoc)
- **Product:** [Scalar API References](/products/api-references) — an MIT renderer with a real API client built into every operation

---

*This comparison is based on Redocly's publicly available documentation, pricing page, and public GitHub repositories as of September 2026, and on Scalar's own source. Products in this category change quickly. We have made a genuine effort to be accurate and to state where Redocly is better. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
