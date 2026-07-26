# Scalar vs Fern

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
| Free SDK tier | One SDK target included | Capped at 50 endpoints |
| SDK pricing | $100/month per additional target, published | "Per SDK, billed annually", contact sales |

## Where Fern is stronger

**Protocol breadth.** Fern accepts OpenAPI, AsyncAPI, OpenRPC, and gRPC/Protobuf as SDK inputs. If your API is not purely REST — particularly if you are shipping gRPC or JSON-RPC — Fern covers input formats that Scalar does not.

**Nine generally available SDK languages**, with second-generation generator lines for TypeScript, Python, Go, Java, and Ruby. That is a lot of per-language investment.

## SDK output: the shape of the code

The clearest way to compare two generators is to read what they emit. Both examples below are taken from real generated output — Fern's from their [public petstore SDK](https://github.com/fern-api/petstore-typescript-sdk), Scalar's from a generated client for the Lithic API.

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
import Lithic from "lithic";

const client = new Lithic({
  apiKey: process.env["LITHIC_API_KEY"], // defaults to the LITHIC_API_KEY env var
  environment: "production",
});
```

Two differences worth noting. Scalar names the client after your API and exports it as the default export, so the import reads like the product. And Scalar reads credentials from a conventional environment variable by default, so the happy path does not require passing a secret at all.

**Calling an endpoint**

```ts
// Fern
await client.pets.createPet({ name: "name" });
```

```ts
// Scalar
const account = await client.accounts.retrieve("accountToken");
```

Fern repeats the resource noun in the method name — `pets.createPet`, not `pets.create`. Over a large API that redundancy compounds on every call site. Scalar generates `accounts.retrieve`, `accounts.list`, `accounts.create`, so the resource appears once.

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
import { APIError } from "lithic";

try {
  const account = await client.accounts.retrieve("accountToken");
} catch (err) {
  if (err instanceof APIError) {
    console.log(err.status, err.name, err.headers);
  }
  throw err;
}
```

Both expose status, body, and the raw response. Scalar additionally documents the exact set of error statuses the API can return, generated from the specification — for this client, `400`, `401`, `403`, `404`, `409`, `410`, `412`, `422`, `429`, and `500`.

**Dependencies**

Both generators produce dependency-light TypeScript. Fern's petstore SDK ships `"dependencies": {}`. Scalar's output is empty too unless you enable a feature that requires a runtime library — the Lithic client above carries exactly one, `standardwebhooks`, because webhook verification is turned on.

## Documentation

Both products render OpenAPI into a documentation site with an interactive explorer, support Markdown and MDX, generate `llms.txt`, and expose an MCP server. The differences are in customization and in where the docs can live.

**Scalar is more customizable, because the renderer is yours.** The API reference is MIT licensed. You get themes and CSS variables, arbitrary custom HTML, CSS, and JavaScript on any page, and the option to fork the renderer outright if you need behaviour we did not anticipate. Fern gives you 27 built-in components and custom React components, which covers a lot — but the renderer itself is not public, so the ceiling is whatever Fern exposes.

**The docs can live inside your application.** Scalar ships 35 framework integrations — Express, Fastify, Hono, NestJS, Next.js, Nuxt, Laravel, Django, Rails, Go, Rust, ASP.NET Core, Spring Boot, and more. You mount the reference inside the app you already run, at whatever route you choose.

