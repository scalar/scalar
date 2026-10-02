# Rust SDK generator from OpenAPI

Scalar can generate a Rust crate from your OpenAPI document, with async pagination, WebSocket support for AsyncAPI channels, and a release workflow that publishes to crates.io using trusted publishing. **The Rust target is experimental.** It generates working code, but it is further from GA than Java, Kotlin, Ruby, and C#, and there is no public Rust sample yet. This page describes what is documented and says plainly where it is describing what the generator targets rather than showing output.

## Where the Rust target is ahead

Rust is experimental, but in a few places it does more than any other Scalar target, and those are worth knowing up front:

- **It follows next-page URLs.** If your API returns a complete URL for the next page (a `cursorUrl` scheme read from a `bodyLink` response field), the Rust target re-issues the request against that URL. It is currently the only target that does. Every other target handles a cursor token, not a URL.
- **It ships a WebSocket runtime.** When you generate from an [AsyncAPI document](/products/sdk-generator/asyncapi) (AsyncAPI support is itself experimental), WebSocket connect methods are generated only for TypeScript, Python, Rust, and the CLI. Other targets get the event types but nothing that opens a connection.

If your API streams over WebSockets or pages by URL, that makes Rust a more complete target for you than its experimental label might suggest.

## What the generator targets for Rust

<scalar-callout type="warning" icon="phosphor/regular/warning">
  There is no public Rust sample yet. The pagination snippet below is the call shape documented in the pagination guide, with a placeholder for the request; the rest of this section describes behaviour all generated SDKs share. Generate a preview from your own document to read the real crate.
</scalar-callout>

**Async pagination with a pager.** The [pagination guide](/products/sdk-generator/pagination) documents that a paginated Rust method gives you a pager you advance with `.await`:

```rust
// `request` stands for a paginated list call built from your client.
let mut pager = request.paginate();
let next = pager.next().await;
```

For page-level control, the guide documents `Pager::next_page`. Treat the exact types (for example, whether items arrive wrapped in a `Result`) as something to confirm in your preview.

**The same API shape as every other target.** Resources and methods come from one configuration, with normalised verbs (`list`, `retrieve`, `create`) cased for Rust, so a support answer written for your TypeScript users maps onto the crate.

**The generator's shared feature set.** The SDK Generator's feature list covers retries on temporary failures (twice by default: network errors, 408, 409, 429, 5xx) with `Retry-After` support, a 60-second default timeout, typed errors carrying status, headers, and body, and credentials from your security schemes with environment variable defaults. On an experimental target, confirm how each surfaces in the crate.

**A limitation to know about.** Rust does not read `itemCursor` or `cursorPath`, so a scheme relying on either stops after the first page. Prefer a top-level cursor field where your API offers one.

## Configure the target

```json
{
  "targets": {
    "rust": {
      "packageName": "acme",
      "destinations": {
        "production": { "repo": "acme/acme-rust" }
      },
      "publish": {
        "cargo": {
          "authMethod": "oidc",
          "homepage": "https://acme.com",
          "description": "Acme API Rust SDK"
        }
      }
    }
  }
}
```

`packageName` is the crate name on crates.io. crates.io names are first come, first served and global, so check the name is free before your first release. See the [Rust configuration](/products/sdk-generator/configuration/rust) reference.

## Publishing to crates.io

crates.io supports trusted publishing, and it is the recommended path. The generated release workflow uses `rust-lang/crates-io-auth-action` to exchange the GitHub workflow's identity token for a short-lived crates.io token, so nothing long-lived is stored.

1. On crates.io, open the crate's **Settings → Trusted Publishing** and add a GitHub publisher for your repository with the workflow file `release-please.yml`.
2. Keep `"publish": { "cargo": true }` (OIDC is the default).
3. Merge the release pull request Scalar keeps open in your repository.

