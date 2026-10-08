# Best SDK generators (2026)

*Last updated: September 2026*

An SDK generator reads your API description, usually an OpenAPI document, and emits typed client libraries in one or more languages, and in 2026 the realistic shortlist is Scalar, Speakeasy, Fern, OpenAPI Generator, Kiota, liblab, and APIMatic, with Stainless no longer taking new customers.

The market moved more in the last nine months than in the previous five years. Postman [bought Fern](https://buildwithfern.com/post/postman-acquires-fern) in January. Stainless [joined Anthropic](https://www.stainless.com/blog/stainless-is-joining-anthropic/) in May and is winding down its hosted products. Speakeasy [open-sourced its generator under AGPL-3.0](https://www.speakeasy.com/blog/partnering-with-google) on 17 September in a partnership with Google. If you last compared SDK generators in 2025, most of what you read is out of date.

This page is written by Scalar, which makes one of the generators listed. Every claim about another vendor links to its own site or repository, checked on 26 September 2026. We say where others are stronger, and there are several places where they are.

## How we evaluated

We looked at each generator the way a platform team would before committing to it for years:

- **Status.** Is the vendor taking new customers, and who owns it?
- **Languages, and how mature each one is.** A long list of targets means little if most are beta. We separate generally available from preview or experimental wherever the vendor does.
- **Licence of the generator.** Can you read, run, and fork it? Who owns the generated code?
- **Published pricing.** Can you estimate the bill without a sales call?
- **What you get beyond the client library.** Docs, CLIs, Terraform providers, MCP servers, publishing to package registries, custom code that survives regeneration.
- **Inputs.** OpenAPI 3.0 and 3.1 at minimum; some also read AsyncAPI, gRPC, or OpenRPC.

We did not benchmark generated code quality across all seven, because a fair benchmark needs the same API description through every tool and a lot of hand review. Where we compare output, we link to real, public generated code.

## Comparison table

| Generator | Status | Generator licence | Languages (vendor's own labels) | Free tier | Paid pricing |
| --- | --- | --- | --- | --- | --- |
| Scalar | Independent | Closed source | GA: TypeScript, Python, Go, Java, Kotlin, CLI. Experimental: Ruby, C#, PHP, Rust, Swift, Dart, C++ | 1 SDK up to 25 endpoints | 1 SDK included; extra SDKs $150 or $600/month ([pricing](/pricing)) |
| Speakeasy | Independent; AI control plane focus | [AGPL-3.0](https://github.com/speakeasy-api/openapi-generation), commercial licence available | TypeScript, Python, Go, Java, C#, PHP, Ruby, Unity, plus Terraform, CLI, MCP | [1 SDK, 50 methods](https://www.speakeasy.com/docs/sdks/introduction) | [Tailored](https://www.speakeasy.com/pricing) |
| Fern | Owned by Postman | [Apache-2.0](https://github.com/fern-api/fern) | TypeScript, Python, Java, Go, Ruby, PHP, C#, Swift, Rust | [Python and TypeScript, up to 200 endpoints](https://buildwithfern.com/pricing.md) | Enterprise, per SDK, billed annually |
| OpenAPI Generator | Community project | [Apache-2.0](https://github.com/OpenAPITools/openapi-generator) | [80 client and 72 server generators](https://openapi-generator.tech/docs/generators) | Free | Free |
| Kiota | Microsoft open source | [MIT](https://github.com/microsoft/kiota) | Stable: C#, Go, Java, PHP, Python. Preview: TypeScript, Dart, Ruby | Free | Free |
| liblab | Independent | Closed source | [TypeScript, Python, Java, .NET, Go, PHP, Terraform](https://liblab.com/docs) | Not published | [Not published for SDKs](https://liblab.com/pricing) |
| APIMatic | Independent | Closed source | Up to 7 SDK languages | 14-day trial | [From $10/month](https://www.apimatic.io/pricing) |
| Stainless | Winding down | Closed source | n/a for new users | Closed to new signups | Closed to new signups |

## 1. Scalar

**What it is.** A hosted SDK generator that compiles an OpenAPI document into idiomatic client libraries and a CLI, alongside Scalar's API reference, API client, and hosted MCP servers. `docs` is a build target, so one generation run emits the SDKs and a static API reference from the same compiled document. Inputs include OpenAPI, AsyncAPI, and gRPC. Scalar also reads `stainless.yml`, and can emit a Speakeasy-compatible module so existing call sites keep compiling during a migration (see [Scalar vs Speakeasy](/resources/compare/speakeasy)).

**Languages.** Generally available: TypeScript, Python, Go, Java, Kotlin, and CLI. Experimental: Ruby, C#, PHP, Rust, Swift, Dart, and C++. Terraform and SQL are not supported.

**Pricing.** Every plan includes one SDK (one language target for one API). Free covers SDKs up to 25 endpoints, Pro ($150 per month) up to 100, Business ($600 per month) up to 250. Additional SDKs are $150 per month each up to 100 endpoints, or $600 per month each for 101 to 250 endpoints. Enterprise is custom. Details on the [pricing page](/pricing).

**Open source.** The generator is not open source. The API reference and API client are MIT licensed.

**Best for.** Teams who want SDKs, docs, and an MCP server generated from one OpenAPI document by one vendor, with a price they can calculate up front. Also teams leaving Stainless, since `stainless.yml` is read directly.

**Watch out for.** Six targets are generally available, still fewer than Speakeasy or Fern, and the generator is closed source. It is in production today at [Warp](/customers/warp), [Profound](/customers), Dedalus Labs and others. Real output: the public [Warp TypeScript SDK](https://github.com/TeamWarp/warp-sdk-typescript) and the [Warp case study](/customers/warp).

## 2. Speakeasy

**Disclosure first.** Scalar and Speakeasy work together. Speakeasy [documents a Scalar integration](https://www.speakeasy.com/docs/sdks/sdk-docs/integrations/scalar) for teams who want Speakeasy SDKs with Scalar docs, and Speakeasy's own [API reference](https://www.speakeasy.com/docs/ai-control-plane/reference/api-reference) is rendered by Scalar. We are not neutral here, and we would rather you knew it.

**What it is.** One of the most established commercial SDK generators, with years of SDKs shipping in production at companies such as [Vercel](https://github.com/vercel/sdk). On 17 September 2026 Speakeasy [released its generators under AGPL-3.0](https://www.speakeasy.com/blog/partnering-with-google) in the [openapi-generation repository](https://github.com/speakeasy-api/openapi-generation), covering SDKs, a CLI generator, and an MCP server generator. Their announcement says code generated with the tools belongs to you, and that commercial licensing is still available. The company's positioning has moved toward an AI control plane, and its [pricing page](https://www.speakeasy.com/pricing) lists a single "Tailored" enterprise plan.

**Languages.** The repository lists TypeScript, Python, Go, Java, C#, PHP, Ruby, and Unity, plus Terraform providers, CLI applications, MCP servers in TypeScript, and Postman collections.

**Pricing.** Free accounts can [generate one SDK with up to 50 API methods](https://www.speakeasy.com/docs/sdks/introduction). Everything else is a conversation with sales, or you run the AGPL generator yourself.

**Best for.** Teams that need [Terraform providers](https://www.speakeasy.com/docs/terraform/create-terraform), a broad set of mature languages, or a generator they can run and read under an open licence.

**Watch out for.** AGPL-3.0 has real obligations if you modify the generator and offer it as a network service; read the licence with your legal team before building on it. Ask Speakeasy directly where SDK generation sits on their roadmap now that the company leads with the AI control plane. Compare at [Scalar vs Speakeasy](/resources/compare/speakeasy) and see [Speakeasy alternatives](/alternatives/speakeasy).

## 3. Fern

**What it is.** A docs and SDK platform, [acquired by Postman](https://buildwithfern.com/post/postman-acquires-fern) in January 2026. Fern says the product and brand are not changing.

**Languages.** The [repository](https://github.com/fern-api/fern) lists TypeScript, Python, Java, Go, Ruby, PHP, C#, Swift, and Rust. The pricing page mentions Kotlin in progress.

**Pricing.** The free SDK plan covers Python and TypeScript up to 200 endpoints, with pagination, retries, OAuth, and registry publishing. Enterprise is priced per SDK and billed annually, with unlimited endpoints and all languages. Postman Team customers get up to 500 endpoints free ([pricing](https://buildwithfern.com/pricing.md)).

**Open source.** The generators are Apache-2.0.

**Inputs.** OpenAPI, AsyncAPI, gRPC (Protobuf), and OpenRPC. That is broader than Scalar, which does not read OpenRPC.

**Best for.** Teams with gRPC or JSON-RPC APIs, teams already paying for Postman, and anyone who wants to read the generator source under a permissive licence.

**Watch out for.** Languages beyond Python and TypeScript need an annual, per-SDK Enterprise contract. See [Scalar vs Fern](/resources/compare/fern).

## 4. OpenAPI Generator

**What it is.** The community fork of Swagger Codegen, and the default free choice. It generates API clients, server stubs, and documentation for dozens of languages and frameworks. Latest release on 26 September 2026 was 7.25.0, published 24 August 2026.

**Pricing.** Free. The project states that generated code is not subject to the project's licence.

**Open source.** [Apache-2.0](https://github.com/OpenAPITools/openapi-generator), about 26,800 GitHub stars.

**OpenAPI support.** OpenAPI 2.0 and 3.0, with OpenAPI 3.1 support marked beta in the README.

**Best for.** Teams who want free, self-run generation across many languages, including server stubs, and who have the engineering time to template and post-process the output.

**Watch out for.** Output quality varies a lot by generator, because each language is maintained by different contributors. There is no hosted publishing, custom-code merging, or support contract. It needs Java 11 or newer to run. See [OpenAPI Generator alternatives](/alternatives/openapi-generator) and [Scalar vs OpenAPI Generator](/resources/compare/openapi-generator).

## 5. Kiota

**What it is.** Microsoft's open-source command-line client generator, built on OpenAPI.NET. Kiota's pitch is a consistent client shape across languages for calling any OpenAPI-described API.

**Languages.** Stable: C#, Go, Java, PHP, Python. Preview: TypeScript, Dart, Ruby ([README](https://github.com/microsoft/kiota)).

**Pricing.** Free.

**Open source.** MIT, about 3,800 GitHub stars.

**Best for.** Teams consuming third-party APIs who want one consistent, free client generator, especially in .NET shops.

**Watch out for.** Kiota generates request builders that mirror URL paths rather than a hand-crafted, resource-named SDK surface. That suits API consumers well, and suits API vendors shipping a branded SDK less well. TypeScript is still preview.

## 6. liblab

**What it is.** A commercial SDK and MCP generator.

**Languages.** The [docs](https://liblab.com/docs) list TypeScript, Python, Java, .NET, Go, and PHP, plus Terraform.

**Pricing.** The [pricing page](https://liblab.com/pricing) publishes MCP generator pricing (100 free MCP calls per month for the first year, then $5 per 100 calls) but no SDK pricing.

**Open source.** No.

**Best for.** Teams who want Terraform alongside SDKs from a smaller vendor and are happy to get a quote.

**Watch out for.** No published SDK price.

## 7. APIMatic

**What it is.** A long-running commercial platform that generates SDKs and a docs portal together, with an API transformer for converting between formats.

**Pricing.** Lite Starter is $10 per month for one API portal, 20 endpoints per API, and one SDK language. Basic is $300 per month per language, up to five languages. Business and Enterprise are quoted, with all seven SDK languages and white labeling on Business ([pricing](https://www.apimatic.io/pricing)).

**Open source.** No.

**Best for.** Teams who want SDKs and a docs portal from one vendor with a low entry price for a single language.

**Watch out for.** Per-language pricing adds up quickly once you want four or five languages. Premium SDK features such as pagination and webhooks are listed on Business.

## 8. Stainless (winding down)

**What it is.** The generator behind many well-known SDKs; Stainless lists [OpenAI and Cloudflare among its users](https://www.stainless.com/). On 18 May 2026 Stainless [announced it was joining Anthropic](https://www.stainless.com/blog/stainless-is-joining-anthropic/) and winding down all hosted products, including the SDK generator. The announcement says new signups, projects, and SDKs are no longer available, and that customers own the SDKs they have already generated.

**Status for buyers.** You cannot start with Stainless today. If you are an existing customer, your SDKs keep working; what stops is regeneration as your API changes.

**Where to go.** Scalar reads `stainless.yml` and produces output deliberately close to Stainless's shape. See the [Stainless wind-down guide](/resources/stainless-wind-down), the [migration guide](/resources/migration/stainless), [Scalar vs Stainless](/resources/compare/stainless), and [Stainless alternatives](/alternatives/stainless).

## When another generator is the better choice

- **You need Terraform providers.** Speakeasy and liblab generate them. Scalar does not.
- **You need many languages generally available today.** Speakeasy and Fern have more mature targets than our six.
- **You want to read and run the generator yourself.** Fern (Apache-2.0), OpenAPI Generator (Apache-2.0), Kiota (MIT), or Speakeasy (AGPL-3.0). Scalar's generator is closed.
- **Your API is JSON-RPC.** Fern reads OpenRPC; Scalar does not.
- **You consume other people's APIs and want free, consistent clients.** Kiota or OpenAPI Generator.
- **You need server stubs, not client SDKs.** OpenAPI Generator.

## Build or buy?

Free generators cost engineering time instead of money. The hidden work is templates, post-processing, pagination and retry helpers, custom code that survives regeneration, release automation, and keeping up with your API. A commercial generator is worth it when that work would take a platform engineer more than a few weeks a year. We cover the trade-off in [build vs buy an SDK](/learn/sdk/build-vs-buy-sdk), and walk through the mechanics in [generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi).

## Frequently asked questions

<scalar-detail title="What is the best free SDK generator?">
For self-run generation, OpenAPI Generator (Apache-2.0) covers the most languages and Kiota (MIT) gives the most consistent output across its stable languages. Speakeasy's generator is now AGPL-3.0. For hosted free tiers: Scalar includes one SDK up to 25 endpoints, Fern covers Python and TypeScript up to 200 endpoints, and Speakeasy allows one SDK with up to 50 methods.
</scalar-detail>

<scalar-detail title="Is Speakeasy open source now?">
Speakeasy released its SDK, CLI, and MCP server generators under AGPL-3.0 on 17 September 2026, in the speakeasy-api/openapi-generation repository. Commercial licensing is still available from Speakeasy for teams that need different terms.
</scalar-detail>

<scalar-detail title="What happened to Stainless?">
Stainless announced on 18 May 2026 that it was joining Anthropic and winding down its hosted products, including the SDK generator. New signups, projects, and SDKs are closed. Existing customers own the code they already generated. Our [wind-down guide](/resources/stainless-wind-down) covers the options.
</scalar-detail>

<scalar-detail title="What is the difference between OpenAPI Generator and a commercial SDK generator?">
OpenAPI Generator is a free, community-maintained tool you run yourself, with quality that varies by language. Commercial generators add idiomatic, consistently designed output, hosted generation and publishing, custom code that survives regeneration, and support. Whether that is worth paying for depends on how many languages you ship and how often your API changes.
</scalar-detail>

<scalar-detail title="Can I generate an SDK from Swagger 2.0?">
Most generators accept Swagger 2.0 directly or after conversion. Converting to OpenAPI 3.1 first usually gives better results, because 3.1 aligns with JSON Schema. Scalar's open-source [OpenAPI upgrader](/tools/openapi-upgrader/getting-started) handles the conversion.
</scalar-detail>

<scalar-detail title="Which SDK generator supports the most languages?">
By raw count, OpenAPI Generator. Among commercial generators, Speakeasy and Fern each list eight or nine languages. Check which ones each vendor marks as stable or generally available, since that matters more than the length of the list.
</scalar-detail>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [SDK vs API](/learn/sdk/sdk-vs-api)
- **Docs:** [SDK generator getting started](/products/sdk-generator/getting-started)
- **Product:** [SDK Generator](/products/sdk-generator) — typed SDKs and a CLI from your OpenAPI document, with one SDK included on every plan

---

*Vendor status, licences, languages, and prices are taken from each vendor's public announcements, pricing pages, documentation, and GitHub repositories as of 26 September 2026, and are linked inline. This page is written by Scalar, which makes one of the generators listed, and Scalar has a working relationship with Speakeasy. We have tried to be accurate and to say where others are stronger. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