Fern is a hosted documentation platform. There is no middleware. The only embedding mechanism is [embedded mode](https://fern.docs.buildwithfern.com/learn/docs/customization/embedded-mode.md), which strips the chrome so you can drop the hosted site into an `<iframe>`. Fern's own writing [acknowledges the difference](https://buildwithfern.com/post/self-hosted-documentation-tools-enterprise-security), noting that Scalar can be "integrated with frameworks like Express, FastAPI, Hono, and NestJS".

**Self-hosting is available on both, on different terms.** Scalar's renderer is MIT and self-hostable on any plan. Fern's self-hosted docs are [Enterprise-only](https://fern.docs.buildwithfern.com/learn/docs/self-hosted/overview.md), ship as a closed `fernenterprise` Docker image, and Fern publishes an honest list of what stops working in that mode — Ask Fern, AI examples, analytics, the editor, SSO, RBAC, and OAuth are all unavailable when self-hosted.

**The site you are reading is the product.** scalar.com — this page, the pricing page, the guides, the API reference, and the blog — is built and hosted entirely on Scalar Docs from a single `scalar.config.json`. We do not maintain a separate marketing stack.

## The single source of truth is literal

Both products describe docs and SDKs coming from one specification. In Scalar's generator this is not a framing — `docs` is a build target alongside the language targets. One generation run emits the SDKs, a static API reference, and `openapi.augmented.json`, which is the exact artifact the SDKs were generated from, plus a shared manifest used for coverage checks. Your reference and your client libraries cannot describe different APIs, because they are produced from the same compiled document in the same run.

## What the free tier actually includes

Fern's free SDK tier caps at **50 endpoints**, and the following are all [Enterprise-only](https://buildwithfern.com/pricing):

> Auto-pagination · Retries with backoff · OAuth 2.0 · Idempotency headers · Webhook verification · WebSockets · Server-sent events · gRPC · OpenRPC · HMAC auth · Mock server tests · Custom code maintenance

Enterprise is priced "per SDK, billed annually" with no published rate, so most of what Fern markets as SDK capability sits behind a per-language annual contract you have to call about.

Scalar includes one SDK target at no cost, with no endpoint cap, and publishes the price of additional targets: **$100/month each**. You can work out what it costs without talking to us.

## Webhooks

Fern's webhook signature verification is well designed — HMAC and asymmetric RSA/ECDSA/Ed25519, declared through an OpenAPI extension, with replay protection. It is [TypeScript-only today](https://fern.docs.buildwithfern.com/learn/sdks/deep-dives/webhook-signature-verification.md).

Scalar generates typed inbound event models and verification helpers across targets, with HMAC SHA-256, multi-secret rotation, provider-style signature headers, timestamp tolerance, and replay-store hooks. Targets with native platform crypto expose RSA, ECDSA, and Ed25519 directly; targets whose standard library lacks Ed25519 accept a verifier callback so the generated runtime stays dependency-light.

## Open source, precisely

Neither product is open source end to end, and the halves are inverted.

**Scalar's documentation stack is open.** The API reference and the API client are MIT licensed. You can run them offline, without an account, and fork them. This is why GitBook's interactive API explorer is [powered by Scalar](https://gitbook.com/docs/api-references/openapi) — the component is open enough that another documentation company ships it inside their own product. **Scalar's SDK generator is not open source.**

**Fern's SDK generators are open.** [`fern-api/fern`](https://github.com/fern-api/fern) is Apache-2.0 with every language generator public. Two caveats: `fern generate --local` still [requires a `FERN_TOKEN`](https://fern.docs.buildwithfern.com/learn/sdks/deep-dives/self-hosted.md) and an organization verification call, and without it you get [partial output only](https://fern.docs.buildwithfern.com/learn/sdks/overview/how-it-works.md) — core code without package metadata. **Fern's docs renderer does not appear to be public**: there is no repository for it in the monorepo, the CLI's local preview downloads a prebuilt bundle rather than building from source, and self-hosted docs ship as a closed image.

So if what matters to you is owning and modifying the documentation layer, Scalar is the open one. If what matters is reading and running the SDK generator yourself, Fern is.

## The API client

Scalar ships a standalone, open-source API client — desktop and web, offline-first, with environments, Postman-compatible scripting, and code generation for 40+ HTTP clients. Fern has no equivalent; their explorer lives inside the documentation site.

Fern's comparison content [describes Scalar](https://buildwithfern.com/post/interactive-api-documentation-tools-live-testing) as REST-only with no server-sent events, and as lacking OAuth token handling. Both points are out of date. Scalar's client handles `text/event-stream` responses with dedicated streaming response rendering, recognises AsyncAPI documents, and implements OAuth 2.0 across the authorization code, password, and client credentials grants, capturing refresh tokens where the provider returns them.

## Which should you choose?

**Choose Fern if** your API depends on gRPC or OpenRPC, you need nine mature SDK languages today, or you want to read and run the SDK generator source yourself.

**Choose Scalar if** you want a documentation layer you own outright under MIT, you want to self-host without an enterprise contract, you want docs mounted inside your existing application rather than on a separate hosted site, you want a real API client alongside your docs, or you want to know what an SDK costs before you talk to sales.

[Start free](https://dashboard.scalar.com/register) or [talk to us](https://scalar.cal.com/).

---

*This comparison is based on Fern's publicly available documentation, pricing page, and public GitHub repositories as of July 2026, and on Scalar's own source and generated output. Fern was acquired by Postman in January 2026 and their product may change. We have made a genuine effort to be accurate and to state where Fern is better. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
