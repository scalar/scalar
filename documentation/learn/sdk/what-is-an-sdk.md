# What is an SDK?

*Last updated: September 2026*

An SDK (software development kit) is a packaged set of code, tools, and documentation that lets developers build on a platform or call a service from their own programming language without writing the low-level plumbing themselves. For web APIs, an SDK is usually a client library: install `@acme/api` from npm or `acme-api` from PyPI, and the API's endpoints become typed methods like `client.users.list()`.

The term covers a wide range. The toolchain you install to build Android apps is an SDK. So is the small TypeScript package a startup publishes for its REST API. What they share is purpose: an SDK packages the knowledge of how to use a platform correctly, so every developer does not have to rediscover it.

This article explains what goes into an SDK, the main kinds you will meet, what separates a good one from a frustrating one, and how API providers build them today.

## What is inside an SDK

No two SDKs contain exactly the same things, but most combine several of these parts.

| Component | What it does | Example |
| --- | --- | --- |
| Client library | Code you import and call | `import Acme from '@acme/api'` |
| Types and models | Describe requests and responses so editors and compilers can check them | `User`, `CreateInvoiceParams` |
| Runtime helpers | Auth, retries, timeouts, pagination, serialization, streaming | Auto-paginating iterators |
| Error types | Map failures to catchable classes | `NotFoundError`, `RateLimitError` |
| Documentation | README, method reference, changelog | `README.md`, `api.md`, `CHANGELOG.md` |
| Examples | Runnable snippets for common tasks | "Create your first invoice" |
| Tools | CLIs, emulators, debuggers, build plugins | A command-line client, a local emulator |
| Release metadata | Package manifest and version | `package.json`, `pyproject.toml`, `go.mod` |

Platform SDKs lean toward the bottom of that table, with compilers, emulators, and build tooling. API SDKs lean toward the top: a client library, its types, and the helpers that make network calls reliable.

## Kinds of SDKs

### Platform SDKs