If you cannot use OIDC, create a token with the `publish-update` scope, store it as `CARGO_REGISTRY_TOKEN`, and set `"authMethod": "access-token"`. Before running `cargo publish`, the workflow queries crates.io for the version and skips it if it already exists, so re-merges are safe. Details are in [crates.io publishing](/products/sdk-generator/configuration/rust#publish).

## Scalar compared with OpenAPI Generator for Rust

OpenAPI Generator's [`rust` generator](https://openapi-generator.tech/docs/generators/rust) is stable and free. It supports four HTTP libraries: `reqwest` (the default), `reqwest-trait`, `hyper` (Hyper 1.x), and `hyper0x`. With `reqwest`, `supportAsync` defaults to true, and `supportMiddleware` adds `reqwest-middleware` support, which is a clean way to bolt on retries or tracing yourself. Its feature table marks `oneOf` as supported and `allOf` and `anyOf` as unsupported.

If you need control over the HTTP stack, a trait-based client for mocking, or a stable generator today, OpenAPI Generator is a good fit and we would say so.

| | Scalar Rust target (experimental) | OpenAPI Generator `rust` |
| --- | --- | --- |
| Status | Experimental | Stable |
| HTTP stack | One generated client | `reqwest` (default), `reqwest-trait`, `hyper`, `hyper0x` |
| Async | Async pager for paginated methods | `supportAsync` (default true with `reqwest`) |
| `oneOf` / `anyOf` / `allOf` | Lowered into typed unions; check your preview | `oneOf` supported; `allOf` and `anyOf` marked unsupported |
| Pagination | Pager, including next-page URLs | Not among the generator's documented options |
| Retries | Built in, honours `Retry-After` | Add your own through `reqwest-middleware` |
| crates.io release | Trusted publishing workflow generated into your repo | `Cargo.toml` generated; release process is yours |

For the broader decision, see [OpenAPI Generator alternatives](/alternatives/openapi-generator).

## Documenting a Rust API, too

If your API is written in Rust, Scalar's API reference already has integrations for [Axum, Actix Web, and other Rust frameworks](/products/api-references/integrations/rust). The OpenAPI document those frameworks produce, for example through `utoipa` or `aide`, is the same input the SDK generator uses.

## Frequently asked questions

<scalar-detail title="Is Scalar's Rust SDK generator production ready?">

No. Rust is experimental. It generates working code but is further from GA than Java, Kotlin, Ruby, and C#. Talk to us before you publish a crate to users.

</scalar-detail>

<scalar-detail title="Can I publish to crates.io without storing a token?">

Yes. Add a trusted publisher on crates.io for your repository and `release-please.yml`. The workflow exchanges its identity token for a short-lived crates.io token at publish time.

</scalar-detail>

<scalar-detail title="Is the generated Rust client async?">

Paginated methods are documented as async: you advance the pager with `pager.next().await`. Confirm the runtime requirements in the README generated for your crate.

</scalar-detail>

<scalar-detail title="Does the Rust SDK support WebSockets?">

Yes, for AsyncAPI documents. Rust is one of four targets, with TypeScript, Python, and the CLI, that ship a WebSocket runtime.

</scalar-detail>

<scalar-detail title="My API paginates with a next-page URL. Which target handles that?">

Rust is currently the only target that follows a next-page URL. Other targets expect a cursor token and stop early on URL-based schemes.

</scalar-detail>

<scalar-button
  title="Preview a Rust crate from your OpenAPI document"
  href="https://dashboard.scalar.com/register">
</scalar-button>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [OpenAPI Generator alternatives](/alternatives/openapi-generator)
- **Docs:** [Rust configuration](/products/sdk-generator/configuration/rust) · [Publishing to crates.io](/products/sdk-generator/configuration/rust#publish)
- **Product:** [SDK Generator](/products/sdk-generator) — preview a Rust crate from your own OpenAPI document

---

*OpenAPI Generator details are taken from [openapi-generator.tech](https://openapi-generator.tech/docs/generators/rust) and the [OpenAPITools/openapi-generator repository](https://github.com/OpenAPITools/openapi-generator) as of September 2026 (release 7.25.0). If something here is out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will fix it.*
