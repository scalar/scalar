# Scalar vs Fern

Fern and Scalar both turn an OpenAPI document into documentation and client SDKs. They are genuinely comparable products, and if you are evaluating one you should evaluate the other.

This page is written by Scalar, so read it with that in mind. We have tried to be accurate rather than flattering, and we link to Fern's own documentation for every claim we make about them. If we have something wrong, tell us and we will fix it.

**One thing to know up front:** Fern [was acquired by Postman in January 2026](https://buildwithfern.com/post/postman-acquires-fern). Fern says the product and brand are not changing and that the team continues to build Fern independently. Six months on, the two products are still separate. If you are making a multi-year platform decision, it is worth asking Fern directly how the roadmap and pricing relate to Postman's.

## At a glance

| | Scalar | Fern |
| --- | --- | --- |
| License | MIT, everything | SDK generators Apache-2.0; docs renderer not public |
| Self-hosting | Any plan | Enterprise plan |
| SDK languages | 12 targets, 3 stable | 9 generally available, 2 gated |
| Docs + SDKs from one spec | Yes | Yes |
| Standalone API client | Yes, open source | No |
| Framework integrations | 35 | None (iframe embed only) |
| SDK pricing | $100/month per target, published | "Per SDK, billed annually", contact sales |
| Ownership | Independent | Postman |

## Where Fern is genuinely stronger

We would rather you hear this from us than discover it after switching.

**The SDK generators are excellent and they are real open source.** [`fern-api/fern`](https://github.com/fern-api/fern) is Apache-2.0 with every language generator in the open, and Fern maintains second-generation generator lines for TypeScript, Python, Go, Java, and Ruby. That is years of per-language investment you can read.

**Fern Replay is the best answer we have seen to the hardest problem in code generation.** Most generators make you choose between "never touch this file again" and "lose your edits on regeneration". [Replay](https://fern.docs.buildwithfern.com/learn/sdks/overview/custom-code.md) keeps your line-level edits under version control as tracked patches and reapplies them via three-way merge on every regeneration, surfacing conflicts in the pull request. Scalar does not have an equivalent today.

**Protocol breadth.** Fern takes OpenAPI, AsyncAPI, OpenRPC, and gRPC/Protobuf as SDK inputs. If your API is not purely REST, that matters.

**Zero-dependency TypeScript output**, verifiably — their [sample SDK](https://github.com/fern-api/petstore-typescript-sdk/blob/main/package.json) ships `"dependencies": {}`.

**A WYSIWYG editor that preserves docs-as-code.** [Fern Editor](https://fern.docs.buildwithfern.com/learn/docs/writing-content/fern-editor.md) lets non-technical contributors edit visually while every save opens a pull request. If your docs are owned by a writing team rather than engineers, this is a real advantage.

**Marquee customers and Postman's distribution.** ElevenLabs, NVIDIA, Square, Auth0, Adobe, Twilio. No independent competitor matches Postman's reach.

## Documentation

Both products render OpenAPI into a documentation site with an interactive explorer, support Markdown and MDX, generate `llms.txt`, and expose an MCP server.

The difference is in where the docs can live.

Scalar ships **35 framework integrations** — Express, Fastify, Hono, NestJS, Next.js, Nuxt, Laravel, Django, Rails, Go, Rust, ASP.NET Core, Spring Boot, and more. You mount the reference inside the application you already run, at whatever route you choose.

Fern is a hosted documentation platform. There is no middleware. The only embedding mechanism is [embedded mode](https://fern.docs.buildwithfern.com/learn/docs/customization/embedded-mode.md), which strips the chrome so you can put the hosted site in an `<iframe>`. Fern's own writing [acknowledges this difference](https://buildwithfern.com/post/self-hosted-documentation-tools-enterprise-security), noting that Scalar can be "integrated with frameworks like Express, FastAPI, Hono, and NestJS".

Self-hosting is available for both, but on different terms. Scalar's renderer is MIT and self-hostable on any plan. Fern's self-hosted docs are [Enterprise-only](https://fern.docs.buildwithfern.com/learn/docs/self-hosted/overview.md), shipped as a closed `fernenterprise` Docker image, and Fern publishes an honest list of what does not work in that mode — Ask Fern, AI examples, analytics, the editor, SSO, RBAC, and OAuth are all unavailable when self-hosted.

## SDK generation

Fern supports nine generally available languages: TypeScript, Python, Go, Java, C#, PHP, Ruby, Swift, and Rust. C++ and Kotlin are [gated behind a demo request](https://fern.docs.buildwithfern.com/learn/sdks/overview/introduction.md).

Scalar's generator emits twelve language targets plus a CLI target and a docs target. We label maturity honestly, because a language count on its own is not a useful number:

- **Stable:** TypeScript, Python, Java
- **Active:** Go, Rust, Ruby, PHP, C#, Kotlin
- **Early:** C++, Dart, Swift

TypeScript is the deepest implementation, with zero-dependency runtime output, typed errors, pagination, retries, and generated tests. If you need nine mature languages today, Fern has more finished surface area than we do, and we would rather say so than bury it.

### The single source of truth is literal

Both products describe docs and SDKs coming from one specification. In Scalar's generator this is not a marketing framing — `docs` is a build target alongside the language targets. A generation run emits the SDKs, a static API reference, and `openapi.augmented.json`, which is the exact artifact the SDKs were generated from, plus a shared manifest used for coverage checks. Your reference and your client libraries cannot describe different APIs, because they are produced from the same compiled document in the same run.

### What the free tier actually includes

This is the most important practical difference and it is easy to miss.

Fern's free SDK tier caps at **50 endpoints**, and the following are all [Enterprise-only](https://buildwithfern.com/pricing):

> Auto-pagination · Retries with backoff · OAuth 2.0 · Idempotency headers · Webhook verification · WebSockets · Server-sent events · gRPC · OpenRPC · HMAC auth · Mock server tests · Custom code maintenance

Enterprise is priced "per SDK, billed annually" with no published rate. So most of what Fern markets as SDK capability sits behind a per-language annual contract you have to call about.

Scalar publishes its number: **$100/month per target**. You can decide whether that is worth it without talking to us.

### Webhooks

Fern's webhook signature verification is well designed — HMAC and asymmetric RSA/ECDSA/Ed25519, declared through an OpenAPI extension, with replay protection. It is [TypeScript-only today](https://fern.docs.buildwithfern.com/learn/sdks/deep-dives/webhook-signature-verification.md).

Scalar generates typed inbound event models and verification helpers across targets, with HMAC SHA-256, multi-secret rotation, provider-style signature headers, timestamp tolerance, and replay-store hooks. Targets with native platform crypto expose RSA, ECDSA, and Ed25519 directly; targets whose standard library lacks Ed25519 accept a verifier callback so the generated runtime stays dependency-light.

## Open source, precisely

Fern markets an open-source compiler, and that is true of the generators. Two details are worth knowing before you rely on it:

`fern generate --local` runs the generator in Docker on your machine, and Fern is clear that no specification data leaves your network. But it [requires a `FERN_TOKEN`](https://fern.docs.buildwithfern.com/learn/sdks/deep-dives/self-hosted.md) and performs an organization verification call. Without that verification you get [partial output only](https://fern.docs.buildwithfern.com/learn/sdks/overview/how-it-works.md) — core code without package metadata.

The docs renderer does not appear to be public. There is no repository for it in the monorepo, the CLI's local preview downloads a prebuilt bundle rather than building from source, and self-hosted docs ship as a closed image.

Scalar is MIT throughout — the API reference, the API client, and the generator. You can run all of it, offline, without an account or a token, and you can fork it.

This is also why GitBook's interactive API explorer is [powered by Scalar](https://gitbook.com/docs/api-references/openapi): the component is open enough that another documentation company could ship it inside their own product.

## The API client

Scalar ships a standalone, open-source API client — desktop and web, offline-first, with environments, Postman-compatible scripting, and code generation for 40+ HTTP clients. Fern has no equivalent; their explorer lives inside the documentation site.

Fern's own comparison content [describes Scalar](https://buildwithfern.com/post/interactive-api-documentation-tools-live-testing) as REST-only with no server-sent events, and as lacking OAuth token handling. Both points are out of date. Scalar's client handles `text/event-stream` responses with dedicated streaming response rendering, recognises AsyncAPI documents, and implements OAuth 2.0 across the authorization code, password, and client credentials grants, capturing refresh tokens where the provider returns them.

## Which should you choose?

**Choose Fern if** you need nine mature SDK languages today, your API depends on gRPC or OpenRPC, line-level custom code that survives regeneration is critical, a visual editor for non-technical writers is a requirement, or Postman's ecosystem is where your users already are.

**Choose Scalar if** you want the whole stack under MIT with no vendor lock-in, you want to self-host without an enterprise contract, you want docs mounted inside your existing application rather than on a separate hosted site, you want a real API client alongside your docs, or you want to know what it costs before you talk to sales.

If you are migrating, [get in touch](https://scalar.cal.com/) or [start free](https://dashboard.scalar.com/register).

---

*This comparison is based on Fern's publicly available documentation, pricing page, and public GitHub repositories as of July 2026, and on Scalar's own source. Fern was acquired by Postman in January 2026 and their product may change. We have made a genuine effort to be accurate and to state where Fern is better. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
