# Best Fern alternatives (2026)

*Last updated: September 2026*

The best Fern alternative depends on which half of Fern you are replacing: the SDK generator, the hosted docs, or both. This page covers all three cases, starting with Scalar, which like Fern produces documentation and SDKs from one OpenAPI document.

This page is written by Scalar, so read it with that in mind. Every claim about Fern links to Fern's own site, docs, pricing page or repositories. Fern is a good product, and there is a section below on when you should stay.

## Why teams look for a Fern alternative

It is worth being precise here, because one common reason no longer applies.

**Fern is now part of Postman.** Postman [acquired Fern on January 8, 2026](https://buildwithfern.com/post/postman-acquires-fern). Fern says the product and brand are not changing. Postman had already [acquired liblab](https://liblab.com/blog/liblab-joins-postman), another SDK generator, in November 2025. Two of the independent SDK-plus-docs vendors now sit under one parent. For many teams that is fine, even good. For teams that deliberately avoided building on Postman, or that worry about roadmap consolidation, it is the main reason to look around.

**Several things teams care about are Enterprise-only.** Fern's [pricing page](https://buildwithfern.com/pricing), as of September 26, 2026, lists these under Enterprise: custom React components and custom CSS and JavaScript, self-hosting, SSO and RBAC, removal of the "Built with Fern" branding, and in SDKs, custom code, webhook verification, WebSockets and gRPC. Enterprise is priced "per SDK, billed annually" with no published rate.

**The docs renderer is hosted and not public.** Fern's SDK generators are [Apache-2.0](https://github.com/fern-api/fern), but the documentation renderer is not in the public repository, and [self-hosted docs](https://fern.docs.buildwithfern.com/learn/docs/self-hosted/overview.md) are an Enterprise option shipped as a closed image. If you want the docs inside your own application or infrastructure on a normal plan, Fern is not built for that.

**What is not a reason anymore: entry price.** Fern's free tiers are now generous. Docs are free for up to 10 team members and 1,000 pages. SDKs are free in Python and TypeScript for up to 200 endpoints. A "Postman Team" plan makes docs and SDKs free to Postman Team customers at higher limits. If you are leaving Fern purely because it costs too much at small scale, check the current [pricing page](https://buildwithfern.com/pricing) first. It may have changed since you last looked.

## Fern alternatives at a glance

| Tool | Replaces | Docs renderer | SDK generation | Self-hosting | Entry paid price |
| --- | --- | --- | --- | --- | --- |
| **Scalar** | Docs and SDKs | MIT API reference, hosted docs | Native; TypeScript, Python, Go, CLI GA | API reference on any plan | Pro $150/month ([pricing](/pricing)) |
| **Speakeasy** | SDKs | Uses a docs vendor | Native | Generator self-runnable (AGPL-3.0) | Enterprise, tailored ([pricing](https://www.speakeasy.com/pricing)) |
| **Mintlify** | Docs | Closed, hosted | None; integrates third parties | Enterprise | Pro $450/month on annual billing ([pricing](https://mintlify.com/pricing)) |
| **ReadMe** | Docs | Closed, hosted | TypeScript/JavaScript via `api` CLI | No | Pro $250/month billed annually ([pricing](https://readme.com/pricing)) |
| **Redocly** | Docs | Redoc is open source; platform is commercial | None | Yes, on commercial plans | Pro $10 per seat/month ([pricing](https://redocly.com/pricing)) |
| **Bump.sh** | API reference | Hosted | None | No | Basic $50/month ([pricing](https://bump.sh/pricing)) |
| **OpenAPI Generator** | SDKs | Basic HTML output | [80 client generators](https://openapi-generator.tech/docs/generators) | Yes | Free, Apache-2.0 |

All prices were checked on September 26, 2026, on each vendor's own pricing page.

## The options, one by one

### 1. Scalar: docs and SDKs, with an open documentation layer

**Verdict:** the closest like-for-like replacement for Fern, with the documentation layer open instead of the generator.

Scalar is the same shape as Fern. One OpenAPI document produces your [API reference](/products/api-references), your guides in [Scalar Docs](/products/docs), and your [SDKs](/products/sdk-generator). In Scalar's generator, `docs` is literally a build target, so the reference and the SDKs are produced from the same compiled document in the same run.

The open halves are inverted compared to Fern. Scalar's API reference and [API client](/products/api-client) are MIT licensed (15.7k stars on [GitHub](https://github.com/scalar/scalar)), and you can mount the reference inside the application you already run through [framework integrations](/products/api-references/integrations/express) for Express, FastAPI, NestJS, ASP.NET Core, Laravel and many more. The generator is closed source.

Pricing is published: Free at $0, Pro at $150 per month, Business at $600 per month, Enterprise custom. Every plan includes one SDK. Additional SDKs are $150 per month each up to 100 endpoints, or $600 per month each for 101 to 250 endpoints. Custom HTML, CSS and JavaScript and custom domains start on Pro.

SDK targets generally available today are TypeScript, Python, Go and CLI. Java, Kotlin, Ruby, C#, PHP, Rust, Swift, Dart and C++ are experimental. AsyncAPI and gRPC are supported as SDK inputs; OpenRPC is not. MCP servers are [hosted by Scalar](/products/agent/mcp) with OAuth, not generated as code.

**Best for:** teams that want a Fern-shaped platform without a Postman dependency, with a documentation layer they can own and self-host.

### 2. Speakeasy: best-of-breed SDKs

**Verdict:** the strongest standalone SDK generator if you are happy to pick docs separately.

Speakeasy focuses on SDK generation and, since April 2026, an AI control plane. Its generator was [open-sourced under AGPL-3.0](https://www.speakeasy.com/blog/partnering-with-google) on September 17, 2026. It generates Terraform providers, which Fern and Scalar do not. For documentation it [publishes code samples to a docs vendor](https://www.speakeasy.com/docs/sdks/sdk-docs/integrations/scalar), Scalar among them. Pricing is Enterprise-only and tailored. Full picture in [Speakeasy alternatives](/alternatives/speakeasy).

**Best for:** teams that want the generator and the docs from different specialists, or need Terraform.

### 3. Mintlify: polished hosted docs

**Verdict:** a top choice for docs owned by writers, but you will need a separate SDK vendor.

Mintlify is a hosted docs platform with a web editor, unlimited editors on Pro, and an MCP server and API playground even on the free Starter plan ([pricing](https://mintlify.com/pricing)). It does not generate SDKs; it [integrates with Speakeasy](https://www.mintlify.com/docs/integrations/sdks/speakeasy) and other generators. White labeling and self-hosting are Enterprise.

**Best for:** documentation led by a writing team, where SDKs are handled elsewhere. See [Mintlify alternatives](/alternatives/mintlify).

### 4. ReadMe: docs with API analytics

**Verdict:** the pick if per-developer API usage data inside your docs matters more than SDKs.

ReadMe's [Developer Dashboard](https://docs.readme.com/main/docs/developer-dashboard) shows which endpoints developers call and where they hit errors. The free Starter plan includes a custom domain, bi-directional Git sync and an MCP server. Pro is $250 per month billed annually. SDK generation is limited to its [`api` CLI](https://api.readme.dev/docs/getting-started) for TypeScript and JavaScript.

**Best for:** teams that want to watch how developers use the API. See [ReadMe alternatives](/alternatives/readme).

### 5. Redocly: docs-as-code for OpenAPI

**Verdict:** a mature docs-as-code option with a well-known open-source renderer.

Redocly's commercial platform builds on Redoc and adds linting and developer portal features, priced per seat ([pricing](https://redocly.com/pricing)). It does not generate SDKs.

**Best for:** teams that live in Git and want strict OpenAPI governance. See [Redocly alternatives](/alternatives/redocly).

### 6. Bump.sh: hosted API reference and changelog

**Verdict:** a lightweight, focused hosted reference.

Bump.sh publishes API references with change tracking, with plans from $50 per month for 10 API docs ([pricing](https://bump.sh/pricing)). No SDKs, no long-form guides platform on the scale of Fern's.

**Best for:** teams that only need a clean hosted reference with change history.

### 7. OpenAPI Generator: the free SDK baseline

**Verdict:** free and broad, with the maintenance on you.

[OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator) is Apache-2.0 and lists [80 client generators](https://openapi-generator.tech/docs/generators) as of September 2026. Output quality varies by language and there is no managed publishing.

**Best for:** internal SDKs and teams with engineering time to spare. See [OpenAPI Generator alternatives](/alternatives/openapi-generator).

## When to stay on Fern

Stay on Fern if:

- **Your API uses OpenRPC.** Fern accepts it as an SDK input. Scalar does not.
- **You want to read and run the SDK generator source.** Fern's generators are Apache-2.0. Scalar's generator is closed.
- **You are already a Postman Team customer.** Fern's pricing page lists docs and SDKs at $0 on the Postman Team plan, with higher limits than the free tier. That is hard to beat on cost.
- **The free tier covers you.** Up to 200 endpoints in Python and TypeScript, and docs for up to 10 team members, is a lot of product for nothing.
- **You need TypeScript webhook signature verification with asymmetric keys** and are on Enterprise. Fern's implementation is [well designed](https://fern.docs.buildwithfern.com/learn/sdks/deep-dives/webhook-signature-verification.md).

## Moving from Fern to Scalar

The core asset is your OpenAPI document. If you author in Fern Definition rather than OpenAPI, you will need an OpenAPI version of your API first. Then:

<scalar-steps>
<scalar-step title="Preview the reference locally">

Point the Scalar CLI at your document and look at it before you commit to anything.

```bash
npx @scalar/cli document serve openapi.yaml
```

</scalar-step>
<scalar-step title="Create a docs project">

Run `npx @scalar/cli project init` to create a `scalar.config.json`, then add your OpenAPI document as a route with `"type": "openapi"`. Move Markdown guides across; Scalar Docs supports Markdown and MDX.

</scalar-step>
<scalar-step title="Add SDK targets">

Configure the SDK generator for the languages you ship today. Compare the generated method names against your current Fern SDK before you publish, and plan a major version if the surface changes.

</scalar-step>
</scalar-steps>

## Frequently asked questions

<scalar-detail title="Is Fern still independent after the Postman acquisition?">
Fern was [acquired by Postman](https://buildwithfern.com/post/postman-acquires-fern) on January 8, 2026. Fern says its product and brand are not changing and the team keeps building Fern. It is owned by Postman, which also acquired liblab in November 2025.
</scalar-detail>

<scalar-detail title="Is Fern free?">
Partly. As of September 26, 2026, Fern's [pricing page](https://buildwithfern.com/pricing) lists free docs (10 team members, 1,000 pages) and free SDKs in Python and TypeScript up to 200 endpoints. Enterprise features such as branding removal, self-hosting and custom code in SDKs are priced per SDK, billed annually, on request.
</scalar-detail>

<scalar-detail title="Can I remove the Built with Fern footer?">
According to Fern's pricing page, removal of the "Built with Fern" branding is an Enterprise feature.
</scalar-detail>

<scalar-detail title="What is the best open-source Fern alternative?">
It depends which half you need open. For the SDK generator, OpenAPI Generator (Apache-2.0) and Kiota (MIT) are fully open, and Fern's own generators are Apache-2.0. For the documentation layer, Scalar's API reference is MIT licensed and can be self-hosted or mounted in your app.
</scalar-detail>

<scalar-detail title="Does Scalar support gRPC and AsyncAPI like Fern?">
Scalar's SDK generator accepts AsyncAPI and gRPC as inputs. It does not accept OpenRPC, which Fern does.
</scalar-detail>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [What is an API reference?](/learn/openapi/what-is-an-api-reference)
- **Docs:** [Scalar Docs getting started](/products/docs/getting-started)
- **Product:** [Scalar vs Fern](/resources/compare/fern) — the detailed head-to-head, including SDK output side by side

---

*This page is based on Fern's public pricing page, documentation, blog and GitHub repositories, and on the public pages of every other tool listed, as checked on September 26, 2026. Fern is owned by Postman and its product and pricing may change. If something here is wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
