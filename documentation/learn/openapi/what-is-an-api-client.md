# What is an API client?

*Last updated: September 2026*

*By Marc Laventure · Reviewed by: pending*

An API client is a tool that lets you build an HTTP request to an API, send it, and inspect the response, all without writing application code. You pick a method and a URL, add headers, authentication and a body, press send, and read the status code, headers and payload that come back.

Developers use API clients to explore an API they have never touched before, to debug an endpoint that misbehaves, to check that a change works before it ships, and to share working requests with teammates. The best ones read an OpenAPI document and turn it into a ready-made collection of requests, so you start from the real contract instead of retyping endpoints by hand.

This guide explains what an API client does, the kinds that exist, how importing an OpenAPI document works, and how to choose one.

**On this page**

- [The short answer](#the-short-answer)
- [Two things people mean by "API client"](#two-things-people-mean-by-api-client)
- [What an API client does](#what-an-api-client-does)
- [Types of API clients](#types-of-api-clients)
- [Why OpenAPI and API clients belong together](#why-openapi-and-api-clients-belong-together)
- [How to import an OpenAPI document into an API client](#how-to-import-an-openapi-document-into-an-api-client)
- [A worked example](#a-worked-example)
- [API client vs SDK vs API reference vs mock server](#api-client-vs-sdk-vs-api-reference-vs-mock-server)
- [How to choose an API client](#how-to-choose-an-api-client)
- [Common options](#common-options)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## The short answer

An API client is to an HTTP API what a database GUI is to a database: a workbench for talking to it directly. It handles the tedious parts of making a request (encoding a body, attaching a bearer token, running an OAuth flow, switching base URLs between staging and production) and shows you the result in a readable form.

If you have ever run `curl -X POST ...` and squinted at the JSON that came back, you have used an API client. Graphical API clients do the same thing with more help: saved requests, collections, environments, scripts, tests, and code snippets you can paste into your app.

## Two things people mean by "API client"

The phrase has two common meanings, and it helps to separate them before going further.

1. **An API client tool.** An application (desktop, web or command line) that a person uses to send requests by hand. Examples include curl, Scalar API Client, Bruno, Insomnia and Postman. This is what this guide is about.
2. **An API client library.** Code that your application imports to call an API, such as a TypeScript or Python package with a method per endpoint. Those are usually called SDKs. If that is what you are looking for, read [What is an SDK?](/learn/sdk/what-is-an-sdk) and [SDK vs API](/learn/sdk/sdk-vs-api).

Both are "clients" in the HTTP sense: they sit on the client side of a request and response. The difference is who drives them. A person drives an API client tool; your program drives an SDK.

## What an API client does

Most API clients share the same core features. The details vary, but the anatomy looks like this.

**A request builder.** Fields for the HTTP method, the URL with path and query parameters, headers, cookies, and a body editor that understands JSON, form data, multipart uploads and raw text.

**Authentication helpers.** Instead of hand-crafting an `Authorization` header, you choose a scheme (API key, HTTP Basic, bearer token, OAuth 2.0, OpenID Connect) and the client applies it. Good clients run the full OAuth 2.0 flow for you, including the browser redirect and the token exchange. If you want to understand how those schemes are described in an API contract, see [OpenAPI security schemes](/learn/openapi/openapi-security-schemes).

**Environments and variables.** A variable such as `{{ baseUrl }}` or `{{ apiKey }}` lets one saved request run against local, staging and production by switching the active environment, and keeps secrets out of the request itself.

**Collections.** Requests grouped by API, resource or workflow, saved so you and your teammates can run them again.

**Response inspection.** Status code, timing, response size, headers, and a formatted body. Some clients render images, HTML and streamed responses such as Server-Sent Events.

**Scripts and tests.** Code that runs before a request (to compute a signature or fetch a token) or after it (to assert on the status code or store a value for the next request).

**Code generation.** A snippet that reproduces the current request in curl, JavaScript `fetch`, Python `requests`, Go and so on, so a request you got working by hand becomes code in seconds.

**History.** A log of what you sent and what came back, which is often the fastest way to answer "what changed since this morning?"

## Types of API clients

API clients come in a few shapes. Many developers use more than one: curl in a terminal for a quick check, a graphical client for longer sessions, and the "try it" panel in documentation when evaluating a new API.

| Type | Examples | Good for | Trade-offs |
| --- | --- | --- | --- |
| Command line | curl, HTTPie | Quick checks, scripts, CI, sharing a one-liner | No saved collections or auth flows unless you build them yourself |
| Desktop app | Scalar API Client, Bruno, Insomnia, Postman | Long debugging sessions, collections, environments, OAuth | One more app to install and keep in sync with the API |
| Browser app | Scalar API Client at client.scalar.com, Hoppscotch | Zero install, quick sharing | Browser security rules (CORS) can get in the way, so a proxy is often needed |
| Embedded in docs | The "Test Request" panel in an API reference | Trying an endpoint while reading about it | Scoped to one API, usually no long-term storage |
| Embedded in an editor | `.http` files in IDE extensions | Keeping requests next to code | Feature depth varies a lot by extension |

The line between these has blurred. Scalar's API client, for example, runs in the browser, as a desktop app for macOS, Windows and Linux, and inside every [Scalar API reference](/products/api-references) as the request panel, so the same client follows an API from its documentation to your desk.

## Why OpenAPI and API clients belong together

An API client is only as good as the requests in it. The traditional way to fill a client is by hand: read the documentation, copy the URL, guess the headers, paste an example body. That works for three endpoints. It does not work for three hundred, and it breaks quietly every time the API changes.

An [OpenAPI document](/learn/openapi/what-is-openapi) already contains everything a client needs:

- every path and HTTP method, grouped by tag
- every parameter, with its location, type and whether it is required
- request body schemas and examples
- the servers the API runs on, including server variables
- the security schemes and which operations require them

So a client that reads OpenAPI can generate a complete, correct collection in one step. The request bodies arrive pre-filled from examples, the auth panel already knows the API uses OAuth 2.0 with the authorization code flow, and the server dropdown already lists staging and production.

There is a second benefit that matters more over time: drift. A hand-built collection is a copy of the API contract, and copies go stale. A collection generated from the OpenAPI document can be regenerated or re-synced when the document changes, so your saved requests track the API instead of the API as it was when someone last updated the collection.

## How to import an OpenAPI document into an API client

The exact buttons differ between tools, but the process is the same everywhere: point the client at your document, let it build a collection, then add credentials and environment values. Here is how it works in the [Scalar API Client](/products/api-client).

<scalar-steps>
  <scalar-step id="step-1" title="Open the client">

Open [client.scalar.com](https://client.scalar.com) in a browser, or download the desktop app for macOS, Windows or Linux.

  </scalar-step>

  <scalar-step id="step-2" title="Import your OpenAPI document">

Press **⌘ K** (or **Ctrl K**), choose **Import from OpenAPI/Swagger/Postman/cURL**, then drop in a file, paste a URL to a hosted document, or point the client at your local development server. JSON and YAML both work. Swagger 2.0 files are upgraded to OpenAPI 3.1 automatically, and Postman Collection v2.0 and v2.1 files are converted as a one-off import. The [import guide](/products/api-client/import) lists every format.

  </scalar-step>

  <scalar-step id="step-3" title="Add credentials">

The client reads `components.securitySchemes` and preselects the scheme each operation requires. Fill in a token, an API key, or run the OAuth flow once at the collection level and every request reuses it. Details are in the [authentication guide](/products/api-client/authentication).

  </scalar-step>

  <scalar-step id="step-4" title="Set up environments">

Create an environment per stage and reference its variables with double curly braces, for example `{{ baseUrl }}` or `{{ apiKey }}`. Switching the active environment re-resolves every request. See [environments](/products/api-client/environments).

  </scalar-step>

  <scalar-step id="step-5" title="Send, test, and keep it in sync">

Send a request, add a [post-response test](/products/api-client/testing), and when your OpenAPI document changes on disk, let the client watch it so the collection stays aligned.

  </scalar-step>
</scalar-steps>

One detail worth knowing: credentials you enter are stored in your workspace and are never exported with the OpenAPI document. That is deliberate. The document is a contract you can commit and share; your token is not.

## A worked example

Here is a small but complete OpenAPI 3.1 document. Import it and the client creates two requests, a server dropdown with two entries, and a bearer token field.

```yaml
openapi: 3.1.0
info:
  title: Orders API
  version: 1.0.0
servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://staging-api.example.com/v1
    description: Staging
security:
  - bearerAuth: []
paths:
  /orders:
    get:
      operationId: listOrders
      summary: List orders
      tags: [Orders]
      parameters:
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        '200':
          description: A page of orders
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Order'
    post:
      operationId: createOrder
      summary: Create an order
      tags: [Orders]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewOrder'
            example:
              sku: TSHIRT-M-BLUE
              quantity: 2
      responses:
        '201':
          description: Order created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    NewOrder:
      type: object
      required: [sku, quantity]
      properties:
        sku:
          type: string
        quantity:
          type: integer
          minimum: 1
    Order:
      allOf:
        - $ref: '#/components/schemas/NewOrder'
        - type: object
          required: [id, status]
          properties:
            id:
              type: string
            status:
              type: string
              enum: [pending, paid, shipped]
```

The **Create an order** request opens with the example body already in place. The equivalent curl command, which the client can generate for you, looks like this:

```bash
curl https://staging-api.example.com/v1/orders \
  --request POST \
  --header 'Authorization: Bearer YOUR_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"sku":"TSHIRT-M-BLUE","quantity":2}'
```

To turn the request into a quick regression check, add a post-response script. Scalar uses a Postman-compatible `pm` API, so scripts written for Postman usually run unchanged:

```js
pm.test('Order is created', () => {
  pm.response.to.have.status(201)
  const order = pm.response.json()
  pm.expect(order.status).to.equal('pending')
  pm.environment.set('orderId', order.id)
})
```

The last line stores the new order's ID in the environment, so a follow-up request such as `GET {{ baseUrl }}/orders/{{ orderId }}` can use it. Pre-request scripts work the same way in the other direction.

## API client vs SDK vs API reference vs mock server

These four tools all read the same OpenAPI document, which is why they get confused. They answer different questions.

| Tool | Who uses it | Question it answers | Output |
| --- | --- | --- | --- |
| API client | A developer, by hand | "What does this endpoint actually return right now?" | A sent request and its response |
| SDK | Your application code | "How do I call this API from my program?" | A typed library, such as a TypeScript or Python package |
| API reference | Anyone reading about the API | "What endpoints exist and how do they work?" | Interactive documentation |
| Mock server | Frontend and test code | "What would the API return, before it exists?" | A fake API that answers with example data |

They work best together. You read the [API reference](/learn/openapi/what-is-an-api-reference), try a call in the API client, point the client at a [mock server](/learn/openapi/api-mocking) while the backend is still being built, and ship with the [SDK generated from the same document](/learn/sdk/generate-sdk-from-openapi).

## How to choose an API client

Feature lists across API clients look similar, so the useful questions are about how the tool fits your workflow and what happens to your data.

**Where do your collections live?** Some clients store collections in a vendor cloud, some store plain files on disk that you can commit to Git, and some let you choose. If you want requests reviewed in pull requests next to the code, files on disk matter.

**Does it speak OpenAPI natively?** Many clients can import an OpenAPI document once. Fewer treat OpenAPI as their internal format, which means importing is lossless and exporting gives you a valid OpenAPI document back. Scalar's client uses OpenAPI as its native format, so environments, auth schemes and servers map directly to the specification.

**Does it work offline?** If your API runs on `localhost` or behind a VPN, a client that needs an account and a network connection to start is friction.

**Which auth flows does it support?** API keys and bearer tokens are universal. OAuth 2.0 with PKCE, client credentials, and OpenID Connect discovery are where clients differ.

**Can you script it?** Pre-request and post-response scripts cover token refresh, request signing and chained requests. Postman's `pm` scripting API is the de facto standard, so compatibility with it makes migrating scripts easier.

**What is the licence?** Open source clients can be audited, self-hosted, and kept running if the vendor changes direction.

## Common options

Here are the API clients developers most often compare, with the facts we could verify from each project's own repository as of September 2026. For a longer roundup, see [the best open source API clients](/library/best-open-source-api-clients-2026).

- **Scalar API Client.** Open source under the [MIT licence](https://github.com/scalar/scalar), offline-first, available in the browser and as a desktop app, with OpenAPI as its native format, Postman-compatible scripting and code snippets for 40+ HTTP clients. It is also the request panel inside every Scalar API reference. Best for teams whose source of truth is an OpenAPI document.
- **Bruno.** [MIT licensed](https://github.com/usebruno/bruno). Its README says it stores collections in a folder on your filesystem using a plain-text markup language called Bru, and that it is offline-only. Best for teams who want requests as files in Git and do not need OpenAPI as the storage format.
- **Insomnia.** [Apache-2.0 licensed](https://github.com/Kong/insomnia) and maintained by Kong. Its repository describes support for GraphQL, REST, WebSockets, SSE and gRPC, with cloud, local and Git storage. Best if you need gRPC or GraphQL alongside REST in one tool.
- **Hoppscotch.** [MIT licensed](https://github.com/hoppscotch/hoppscotch), with web, desktop and CLI versions and a self-hosted option according to its repository. Best for a lightweight browser-first client.
- **Postman.** The client most teams are migrating from or comparing against. Our [Scalar vs Postman comparison](/resources/compare/postman) and the [Postman alternatives guide](/alternatives/postman) cover the differences in detail.
- **curl.** Not a collection manager, but installed almost everywhere and the lingua franca for sharing a single request. Every graphical client worth using can import and export curl commands.

## Common mistakes

**Treating the collection as the source of truth.** If your team edits requests in a client but never updates the OpenAPI document, the two drift apart and your documentation, SDKs and mocks go stale. Make the OpenAPI document canonical and regenerate or re-sync the collection from it.

**Hard-coding secrets in requests.** A token pasted into a header gets exported, screenshotted and committed. Put secrets in environment variables and keep them out of shared files.

**Testing only the happy path.** A client makes it easy to send the one request you know works. Also send the request with a missing field, an expired token and an out-of-range parameter, and check that the error responses match what the API describes.

**Fighting CORS in a browser client.** Browsers block cross-origin requests that the API does not allow. That is a browser rule, not a bug in the API. Use a desktop app, a local proxy, or the proxy your client provides.

**Ignoring the API's own examples.** If a request body starts empty after import, the OpenAPI document probably has no examples. Adding `example` or `examples` to request bodies improves every tool downstream, not just the client.

## Frequently asked questions

<scalar-detail title="Is an API client the same as an SDK?">
No. An API client tool is an application a person uses to send requests by hand. An SDK is a code library your application imports to call an API. Both are on the client side of an HTTP exchange, which is why the names overlap. See [SDK vs API](/learn/sdk/sdk-vs-api) for how SDKs fit in.
</scalar-detail>

<scalar-detail title="How do I import an OpenAPI file into an API client?">
In most clients you choose Import and provide a file, a URL, or paste the document. In the Scalar API Client, press ⌘ K or Ctrl K, choose Import from OpenAPI/Swagger/Postman/cURL, and drop in a JSON or YAML file or a URL. The client creates one request per operation and reads servers and security schemes from the document.
</scalar-detail>

<scalar-detail title="Can I import a Swagger 2.0 file?">
Yes, in most modern clients. The Scalar API Client upgrades Swagger 2.0 files to OpenAPI 3.1 during import, so you do not need to convert them first. If you want to convert the file itself, the Scalar CLI has a `scalar document upgrade` command.
</scalar-detail>

<scalar-detail title="Is there a free, open source API client?">
Yes, several. Scalar API Client, Bruno and Hoppscotch are MIT licensed, and Insomnia is Apache-2.0 licensed. They differ mainly in how they store collections and how deeply they support OpenAPI.
</scalar-detail>

<scalar-detail title="Why does my request work in the API client but fail in the browser?">
Usually because of CORS. A desktop API client is not subject to the browser's cross-origin rules, while code running in a web page is. The API needs to return the right Access-Control-Allow-Origin headers for your web app's origin.
</scalar-detail>

<scalar-detail title="Can I run API client tests in CI?">
Many clients offer a command-line runner for their collections. Another approach is to keep the OpenAPI document as the source of truth and run contract tests or linting in CI, using the API client for interactive work. See [Spectral rules](/learn/openapi/spectral-rules) for the linting side.
</scalar-detail>

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [API mocking](/learn/openapi/api-mocking) · [OpenAPI security schemes](/learn/openapi/openapi-security-schemes)
- **Docs:** [Get started with the API Client](/products/api-client/getting-started)
- **Product:** [Scalar API Client](/products/api-client) — an open source, offline-first API client that uses OpenAPI as its native format.
