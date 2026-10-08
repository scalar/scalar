# Scalar vs Stainless

*Last updated: September 2026*

Stainless set the bar for what a generated SDK should feel like. If you have used the OpenAI, Anthropic, or Cloudflare client libraries, you have used one.

This page is written by Scalar, so read it with that in mind. Every claim we make about Stainless links to Stainless's own documentation, pricing page, or public repositories. If we have something wrong, tell us and we will fix it.

**The thing that changes this comparison:** on 18 May 2026 Stainless [announced they are joining Anthropic](https://www.stainless.com/blog/stainless-is-joining-anthropic) and winding down their hosted products, including the SDK generator. Their announcement is explicit that new signups, projects, and SDKs are not available. As of late September 2026, that announcement is still the most recent post on the [Stainless blog](https://www.stainless.com/blog), no end-of-service date for the hosted products has been published, and the [pricing page](https://www.stainless.com/pricing/) no longer lists paid plans.

So this is not a comparison you can act on by signing up for both. It is still worth writing, because "how does this compare to Stainless" is the question we are asked most often — Stainless SDKs are the reference point people carry in their heads, and a lot of teams are now holding one they can no longer regenerate.

If you are looking for the practical steps rather than the product comparison, go straight to the [Stainless migration guide](../migration/stainless.md).

## At a glance

| | Scalar | Stainless |
| --- | --- | --- |
| Accepting new customers | Yes | [No, as of May 2026](https://www.stainless.com/blog/stainless-is-joining-anthropic) |
| Generally available targets | TypeScript, Python, Go, Java, Kotlin, CLI | [TypeScript, Python, Go, Java, Kotlin, Ruby, PHP, C#](https://www.stainless.com/products/sdks) |
| Terraform providers | No | [Yes, experimental](https://www.stainless.com/docs/terraform/) |
| MCP servers | Yes, hosted and configurable | [Yes](https://www.stainless.com/docs/mcp/), generated to deploy yourself |
| Docs renderer | MIT, self-hostable on any plan | [Hosted docs platform](https://www.stainless.com/products/docs/) |
| Standalone API client | Yes, open source | No |
| Reads `stainless.yml` | Yes | Yes |
| Published price | One target included; additional targets from $150/month | [No longer published](https://www.stainless.com/pricing/) |

## Where Stainless is stronger

**Scale, and everything that comes with it.** Stainless states that SDKs generated on their platform are [downloaded over 130 million times per week](https://www.stainless.com/docs/compare/speakeasy/), across [OpenAI, Cloudflare, Modern Treasury, Lithic, MUX, Replicate, and Weights & Biases](https://www.stainless.com/). Years of that traffic is years of edge cases found and fixed by someone else. Scalar's generator is in production at [Warp](/customers/warp), [Profound](/customers), Dedalus Labs and others, but not yet at that scale, and no amount of testing substitutes for that exposure. This is the honest gap.

**More languages past the experimental line.** Stainless ships [TypeScript, Python, Go, Java, Kotlin, Ruby, PHP, and C#](https://www.stainless.com/products/sdks), with [SQL](https://www.stainless.com/docs/sdks/sql/) as an additional, experimental target. Scalar has six generally available targets. Stainless also treats [Kotlin as a distinct SDK rather than a Java wrapper](https://www.stainless.com/docs/design/kotlin-and-java/) — nullable types instead of `Optional`, `Sequence` instead of `Stream`, `suspend` functions instead of `CompletableFuture`. Scalar generates Kotlin as its own target too, separate from Java, so compare the two outputs on your own document.

**Terraform providers.** Stainless [generates Terraform providers](https://www.stainless.com/docs/terraform/) from an OpenAPI document, labelled experimental. Scalar does not, at all; Terraform is on our roadmap with no date. If your API is infrastructure that people declare rather than call, that is the whole comparison.

**MCP servers as code you deploy.** Both products do MCP — Scalar's is hosted, covered below — but Stainless generates the server as code with [Docker publishing, remote deployment, OAuth for pre-registered apps, and per-tool permissions](https://www.stainless.com/docs/mcp/). If the server has to run inside your own infrastructure, that shape is theirs and not ours.

**They wrote down their design decisions.** Stainless publishes the reasoning behind choices most vendors leave implicit — [why they do not do runtime request validation](https://www.stainless.com/docs/design/runtime-request-validation/), [why Kotlin and Java are separate SDKs](https://www.stainless.com/docs/design/kotlin-and-java/). We think that is the right instinct and we have less of it published than they do.

**Enterprise depth.** [Breaking change detection](https://www.stainless.com/docs/enterprise/breaking-change-detection/), [pinned SDK versions](https://www.stainless.com/docs/enterprise/pin-sdk-versions/), [code owners](https://www.stainless.com/docs/enterprise/codeowners/), [GitHub issue triage](https://www.stainless.com/docs/enterprise/issue-triage/), and [SSO and SCIM](https://www.stainless.com/docs/enterprise/sso-and-scim/) are documented features of a mature platform.

## Why the SDKs look so similar

Scalar's generated output is deliberately close to Stainless's. We are not going to pretend otherwise, and it is the single most useful fact on this page.

Compare the error surface. Stainless's TypeScript SDKs export a hierarchy of `BadRequestError`, `AuthenticationError`, `PermissionDeniedError`, `NotFoundError`, `ConflictError`, `UnprocessableEntityError`, `RateLimitError`, and `InternalServerError`, plus connection and abort errors — the full list is in [their own comparison page](https://www.stainless.com/docs/compare/speakeasy/). Scalar's generated clients export the same names — readable in [`src/core/error.ts`](https://github.com/TeamWarp/warp-sdk-typescript/blob/scalar-generated/src/core/error.ts) of the public [Warp SDK](https://github.com/TeamWarp/warp-sdk-typescript/tree/scalar-generated):

```ts
import { APIError, NotFoundError, RateLimitError } from "warp-hr";

try {
  const list = await client.customWorkerFields.list();
} catch (err) {
  if (err instanceof RateLimitError) {
    // 429, with typed access to status, name, and headers
  }
  if (err instanceof APIError) {
    console.log(err.status, err.name, err.headers);
  }
  throw err;
}
```

The same convergence runs through resource-namespaced methods, auto-pagination, `Retry-After` handling, per-call raw response access, and zero runtime dependencies. The Warp package ships `"dependencies": {}`.

This is not an accident and it is not flattery. A generated SDK is a public API contract, and the conventions Stainless established are the ones a large share of working developers already have in their fingers. Diverging for the sake of it would cost users.

It also has a practical consequence: **your call sites keep working.** Scalar reads [`stainless.yml`](https://www.stainless.com/docs/reference/config/) directly, so resources, method names, sub-resources, models, pagination schemes, and per-language package names carry across rather than being re-derived from the OpenAPI document. Regenerating from the specification alone would give you a different SDK — new namespaces, new method names, a breaking change for everyone who installed your package. That is the part of leaving Stainless that actually costs money, and it is the part we built for.

## How we test, and against what

Since we cannot claim Stainless's production exposure, here is what we do instead.

Scalar runs a parity harness that clones production SDKs at pinned commits, extracts the public surface from both ours and theirs, and fails the build on drift in operation coverage, wire shapes, unions, enums, pagination behavior, requiredness, or parameter location. It then drives both clients through every shared operation against a recording mock and diffs the requests they actually send.

The SDKs teams publish today are frequently Stainless-generated, so in practice a good deal of that harness is Scalar being measured against Stainless's output. We would rather say that plainly than imply we arrived at the same conventions independently.

Alongside it, generally available targets carry end-to-end tests that generate, build, and run against a live server on every change, and every target gets smoke tests that call each operation against a mock server.

## Targets, honestly

Scalar's generally available targets are **TypeScript, Python, Go, Java, Kotlin, and the CLI**.

Ruby, C#, PHP, Rust, Swift, Dart, and C++ are experimental. Ruby and C# sit in the same continuous integration matrix as the generally available targets and are the closest behind, but the label is there for a reason. PHP, Rust, Swift, Dart, and C++ generate working code and carry a talk-to-us-first caveat. The [SDK generator page](../guides/sdks/index.md) says the same thing.

If you are on a Stainless Kotlin, Java, C#, or PHP SDK today, that is the honest friction point in moving to Scalar, and it is worth raising with us before you plan a migration rather than after.

## Docs

Stainless's docs platform is [an Astro project](https://www.stainless.com/docs/docs-platform/hosting-and-deploys/) whose repository lives in the `stainless-sdks` GitHub organisation rather than yours, with a component library, AI chat, custom domains, and analytics. Their [hosting documentation](https://www.stainless.com/docs/docs-platform/hosting-and-deploys/) describes forking the project into your own organisation and deploying it yourself, which means taking on the CI, deployment, domain, and operational work.

Scalar's approach differs in two ways that matter if you are deciding where to land.

**The renderer is yours.** The API reference is MIT licensed and self-hostable on any plan. You get themes and CSS variables, arbitrary custom HTML, CSS, and JavaScript on any page, and the option to fork it outright.

**Docs and SDKs come from the same run.** In Scalar's generator, `docs` is a build target alongside the language targets. One run emits the SDKs, a static API reference, and `openapi.augmented.json` — the exact artifact the SDKs were generated from. Your reference and your client libraries cannot describe different APIs.

The site you are reading is the product: scalar.com — this page, the pricing page, the guides, the API reference, and the blog — is built and hosted on Scalar Docs from a single `scalar.config.json`.

## Agents

Both products take agent consumption seriously, and both generate MCP servers from your OpenAPI document. The split is where the server runs.

Stainless generates [the server as code](https://www.stainless.com/docs/mcp/), with per-tool permissions, Docker publishing, remote deployment, and OAuth for pre-registered apps. You deploy and operate it. Their MCP docs now mark Stainless-hosted code execution as deprecated, so plan on running everything locally.

Scalar hosts it. You pick which endpoints become tools in the dashboard, choose per tool whether it is exposed for lookup only or makes real authenticated requests, and store API credentials against the installation so they never reach the client. The server runs at `mcp.scalar.com`, private by default, with Personal Access Tokens for your team and OAuth for people outside it. There is a separate Docs MCP at `your-docs-domain/mcp` for searching and reading your published documentation. See the [MCP servers guide](../guides/agent/mcp.md).

If you need the server inside your own network or under your own compliance boundary, generated code is the right shape and Stainless's is the more configurable one. If you would rather not operate another service, hosted is less work.

Scalar also ships agent context inside the SDK itself: a `SKILL.md`, a `.claude/skills/` entry for automatic discovery, a generated `api.md` listing every method grouped by resource, and an `openapi.augmented.json`. All four are readable in the [generated Warp SDK](https://github.com/TeamWarp/warp-sdk-typescript/tree/scalar-generated). That is a narrower goal than an MCP server — stop an agent inventing a method name that does not exist — and it is on by default rather than a separate target to configure.

## Pricing

| Plan | Scalar ([pricing](https://scalar.com/pricing)) | Stainless ([pricing](https://www.stainless.com/pricing/)) |
| --- | --- | --- |
| Free | $0: 1 SDK up to 25 endpoints, docs with 1 editor seat, up to 3 APIs | Not available to new customers |
| Entry paid | Pro, $150/month ($125/month billed yearly): 1 SDK up to 100 endpoints, 5 editor seats, MCP servers | No longer published |
| Mid tier | Business, $600/month ($500/month billed yearly): SDKs up to 250 endpoints, 10 editor seats, SSO | No longer published |
| Top tier | Enterprise, custom, with migration services | No longer published |
| Additional SDKs | $150/month each up to 100 endpoints, $600/month each for 101–250 | — |

Checked on 26 September 2026. Stainless's pricing page no longer shows paid plans, and [new signups are closed](https://www.stainless.com/blog/stainless-is-joining-anthropic).

## Stainless vs Scalar

If you ship Stainless SDKs today, the practical question is not which product is better but when you move. Nothing breaks on a deadline: the code is yours, and your published packages keep working. What you lose is regeneration, so the clock starts the next time your API changes.

Staying put is reasonable if your API is stable and you expect few changes for a while, or if you depend on the Terraform or Kotlin output where we are not yet a like-for-like replacement.

Scalar is built for the rest. It reads your `stainless.yml`, keeps resource and method names so your users' call sites keep compiling, and produces the same error classes and pagination conventions. The TypeScript, Python, and Go SDKs are the ones where the move is lowest risk today. Migrating before your next breaking API change is easier than migrating during it, and the [migration guide](../migration/stainless.md) shows the steps.

## Which should you choose?

If you are starting fresh, this is not really a choice: Stainless is [not accepting new customers](https://www.stainless.com/blog/stainless-is-joining-anthropic).

**Stay on Stainless for now if** your SDKs are stable, your API is not changing, and you would rather wait and see. You own the code you have generated and nothing breaks on a deadline. The question is only what happens the next time your API changes.

**Look hard at us if** you want the same SDK conventions without re-authoring your configuration, you want your documentation and SDKs produced by the same run, you want a documentation layer you own under MIT rather than an Astro fork you now maintain, or you want a real API client alongside your docs.

**Look elsewhere if** you depend on Terraform providers, on an MCP server running as code inside your own infrastructure rather than hosted, or on a production-supported Kotlin, Java, C#, or PHP SDK. Those are places we would be overselling. Our [wind-down write-up](../resources/stainless-wind-down.md) says where to go instead — it weighs OpenAPI Generator, Speakeasy, Fern, APIMatic, liblab, and the open source options alongside us, and names the ones that beat us at each of those.

Ready to move? The [Stainless migration guide](../migration/stainless.md) walks through the config import and the API surface diff, and we will do it with you. [Start free](https://dashboard.scalar.com/register) or [talk to us](https://scalar.cal.com/).

## Frequently asked questions

<scalar-detail title="Is Stainless shutting down?">

Stainless [joined Anthropic in May 2026](https://www.stainless.com/blog/stainless-is-joining-anthropic) and is winding down its hosted products, including the SDK generator. New signups, projects, and SDKs are not available. As of September 2026 no end-of-service date has been published.

</scalar-detail>

<scalar-detail title="What happens to SDKs I already generated with Stainless?">

They keep working. The code is in your repositories and your published packages stay published. What stops is regeneration on Stainless, so the next change to your API is when you need a new generator.

</scalar-detail>

<scalar-detail title="Can Scalar read my stainless.yml?">

Yes. Scalar reads `stainless.yml` directly, so resources, method names, sub-resources, models, pagination, and per-language package names carry across. That keeps your users' call sites working instead of producing a new SDK surface. The [migration guide](../migration/stainless.md) walks through it.

</scalar-detail>

<scalar-detail title="Does Scalar generate Terraform providers like Stainless?">

No. Terraform providers are on Scalar's roadmap with no date. If Terraform output is essential for you, our [wind-down write-up](../resources/stainless-wind-down.md) lists the alternatives that support it today.

</scalar-detail>

<scalar-detail title="Which Stainless SDK languages can Scalar replace today?">

TypeScript, Python, Go, Java, and Kotlin are generally available, along with a CLI target. Ruby, C#, PHP, Rust, Swift, Dart, and C++ are experimental. If you are moving a Stainless C# or PHP SDK, talk to us before you plan the migration.

</scalar-detail>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [Generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi)
- **Docs:** [Stainless migration guide](../migration/stainless.md) · [Stainless alternatives](/alternatives/stainless) · [After the Stainless wind-down](../resources/stainless-wind-down.md)
- **Product:** [Scalar SDK Generator](/products/sdk-generator) — reads your stainless.yml so your SDK surface survives the move

---

*This comparison is based on Stainless's publicly available documentation, pricing page, and public GitHub repositories as of September 2026, and on Scalar's own source and generated output. Stainless announced their wind-down in May 2026, so their documentation may change or be withdrawn and some links here may not survive. We have made a genuine effort to be accurate and to state where Stainless is better. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
