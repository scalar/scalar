# Best Speakeasy alternatives (2026)

*Last updated: September 2026*

If you are looking for a Speakeasy alternative, the honest first question is not "which generator is better" but "do I want my SDKs and my documentation to come from one platform, or from two specialists I compose myself?" This page walks through that choice and the realistic options on each side.

**Before anything else, a disclosure.** Scalar and Speakeasy work together. Speakeasy [documents a Scalar integration](https://www.speakeasy.com/docs/sdks/sdk-docs/integrations/scalar) for teams who want Speakeasy SDKs with Scalar documentation, and Speakeasy's own [API reference](https://www.speakeasy.com/docs/ai-control-plane/reference/api-reference) is rendered by Scalar. We are not neutral, and we are not going to declare a winner. Speakeasy is a strong SDK generator with years of production use behind it. What follows is a map of the choices, written by one of the companies on it.

## Why teams look for a Speakeasy alternative

Nobody on this list is running from a broken product. The reasons people search for alternatives are mostly about direction, licensing and cost visibility.

**The company's focus has broadened.** Since [April 30, 2026](https://www.prnewswire.com/news-releases/speakeasy-defines-the-ai-control-plane--the-governing-layer-enterprises-need-to-safely-scale-ai-302759058.html) Speakeasy has positioned itself as an "AI control plane" for enterprises: MCP gateways, agent identity, AI observability. As of September 2026 their [pricing page](https://www.speakeasy.com/pricing) prices that control plane, not SDK generation. The SDK product is still [documented](https://www.speakeasy.com/docs/sdks/introduction) and actively developed. But if you are making a multi-year decision about your client libraries, it is reasonable to ask Speakeasy directly how SDK generation fits their roadmap.

**The generator is now AGPL-3.0.** On [September 17, 2026](https://www.speakeasy.com/blog/partnering-with-google), in a partnership with Google, Speakeasy open-sourced its client generator as [`speakeasy-api/openapi-generation`](https://github.com/speakeasy-api/openapi-generation) under AGPL-3.0. That is good news for transparency. It also means legal teams will ask questions: the repository README says generated output carries the license its caller elects, either AGPL-3.0 or a commercial license with a license token, and Speakeasy says commercial licensing remains available from them. Speakeasy also states that code generated with these tools belongs to you in perpetuity. Read the README with your counsel before assuming either way.

**Pricing is a conversation.** Speakeasy's free tier is [one SDK with up to 50 API methods](https://www.speakeasy.com/docs/sdks/introduction), plus a 14-day trial of the business tier. Beyond that, the pricing page lists a single Enterprise tier marked "Tailored", with no published SDK price and no self-serve paid tier. Unpublished pricing is not the same as expensive pricing. It does mean you cannot compare cost without a call.

**Docs are a second vendor.** Speakeasy generates code samples and an API reference, and for a full documentation site you [publish to a docs vendor](https://www.speakeasy.com/docs/sdks/sdk-docs/integrations/scalar) such as Scalar, Mintlify or ReadMe. Some teams love that separation. Others would rather have one bill and one pipeline.

## Composed or consolidated: the real choice

Strip the feature lists away and there are two shapes.

**Composed (best of breed).** You pick an SDK generator on its own merits and a docs platform on its own merits, and connect them through an OpenAPI document with code samples attached. Speakeasy plus a docs vendor is the canonical example. You get leverage and an exit at every layer: when a better docs tool appears you swap it without touching your SDKs.

**Consolidated (one platform).** Documentation and SDKs come out of the same generation run from the same compiled document. Scalar works this way, and so does Fern. You get one artifact, one bill, and one place to debug when the reference and the SDK disagree.

Both are legitimate. If your docs setup already works and you are happy with Speakeasy SDKs, the composed path, Speakeasy SDKs into Scalar docs, is a path we actively help people take. You may not need an alternative at all.

## Speakeasy alternatives at a glance

| Tool | Shape | SDK languages (generally available) | Docs included | License of generator | Published SDK price |
| --- | --- | --- | --- | --- | --- |
| **Scalar** | Consolidated | TypeScript, Python, Go, CLI (9 more experimental) | Yes, MIT API reference plus hosted docs | Closed source | 1 SDK on every plan, extra SDKs from $150/month ([pricing](/pricing)) |
| **Fern** | Consolidated | 10 languages on Enterprise ([pricing](https://buildwithfern.com/pricing)) | Yes, hosted | [Apache-2.0](https://github.com/fern-api/fern) | Free up to 200 endpoints (Python, TypeScript); Enterprise per SDK, custom |
| **Speakeasy open-source generator** | Composed, self-run | See [repo](https://github.com/speakeasy-api/openapi-generation) | No | AGPL-3.0 | Free to run; commercial license from Speakeasy |
| **OpenAPI Generator** | Composed, self-run | 80 client generators, community-maintained ([repo](https://github.com/OpenAPITools/openapi-generator)) | Basic HTML output | Apache-2.0 | Free |
| **Microsoft Kiota** | Composed, self-run | C#, Go, Java, PHP, Python stable; TypeScript preview ([repo](https://github.com/microsoft/kiota)) | No | MIT | Free |
| **APIMatic** | Consolidated | Java, Python, TypeScript, Ruby, C#, PHP, Go ([site](https://www.apimatic.io/)) | Yes, developer portal | Closed source | Basic from $300/month per language ([pricing](https://www.apimatic.io/pricing)) |
| **liblab** | Composed | See [liblab](https://liblab.com/) | See liblab | Closed source | Now part of Postman ([announcement](https://liblab.com/blog/liblab-joins-postman)) |

Prices and language lists were checked on September 26, 2026. Stainless, once the other big name here, [joined Anthropic in May 2026](https://www.stainless.com/blog/stainless-is-joining-anthropic/) and is winding down its hosted products; see [Stainless alternatives](/alternatives/stainless) if you are also on Stainless.

## The options, one by one

### 1. Scalar: docs and SDKs from one run

**Verdict:** the consolidated choice if you want your API reference, SDKs and an API client from one OpenAPI document, with a price you can calculate before you call anyone.

In Scalar's [SDK generator](/products/sdk-generator), `docs` is a build target alongside the language targets. One run produces the SDKs, a static API reference, and the augmented OpenAPI document the SDKs were generated from, so your reference and your libraries cannot describe different APIs. TypeScript, Python, Go and CLI are generally available. Java, Kotlin, Ruby, C#, PHP, Rust, Swift, Dart and C++ are experimental. Custom code survives regeneration through a three-way merge.

If you already ship Speakeasy SDKs, the TypeScript target can emit a [compatibility module](/resources/compare/speakeasy) that reproduces Speakeasy's standalone-function surface, marked deprecated and forwarding to the new client, so your users' call sites keep compiling while they migrate.

The documentation layer is open: the [API reference](/products/api-references) and [API client](/products/api-client) are MIT licensed, with 15.7k stars on [GitHub](https://github.com/scalar/scalar). MCP is hosted rather than generated: Scalar runs [MCP servers from your OpenAPI document](/products/agent/mcp) with OAuth, instead of handing you server code to deploy.

**Where it falls short:** no Terraform providers (on the roadmap, no date), the generator is closed source, and it is newer than Speakeasy's. Years of other people's edge cases is not something we can claim.

**Best for:** teams that want docs, SDKs and a client from one vendor with published pricing.

### 2. Fern: the other consolidated platform

**Verdict:** the closest structural match to Scalar, with open-source generators and a now very generous free tier.

Fern generates SDKs and hosted docs from one definition. Its generators are [Apache-2.0](https://github.com/fern-api/fern). As of September 2026 the [pricing page](https://buildwithfern.com/pricing) offers free SDKs in Python and TypeScript up to 200 endpoints, with Enterprise priced per SDK and billed annually. Features such as custom code in SDKs, webhook verification, WebSockets and gRPC are listed as Enterprise. Fern [was acquired by Postman](https://buildwithfern.com/post/postman-acquires-fern) in January 2026 and says the product and brand are not changing.

**Best for:** teams that want a consolidated platform and value reading the generator source, or that need OpenRPC input. More detail in [Fern alternatives](/alternatives/fern).

### 3. Speakeasy's own open-source generator

**Verdict:** the alternative to the Speakeasy platform might be Speakeasy's code, run yourself.

Since September 17, 2026, you can clone [`openapi-generation`](https://github.com/speakeasy-api/openapi-generation) and run it in your own CI. The README lists targets including TypeScript, Python, Go, Java, C#, PHP, Ruby, CLI and Terraform. You give up the managed pipeline and support, and you take on the AGPL-3.0 questions described above.

**Best for:** teams that like Speakeasy's output, have the engineering time to operate a generator, and have cleared the license with legal.

### 4. OpenAPI Generator

**Verdict:** the free, broad, do-it-yourself baseline.

[OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator) is Apache-2.0, with 26.8k stars and [80 client and 72 server generators](https://openapi-generator.tech/docs/generators). Quality varies by generator because each is community-maintained, and you own templates, publishing and versioning.

**Best for:** internal SDKs, unusual languages, and teams with budget for engineering time rather than a vendor. See [OpenAPI Generator alternatives](/alternatives/openapi-generator).

### 5. Microsoft Kiota

**Verdict:** a solid, MIT-licensed generator if your languages match its stable set.

[Kiota](https://github.com/microsoft/kiota) generates strongly typed clients with C#, Go, Java, PHP and Python marked stable, and TypeScript, Dart and Ruby in preview. It generates clients, not a docs site.

**Best for:** .NET-heavy organizations and teams already in the Microsoft Graph ecosystem.

### 6. APIMatic

**Verdict:** a long-standing SDK and portal vendor with a published entry price.

[APIMatic's pricing page](https://www.apimatic.io/pricing) lists a Basic plan at $300 per month per language, with Business and Enterprise on quote and a 14-day trial. It produces SDKs and a developer portal.

**Best for:** teams that want a vendor-run SDK plus portal and are comfortable with per-language pricing.

### 7. liblab

**Verdict:** worth a look only if you are standardizing on Postman.

liblab generated SDKs from OpenAPI and [joined Postman in November 2025](https://liblab.com/blog/liblab-joins-postman), which also owns Fern. Expect its future to be tied to the Postman platform.

**Best for:** organizations already committed to Postman.

## When to stay on Speakeasy

Stay if any of these describe you. We mean it.

- **You need Terraform providers.** Speakeasy [generates them](https://www.speakeasy.com/docs/terraform/create-terraform); Scalar does not.
- **You want the MCP server as code in your own infrastructure.** Speakeasy's [standalone MCP servers](https://www.speakeasy.com/docs/standalone-mcp/overview) are generated code you deploy yourself. Scalar's are hosted.
- **Tree-shakable standalone functions are your primary SDK surface** for browser or edge bundles.
- **You are adopting their AI control plane** for gateways and agent identity. That is a different product category from anything else on this page.
- **Your SDKs work and your docs work.** Changing generators has real cost for your users. If the only problem is documentation, keep Speakeasy for SDKs and change the docs layer. Speakeasy's [Scalar integration](https://www.speakeasy.com/docs/sdks/sdk-docs/integrations/scalar) exists for exactly that.

## How to evaluate, in one afternoon

<scalar-steps>
<scalar-step title="Pick three representative operations">

Choose one simple GET, one paginated list, and one request with a complex body or file upload. These expose the differences between generators faster than a full run.

</scalar-step>
<scalar-step title="Generate with each candidate">

Run your real OpenAPI document through each tool. Compare method names, error types, pagination helpers and how authentication is configured.

</scalar-step>
<scalar-step title="Check the docs path">

Ask how code samples reach your reference. In a composed setup, confirm the docs vendor reads the samples. In a consolidated one, confirm the reference and SDK come from the same run.

</scalar-step>
<scalar-step title="Price it at your size">

Count endpoints and languages, then price each option. Where pricing is unpublished, ask for a written quote.

</scalar-step>
</scalar-steps>

## Frequently asked questions

<scalar-detail title="Is Speakeasy open source now?">
The SDK generator is. On September 17, 2026 Speakeasy published it as [`speakeasy-api/openapi-generation`](https://github.com/speakeasy-api/openapi-generation) under AGPL-3.0, with a commercial license still available from Speakeasy. Their hosted platform and AI control plane are separate commercial products.
</scalar-detail>

<scalar-detail title="Does Speakeasy have a free plan?">
Speakeasy's docs describe a free account that can generate [one SDK with up to 50 API methods](https://www.speakeasy.com/docs/sdks/introduction), plus a 14-day business-tier trial. Their pricing page lists only an Enterprise tier with tailored pricing, as of September 2026.
</scalar-detail>

<scalar-detail title="Can I use Speakeasy SDKs with Scalar docs?">
Yes. Speakeasy [documents the integration](https://www.speakeasy.com/docs/sdks/sdk-docs/integrations/scalar): Scalar reads the OpenAPI document that carries Speakeasy's generated code samples and shows them in the reference. Many teams run exactly this setup.
</scalar-detail>

<scalar-detail title="What is the best free Speakeasy alternative?">
For a self-run generator, OpenAPI Generator (Apache-2.0) and Kiota (MIT) are free. Fern's free tier covers Python and TypeScript up to 200 endpoints. Scalar's Free plan includes one SDK for APIs up to 25 endpoints, alongside hosted docs.
</scalar-detail>

<scalar-detail title="Can I migrate from Speakeasy without breaking my users?">
With Scalar, the TypeScript target can emit a Speakeasy compatibility module that keeps existing call sites compiling while you move users to the new client. The [Scalar vs Speakeasy](/resources/compare/speakeasy) page shows the configuration.
</scalar-detail>

<scalar-detail title="Does Scalar generate Terraform providers?">
No. Terraform is on the roadmap without a date. If you need Terraform providers today, Speakeasy is the better fit.
</scalar-detail>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [Build vs buy an SDK](/learn/sdk/build-vs-buy-sdk)
- **Docs:** [SDK generator getting started](/products/sdk-generator/getting-started)
- **Product:** [Scalar vs Speakeasy](/resources/compare/speakeasy) — the full head-to-head, including where Speakeasy is stronger

---

*This page is based on Speakeasy's public pricing page, documentation, blog and GitHub repositories, and on the public pages of every other tool listed, as checked on September 26, 2026. Scalar and Speakeasy have a working relationship, described at the top of this page. Products in this category change quickly. If something here is wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
