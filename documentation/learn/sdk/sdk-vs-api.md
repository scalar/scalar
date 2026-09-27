# SDK vs API: what is the difference?

*Last updated: September 2026*

*By Marc Laventure · Reviewed by: pending*

An API is the contract a service exposes, the endpoints, requests, and responses you can send and receive, while an SDK is a library for one programming language that calls that API for you. The API is what the server offers. The SDK is a convenience layer on the client side that turns HTTP requests into ordinary function calls, with types, authentication, retries, and error handling already written.

So the two are not alternatives in the way "Postgres vs MySQL" are alternatives. An SDK sits on top of an API. Every SDK call eventually becomes an API request, and you can always skip the SDK and call the API directly. The real question is when the SDK is worth it, for you as a consumer and for your team as an API provider.

## The quick answer

| | API | SDK |
| --- | --- | --- |
| What it is | A contract: operations, inputs, outputs, errors | A package of code in one language |
| Where it lives | On the server, described by an API description such as an OpenAPI document | In your application, installed from npm, PyPI, Go modules, and so on |
| Language | Language-neutral (HTTP and JSON, usually) | Language-specific (TypeScript, Python, Go...) |
| How you use it | Send HTTP requests with any client | Call methods like `client.users.list()` |
| Who maintains it | The API provider | The provider (official SDK) or the community |
| Types and autocomplete | Only if you write them | Included |
| Retries, pagination, auth | You implement them | Usually built in |
| Can exist without the other | Yes | No, an API SDK always wraps an API |

## What is an API?

An API (application programming interface) is a defined way for one piece of software to ask another for something. On the web, that usually means an HTTP API: you send a `GET /users/123` with a credential and receive JSON back. The API defines which endpoints exist, which parameters they accept, what they return, and which errors can happen.

That definition is best written down in a machine-readable API description. For HTTP APIs, the standard format is OpenAPI. An OpenAPI document lists every operation and schema, and tools use it to render [API references](/learn/openapi/what-is-an-api-reference), power [API clients](/learn/openapi/what-is-an-api-client), run mock servers, and generate SDKs. If that is new to you, read [what is OpenAPI](/learn/openapi/what-is-openapi) first.

## What is an SDK?

An SDK (software development kit) is a set of tools for building against a platform. For web APIs, "SDK" almost always means a client library: a package that wraps the API in the idioms of one language. A TypeScript SDK gives you classes, promises, and type definitions. A Python SDK gives you snake_case methods, iterators, and exceptions. A Go SDK gives you structs, `context.Context`, and returned errors.

The broader meaning still exists. The [Android SDK](https://developer.android.com/studio), for example, is a whole toolchain with compilers, emulators, and platform libraries. That kind of SDK is not wrapping one HTTP API. We cover both meanings in [what is an SDK](/learn/sdk/what-is-an-sdk); this page is about API SDKs.

## The same call three ways

The difference is easiest to see in code. Here is one operation, "list users", against a fictional Acme API whose OpenAPI document declares an API key in the `X-API-Key` header and cursor pagination on `/users`.

**Raw HTTP with curl:**

```bash
curl https://api.acme.com/users?limit=50 \
  -H "X-API-Key: $ACME_API_KEY"
```

**Calling the API directly from TypeScript:**

```ts
type User = { id: string; email: string }
type UserList = { data: User[]; next_cursor: string | null }

const listAllUsers = async (): Promise<User[]> => {
  const users: User[] = []
  let cursor: string | null = null

  do {
    const url = new URL('https://api.acme.com/users')
    url.searchParams.set('limit', '50')
    if (cursor) url.searchParams.set('cursor', cursor)

    const response = await fetch(url, {
      headers: { 'X-API-Key': process.env.ACME_API_KEY ?? '' },
    })

    if (response.status === 429) {
      // Real code needs backoff and Retry-After handling here.
      throw new Error('Rate limited')
    }
    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`)
    }

    const page = (await response.json()) as UserList
    users.push(...page.data)
    cursor = page.next_cursor
  } while (cursor)

  return users
}
```

**The same thing through a generated SDK:**

```ts
import Acme from '@acme/api'

const client = new Acme() // reads ACME_API_KEY from the environment

