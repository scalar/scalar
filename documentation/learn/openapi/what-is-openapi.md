# What is OpenAPI?

*Last updated: September 2026*

*By Marc Laventure · Reviewed by: pending*

OpenAPI is an open, vendor-neutral standard for describing HTTP APIs in a machine-readable document, written in YAML or JSON, so that people and tools can understand what an API does without reading its source code. The standard is called the OpenAPI Specification (OAS), it is maintained by the OpenAPI Initiative under the Linux Foundation, and the file you write with it is usually called an OpenAPI document or an API description.

That one file lists every endpoint, the parameters each one accepts, the shape of the request and response bodies, the status codes, and how authentication works. Once it exists, a long list of tools can read it: documentation renderers, API clients, SDK generators, mock servers, linters, gateways, and, more recently, MCP servers for AI agents.

This guide covers what the specification is, how a document is structured, where it came from, which version to use, and how teams actually work with it.

**On this page**

- [The short answer](#the-short-answer)
- [What an OpenAPI document looks like](#what-an-openapi-document-looks-like)
- [The building blocks](#the-building-blocks)
- [A brief history: from Swagger to OpenAPI](#a-brief-history-from-swagger-to-openapi)
- [OpenAPI versions at a glance](#openapi-versions-at-a-glance)
- [What you can do with an OpenAPI document](#what-you-can-do-with-an-openapi-document)
- [Design-first vs code-first](#design-first-vs-code-first)
- [What OpenAPI does not do](#what-openapi-does-not-do)
- [Common mistakes](#common-mistakes)
- [Tools that work with OpenAPI](#tools-that-work-with-openapi)
- [Frequently asked questions](#frequently-asked-questions)

## The short answer

The [OpenAPI Specification 3.2.1](https://spec.openapis.org/oas/v3.2.1.html) opens with a precise definition: it "defines a standard, language-agnostic interface to HTTP APIs." In plain terms, it is a shared vocabulary for writing down the contract of a REST or REST-like API.

Three words in that description do most of the work:

- **Standard.** The format is published by a neutral foundation, not by a single vendor, so a document written for one tool works in another.
- **Language-agnostic.** It does not matter whether your API is written in Python, Go, C#, or TypeScript. The document describes the HTTP surface, not the implementation.
- **HTTP APIs.** OpenAPI covers request and response APIs over HTTP. Event-driven APIs (Kafka, WebSockets, MQTT) usually use AsyncAPI instead, and GraphQL and gRPC have their own schema languages.

A note on terms: "OpenAPI" is the specification. "Swagger" is the old name of the specification (up to version 2.0) and today the brand of a set of tools made by SmartBear. If you want the full story, read [OpenAPI vs Swagger](/learn/openapi/openapi-vs-swagger).

## What an OpenAPI document looks like

Here is a small but complete and valid OpenAPI 3.1 document for an API that lists and creates planets. It is written in YAML, which most people find easier to read and edit by hand. JSON works the same way.

```yaml
openapi: 3.1.1
info:
  title: Planets API
  version: 1.0.0
  description: A small API for listing and creating planets.
  license:
    name: MIT
    identifier: MIT
servers:
  - url: https://api.example.com/v1
tags:
  - name: Planets
    description: Everything about planets.
paths:
  /planets:
    get:
      tags: [Planets]
      summary: List planets
      operationId: listPlanets
      parameters:
        - name: limit
          in: query
          description: How many planets to return.
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        '200':
          description: A page of planets.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Planet'
    post:
      tags: [Planets]
      summary: Create a planet
      operationId: createPlanet
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Planet'
      responses:
        '201':
          description: The planet was created.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Planet'
        '401':
          description: The bearer token is missing or invalid.
components:
  schemas:
    Planet:
      type: object
      required: [name]
      properties:
        id:
          type: integer
          readOnly: true
          examples: [1]
        name:
          type: string
          examples: [Mars]
        description:
          type: [string, 'null']
          examples: [The red planet]
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
```

Even without knowing the specification, you can read that file and learn that `GET /planets` accepts an optional `limit` between 1 and 100, returns an array of planets, and that creating one requires a bearer token. That readability, for both humans and programs, is the whole point.

## The building blocks

Every OpenAPI document is a JSON object with a handful of top-level fields. The [OpenAPI Object section of the 3.2.1 specification](https://spec.openapis.org/oas/v3.2.1.html#openapi-object) makes `openapi` and `info` required and says that at least one of `paths`, `components`, or `webhooks` must be present.

| Field          | Required     | What it holds                                                                                    |
| -------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| `openapi`      | Yes          | The version of the specification the document uses, for example `3.1.1`. Not your API's version. |
| `info`         | Yes          | Title, your API's own `version`, description, contact, and license.                              |
| `servers`      | No           | Base URLs where the API is served. Defaults to `/` if omitted.                                   |
| `paths`        | One of three | Every endpoint, keyed by path (`/planets/{id}`), with an operation per HTTP method.              |
| `webhooks`     | One of three | Requests your API sends to consumers (added in 3.1).                                             |
| `components`   | One of three | Reusable schemas, parameters, responses, examples, and security schemes.                         |
| `security`     | No           | Which security schemes apply to the whole API by default.                                        |
| `tags`         | No           | Groups operations and gives each group a description.                                            |
| `externalDocs` | No           | A link to further documentation.                                                                 |

A few concepts come up constantly:

- **Operations.** A path plus an HTTP method, such as `get` on `/planets`. Each operation has a `summary`, an optional `description`, `parameters`, a `requestBody`, and `responses`.
- **Parameters.** Inputs that live in the path, query string, headers, or cookies. OpenAPI 3.2 adds a `querystring` location that treats the whole query string as one value.
- **Schemas.** The shape of data. Since OpenAPI 3.1, the Schema Object is a superset of [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12), so most JSON Schema knowledge transfers directly. The relationship is covered in [JSON Schema vs OpenAPI](/learn/openapi/json-schema-vs-openapi).
- **`$ref`.** A pointer to something defined elsewhere, most often in `components`. It keeps large documents from repeating themselves. Pulling external `$ref` targets into one file is called bundling; replacing every `$ref` with its value is called dereferencing.
- **Security schemes.** API keys, HTTP authentication (basic, bearer), OAuth 2.0, OpenID Connect, and mutual TLS. See [OpenAPI security schemes](/learn/openapi/openapi-security-schemes) for worked examples.

Most `description` fields accept [CommonMark](https://spec.commonmark.org/), which is how documentation tools can render headings, lists, and links from inside the document.

## A brief history: from Swagger to OpenAPI

OpenAPI did not start as OpenAPI. The [revision history in the specification](https://spec.openapis.org/oas/v3.2.1.html#appendix-a-revision-history) lists the first release of the Swagger Specification in August 2011 and Swagger 2.0 in September 2014.

On November 5, 2015, the Linux Foundation [announced the Open API Initiative](https://www.linuxfoundation.org/press/press-release/new-collaborative-project-to-extend-swagger-specification-for-building-connected-applications-and-services), with founding members including Google, IBM, Microsoft, PayPal, Capital One, and SmartBear. SmartBear donated the Swagger Specification, and the [OpenAPI Initiative](https://www.openapis.org/about) has governed it since. The specification's own history dates the donation of Swagger 2.0 to December 31, 2015.

The first version released under the new name was OpenAPI 3.0.0, in July 2017. That is why "Swagger 2.0" and "OpenAPI 3.x" are the usual way to refer to the old and new generations.

## OpenAPI versions at a glance

Dates below come from the revision history table in the [3.2.1 specification](https://spec.openapis.org/oas/v3.2.1.html#appendix-a-revision-history).

| Version     | First released | Latest patch           | What defines it                                                                                                                |
| ----------- | -------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Swagger 2.0 | September 2014 | 2.0                    | `swagger: "2.0"`, `definitions`, `host` + `basePath`, one body parameter per operation                                         |
| OpenAPI 3.0 | July 2017      | 3.0.4 (October 2024)   | `components`, `servers`, `requestBody`, `callbacks`, links; schemas are a subset of an older JSON Schema draft with `nullable` |
| OpenAPI 3.1 | February 2021  | 3.1.2 (September 2025) | Full JSON Schema 2020-12, `webhooks`, `paths` optional, license `identifier`                                                   |
| OpenAPI 3.2 | September 2025 | 3.2.1 (September 2026) | Nested tags, `query` method and `additionalOperations`, streaming media types, `querystring` parameters, `$self`               |

Which one should you write? For a new API in 2026, **OpenAPI 3.1** is the safe default: it is widely supported by documentation tools, generators, and validators. OpenAPI 3.2 is the newest feature set and is worth adopting once every tool in your pipeline supports it. If you are on 3.0, the upgrade is mostly mechanical and is walked through in [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0). If you still have Swagger 2.0 files, convert them; the [Scalar OpenAPI upgrader](/tools/openapi-upgrader/getting-started) does this from the command line.

## What you can do with an OpenAPI document

The document is valuable because of what it feeds. The specification itself says an OpenAPI description "can then be used by documentation generation tools to display the API, code generation tools to generate servers and clients in various programming languages, testing tools, and many other use cases." In practice:

1. **Interactive documentation.** Render the document as an [API reference](/learn/openapi/what-is-an-api-reference) with a sidebar, request and response examples, and a "try it" button. This is the most common use by far. For the writing side, see [OpenAPI documentation](/learn/openapi/openapi-documentation).
2. **API clients.** Import the document into an [API client](/learn/openapi/what-is-an-api-client) and every endpoint appears as a ready-to-send request.
3. **SDKs.** Generate typed client libraries in several languages. See [how to generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi).
4. **Mock servers.** Serve realistic fake responses before the backend exists. See [API mocking](/learn/openapi/api-mocking).
5. **Linting and validation.** Check the document against the specification and against your own style rules. See [OpenAPI linting](/learn/openapi/spectral-rules).
6. **Contract testing.** Compare real traffic against the description to catch drift.
7. **Gateways and server validation.** Reject requests that do not match the schema before they hit your code.
8. **AI agents.** Expose operations as tools through the Model Context Protocol. See [how to turn an OpenAPI document into an MCP server](/learn/mcp/openapi-to-mcp-server).

The more of these you use, the more it pays to keep one accurate document instead of several hand-maintained artifacts.

## Design-first vs code-first

There are two common ways to produce an OpenAPI document.

**Design-first** means writing the document before the code. Teams review the contract in a pull request, generate a mock server, and let frontend and backend work in parallel. The document is the source of truth, and the implementation is tested against it.

**Code-first** means annotating your code or letting your framework infer the document from routes and types. FastAPI, NestJS, ASP.NET Core, Hono, and many others generate OpenAPI this way. For example, Microsoft's ASP.NET Core documentation shows how to generate a document at runtime and [render it with Scalar](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents).

Neither approach is wrong. Code-first is faster to start and keeps the document close to reality; design-first produces better-considered APIs and catches breaking changes before they ship. Many teams mix them: code-first generation, with a linter and a review step on the generated file.

## What OpenAPI does not do

It helps to know the boundaries:

- **It does not describe business logic.** It says a `POST /orders` accepts an order, not what happens to inventory.
- **It does not replace guides.** A reference answers "what does this endpoint accept?" It rarely answers "how do I build a checkout?" Good documentation combines both; see [API documentation best practices](/learn/openapi/api-documentation-best-practices).
- **It is not an implementation.** Generated server stubs are a starting point, not a working service.
- **It is not ideal for every protocol.** Use AsyncAPI for message-driven APIs, and the native schema languages for GraphQL and gRPC.
- **Multi-step workflows need something else.** The OpenAPI Initiative publishes a separate specification, Arazzo, for describing sequences of calls across APIs.

## Common mistakes

These are the problems we see most often in real API descriptions:

1. **Confusing `openapi` and `info.version`.** `openapi: 3.1.1` is the specification version. Your API's release number goes in `info.version`.
2. **Mixing version features.** Using `nullable: true` in a 3.1 document, or `type: [string, 'null']` in a 3.0 document. Each version has its own rules, and validators check against the declared one.
3. **Missing or empty descriptions.** A document that validates can still be useless to a reader. Every operation deserves a `summary`, and anything non-obvious deserves a `description`.
4. **No examples.** Tools can generate placeholder values from schemas, but a real example is far more helpful.
5. **Undeclared error responses.** If the API can return `401`, `404`, or `422`, describe them.
6. **Duplicated schemas.** Copy-pasting the same object into ten operations guarantees they drift. Put it in `components` and reference it.
7. **A document nobody checks.** Run a validator in CI. The Scalar CLI can do it with `npx @scalar/cli document validate openapi.yaml`.

## Tools that work with OpenAPI

The ecosystem is large; the [OpenAPI Initiative's own tooling list](https://tools.openapis.org/) is a reasonable starting point. At Scalar we build several of these tools around one document:

- [Scalar API reference](/products/api-references): an open-source, MIT-licensed renderer that turns an OpenAPI document into interactive documentation. It works with Swagger 2.0, OpenAPI 3.0, 3.1, and 3.2 documents, and mounts inside more than 35 frameworks, such as [Express](/products/api-references/integrations/express), FastAPI, and ASP.NET Core.
- Scalar API client: an open-source client that imports OpenAPI documents.
- [SDK generator](/products/sdk-generator): generates SDKs from the same document.
- Scalar Registry: stores, versions, and lints OpenAPI documents.

To see your own document rendered, the fastest path is a single HTML file:

```html
<!doctype html>
<html>
  <head>
    <title>API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module">
      import { createApiReference } from 'https://cdn.jsdelivr.net/npm/@scalar/api-reference/esm.js'

      createApiReference('#app', {
        url: '/openapi.yaml',
      })
    </script>
  </body>
</html>
```

## Frequently asked questions

<scalar-detail title="Is OpenAPI the same as Swagger?">
Not anymore. Swagger was the name of the specification up to version 2.0. After it was donated to the OpenAPI Initiative in 2015, the specification became OpenAPI, starting with 3.0. "Swagger" now refers to SmartBear's tools, such as Swagger UI, Swagger Editor, and Swagger Codegen. The details are in [OpenAPI vs Swagger](/learn/openapi/openapi-vs-swagger).
</scalar-detail>

<scalar-detail title="Is OpenAPI free to use?">
Yes. The specification is published under the Apache License 2.0 by the OpenAPI Initiative. You do not need permission or a license from anyone to write an OpenAPI document or build tools that read one.
</scalar-detail>

<scalar-detail title="Should I write OpenAPI in YAML or JSON?">
Either is valid, and they are interchangeable. YAML is easier to read and review by hand and allows comments. JSON is easier to generate and parse from code. Many teams author in YAML and publish both.
</scalar-detail>

<scalar-detail title="Which OpenAPI version should I use in 2026?">
OpenAPI 3.1 is the practical default for new APIs because tool support is broad. Use OpenAPI 3.2 if you need its new features (nested tags, the QUERY method, streaming media types) and your tools support it. Upgrade anything still on Swagger 2.0.
</scalar-detail>

<scalar-detail title="Is OpenAPI only for REST APIs?">
It is for HTTP APIs, which includes REST and most REST-like or RPC-over-HTTP designs. It is not a good fit for event-driven APIs, where AsyncAPI is the usual choice, or for GraphQL and gRPC, which have their own schema languages.
</scalar-detail>

<scalar-detail title="Do I have to write the OpenAPI document by hand?">
No. Most modern web frameworks can generate one from your routes and types. Writing it by hand (design-first) is also common, especially when several teams need to agree on the contract before implementation starts.
</scalar-detail>

## Related

- **Learn:** [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0) · [OpenAPI documentation](/learn/openapi/openapi-documentation) · [All OpenAPI guides](/learn/openapi)
- **Docs:** [Scalar and the OpenAPI Specification](/products/api-references/openapi)
- **Product:** [Scalar API reference](/products/api-references) — render any OpenAPI document as interactive documentation, free and open source.
