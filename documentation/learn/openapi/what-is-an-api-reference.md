# What is an API reference?

*Last updated: September 2026*

An API reference is the part of an API's documentation that describes every endpoint exactly: its URL and HTTP method, the parameters and request body it accepts, the responses and errors it returns, and how to authenticate. It is the page a developer keeps open while writing code, the way you would keep a dictionary open while writing in a foreign language. Today most API references are generated from an OpenAPI document rather than written by hand.

A good API reference is complete, precise, and boring in the best sense: every operation looks the same, every field is described, and nothing is left for the reader to guess. This guide explains what goes into one, how it differs from other kinds of documentation, how references are generated, and what separates a useful one from a frustrating one.

**On this page**

- [The short answer](#the-short-answer)
- [Anatomy of an API reference](#anatomy-of-an-api-reference)
- [API reference vs guides, tutorials, and explanations](#api-reference-vs-guides-tutorials-and-explanations)
- [How API references are made](#how-api-references-are-made)
- [From OpenAPI document to reference page](#from-openapi-document-to-reference-page)
- [Static vs interactive references](#static-vs-interactive-references)
- [What makes a good API reference](#what-makes-a-good-api-reference)
- [API references for AI agents](#api-references-for-ai-agents)
- [Common mistakes](#common-mistakes)
- [Tools for building an API reference](#tools-for-building-an-api-reference)
- [Frequently asked questions](#frequently-asked-questions)

## The short answer

An API reference answers one kind of question: **"What exactly does this endpoint do, and what do I send and get back?"** It does not teach, persuade, or tell a story. It is information-oriented, organized around the structure of the API itself (resources, operations, schemas), and meant to be looked up rather than read front to back.

Some other names you will see for the same thing: API reference documentation, reference docs, endpoint documentation, or an API explorer when it lets you send requests.

## Anatomy of an API reference

Almost every API reference, whatever tool produced it, contains the same building blocks. Here is what each one is and where it comes from in an [OpenAPI document](/learn/openapi/what-is-openapi).

| Element           | What the reader learns                                             | Source in OpenAPI                                 |
| ----------------- | ------------------------------------------------------------------ | ------------------------------------------------- |
| Introduction      | What the API is for, base URL, versioning, rate limits             | `info.description`, `servers`                     |
| Authentication    | How to get and send credentials                                    | `components.securitySchemes`, `security`          |
| Navigation groups | How endpoints are organized                                        | `tags`, nested tags (3.2) or `x-tagGroups`        |
| Operation         | Method, path, one-line summary, longer description                 | `paths.{path}.{method}`, `summary`, `description` |
| Parameters        | Path, query, header, and cookie inputs, with types and constraints | `parameters`                                      |
| Request body      | The payload shape, required fields, allowed values                 | `requestBody`, `components.schemas`               |
| Responses         | Status codes, response bodies, headers                             | `responses`                                       |
| Errors            | What can go wrong and what the error body looks like               | `4xx` / `5xx` responses                           |
| Examples          | Realistic request and response payloads                            | `example`, `examples`                             |
| Code samples      | The call in curl, JavaScript, Python, and so on                    | Generated, or `x-codeSamples`                     |
| Models            | Every schema, browsable on its own                                 | `components.schemas`                              |
| Try it            | Send a real request from the page                                  | Generated from all of the above                   |
| Webhooks          | Events the API sends to you                                        | `webhooks` (OpenAPI 3.1+)                         |

If you are writing the document, [OpenAPI documentation](/learn/openapi/openapi-documentation) explains how to fill each of these fields so the reference comes out well.

## API reference vs guides, tutorials, and explanations

Good documentation serves different needs with different types of content. The [Diátaxis framework](https://diataxis.fr/) names four: tutorials (learning by doing), how-to guides (solving a specific problem), reference (describing the machinery), and explanation (building understanding). An API reference sits squarely in the reference quadrant.

|                     | API reference                      | Guide or tutorial                 |
| ------------------- | ---------------------------------- | --------------------------------- |
| Question it answers | "What does `POST /orders` accept?" | "How do I take my first payment?" |
| Organized by        | The API's structure                | The reader's goal                 |
| Coverage            | Every endpoint, every field        | The few endpoints a task needs    |
| Tone                | Neutral, precise, consistent       | Friendly, step by step            |
| Source              | Usually generated from OpenAPI     | Written by hand, often Markdown   |
| Changes when        | The API changes                    | The recommended workflow changes  |

A reference without guides leaves newcomers stuck at "where do I start?" Guides without a reference leave experienced developers guessing about edge cases. You need both, and they should link to each other: a guide says "create an order," the reference says exactly what that request looks like. For how to combine them, see [API documentation best practices](/learn/openapi/api-documentation-best-practices).

## How API references are made

There are three broad approaches.

**1. Written by hand.** Markdown or a wiki page per endpoint. It is flexible and needs no tooling, but it drifts from the real API almost immediately and is tedious to keep consistent. It is rarely the right choice for more than a handful of endpoints.

**2. Generated from code annotations.** Many frameworks generate an OpenAPI document from routes, types, and comments: FastAPI, NestJS, ASP.NET Core, Hono, Laravel packages, and more. The reference is then rendered from that document. This keeps the reference close to the implementation.

**3. Generated from a hand-written OpenAPI document (design-first).** The team writes and reviews the OpenAPI document before or alongside the code. The document drives the reference, mock servers, and SDKs, and the implementation is tested against it.

Approaches 2 and 3 both end in the same place: an OpenAPI document that a renderer turns into a reference. That shared format is why you can switch rendering tools without rewriting your docs.

## From OpenAPI document to reference page

Take this operation from an OpenAPI 3.1 document:

```yaml
openapi: 3.1.1
info:
  title: Orders API
  version: 2.0.0
servers:
  - url: https://api.example.com
security:
  - apiKey: []
tags:
  - name: Orders
    description: Create and track orders.
paths:
  /orders/{orderId}:
    get:
      tags: [Orders]
      summary: Retrieve an order
      description: |
        Returns a single order by its ID. Orders older than
        two years are archived and return `404`.
      operationId: getOrder
      parameters:
        - name: orderId
          in: path
          required: true
          description: The order ID, prefixed with `ord_`.
          schema:
            type: string
            pattern: '^ord_[a-zA-Z0-9]+$'
          example: ord_8f2k1
      responses:
        '200':
          description: The order.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
              example:
                id: ord_8f2k1
                status: shipped
                total: 4200
                currency: EUR
        '404':
          description: No order with this ID exists, or it has been archived.
components:
  securitySchemes:
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
  schemas:
    Order:
      type: object
      required: [id, status, total, currency]
      properties:
        id:
          type: string
        status:
          type: string
          enum: [pending, paid, shipped, cancelled]
        total:
          type: integer
          description: Amount in the smallest currency unit, for example cents.
        currency:
          type: string
          description: ISO 4217 currency code.
```

A renderer turns that into a page with a sidebar entry "Retrieve an order" under "Orders," a `GET /orders/{orderId}` heading, a parameter table showing the pattern, a response panel with the example, a documented `404`, an `Order` model with an enum of statuses, generated curl and JavaScript snippets that include the `X-API-Key` header, and, in interactive tools, a button to send the request.

Notice how much of the reader's experience depends on the words in `summary` and `description`. The structure is automatic; the clarity is not.

## Static vs interactive references

Early generated references were static HTML. Most modern ones are interactive:

- **Try it / test request.** Fill in parameters and send a real call from the browser, with your credentials. This is the fastest way for a developer to answer "does this do what I think?"
- **Generated code samples.** The same request in many languages and HTTP clients, updated as you change parameters.
- **Search.** Jump to any operation or model by name.
- **Environment and server switching.** Toggle between sandbox and production base URLs.
- **Example switching.** Pick between named examples of a request or response.

Interactivity has a cost: browsers enforce CORS, so "try it" calls to an API that does not send CORS headers need a proxy. Good tools handle this for you or document how.

Many teams also pair the reference with a full [API client](/learn/openapi/what-is-an-api-client), for saved requests, environments, and scripting beyond what a docs page can do.

## What makes a good API reference

Structure comes for free once you use OpenAPI. Quality does not. The best references share these traits:

1. **Complete.** Every public endpoint, every parameter, every response status your API actually returns, including errors.
2. **Accurate.** Generated from, or tested against, the real API, and redeployed when it changes.
3. **Described in human terms.** "Amount in cents" beats "integer." Units, formats, defaults, limits, and side effects belong in descriptions.
4. **Full of real examples.** A realistic example is worth more than a perfect schema.
5. **Consistent.** Same naming, same casing, same error format everywhere. A linter enforces this; see [OpenAPI linting](/learn/openapi/spectral-rules).
6. **Navigable.** Tags that match how users think about the product, not how the codebase is organized.
7. **Linked to guides.** Operations link to the how-to guides that use them, and guides link back.
8. **Fast and searchable.** Large APIs with hundreds of operations need search and a responsive page.

Publishing your OpenAPI document alongside the reference is increasingly common, too, so developers can import it into their own tools. [GitHub](https://github.com/github/rest-api-description) and [Stripe](https://github.com/stripe/openapi) both publish theirs openly on GitHub.

## API references for AI agents

API references now have a second audience: coding assistants and AI agents. They read the same information, but in different shapes:

- **The OpenAPI document itself**, which is already machine-readable.
- **Plain-text or Markdown versions of the docs**, often advertised through an `llms.txt` file. See [llms.txt for API docs](/learn/openapi/llms-txt-for-api-docs).
- **MCP servers** that expose operations as tools an agent can call. See [what is MCP?](/learn/mcp/what-is-mcp).

The good news: everything that makes a reference clear to humans (descriptive summaries, units, examples, documented errors) makes it clearer to agents too.

## Common mistakes

- **Summaries that repeat the path.** "GET /users" as a summary tells the reader nothing new. "List users in an organization" does.
- **Undocumented errors.** If the reference only shows `200`, readers discover the rest in production.
- **Schemas without descriptions.** Field names are rarely self-explanatory to someone outside your team.
- **Placeholder examples.** `"string"` and `0` are what tools generate when you give them nothing. Replace them.
- **A reference that lags the API.** Hand-edited references, or ones rebuilt only at release time, drift. Automate the publish step.
- **One giant tag.** Two hundred operations under "default" is not navigation.
- **Hiding authentication.** The first thing a new developer needs is how to get a key. Put it at the top.

## Tools for building an API reference

Most API reference tools read OpenAPI and differ in design, interactivity, hosting, and price. For a broader survey, see [the best API documentation tools in 2026](/library/best-api-documentation-tools-2026), and if you are replacing an older renderer, [Swagger UI alternatives](/alternatives/swagger-ui).

The [Scalar API reference](/products/api-references) is our open-source (MIT) renderer. It reads Swagger 2.0 and OpenAPI 3.0, 3.1, and 3.2 documents, includes a built-in API client for test requests, and runs as a hosted site, a single HTML file, or middleware inside more than 35 frameworks. In an Express app, for example:

```typescript
import { apiReference } from '@scalar/express-api-reference'

app.use(
  '/reference',
  apiReference({
    url: '/openapi.json',
  }),
)
```

The [Express integration guide](/products/api-references/integrations/express) covers the full setup, and there are equivalent guides for [FastAPI](/products/api-references/integrations/fastapi), [ASP.NET Core](/products/api-references/integrations/aspnetcore/integration), and others. If you want guides and the reference on one hosted site, [Scalar Docs](/products/docs) combines them.

## Frequently asked questions

<scalar-detail title="What is the difference between API documentation and an API reference?">
API documentation is the whole set of material about an API: guides, tutorials, concepts, changelogs, and the reference. The API reference is the part that describes each endpoint precisely. It is usually the largest part of API documentation, but not all of it.
</scalar-detail>

<scalar-detail title="What should an API reference include?">
At minimum: authentication, base URLs, every endpoint with its method and path, parameters, request bodies, responses including errors, and data models. Realistic examples and code samples make it far more useful.
</scalar-detail>

<scalar-detail title="Can I generate an API reference automatically?">
Yes. If you have an OpenAPI document, a renderer turns it into a reference in minutes. Many frameworks can also generate the OpenAPI document from your code, so the whole pipeline can be automated.
</scalar-detail>

<scalar-detail title="Is Swagger UI an API reference?">
Swagger UI is a tool that renders an API reference from an OpenAPI document. The reference is the output; Swagger UI, Scalar, and similar tools are renderers.
</scalar-detail>

<scalar-detail title="How do I keep an API reference up to date?">
Generate it from an OpenAPI document that is itself generated from code or validated against it, and publish on every merge to your main branch. Manual publishing is where drift starts.
</scalar-detail>

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [OpenAPI documentation](/learn/openapi/openapi-documentation) · [API documentation best practices](/learn/openapi/api-documentation-best-practices)
- **Docs:** [API reference quickstart](/products/api-references/getting-started)
- **Product:** [Scalar API reference](/products/api-references) — an open-source, interactive API reference generated from your OpenAPI document.
