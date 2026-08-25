# Scalar vs Speakeasy

Speakeasy and Scalar both turn an OpenAPI document into client SDKs. If you are evaluating one, you should evaluate the other.

This page is written by Scalar, so read it with that in mind. Every claim we make about Speakeasy links to Speakeasy's own documentation, pricing page, or public repositories. If we have something wrong, tell us and we will fix it.

**Two things to disclose up front.**

The first is that we work together. Speakeasy [documents a Scalar integration](https://www.speakeasy.com/docs/sdks/sdk-docs/integrations/scalar) for teams who want Speakeasy SDKs and Scalar documentation, and Speakeasy's own [API reference](https://www.speakeasy.com/docs/ai-control-plane/reference/api-reference) is rendered by Scalar. Their [docs vendor comparison](https://www.speakeasy.com/blog/choosing-a-docs-vendor) is complimentary about us. We are not neutral about Speakeasy and we are not going to pretend the relationship does not exist.

The second is that Speakeasy's company focus has moved. As of August 2026 their [pricing page](https://www.speakeasy.com/pricing) covers the AI control plane — MCP gateways, agent identity, AI observability — and SDK generation sits under a separate "API Platform" heading in their navigation. The SDK product is [documented](https://www.speakeasy.com/docs/sdks/introduction), actively developed, and used in production by large APIs. But if you are making a multi-year platform decision, it is worth asking where SDK generation sits on their roadmap, and asking them directly rather than inferring it from a website.

## At a glance

| | Scalar | Speakeasy |
| --- | --- | --- |
| Generator source | Closed source | CLI is [Elastic License 2.0](https://github.com/speakeasy-api/speakeasy/blob/main/LICENSE), source-available |
| Docs renderer | MIT, self-hostable on any plan | Generates an API reference; a full docs site means a docs vendor |
| Docs + SDKs from one run | Yes, `docs` is a build target | Code samples are published to a docs vendor |
| Terraform providers | No | [Yes](https://www.speakeasy.com/docs/terraform/create-terraform) |
| MCP servers | Yes, hosted and configurable | [Yes](https://www.speakeasy.com/docs/standalone-mcp/overview), generated to deploy yourself |
| Custom code survives regeneration | Yes, three-way merge | [Yes](https://www.speakeasy.com/docs/sdks/customize/basics), three-way merge |
| Speakeasy call-site compatibility | Yes, generated compat module | n/a |
| Standalone API client | Yes, open source | No |
| Published SDK price | One target included; additional targets $150/month | Not published; free tier is [1 SDK, 50 API methods](https://www.speakeasy.com/docs/sdks/introduction) |

## Where Speakeasy is stronger

We would rather you hear this from us than discover it in a trial.

**Terraform providers.** Speakeasy [generates Terraform providers from an annotated OpenAPI document](https://www.speakeasy.com/docs/terraform/create-terraform). Scalar does not generate Terraform providers at all. If your API is infrastructure that people declare rather than call, this is not a close comparison — it is the whole comparison.

**MCP servers you deploy yourself.** Both products do MCP, and they do it differently — see [MCP servers](#mcp-servers) below. Speakeasy's advantage is that the server is generated code you own and run: [custom prompts, custom resources, tool curation, OAuth, Docker, and Cloudflare Workers deployment](https://www.speakeasy.com/docs/standalone-mcp/overview). If you need the server inside your own infrastructure rather than hosted, that is theirs.

**Tree-shakable functions as the primary surface.** Every Speakeasy method is [also exported as a standalone function](https://github.com/vercel/sdk#standalone-functions), so bundlers can drop the operations you do not call. For a browser or edge bundle against a large API that is a real, measurable win. Scalar's idiomatic surface is a client object; we emit Speakeasy-shaped standalone functions through the compatibility module described below, but that exists to keep migrating call sites compiling, not as our recommended surface.

**Contract test generation on an open standard.** Speakeasy generates contract tests using the [Arazzo specification](https://www.speakeasy.com/docs/sdks/sdk-contract-testing), with a generated mock server, so the tests live in a public format rather than a proprietary one. It is marked beta, covers successful scenarios only, supports six languages, and requires an Enterprise account plus an add-on — but the design decision to build on an open workflow spec is the right one and we like it.

**A longer production track record.** Speakeasy-generated SDKs have been shipping for years at scale. You can read [Vercel's](https://github.com/vercel/sdk) and [Dub's](https://github.com/dubinc/dub-node) in full. Scalar's generator is newer, and years of other people's edge cases is not something we can claim.

## The actual architectural choice

Strip away the feature tables and the decision looks like this.

**Speakeasy composes.** Speakeasy [generates an API reference with code snippets for every method](https://www.speakeasy.com/docs/sdks/core-concepts), and for a full documentation site you [integrate the output with a documentation vendor](https://www.speakeasy.com/docs/sdks/sdk-docs/integrations/scalar) — Scalar, Mintlify, ReadMe, or Bump.sh — by publishing a combined OpenAPI document with those samples attached. Each layer is chosen on its own merits. When a better docs product appears you swap it without touching your SDKs.

**Scalar consolidates.** In Scalar's generator, `docs` is a build target alongside the language targets. One generation run emits the SDKs, a static API reference, and `openapi.augmented.json` — the exact artifact the SDKs were generated from — plus a shared manifest used for coverage checks. Your reference and your client libraries cannot describe different APIs, because they are produced from the same compiled document in the same run.

Both are legitimate. Composition gives you leverage and an exit at every layer. Consolidation gives you one artifact, one bill, and one thing to debug when the reference and the SDK disagree. We think consolidation is the better default for most teams, but "most" is doing real work in that sentence, and if you already have a docs setup you like, the composed path — Speakeasy SDKs into Scalar docs — is a path we help people take.

## Moving without breaking your users

If you already ship Speakeasy SDKs, the expensive part of changing generator is not the generation — it is that your users have written code against a public surface, and a new generator produces a different one. New function names, new import paths, a major version bump, and a migration note nobody reads.

Scalar generates a compatibility module for exactly this. Set `compatibility` on a target:

```json
{
  "targets": {
    "typescript": {
      "compatibility": "speakeasy"
    }
  }
}
```

That emits `src/compat/speakeasy.ts` — Speakeasy-style standalone functions returning a functional `Result`, matching Speakeasy's tree-shakable `funcs/` surface, marked deprecated and forwarding to the generated Scalar SDK. Existing call sites keep compiling while you migrate, and the deprecation markers give your users a machine-readable path off the old surface rather than a changelog entry.

It is a bridge, not a permanent shim: the compat module reproduces the Speakeasy surface, and the idiomatic Scalar client is what you move people toward. See the [TypeScript configuration reference](../guides/sdks/configuration/typescript.md) for the current options.

## MCP servers

Both products generate MCP servers from OpenAPI. The difference is where the server runs, and it is the same composed-versus-consolidated split as everything else on this page.

**Speakeasy generates the server as code.** You get a [standalone MCP server](https://www.speakeasy.com/docs/standalone-mcp/overview) with custom prompts, custom resources, tool customization, and OAuth, which you deploy — Docker, remote, or Cloudflare Workers. You own the runtime and the operational burden that comes with it.

**Scalar hosts the server.** You pick which endpoints become tools in the dashboard, choose per-tool whether it is exposed for lookup only or makes real authenticated requests, and store the API credentials against the installation so they are never handed to the client. The server runs at `mcp.scalar.com`, private by default, with Personal Access Tokens for your team and OAuth for people outside it. Scalar also exposes a separate Docs MCP at `your-docs-domain/mcp` so AI clients can search and read your published documentation. Full details in the [MCP servers guide](../guides/agent/mcp.md).

Neither is the obviously correct answer. If you have compliance requirements about where API credentials live, or you want the server inside your own network, generated code is the right shape and Speakeasy's is more configurable at the code level. If you would rather not operate another service, and you want tool selection and auth managed alongside the API description they came from, hosted is less work.

## SDK output: the shape of the code

The clearest way to compare two generators is to read what they emit. Below is real, public generated code — Speakeasy's from the [Vercel SDK](https://github.com/vercel/sdk) and the [Dub SDK](https://github.com/dubinc/dub-node), Scalar's from the [Warp TypeScript SDK](https://github.com/TeamWarp/warp-sdk-typescript/tree/scalar-generated).

**Instantiating a client**

```ts
// Speakeasy
import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({
  bearerToken: "<YOUR_BEARER_TOKEN_HERE>",
});
```

```ts
// Scalar
import WarpAPI from "warp-hr";

const client = new WarpAPI({
  apiKey: process.env["API_KEY"], // defaults to the API_KEY env var
});
```

Two small differences. Scalar exports the client as the default export, so the import reads like the product. And Scalar reads credentials from a conventional environment variable by default, so the quickstart does not require passing a secret inline.

**Method naming**

Speakeasy carries your `operationId` through to the method name. When your OpenAPI document is well curated that is exactly what you want — Dub's SDK reads `dub.links.create()` and `dub.links.upsert()`, which is hard to improve on. When it is not, you get what Vercel's document produces: `vercel.replaceDomainsByDomainRecords()`. Speakeasy gives you [extensions and overlays](https://www.speakeasy.com/docs/sdks/customize/basics) to rename methods and group operations, so the fix exists — it is work you do in the document.

Scalar takes the other position and normalizes by default: it strips the redundant resource noun and maps the verb onto a fixed set, so `list`, `retrieve`, `create`, `update`, and `delete` appear on every resource.

| `operationId` | Carried through | Scalar |
| --- | --- | --- |
| `listPets` | `client.pets.listPets()` | `client.pet.list()` |
| `getPetById` | `client.pets.getPetById()` | `client.pet.retrieve()` |
| `addPet` | `client.pets.addPet()` | `client.pet.create()` |

This is a genuine trade-off rather than a win. Speakeasy's default gives you the names you wrote, which is predictable and auditable against your specification. Scalar's default gives you names you can guess without reading the reference, at the cost of not matching your `operationId` exactly. Pick the one that matches how much you trust your own document.

**Errors**

Both generators produce a typed error hierarchy. Scalar's generated clients export `BadRequestError`, `AuthenticationError`, `PermissionDeniedError`, `NotFoundError`, `ConflictError`, `UnprocessableEntityError`, `RateLimitError`, and `InternalServerError`, alongside `APIConnectionError`, `APIConnectionTimeoutError`, and `APIUserAbortError` — all readable in [`src/core/error.ts`](https://github.com/TeamWarp/warp-sdk-typescript/blob/scalar-generated/src/core/error.ts). Scalar additionally enumerates the exact set of error statuses each operation can return, generated from the specification.

## Custom code

Scalar supports custom code anywhere in the generated SDK. Edit generated files as you would any other code: every build performs a three-way merge between the previous generation, the new generation, and the current state of your repository, then opens a pull request combining the two. Untouched files update cleanly, your edits ride along, and files you added yourself are left alone. For code you want held in place explicitly, mark a region:

```ts
// scalar-sdk-generator:custom-code retry-helper:start
export const withBackoff = async <T>(fn: () => Promise<T>) => {
  // Anything in here is carried forward on every regeneration.
};
// scalar-sdk-generator:custom-code retry-helper:end
```

Conflicts arrive as a pull request you resolve on GitHub, and the whole flow runs on managed branches you can inspect: `scalar-generated` holds pristine output, `scalar-next` holds output merged with your commits, and `scalar-merge-conflict` carries anything needing a human. See [custom code](../guides/sdks/custom-code.md) for the details.

Speakeasy is comparable here, and we would not pick between the two products on this point. They support [custom code anywhere in the generated SDK, preserved across regeneration through three-way merging](https://www.speakeasy.com/docs/sdks/customize/basics), plus [SDK hooks](https://www.speakeasy.com/docs/sdks/customize/code/sdk-hooks) for lifecycle logic — initialization, before request, after success, after error — which is a cleaner extension point than editing files when what you need is cross-cutting behavior rather than a one-off method.

## Agent readiness

Both products ship Agent Skills. They are aimed at different people, and the distinction matters more than the shared name.

Speakeasy's [skills](https://www.speakeasy.com/docs/speakeasy-reference/skills) are installed with `speakeasy agent setup-skills` and help *you* generate SDKs — starting a project, following generation best practices, generating a server. They make your coding assistant good at Speakeasy.

Scalar's ship inside the generated SDK, for the developers and agents who *consume* your API. Every generated SDK carries a `SKILL.md`, a `.claude/skills/` entry for automatic discovery, a generated `api.md` listing every method grouped by resource, and an `openapi.augmented.json`. All four are readable in the [generated Warp SDK](https://github.com/TeamWarp/warp-sdk-typescript/tree/scalar-generated). The intent is that an agent writing code against your API cannot invent a method name that does not exist.

These are complements, not competitors. If you generate with Speakeasy you can install their skills; the question is whether your *users'* agents get the same treatment.

## Open source, precisely

Neither product is open source end to end, and the open halves are different.

**Scalar's documentation stack is open.** The API reference renderer and the API client are MIT licensed, runnable offline without an account, and forkable. This is why GitBook's interactive API explorer is [powered by Scalar](https://gitbook.com/docs/api-references/openapi). **Scalar's SDK generator is not open source.**

**Speakeasy's CLI is source-available.** [`speakeasy-api/speakeasy`](https://github.com/speakeasy-api/speakeasy) is under the [Elastic License 2.0](https://github.com/speakeasy-api/speakeasy/blob/main/LICENSE) — you can read it, modify it, and run it, but you may not offer it as a hosted service or circumvent the license key. That is not an OSI-approved open source licence, and Speakeasy does not describe it as one. Separately, Speakeasy publishes genuinely permissive OpenAPI tooling that is worth knowing about regardless of which generator you choose: [`speakeasy-api/openapi`](https://github.com/speakeasy-api/openapi) is MIT, and their [documentation site](https://github.com/speakeasy-api/developer-docs) is MIT too.

So if what matters is owning and modifying the documentation layer, Scalar is the open one. If what matters is reading the generator that produces your SDKs, Speakeasy is — with the Elastic License caveat attached.

## What you know before you talk to sales

Speakeasy's free tier is [one SDK with up to 50 API methods](https://www.speakeasy.com/docs/sdks/introduction), and new accounts get a 14-day trial of the business tier. Beyond that, their [pricing page](https://www.speakeasy.com/pricing) as of August 2026 prices the AI control plane and lists a single "Enterprise — Tailored" tier, so SDK pricing is a conversation. [SDK contract testing](https://www.speakeasy.com/docs/sdks/sdk-contract-testing) additionally requires an Enterprise account and an add-on.

Scalar publishes its price: **one SDK target is included with every plan, and additional targets are $150 per month each**, with volume discounts as you add more. Pricing scales with the number of endpoints in your OpenAPI document. A target becomes billable when you save a version and queue its build, and drafts are never billed. You can work out what it costs without talking to us.

To be fair about it: unpublished pricing is not the same as expensive pricing, and a company selling mostly to enterprises has real reasons not to publish. But it does mean the two products cannot be compared on cost without a call, and we would rather be the one you can price in advance.

## Which should you choose?

**Choose Speakeasy if** you need Terraform providers, you need the MCP server as code running in your own infrastructure rather than hosted, bundle size makes tree-shakable standalone functions your primary surface, you want Arazzo-based contract tests, or you want to read the generator that produces your code.

**Choose Scalar if** you want documentation and SDKs produced by the same run from the same compiled document, you want a documentation layer you own outright under MIT and can self-host on any plan, you want a hosted MCP server with per-tool control and credentials that never reach the client, you want an Agent Skill shipped to your API's consumers rather than to your own team, you want a real API client alongside your docs, or you want to know the price before the call.

**Choose both if** you already have Speakeasy SDKs and want better documentation. That path is [documented by Speakeasy](https://www.speakeasy.com/docs/sdks/sdk-docs/integrations/scalar) and it works. And if you decide to move the SDKs across later, the compatibility module means you can do it without breaking the call sites your users have already written.

[Start free](https://dashboard.scalar.com/register) or [talk to us](https://scalar.cal.com/).

---

*This comparison is based on Speakeasy's publicly available documentation, pricing page, and public GitHub repositories as of August 2026, and on Scalar's own source and generated output. One correction in the other direction: Speakeasy's docs vendor comparison describes Scalar as lacking MDX, and Scalar Docs [supports MDX](../guides/docs/content/mdx.mdx) — we mention it here rather than asking them to change their page. We have made a genuine effort to be accurate and to state where Speakeasy is better. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