These let you build software *for* a platform. The [Android SDK](https://developer.android.com/studio) and Apple's [iOS SDK in Xcode](https://developer.apple.com/xcode/) include compilers, system libraries, simulators, and debugging tools. You do not call them over a network; you build against them.

### API SDKs (client libraries)

These let you call a remote service. The provider describes an HTTP API, and the SDK turns each operation into a method in your language. Large providers maintain SDKs across many languages; for instance, [AWS publishes its JavaScript SDK on GitHub](https://github.com/aws/aws-sdk-js-v3), with the client code [generated from AWS's internal service models](https://github.com/aws/aws-sdk-js-v3) using Smithy. This is the kind of SDK most developers mean when they talk about "the SDK for an API", and the kind the rest of this page focuses on. If you are unsure how it relates to the API itself, see [SDK vs API](/learn/sdk/sdk-vs-api).

### Embedded and device SDKs

Analytics, payments, maps, and authentication vendors ship SDKs that run inside your app, often with UI components. They usually wrap an API too, but add local state, caching, and interface code.

### CLIs as SDK companions

A command-line client is not an SDK in the strict sense, but it is often generated from the same API description and shipped alongside the libraries. Scalar, for example, treats the CLI as a target next to TypeScript, Python, and Go.

## How an API SDK works

Under the hood, every API SDK call follows the same path:

1. **You call a method** such as `client.invoices.create({ customer: 'cus_123', amount: 4200 })`.
2. **The SDK validates and serializes** the arguments into the request the API expects: path, query string, headers, JSON body.
3. **It adds authentication**, for example an `Authorization` or `X-API-Key` header built from the credential you passed to the constructor.
4. **It sends the HTTP request**, with a timeout.
5. **It handles transient failures**, retrying on network errors or 429 and 5xx responses, and waiting for `Retry-After` when the server sends it.
6. **It parses the response** into a typed object, or throws a typed error with the status, headers, and body attached.

Here is that flow from the caller's side, using the public [Warp TypeScript SDK](https://github.com/TeamWarp/warp-sdk-typescript/tree/scalar-generated), which Scalar generates from Warp's OpenAPI document:

```ts
import Warp, { NotFoundError } from 'warp-hr'

const client = new Warp({
  apiKey: process.env['WARP_API_KEY'], // defaults to the WARP_API_KEY env var
  maxRetries: 2,
  timeout: 60_000,
})

try {
  const worker = await client.workers.get('wrk_1234')
  console.log(worker)
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log('That worker does not exist')
  } else {
    throw err
  }
}
```

The developer never writes a URL, a header, or a retry loop. The `apiKey`, `maxRetries`, and `timeout` options come straight from the SDK's README, and the error classes are defined in its [`src/core/error.ts`](https://github.com/TeamWarp/warp-sdk-typescript/blob/scalar-generated/src/core/error.ts).

## Anatomy of a real generated SDK

Looking at a real repository helps more than any definition. The top level of the Warp TypeScript SDK on its `scalar-generated` branch contains, among other files:

| Path | Purpose |
| --- | --- |
| `src/` | The client, resources (one module per API resource), and core runtime |
| `tests/` | Generated tests |
| `api.md` | Every method grouped by resource, with request and response types |
| `README.md` | Installation, authentication, errors, client and request options |
| `SKILL.md` and `.claude/skills/` | Instructions that help coding agents call the API correctly |
| `package.json` | Package name (`warp-hr`), exports for ESM and CommonJS |
| `CHANGELOG.md`, `release-please-config.json` | Versioning and release history |
| `.github/workflows/` | CI and publishing workflows |

Notice how much of that is not code. Documentation, release configuration, and agent instructions are part of what makes an SDK usable, and they are the parts hand-written SDKs most often skip.

## What makes a good SDK

A usable SDK is easy to recognize once you know what to look for.

**It feels native to the language.** Python methods are snake_case and return iterators; Go methods take a `context.Context` and return `(value, error)`; TypeScript methods return promises and export types. An SDK that reads like a translation of another language is harder to use than the raw API. Our [TypeScript](/sdk/typescript), [Python](/sdk/python), and [Go](/sdk/go) pages show what idiomatic generated output looks like in each.

**Names are predictable.** If `client.users.list()` exists, you should be able to guess `client.invoices.list()`. Consistent verbs across resources save more time than any single feature.

**It handles the boring failures.** Retries with backoff, timeouts, and rate-limit handling are there by default and configurable per request.

**Pagination is invisible when you want it to be.** Looping over a list endpoint fetches every page, while a page-at-a-time API is still available.

**Errors are specific.** Typed errors carry the status code, headers, and parsed body.

**It is versioned honestly.** Breaking changes bump the major version (or the minor, before 1.0), and the changelog says what changed. Automating this with Conventional Commits and release pull requests is covered in Scalar's [publishing guide](/products/sdk-generator/configuration/overview#targets).

**It stays in sync with the API.** An SDK that lags the API by months pushes users back to raw HTTP. Keeping the API description in a [registry](/products/registry) and regenerating on every change is the usual fix.

**It is documented where developers look.** A README with a working first call, a method reference, and inline doc comments that show up in the editor. The same [API documentation practices](/learn/openapi/api-documentation-best-practices) apply to SDK docs.

## How SDKs are built today

There are three broad approaches, and most mature API companies end up mixing them.

1. **Hand-written.** Engineers write each SDK directly. You get full control and full cost: every endpoint, every language, every release, forever.
2. **Generated with open-source tools.** A template-based generator such as [OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator) turns an OpenAPI document into code. It is free and covers many languages; the output often needs template work and your own release pipeline. See [OpenAPI Generator alternatives](/alternatives/openapi-generator) for where it fits.
3. **Generated with a managed service.** Tools such as [Scalar's SDK Generator](/products/sdk-generator) produce idiomatic SDKs, handle custom code across regenerations, and publish through workflows in your repository.

The input for both generated approaches is an [OpenAPI document](/learn/openapi/what-is-openapi). The better that document describes the API, including operation names, tags, schemas, error responses, and pagination, the better every generated SDK will be. The step-by-step version is in [how to generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi), and the cost trade-offs are in [build vs buy an SDK](/learn/sdk/build-vs-buy-sdk).

## SDKs and AI agents

A growing share of the code that calls APIs is written by coding agents. Agents are good at using libraries and bad at guessing endpoints, so a typed SDK with a clear method reference narrows the room for invented calls: the compiler rejects a method that does not exist. That is why generated SDKs increasingly ship machine-readable context next to the code: Scalar-generated SDKs include an Agent Skill (`SKILL.md`) and an `api.md` method list by default.

Agents can also call APIs without any SDK through the Model Context Protocol. An MCP server exposes API operations as tools an agent can invoke at runtime. SDKs and MCP servers solve different problems: the SDK is for code a developer ships, the MCP server is for an agent acting on a user's behalf. [What is MCP](/learn/mcp/what-is-mcp) explains the difference, and Scalar [hosts MCP servers](/products/agent/mcp) built from the same OpenAPI document.

## Common questions about SDK terminology

**Is an SDK the same as a library?** An API SDK is mostly a library, plus the documentation, examples, and tooling that ship with it. People use the words interchangeably in API work.

**Is an SDK the same as an API?** No. The API is the contract on the server; the SDK is client code that calls it. [SDK vs API](/learn/sdk/sdk-vs-api) covers this in detail.

**What does "official SDK" mean?** It is maintained by the company that runs the API, as opposed to a community library. Official SDKs track the API more closely and are usually the safer default.

**What is a "thin" SDK?** One that maps endpoints to methods and does little else. Thin SDKs are easy to generate and maintain, but leave retries, pagination, and error handling to the caller.

## Frequently asked questions

<scalar-detail title="What does SDK stand for?">

SDK stands for software development kit. It is a bundle of code, tools, and documentation for building on a platform or calling a service.

</scalar-detail>

<scalar-detail title="What is an example of an SDK?">

The Android SDK is a platform SDK used to build Android apps. The AWS SDK for JavaScript is an API SDK used to call AWS services from JavaScript. The Warp TypeScript SDK (`warp-hr` on npm) is a smaller API SDK, generated from Warp's OpenAPI document.

</scalar-detail>

<scalar-detail title="Why do companies build SDKs for their APIs?">

To shorten the time from sign-up to a working integration, reduce support load from common mistakes such as missing retries or broken pagination, and give developers type safety and autocomplete. For many API products, SDK quality directly affects adoption.

</scalar-detail>

<scalar-detail title="Do I need an SDK to use an API?">

No. You can always call an HTTP API directly with `curl`, `fetch`, or any HTTP client. An SDK saves time and removes whole classes of bugs, but it is optional.

</scalar-detail>

<scalar-detail title="How many languages should an API SDK support?">

Start with the languages your users actually write, usually two or three. Your API logs (user agents), support tickets, and sales conversations will tell you which. Add languages when demand is clear, because each one is ongoing maintenance.

</scalar-detail>

<scalar-detail title="Are generated SDKs as good as hand-written ones?">

They can be. Older template-based output earned a poor reputation, but current generators produce idiomatic code with retries, pagination, and typed errors, provided the OpenAPI document is complete. Hand-written SDKs still make sense when the SDK carries heavy client-side logic that no API description can express.

</scalar-detail>

## Related

- **Learn:** [SDK vs API](/learn/sdk/sdk-vs-api) · [How to generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [Build vs buy an SDK](/learn/sdk/build-vs-buy-sdk)
- **Docs:** [SDK Generator getting started](/products/sdk-generator/getting-started) · [Custom code](/products/sdk-generator/custom-code)
- **Product:** [Scalar SDK Generator](/products/sdk-generator) — generate idiomatic TypeScript, Python, Go, and CLI clients from your OpenAPI document.
