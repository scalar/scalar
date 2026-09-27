# Best OpenAPI Generator alternatives (2026)

*Last updated: September 2026*

The right OpenAPI Generator alternative depends on one question: are you publishing SDKs for other people to install, or generating a client for an API you call yourself? This guide sorts the options by that job, with sources for every claim.

[OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator) is the most widely used open-source code generator for OpenAPI. It is Apache 2.0 licensed, has nearly 27,000 GitHub stars, still ships regularly ([v7.25.0 in August 2026](https://github.com/OpenAPITools/openapi-generator/releases)), and covers an enormous range of languages and frameworks, including server stubs. Nothing on this page is a reason to rip it out if it is working for you.

We make Scalar, which is listed first. For a detailed, code-level head-to-head, read [Scalar vs OpenAPI Generator](/resources/compare/openapi-generator); this page is the wider map.

## Why teams look for an alternative

**Composition keywords are still hard.** The request for full [`anyOf`, `oneOf` and `allOf` support](https://github.com/OpenAPITools/openapi-generator/issues/10514) has been open since 2021 with a bounty attached, and [improving `oneOf` handling](https://github.com/OpenAPITools/openapi-generator/issues/15) has been open since the project's first week in 2018. How well polymorphic schemas come out depends heavily on which generator you use. If your API uses discriminated unions, test your target language before you commit.

**OpenAPI 3.1 is still labelled beta.** The README lists OpenAPI 3.1 as ["beta support"](https://github.com/OpenAPITools/openapi-generator#overview). The long-running [3.1 support issue](https://github.com/OpenAPITools/openapi-generator/issues/9083) is closed, and many 3.1 documents generate fine, but specific keywords such as [`prefixItems`](https://github.com/OpenAPITools/openapi-generator/issues/18911) are open requests.

**The issue backlog is large.** There are more than 5,100 open issues at the time of writing. That is partly a sign of success, since huge projects attract huge trackers, but it means a bug in your generator may wait a long time unless someone on your team fixes it.

**Quality varies by generator.** Each language is maintained by volunteers on a [technical committee](https://github.com/OpenAPITools/openapi-generator#62---openapi-generator-technical-committee), and some generators are marked beta, experimental or deprecated. The TypeScript output you get from one generator can look nothing like the Python output from another. For a company publishing SDKs in several languages, that inconsistency ends up in front of customers.

**Customising means owning templates.** Changing what the output looks like usually means copying and overriding the Mustache templates. Those overrides then need merging by hand every time you upgrade the generator.

**The toolchain needs Java.** The CLI [requires a Java 11 runtime at a minimum](https://github.com/OpenAPITools/openapi-generator#13---download-jar), even through the npm wrapper. Minor for a Java shop, one more thing to install in a Node or Python CI image.

**Publishing is up to you.** OpenAPI Generator writes code to a folder. Versioning, changelogs, READMEs, registry publishing and keeping the SDK in sync with the API are separate work.

## First, pick the job

| If you need to... | Look at | Why |
| --- | --- | --- |
| Publish SDKs in several languages to npm, PyPI and others | Scalar, Speakeasy, Fern | Consistent output across languages plus release automation |
| Generate a TypeScript client for your own front end | openapi-typescript, Hey API, Orval | Lightweight, TypeScript-first, no Java |
| Generate a Go client or server | oapi-codegen | Idiomatic Go, single binary |
| Call an API from many languages in-house | Kiota | Free, consistent model, Microsoft-maintained |
| Generate server stubs in many frameworks | Stay on OpenAPI Generator | Nothing else on this list covers as many server frameworks |

## OpenAPI Generator alternatives compared

| Tool | License | Languages | Hosted publishing | Runs on |
| --- | --- | --- | --- | --- |
| **Scalar** | Hosted service | TypeScript, Python, Go, CLI GA; 9 more experimental | Yes | Scalar dashboard |
| [Speakeasy](https://github.com/speakeasy-api/openapi-generation) | [AGPL-3.0](https://www.speakeasy.com/blog/partnering-with-google), commercial licence available | 7 SDK languages plus CLI and MCP | Commercial platform | Go binary |
| [Fern](https://github.com/fern-api/fern) | Apache 2.0 | [TypeScript and Python free; 10 on Enterprise](https://buildwithfern.com/pricing.md) | Yes | CLI + cloud |
| [Kiota](https://learn.microsoft.com/en-us/openapi/kiota/overview) | MIT | C#, Go, Java, PHP, Python, Ruby, TypeScript | No | CLI |
| [openapi-typescript](https://github.com/openapi-ts/openapi-typescript) | MIT | TypeScript types from OpenAPI 3.0 and 3.1 | No | Node |
| [Hey API](https://github.com/hey-api/openapi-ts) | MIT | TypeScript, with 20+ plugins | No | Node |
| [Orval](https://github.com/orval-labs/orval) | MIT | TypeScript clients, hooks and mocks | No | Node |
| [oapi-codegen](https://github.com/oapi-codegen/oapi-codegen) | Apache 2.0 | Go, OpenAPI 3.0 and 3.1 | No | Go |

Licenses from each GitHub repository and vendor page, checked 26 September 2026.

## The alternatives

### 1. Scalar SDK generator

Scalar generates idiomatic SDKs from the OpenAPI document you already maintain, and publishes them from your own GitHub repositories through pull requests. TypeScript, Python, Go and a CLI are generally available; Java, Kotlin, Ruby, C#, PHP, Rust, Swift, Dart and C++ are experimental, and we label them that way everywhere. OpenAPI 3.0 and 3.1 are supported and Swagger 2.0 documents are upgraded on load.

The differences from OpenAPI Generator are in the parts around the code. Composition keywords become real union types with discriminator support. Pagination, retries with `Retry-After`, timeouts, typed errors and webhook signature verification are built in. Custom code you add in the SDK repository is carried forward on every regeneration through a [three-way merge](/products/sdk-generator/custom-code), so you never maintain template forks. Release pull requests, changelogs and registry publishing workflows are generated for you.

It is a hosted product, not an open-source CLI. The Free plan includes one SDK for APIs up to 25 endpoints; Pro is [$150/month](/pricing) with one SDK up to 100 endpoints, and additional SDKs are $150/month each up to 100 endpoints.

**Verdict:** the shortest path from "we generate clients" to "we ship SDKs customers like".
**Best for:** API companies publishing TypeScript, Python or Go SDKs who also want docs and MCP from the same document.

### 2. Speakeasy

Speakeasy [open-sourced its generator under AGPL-3.0](https://www.speakeasy.com/blog/partnering-with-google) on 17 September 2026, covering SDKs in TypeScript, Python, Go, Java, C#, PHP and Ruby plus CLI and MCP server generation, with a commercial licence still available. Its generator is mature and its OpenAPI content is extensive. Note what AGPL means for your organisation before you embed the generator in internal tooling; the generated code itself is yours.

**Verdict:** a strong multi-language option, now inspectable in public.
**Best for:** teams comfortable with AGPL or buying Speakeasy's commercial platform. See [Speakeasy alternatives](/alternatives/speakeasy).

### 3. Fern

[Fern's generators](https://github.com/fern-api/fern) are Apache 2.0. Its free tier covers TypeScript and Python SDKs up to 200 endpoints; the other languages and features such as custom code sit on Enterprise, priced per SDK through sales. Fern was [acquired by Postman in January 2026](https://buildwithfern.com/post/postman-acquires-fern).

**Verdict:** good output and a permissive licence; pricing beyond the free tier is not published.
**Best for:** teams already in the Postman ecosystem. See [Scalar vs Fern](/resources/compare/fern).

### 4. Kiota

[Kiota](https://learn.microsoft.com/en-us/openapi/kiota/overview) is Microsoft's MIT-licensed client generator for C#, Go, Java, PHP, Python, Ruby and TypeScript. Every language follows the same model and depends on a small shared core library per language, so clients look alike across languages. It can generate a client for only the subset of the API you use.

**Verdict:** the best free option for consistent clients in many languages.
**Best for:** consumers of large APIs, and .NET teams in particular.

### 5. openapi-typescript, Hey API and Orval

Three MIT-licensed TypeScript-first tools, each with a different philosophy. [openapi-typescript](https://github.com/openapi-ts/openapi-typescript) generates types only and pairs with a tiny fetch wrapper. [Hey API](https://github.com/hey-api/openapi-ts) generates a typed SDK with plugins for Zod schemas, TanStack Query hooks and more. [Orval](https://github.com/orval-labs/orval) generates models, requests, hooks for query libraries, and MSW mocks.

**Verdict:** far lighter than OpenAPI Generator for front-end work, with no Java.
**Best for:** web apps consuming their own backend.

### 6. oapi-codegen

[oapi-codegen](https://github.com/oapi-codegen/oapi-codegen) generates Go clients, server interfaces for common routers, and types. It is Apache 2.0 licensed, has around 8,600 GitHub stars, and its README describes support for both OpenAPI 3.0 and 3.1.

**Verdict:** the idiomatic choice for Go.
**Best for:** Go teams who want generated types and handlers without the JVM.

### 7. Stainless (winding down)

Stainless was a popular hosted SDK generator until it [joined Anthropic in May 2026](https://www.stainless.com/blog/stainless-is-joining-anthropic/) and began winding down its hosted products. It is included here because many teams comparing OpenAPI Generator alternatives still find it in older articles. If you are on Stainless, Scalar reads `stainless.yml` directly; see the [Stainless wind-down guide](/resources/stainless-wind-down).

## When to stay on OpenAPI Generator

- **You need server stubs.** Its server generators span Spring, ASP.NET Core, FastAPI, Go frameworks and many more. None of the SDK platforms above generate servers.
- **You need an uncommon language.** Elixir, Haskell, OCaml, Ada, Zapier and dozens of others are covered. If your target is on the list, that alone may decide it.
- **You have invested in templates.** If your team already maintains custom templates that produce exactly what you want, the switching cost is real.
- **Everything runs offline.** OpenAPI Generator runs entirely in your CI with no external service. Hosted generators, including Scalar, do not.
- **The clients are internal.** For code only your own team imports, "good enough and free" is often the right bar.

## Running both during a migration

You do not have to switch in one go. A common pattern is to keep OpenAPI Generator for server stubs and internal clients, and move only the public SDKs to a publishing platform. The OpenAPI document stays the single source of truth for both. Validate it once in CI (for example `npx @scalar/cli document validate openapi.yaml`) so both pipelines read a document you trust. Then switch one language at a time, starting with the SDK that has the most users, and compare the generated surface before you publish a major version.

## Frequently asked questions

<scalar-detail title="Is there a better alternative to OpenAPI Generator for TypeScript?">
For a client inside your own web app, openapi-typescript, Hey API and Orval are lighter and TypeScript-native. For a TypeScript SDK you publish to npm for customers, a platform such as Scalar, Speakeasy or Fern adds pagination, retries, typed errors and release automation.
</scalar-detail>

<scalar-detail title="Does OpenAPI Generator support OpenAPI 3.1?">
Its README lists OpenAPI 3.1 as beta support. Many 3.1 documents generate correctly, but some keywords are still open feature requests, and results depend on which language generator you use.
</scalar-detail>

<scalar-detail title="Why does OpenAPI Generator need Java?">
It is written in Java and uses Mustache templates. The npm package is a wrapper that downloads and runs the JAR, so a Java 11 or newer runtime is required. There is also a Docker image if you would rather not install Java.
</scalar-detail>

<scalar-detail title="Which OpenAPI code generators are free and open source?">
OpenAPI Generator, Swagger Codegen, Kiota, openapi-typescript, Hey API, Orval and oapi-codegen are free and open source. Fern's generators are Apache 2.0. Speakeasy's generator is AGPL-3.0. Scalar's SDK generator is a hosted service with a free tier.
</scalar-detail>

<scalar-detail title="Can I keep my SDK method names if I move off OpenAPI Generator?">
Usually, with some configuration. Most generators derive method names from `operationId`, so keeping those stable keeps call sites stable. Scalar lets you define the resource tree and method names explicitly in its configuration, so you can match an existing SDK's public surface before you publish.
</scalar-detail>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [Build vs buy an SDK](/learn/sdk/build-vs-buy-sdk)
- **Docs:** [SDK generator getting started](/products/sdk-generator/getting-started)
- **Product:** [Scalar SDK Generator](/products/sdk-generator) — idiomatic SDKs published from your repositories, without template forks.

---

*This page is based on the public GitHub repositories, READMEs, documentation and pricing pages of OpenAPI Generator and every other tool listed, as of 26 September 2026. Code generation tools change quickly. We have made a genuine effort to be accurate and fair. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
