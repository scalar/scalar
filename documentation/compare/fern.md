# Scalar vs Fern

*Last updated: September 2026*

Fern and Scalar both turn an OpenAPI document into documentation and client SDKs. They are genuinely comparable products, and if you are evaluating one you should evaluate the other.

This page is written by Scalar, so read it with that in mind. Every claim we make about Fern links to Fern's own documentation, pricing page, or public repositories. If we have something wrong, tell us and we will fix it.

**One thing to know up front:** Fern [was acquired by Postman in January 2026](https://buildwithfern.com/post/postman-acquires-fern). Fern says the product and brand are not changing and that the team continues to build Fern independently. If you are making a multi-year platform decision, it is worth asking how the roadmap and pricing relate to Postman's.

## At a glance

| | Scalar | Fern |
| --- | --- | --- |
| Docs renderer | MIT, self-hostable on any plan | Not public; self-hosting is Enterprise |
| SDK generator | Closed source | Apache-2.0 |
| Docs + SDKs from one spec | Yes | Yes |
| Standalone API client | Yes, open source | No |
| Framework integrations | 35 | None (iframe embed only) |
| SDK pricing | One target included; additional targets from $150/month, published | [Free up to 200 endpoints](https://buildwithfern.com/pricing) in TypeScript and Python; Enterprise "per SDK, billed annually", contact sales |

## Where Fern is stronger

**More production SDK languages.** Fern [generates SDKs](https://buildwithfern.com/learn/sdks/overview/introduction) in TypeScript, Python, Go, Java, .NET, PHP, Ruby, Swift, and Rust. Scalar's generally available targets are TypeScript, Python, Go, Java, Kotlin, Ruby, and a CLI; C#, PHP, Rust, Swift, Dart, and C++ are experimental. If you need a production-supported C# or Swift SDK today, Fern is further along.

**OpenRPC.** Both products accept OpenAPI, AsyncAPI, and gRPC as SDK inputs. Fern also accepts OpenRPC, which Scalar does not. If you ship a JSON-RPC API described in OpenRPC, Fern covers it and we do not.

**A generous free tier.** Fern's [free plans](https://buildwithfern.com/pricing) include docs for 10 members and 1,000 pages, and SDKs in TypeScript and Python up to 200 endpoints with pagination, retries, and OAuth. Postman customers can apply for a larger free allowance.

## SDK output: the shape of the code

The clearest way to compare two generators is to read what they emit. Fern's output below is from their [petstore SDK](https://github.com/fern-api/petstore-typescript-sdk); Scalar's is from the [Warp TypeScript SDK](https://github.com/TeamWarp/warp-sdk-typescript/tree/candidate). Both are real, public generated code.

**Instantiating a client**

```ts
// Fern
import { FernApiClient } from "@fern-api/example-typescript-sdk-petstore";

const client = new FernApiClient({
  environment: "YOUR_BASE_URL",
  token: "YOUR_TOKEN",
  clientId: "YOUR_CLIENT_ID",
  clientSecret: "YOUR_CLIENT_SECRET",
});
```

```ts
// Scalar
import WarpAPI from "warp-hr";

const client = new WarpAPI({
  apiKey: process.env["API_KEY"], // defaults to the API_KEY env var
});
```

Two differences worth noting. Scalar names the client after your API and exports it as the default export, so the import reads like the product. And Scalar reads credentials from a conventional environment variable by default, so the happy path does not require passing a secret at all.

**Method naming**

For this one it is worth putting both generators on the same input. Below is what each produces from a Petstore document — the same operations, the same resource.

| `operationId` | Fern | Scalar |
| --- | --- | --- |
| `listPets` | `client.pets.listPets()` | `client.pet.list()` |
| `getPet` / `getPetById` | `client.pets.getPet()` | `client.pet.retrieve()` |
| `createPet` / `addPet` | `client.pets.createPet()` | `client.pet.create()` |

Fern carries the operationId through nearly verbatim, so the resource noun appears twice on every call — `pets.listPets`, `pets.getPet`, `pets.createPet`. Scalar strips the redundant noun and normalises the verb, giving you `list`, `retrieve`, and `create` on every resource. Over a large API that consistency is the difference between guessing a method name and knowing it.

**Handling errors**

```ts
// Fern
import { FernApiError } from "@fern-api/example-typescript-sdk-petstore";

try {
  await client.pets.createPet(...);
} catch (err) {
  if (err instanceof FernApiError) {
    console.log(err.statusCode);
    console.log(err.message);
    console.log(err.body);
  }
}
```

```ts
// Scalar
import { APIError } from "warp-hr";

try {
  const list = await client.customWorkerFields.list();
} catch (err) {
  if (err instanceof APIError) {
    console.log(err.status, err.name, err.headers);
  }
  throw err;
}
```

Both expose status, body, and the raw response. Scalar additionally documents the exact set of error statuses the API can return, generated from the specification — for this client, `400`, `401`, `403`, `404`, `409`, `422`, `429`, and `500`.

**Dependencies**

Both generators produce zero-dependency TypeScript. Fern's petstore SDK and the Warp SDK both ship `"dependencies": {}`. Scalar only adds a runtime library when you turn on a feature that needs one — enabling webhook verification, for example, pulls in `standardwebhooks`.

## Documentation

Both products render OpenAPI into a documentation site with an interactive explorer, support Markdown and MDX, generate `llms.txt`, and expose an MCP server. The differences are in customization and in where the docs can live.

**Scalar is more customizable, because the renderer is yours.** The API reference is MIT licensed. You get themes and CSS variables, arbitrary custom HTML, CSS, and JavaScript on any page, and the option to fork the renderer outright if you need behaviour we did not anticipate. Fern gives you 27 built-in components, plus custom React components, CSS, and JavaScript [on Enterprise](https://buildwithfern.com/pricing), which covers a lot — but the renderer itself is not public, so the ceiling is whatever Fern exposes.

**The docs can live inside your application.** Scalar ships 35 framework integrations — Express, Fastify, Hono, NestJS, Next.js, Nuxt, Laravel, Django, Rails, Go, Rust, ASP.NET Core, Spring Boot, and more. You mount the reference inside the app you already run, at whatever route you choose.

Fern is a hosted documentation platform. There is no middleware. The only embedding mechanism is [embedded mode](https://fern.docs.buildwithfern.com/learn/docs/customization/embedded-mode.md), which strips the chrome so you can drop the hosted site into an `<iframe>`. Fern's own writing [acknowledges the difference](https://buildwithfern.com/post/self-hosted-documentation-tools-enterprise-security), noting that Scalar can be "integrated with frameworks like Express, FastAPI, Hono, and NestJS".

**Self-hosting is available on both, on different terms.** Scalar's renderer is MIT and self-hostable on any plan. Fern's self-hosted docs are [Enterprise-only](https://fern.docs.buildwithfern.com/learn/docs/self-hosted/overview.md), ship as a closed `fernenterprise` Docker image, and Fern publishes an honest list of what stops working in that mode — Ask Fern, Fern Agent, AI examples, analytics, the editor, SSO, RBAC, and OAuth are all unavailable when self-hosted.

**The site you are reading is the product.** scalar.com — this page, the pricing page, the guides, the API reference, and the blog — is built and hosted entirely on Scalar Docs from a single `scalar.config.json`. We do not maintain a separate marketing stack.

## The single source of truth is literal

Both products describe docs and SDKs coming from one specification. In Scalar's generator this is not a framing — `docs` is a build target alongside the language targets. One generation run emits the SDKs, a static API reference, and `openapi.augmented.json`, which is the exact artifact the SDKs were generated from, plus a shared manifest used for coverage checks. Your reference and your client libraries cannot describe different APIs, because they are produced from the same compiled document in the same run.

## What you get before you talk to sales

Fern's free SDK tier now covers TypeScript and Python **up to 200 endpoints**, including pagination, retries, and OAuth. That is a real improvement since we first wrote this page. The following are still [Enterprise-only](https://buildwithfern.com/pricing):

> Additional languages · Webhook verification · WebSockets · Server-sent events · gRPC · OpenRPC · HMAC auth · Mock server tests · Custom code

Enterprise is priced "per SDK, billed annually" with no published rate, so any language beyond TypeScript and Python, and any SDK over 200 endpoints, sits behind a per-language annual contract you have to call about.

Scalar publishes its price: **one SDK target is included with every plan, and additional targets start at $150/month each**. Pricing scales with the number of endpoints in your OpenAPI document — Free covers SDKs up to 25 endpoints, Pro includes 100, Business includes 250 — so you can work out what it costs without talking to us.

## Webhooks

Fern's webhook signature verification is well designed — HMAC and asymmetric RSA/ECDSA/Ed25519, declared through an OpenAPI extension, with replay protection. It [now covers](https://fern.docs.buildwithfern.com/learn/sdks/deep-dives/webhook-signature-verification.md) TypeScript, Python, Java, Go, PHP, Ruby, and C#, and it is an Enterprise feature.

Scalar generates typed inbound event models and verification helpers across targets, with HMAC SHA-256, multi-secret rotation, provider-style signature headers, timestamp tolerance, and replay-store hooks. Targets with native platform crypto expose RSA, ECDSA, and Ed25519 directly; targets whose standard library lacks Ed25519 accept a verifier callback so the generated runtime stays dependency-light.

## Open source, precisely

Neither product is open source end to end, and the halves are inverted.

**Scalar's documentation stack is open.** The API reference and the API client are MIT licensed. You can run them offline, without an account, and fork them. This is why GitBook's interactive API explorer is [powered by Scalar](https://gitbook.com/docs/api-references/openapi) — the component is open enough that another documentation company ships it inside their own product. **Scalar's SDK generator is not open source.**

**Fern's SDK generators are open.** [`fern-api/fern`](https://github.com/fern-api/fern) is Apache-2.0 with every language generator public. Two caveats: `fern generate --local` still [requires a `FERN_TOKEN`](https://fern.docs.buildwithfern.com/learn/sdks/deep-dives/self-hosted.md) and an organization verification call, and without it you get [partial output only](https://fern.docs.buildwithfern.com/learn/sdks/overview/how-it-works.md) — core code without package metadata. **Fern's docs renderer does not appear to be public**: there is no repository for it in the monorepo, the CLI's local preview downloads a prebuilt bundle rather than building from source, and self-hosted docs ship as a closed image.

So if what matters to you is owning and modifying the documentation layer, Scalar is the open one. If what matters is reading and running the SDK generator yourself, Fern is.

## The API client

Scalar ships a standalone, open-source API client — desktop and web, offline-first, with environments, Postman-compatible scripting, and code generation for 40+ HTTP clients. Fern has no equivalent; their explorer lives inside the documentation site.

Fern's comparison content [describes Scalar](https://buildwithfern.com/post/interactive-api-documentation-tools-live-testing) as REST-only with no WebSocket or server-sent events, and as lacking OAuth auto-refresh. Part of that is out of date. Scalar's client handles `text/event-stream` responses with dedicated streaming response rendering, recognises AsyncAPI documents, and implements OAuth 2.0 across the authorization code, password, and client credentials grants, capturing refresh tokens where the provider returns them. The WebSocket point is fair: a WebSocket client is on our roadmap, not shipped.

## Pricing

| Plan | Scalar ([pricing](https://scalar.com/pricing)) | Fern ([pricing](https://buildwithfern.com/pricing)) |
| --- | --- | --- |
| Free | $0: docs with 1 editor seat and up to 3 APIs, 1 SDK up to 25 endpoints | Docs: $0, 10 members, 1,000 pages. SDKs: $0, TypeScript and Python up to 200 endpoints |
| Entry paid | Pro, $150/month ($125/month billed yearly): 5 editor seats, 1 SDK up to 100 endpoints, MCP servers | No self-serve paid tier |
| Mid tier | Business, $600/month ($500/month billed yearly): 10 editor seats, SSO, SDKs up to 250 endpoints | — |
| Top tier | Enterprise, custom | Enterprise, custom; SDKs "per SDK, billed annually" |
| Additional SDKs | $150/month each up to 100 endpoints, $600/month each for 101–250 | Contact sales |

Prices checked on 26 September 2026. Fern also runs a program for Postman customers with larger free limits.

## Fern vs Scalar

If you are on Fern today, you probably chose it for the SDKs, and they are good. If your SDKs cover more languages than Scalar ships as generally available, or your API is described in OpenRPC, stay where you are. The Postman acquisition has not changed the product so far, and Fern's free tier has become more generous since January, not less.

Scalar is worth a look if the docs are where you feel the limits. Custom React components, CSS, and JavaScript are Enterprise features on Fern, and so is self-hosting. On Scalar the renderer is MIT licensed and self-hostable on any plan, and it can mount inside the application you already run. The other common trigger is price visibility: once you need a third SDK language or pass 200 endpoints, Fern becomes a sales conversation, while Scalar's price for the next SDK is on the pricing page.

Moving docs is mostly pointing Scalar at the OpenAPI document you already feed Fern. If your source of truth is a Fern Definition rather than OpenAPI, you will need an OpenAPI document first, because that is what Scalar reads. Moving SDKs means a new generated surface, so plan it as a major version and talk to us before you start.

## Which should you choose?

**Choose Fern if** your API is described in OpenRPC, you need production-supported SDKs in languages beyond TypeScript, Python, and Go, or you want to read and run the SDK generator source yourself.

**Choose Scalar if** you want a documentation layer you own outright under MIT, you want to self-host without an enterprise contract, you want docs mounted inside your existing application rather than on a separate hosted site, you want a real API client alongside your docs, or you want to know what an SDK costs before you talk to sales.

[Start free](https://dashboard.scalar.com/register) or [talk to us](https://scalar.cal.com/).

## Frequently asked questions

<scalar-detail title="Is Fern still independent after the Postman acquisition?">

Fern is owned by Postman since January 2026. The [announcement](https://buildwithfern.com/post/postman-acquires-fern) says the product and brand are not changing, and Fern is still sold as its own product with its own pricing. Postman also ships a separate SDK generator inside its Team and Enterprise plans.

</scalar-detail>

<scalar-detail title="How much does Fern cost?">

As of September 2026, [Fern's pricing page](https://buildwithfern.com/pricing) lists free docs (10 members, 1,000 pages) and free SDKs in TypeScript and Python up to 200 endpoints. Everything above that is Enterprise, priced "per SDK, billed annually" through sales. Scalar Pro is $150 per month and includes one SDK; additional SDKs are $150 per month each up to 100 endpoints.

</scalar-detail>

<scalar-detail title="Is Fern open source?">

Fern's SDK generators are open source under [Apache-2.0](https://github.com/fern-api/fern), though local generation still needs a `FERN_TOKEN` for full output. Fern's docs renderer is not public. Scalar is the reverse: the API reference and API client are MIT licensed, and the SDK generator is closed source.

</scalar-detail>

<scalar-detail title="Which SDK languages does Scalar support compared to Fern?">

Scalar's generally available targets are TypeScript, Python, Go, Java, Kotlin, Ruby, and a CLI. C#, PHP, Rust, Swift, Dart, and C++ are experimental. Fern lists nine SDK languages. If you need production support in a language on Scalar's experimental list, talk to us first.

</scalar-detail>

<scalar-detail title="Can I self-host Fern docs?">

Only on Enterprise, as a closed Docker image, and several features — Ask Fern, Fern Agent, analytics, the editor, SSO, RBAC, and OAuth — are [unavailable when self-hosted](https://fern.docs.buildwithfern.com/learn/docs/self-hosted/overview.md). Scalar's reference is MIT licensed and self-hostable on any plan.

</scalar-detail>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [Build vs buy an SDK](/learn/sdk/build-vs-buy-sdk)
- **Docs:** [SDK generator guide](../guides/sdks/index.md) · [Fern alternatives](/alternatives/fern) · [Scalar vs Postman](./postman.md)
- **Product:** [Scalar SDK Generator](/products/sdk-generator) — SDKs and docs from the same OpenAPI document, in the same run, at a published price

---

*This comparison is based on Fern's publicly available documentation, pricing page, and public GitHub repositories as of September 2026, and on Scalar's own source and generated output. Fern was acquired by Postman in January 2026 and their product may change. We have made a genuine effort to be accurate and to state where Fern is better. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