for await (const user of client.users.list({ limit: 50 })) {
  console.log(user.id, user.email)
}
```

The raw version is not wrong. It is just all yours: the types, the pagination loop, the error mapping, and the retry logic you have not written yet. The SDK version hides those behind a method that already knows the API's rules. For a real, public example of generated SDK output rather than a sketch, look at the [Warp TypeScript SDK](https://github.com/TeamWarp/warp-sdk-typescript/tree/scalar-generated), which exposes calls like `client.timeOff.listAssignments()` and typed errors such as `RateLimitError` and `NotFoundError`.

## What an SDK adds on top of an API

When people say an SDK "makes an API easier", they mean some combination of the following. It is a useful checklist when judging whether an SDK is any good.

- **Types.** Request and response models, so the editor catches a misspelled field before the server does.
- **Authentication.** Credentials passed once to the constructor, often read from an environment variable. The SDK knows which [security scheme](/learn/openapi/openapi-security-schemes) the API uses.
- **Pagination.** Iterators that fetch the next page as you loop. Generators need the pagination style declared; see [how Scalar does it](/products/sdk-generator/pagination).
- **Retries and timeouts.** Automatic retries on network errors, 429, and 5xx responses, respecting `Retry-After`.
- **Typed errors.** A `NotFoundError` you can catch instead of a status code you have to compare.
- **Serialization.** Dates, enums, unions, multipart uploads, and query arrays encoded the way the server expects.
- **Streaming.** Server-sent events or newline-delimited JSON exposed as async iterators.
- **Discoverability.** Autocomplete on `client.` shows every resource, which is often faster than reading docs.
- **Versioning.** A package versioned with semver, so you upgrade on purpose and read a changelog when you do.

Every one of these can be built by hand against the raw API. The point of an SDK is that the provider builds them once instead of every consumer building them separately.

## When to call the API directly

Skipping the SDK is a reasonable choice more often than SDK vendors like to admit.

- **There is no SDK for your language.** An API that ships TypeScript and Python SDKs is still fully usable from Elixir.
- **You need one or two endpoints.** Pulling in a package for one webhook registration can be more weight than it is worth.
- **Bundle size or dependencies matter.** Edge functions and browser bundles sometimes favor a few `fetch` calls.
- **You are exploring.** An [API client](/products/api-client) or `curl` is the fastest way to see what an endpoint actually returns before writing any code.
- **The SDK lags the API.** If a new endpoint is live but not yet in the SDK, call it directly until the next release.

## When to use the SDK

- **You use many endpoints or use them often.** The types and helpers pay for themselves quickly.
- **Correctness matters more than control.** Retries, idempotency keys, and pagination are easy to get subtly wrong.
- **Several teams consume the same API.** One SDK gives everyone the same behavior.
- **Coding agents write the integration.** A typed SDK with a method reference gives an agent less room to invent endpoints. Scalar-generated SDKs, for example, ship an `api.md` and a `SKILL.md` for exactly this reason.

## SDK, API, library, client, and framework

These words get mixed together. A rough guide:

| Term | Meaning | Example |
| --- | --- | --- |
| API | The contract a service exposes | `GET /users/{id}` |
| API description | A machine-readable document of that contract | `openapi.yaml` |
| API client (tool) | An application for sending requests by hand | Scalar API Client, Postman, Bruno |
| Client library | Code that calls an API from one language | `@acme/api` on npm |
| SDK | A client library, sometimes plus tools, docs, and samples | The Acme TypeScript SDK |
| Framework | Code that calls *your* code and shapes the application | Express, Django |

"Client library" and "SDK" are close to synonyms in API work. "SDK" tends to imply an official, maintained package with docs and examples; "client library" is the more neutral term.

## For API providers: should you ship an SDK?

If you run an API, SDKs are part of the product. Developers compare how long it takes to make the first successful call, and an SDK plus a working example usually wins that comparison over a raw HTTP reference alone. The cost is that every SDK is a codebase per language to build, version, publish, and keep in sync with the API.

That cost is why most providers now generate SDKs from their OpenAPI document instead of writing them by hand. A generator reads the document, emits idiomatic code for each language, and regenerates when the API changes. The trade-offs, including when writing by hand still makes sense, are in [build vs buy an SDK](/learn/sdk/build-vs-buy-sdk). The practical steps are in [how to generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi).

A typical order of investment looks like this:

1. **A complete OpenAPI document**, because everything else is built from it.
2. **An interactive [API reference](/products/api-references)** so people can read and try every endpoint.
3. **SDKs for the two or three languages your users write most.**
4. **A CLI** for scripting and operations teams.
5. **An [MCP server](/products/agent/mcp)** so AI agents can call the API as tools. See [MCP vs API](/learn/mcp/mcp-vs-api) for how that fits alongside SDKs.

## Common misconceptions

**"An SDK is a different API."** No. It calls the same endpoints you would. If the SDK can do something the API cannot, that logic is running on the client.

**"If there is an SDK, the API docs do not matter."** SDK users still read the reference to understand fields, limits, and errors. Good generated SDKs link methods back to the reference for that reason.

**"SDKs lock you in."** An official SDK wraps an API you could call anyway. The lock-in, if any, is to the API itself, not the library.

**"Generated SDKs are always worse than hand-written ones."** Older template-based generators earned that reputation. Current generators produce code that is hard to tell apart from hand-written libraries, provided the OpenAPI document is good.

## Frequently asked questions

<scalar-detail title="Is an SDK the same as an API?">

No. The API is the contract a server exposes. An SDK is a language-specific library that calls that API. You can use an API without an SDK, but an API SDK cannot work without the API behind it.

</scalar-detail>

<scalar-detail title="Is an SDK faster than calling the API directly?">

Not at the network level, because both send the same HTTP requests. An SDK can feel faster to build with, and features like connection reuse or automatic retries can make an application more reliable, but the API's latency is the same either way.

</scalar-detail>

<scalar-detail title="Does every API have an SDK?">

No. Many APIs publish only an API reference, or SDKs for a few languages. When there is no SDK for your language, you can call the API directly, use a community library, or generate a client yourself from the provider's OpenAPI document.

</scalar-detail>

<scalar-detail title="What is the difference between an SDK and a REST API?">

A REST API is an HTTP API designed around resources and standard methods (`GET`, `POST`, `PATCH`, `DELETE`). An SDK for a REST API wraps those requests in language-native methods, such as `client.users.retrieve(id)` for `GET /users/{id}`.

</scalar-detail>

<scalar-detail title="Can I generate an SDK from an API?">

Yes, if the API has an OpenAPI document (or you write one). SDK generators turn the document into client libraries for several languages. See [how to generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi).

</scalar-detail>

## Related

- **Learn:** [What is an SDK?](/learn/sdk/what-is-an-sdk) · [How to generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [Build vs buy an SDK](/learn/sdk/build-vs-buy-sdk)
- **Docs:** [SDK Generator getting started](/products/sdk-generator/getting-started)
- **Product:** [Scalar SDK Generator](/products/sdk-generator) — turn the OpenAPI document you already have into typed SDKs and a CLI.
