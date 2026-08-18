# Scalar vs Stainless

Stainless set the bar for what a generated SDK should feel like. If you have used the OpenAI, Anthropic, or Cloudflare client libraries, you have used one.

This page is written by Scalar, so read it with that in mind. Every claim we make about Stainless links to Stainless's own documentation, pricing page, or public repositories. If we have something wrong, tell us and we will fix it.

**The thing that changes this comparison:** on 18 May 2026 Stainless [announced they are joining Anthropic](https://www.stainless.com/blog/stainless-is-joining-anthropic) and winding down their hosted products, including the SDK generator. Their announcement is explicit that new signups, projects, and SDKs are not available.

So this is not a comparison you can act on by signing up for both. It is still worth writing, because "how does this compare to Stainless" is the question we are asked most often — Stainless SDKs are the reference point people carry in their heads, and a lot of teams are now holding one they can no longer regenerate.

If you are looking for the practical steps rather than the product comparison, go straight to the [Stainless migration guide](../migration/stainless.md).

## At a glance

| | Scalar | Stainless |
| --- | --- | --- |
| Accepting new customers | Yes | [No, as of May 2026](https://www.stainless.com/blog/stainless-is-joining-anthropic) |
| Generally available targets | TypeScript, Python, Go, CLI | [TypeScript, Python, Go, Java, Kotlin, Ruby, PHP, C#](https://www.stainless.com/products/sdks) |
| Terraform providers | No | [Yes](https://www.stainless.com/docs/terraform/) |
| MCP servers | Yes, hosted and configurable | [Yes](https://www.stainless.com/docs/mcp/), generated to deploy yourself |
| Docs renderer | MIT, self-hostable on any plan | [Hosted docs platform](https://www.stainless.com/products/docs/) |
| Standalone API client | Yes, open source | No |
| Reads `stainless.yml` | Yes | Yes |
| Published price | One target included; additional targets $150/month | [Published](https://www.stainless.com/pricing/) |

## Where Stainless is stronger

**Scale, and everything that comes with it.** Stainless states that SDKs generated on their platform are [downloaded over 130 million times per week](https://www.stainless.com/docs/compare/speakeasy/), across [OpenAI, Cloudflare, Modern Treasury, Lithic, MUX, Replicate, and Weights & Biases](https://www.stainless.com/). Years of that traffic is years of edge cases found and fixed by someone else. Scalar's generator is newer, and no amount of testing substitutes for that exposure. This is the honest gap.

**More languages past the experimental line.** Stainless ships [TypeScript, Python, Go, Java, Kotlin, Ruby, PHP, and C#](https://www.stainless.com/products/sdks), with [SQL](https://www.stainless.com/docs/sdks/sql/) as an additional target. Scalar has four generally available targets. Stainless is also, as far as we know, the only generator that treats [Kotlin as a distinct SDK rather than a Java wrapper](https://www.stainless.com/docs/design/kotlin-and-java/) — nullable types instead of `Optional`, `Sequence` instead of `Stream`, `suspend` functions instead of `CompletableFuture`. That is a real design commitment, not a checkbox.

**Terraform providers.** Stainless [generates Terraform providers](https://www.stainless.com/docs/terraform/) from an OpenAPI document. Scalar does not, at all. If your API is infrastructure that people declare rather than call, that is the whole comparison.

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

Scalar's generally available targets are **TypeScript, Python, Go, and the CLI**.

Java, Kotlin, Ruby, and C# are marked experimental. They sit in the same continuous integration matrix as the generally available targets and are the closest behind, but the label is there for a reason. PHP, Rust, Swift, Dart, and C++ generate working code and carry a talk-to-us-first caveat. The [SDK generator page](../guides/sdks/index.md) says the same thing.

If you are on a Stainless Kotlin, Java, C#, or PHP SDK today, that is the honest friction point in moving to Scalar, and it is worth raising with us before you plan a migration rather than after.

## Docs

Stainless's docs platform is [an Astro project](https://www.stainless.com/docs/docs-platform/hosting-and-deploys/) whose repository lives in the `stainless-sdks` GitHub organisation rather than yours, with a component library, AI chat, custom domains, and analytics. Their own guidance for the wind-down is to fork it out and take on the CI, deployment, domain, and operational work yourself.

Scalar's approach differs in two ways that matter if you are deciding where to land.

**The renderer is yours.** The API reference is MIT licensed and self-hostable on any plan. You get themes and CSS variables, arbitrary custom HTML, CSS, and JavaScript on any page, and the option to fork it outright.

**Docs and SDKs come from the same run.** In Scalar's generator, `docs` is a build target alongside the language targets. One run emits the SDKs, a static API reference, and `openapi.augmented.json` — the exact artifact the SDKs were generated from. Your reference and your client libraries cannot describe different APIs.

The site you are reading is the product: scalar.com — this page, the pricing page, the guides, the API reference, and the blog — is built and hosted on Scalar Docs from a single `scalar.config.json`.

## Agents

Both products take agent consumption seriously, and both generate MCP servers from your OpenAPI document. The split is where the server runs.

Stainless generates [the server as code](https://www.stainless.com/docs/mcp/), with per-tool permissions, Docker publishing, remote deployment, and OAuth for pre-registered apps. You deploy and operate it.

Scalar hosts it. You pick which endpoints become tools in the dashboard, choose per tool whether it is exposed for lookup only or makes real authenticated requests, and store API credentials against the installation so they never reach the client. The server runs at `mcp.scalar.com`, private by default, with Personal Access Tokens for your team and OAuth for people outside it. There is a separate Docs MCP at `your-docs-domain/mcp` for searching and reading your published documentation. See the [MCP servers guide](../guides/agent/mcp.md).

If you need the server inside your own network or under your own compliance boundary, generated code is the right shape and Stainless's is the more configurable one. If you would rather not operate another service, hosted is less work.

Scalar also ships agent context inside the SDK itself: a `SKILL.md`, a `.claude/skills/` entry for automatic discovery, a generated `api.md` listing every method grouped by resource, and an `openapi.augmented.json`. All four are readable in the [generated Warp SDK](https://github.com/TeamWarp/warp-sdk-typescript/tree/scalar-generated). That is a narrower goal than an MCP server — stop an agent inventing a method name that does not exist — and it is on by default rather than a separate target to configure.

## Which should you choose?

If you are starting fresh, this is not really a choice: Stainless is [not accepting new customers](https://www.stainless.com/blog/stainless-is-joining-anthropic).

**Stay on Stainless for now if** your SDKs are stable, your API is not changing, and you would rather wait and see. You own the code you have generated and nothing breaks on a deadline. The question is only what happens the next time your API changes.

**Look hard at us if** you want the same SDK conventions without re-authoring your configuration, you want your documentation and SDKs produced by the same run, you want a documentation layer you own under MIT rather than an Astro fork you now maintain, or you want a real API client alongside your docs.

**Look elsewhere if** you depend on Terraform providers, on an MCP server running as code inside your own infrastructure rather than hosted, or on a production-supported Kotlin, Java, C#, or PHP SDK. Those are places we would be overselling. Our [wind-down write-up](../resources/stainless-wind-down.md) says where to go instead — it weighs OpenAPI Generator, Speakeasy, Fern, APIMatic, liblab, and the open source options alongside us, and names the ones that beat us at each of those.

Ready to move? The [Stainless migration guide](../migration/stainless.md) walks through the config import and the API surface diff, and we will do it with you. [Start free](https://dashboard.scalar.com/register) or [talk to us](https://scalar.cal.com/).

---

*This comparison is based on Stainless's publicly available documentation, pricing page, and public GitHub repositories as of August 2026, and on Scalar's own source and generated output. Stainless announced their wind-down in May 2026, so their documentation may change or be withdrawn and some links here may not survive. We have made a genuine effort to be accurate and to state where Stainless is better. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
