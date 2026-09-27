# OpenAPI documentation: how to document an API with OpenAPI

*Last updated: September 2026*

*By Marc Laventure · Reviewed by: pending*

OpenAPI documentation is API documentation generated from an OpenAPI document, and writing it well means filling that document with more than structure: clear summaries and descriptions, realistic examples, meaningful tags, documented errors and authentication, and Markdown where a longer explanation helps. The renderer takes care of layout. The words, examples, and organization are up to you, and they decide whether the result is a useful reference or a list of endpoints.

This is a practical guide to the documentation side of OpenAPI: which fields readers actually see, how to write them, and how to organize a large API. It applies whichever tool renders your docs. If you are looking for how Scalar turns an OpenAPI document into hosted documentation, see [OpenAPI documentation with Scalar](/solutions/openapi-documentation) instead.

**On this page**

- [Where documentation lives in an OpenAPI document](#where-documentation-lives-in-an-openapi-document)
- [Start with info.description](#start-with-infodescription)
- [Summaries and descriptions for operations](#summaries-and-descriptions-for-operations)
- [Describe parameters and schema properties](#describe-parameters-and-schema-properties)
- [Examples: the part readers copy](#examples-the-part-readers-copy)
- [Tags, tag groups, and nested tags](#tags-tag-groups-and-nested-tags)
- [Markdown in descriptions](#markdown-in-descriptions)
- [Document authentication and errors](#document-authentication-and-errors)
- [Code samples](#code-samples)
- [Deprecation and internal operations](#deprecation-and-internal-operations)
- [Keeping large documents manageable](#keeping-large-documents-manageable)
- [Publishing your OpenAPI documentation](#publishing-your-openapi-documentation)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## Where documentation lives in an OpenAPI document

An [OpenAPI document](/learn/openapi/what-is-openapi) mixes two kinds of fields: structural ones (types, paths, status codes) that tools use to validate and generate code, and descriptive ones that people read. The descriptive fields are spread across the document. According to the [OpenAPI Specification 3.2.1](https://spec.openapis.org/oas/v3.2.1.html#rich-text-formatting), fields marked as supporting CommonMark can contain Markdown, and tools that render rich text must support at least CommonMark 0.27.

| Field                         | Where it appears            | Markdown          | What to write                                        |
| ----------------------------- | --------------------------- | ----------------- | ---------------------------------------------------- |
| `info.title`                  | Page title, browser tab     | No                | The product name plus "API"                          |
| `info.summary` (3.1+)         | Short tagline in some tools | No                | One sentence on what the API does                    |
| `info.description`            | Introduction page           | Yes               | Overview, quickstart, auth, base URLs, limits        |
| `tags[].description`          | Top of each section         | Yes               | What the resource is and how it relates to others    |
| operation `summary`           | Sidebar entry, heading      | No                | A short verb phrase: "Create a customer"             |
| operation `description`       | Body of the operation       | Yes               | Behavior, side effects, permissions, gotchas         |
| parameter `description`       | Parameter table             | Yes               | Units, formats, defaults, where the value comes from |
| schema `description`          | Model and property docs     | Yes               | Meaning of the field, units, constraints in words    |
| response `description`        | Response panel              | Yes               | When this status is returned                         |
| `examples` (named)            | Example picker              | `description` yes | Realistic payloads for each case                     |
| security scheme `description` | Authentication section      | Yes               | How to obtain and send credentials                   |
| `externalDocs`                | "Learn more" link           | `description` yes | A link to the related guide                          |

Keep that table in mind as you read the rest: every section below is about one or more of these fields.

## Start with info.description

`info.description` is usually rendered as the first thing a reader sees, so treat it as your documentation home page. A good one covers, in this order:

1. What the API does, in one or two sentences.
2. How to get credentials, with a link.
3. A first request, ready to paste.
4. Base URLs and environments.
5. Conventions: pagination, rate limits, idempotency, error format.

````yaml
openapi: 3.1.1
info:
  title: Acme Payments API
  version: '2026-09-01'
  summary: Accept payments and manage payouts.
  description: |
    The Acme Payments API lets you accept card and bank payments,
    issue refunds, and schedule payouts.

    ## Getting started

    1. Create an API key in the [dashboard](https://dashboard.example.com/keys).
    2. Send it in the `Authorization` header as a bearer token.
    3. Make your first call:

    ```bash
    curl https://api.example.com/v2/balance \
      -H "Authorization: Bearer $ACME_API_KEY"
    ```

    ## Conventions

    - All amounts are integers in the smallest currency unit (cents).
    - List endpoints are paginated with `cursor` and `limit`.
    - Errors use [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) problem details.
paths: {}
````

Long conceptual material (a full integration tutorial, for example) is better as a separate guide linked from here. The description should orient, not overwhelm.

## Summaries and descriptions for operations

Every operation has two text fields, and they do different jobs.

**`summary`** is a short label. It becomes the sidebar entry and the heading, so it must be scannable. Start with a verb, use sentence case, and keep it under about 50 characters: "List invoices," "Retrieve an invoice," "Void an invoice." Do not repeat the path; readers can already see `GET /invoices`.

**`description`** is the explanation. Use it for what the summary cannot say:

- What the operation does beyond the obvious.
- Side effects: emails sent, webhooks fired, money moved.
- Required permissions or scopes.
- Idempotency and safe retries.
- Limits and edge cases.
- Links to related operations and guides.

```yaml
openapi: 3.1.1
info:
  title: Invoices API
  version: 1.0.0
paths:
  /invoices/{invoiceId}/void:
    post:
      summary: Void an invoice
      operationId: voidInvoice
      description: |
        Marks an open invoice as void so it can no longer be paid.
        This cannot be undone. To correct an invoice, void it and
        create a new one with `POST /invoices` instead.

        Voiding sends an `invoice.voided` webhook and emails the
        customer if `notify_customer` was set when the invoice was created.

        Requires the `invoices:write` scope.
      parameters:
        - name: invoiceId
          in: path
          required: true
          description: The ID of an invoice with status `open`.
          schema:
            type: string
      responses:
        '200':
          description: The voided invoice.
        '409':
          description: The invoice is already paid or void.
```

Also set a stable `operationId` on every operation. Readers rarely see it, but SDK generators use it for method names and many tools use it for links.

## Describe parameters and schema properties

Names are not self-explanatory to people outside your team. For each parameter and property, say what a type cannot:

- **Units:** cents, seconds, bytes.
- **Formats:** ISO 8601 dates, ISO 4217 currency codes, E.164 phone numbers. Use `format` too, where one exists.
- **Origin:** "The `id` of a customer, returned by Create a customer."
- **Defaults and limits:** and what happens at the limit.
- **Behavior when omitted or null.**

Put constraints in the schema as well as in words: `minimum`, `maximum`, `pattern`, `enum`, `maxLength`. Renderers display them, validators enforce them, and SDK generators turn them into types. For enums, explain what each value means; the `x-enum-descriptions` extension lets tools that support it (including Scalar) show a description next to each value.

Mark fields `readOnly` (only in responses, like `id` and `created_at`) and `writeOnly` (only in requests, like `password`), so the reference shows the right fields in the right place.

## Examples: the part readers copy

Examples are the most-read and most-copied part of any reference, and the part most often left empty. When a document has no examples, tools invent placeholders like `"string"` and `0`, which help nobody.

OpenAPI offers examples at several levels:

- **Schema `examples`** (OpenAPI 3.1+, an array) for individual properties and models. In 3.0 this was a single `example`; see [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0).
- **Media type `example`** for one complete request or response body.
- **Media type `examples`** for several named bodies, each with a `summary` and `description`. Tools show these in an example picker.
- **Parameter examples** for path, query, and header values.

Named examples are worth the effort for any operation that behaves differently depending on input:

```yaml
openapi: 3.1.1
info:
  title: Payments API
  version: 1.0.0
paths:
  /payments:
    post:
      summary: Create a payment
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [amount, currency, method]
              properties:
                amount:
                  type: integer
                  description: Amount in the smallest currency unit.
                  examples: [4200]
                currency:
                  type: string
                  description: ISO 4217 currency code.
                  examples: [EUR]
                method:
                  type: string
                  enum: [card, bank_transfer]
            examples:
              card:
                summary: Card payment
                value:
                  amount: 4200
                  currency: EUR
                  method: card
              bankTransfer:
                summary: Bank transfer
                description: Bank transfers settle in one to three business days.
                value:
                  amount: 125000
                  currency: EUR
                  method: bank_transfer
      responses:
        '201':
          description: The payment was created.
```

Three rules for good examples: use realistic values, keep them consistent across operations (the customer you create in one example is the one you retrieve in the next), and make sure they validate against the schema. A linter can check the last one for you; see [OpenAPI linting](/learn/openapi/spectral-rules).

## Tags, tag groups, and nested tags

Tags turn a flat list of operations into navigation. Each operation lists one or more tags, and the top-level `tags` array gives each tag a description and an order.

```yaml
tags:
  - name: Customers
    description: |
      Customers are the people and companies you bill.
      Create one before creating invoices or subscriptions.
  - name: Invoices
    description: Bills sent to a customer for payment.
```

Tips:

- **Name tags after product concepts**, not code modules.
- **Order the `tags` array deliberately.** The specification says tools may use that order for display, and many do.
- **Give every tag a description.** It becomes the introduction to that section.
- **Prefer one tag per operation** for navigation, so operations do not appear twice.

For large APIs, one level of tags is not enough. There are two ways to add hierarchy.

**`x-tagGroups` (any version).** A widely supported vendor extension that groups tags into sections:

```yaml
openapi: 3.1.1
info:
  title: Billing API
  version: 1.0.0
tags:
  - name: Customers
  - name: Invoices
  - name: Webhooks
x-tagGroups:
  - name: Billing
    tags: [Customers, Invoices]
  - name: Events
    tags: [Webhooks]
paths: {}
```

**Nested tags (OpenAPI 3.2).** The [3.2 Tag Object](https://spec.openapis.org/oas/v3.2.1.html#tag-object) adds `parent`, `summary`, and `kind`, so hierarchy no longer needs an extension:

```yaml
openapi: 3.2.0
info:
  title: Billing API
  version: 1.0.0
tags:
  - name: billing
    summary: Billing
  - name: customers
    summary: Customers
    parent: billing
  - name: invoices
    summary: Invoices
    parent: billing
paths: {}
```

Use `x-tagGroups` if you are on 3.0 or 3.1, and move to `parent` when you adopt 3.2. Scalar supports both, and the [Scalar OpenAPI extensions reference](/products/api-references/openapi) documents how it resolves them, along with `x-displayName` for giving a tag a friendlier label.

## Markdown in descriptions

Because most description fields accept CommonMark, you can use headings, lists, links, tables, inline code, and fenced code blocks. Some practical guidance:

- **Use headings in `info.description` and tag descriptions**, where there is room for structure. Avoid them in parameter descriptions.
- **Link generously** to guides and related operations. Relative links to other parts of your docs are fine where your renderer supports them.
- **Use fenced code blocks** with a language for anything the reader will paste.
- **Keep parameter and property descriptions short**: one or two sentences.
- **Do not rely on raw HTML.** Many renderers sanitize it, and the specification's [security considerations](https://spec.openapis.org/oas/v3.2.1.html#markdown-and-html-sanitization) recommend care here.

Renderers often support extras beyond CommonMark. Scalar, for example, renders GitHub-flavored Markdown and alert blocks such as `> [!tip]` in descriptions; the [Scalar Markdown reference](/products/api-references/markdown) lists what works where. If you use such extras, check how the document looks in other tools that consume it too.

## Document authentication and errors

Two areas deserve special attention because they are where new users get stuck.

**Authentication.** Define every scheme under `components.securitySchemes`, with a `description` that explains how to get credentials, and apply them with `security` globally or per operation. This lets renderers show an authentication section, add the right headers to code samples, and build "try it" forms. [OpenAPI security schemes](/learn/openapi/openapi-security-schemes) covers each type with examples.

**Errors.** Document the error responses each operation can return, not just `200`. Define a shared error schema and shared responses in `components` and reference them, so every operation documents errors consistently with little repetition. The response `description` should say when the status happens: "The invoice is already paid or void" is far more useful than "Conflict." [API documentation best practices](/learn/openapi/api-documentation-best-practices#6-document-every-error) includes a complete example.

## Code samples

Most renderers generate request samples from the document in many languages. If you ship SDKs, show those instead of, or alongside, raw HTTP, because that is the code your users will write. The `x-codeSamples` extension adds custom samples per operation:

```yaml
openapi: 3.1.1
info:
  title: Payments API
  version: 1.0.0
paths:
  /payments:
    post:
      summary: Create a payment
      x-codeSamples:
        - lang: TypeScript
          label: Acme SDK
          source: |
            import Acme from '@acme/sdk'

            const acme = new Acme()
            const payment = await acme.payments.create({
              amount: 4200,
              currency: 'EUR',
              method: 'card',
            })
      responses:
        '201':
          description: The payment was created.
```

If you generate SDKs from the same document, the generator can write these samples for you. See [how to generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi).

## Deprecation and internal operations

**Deprecation.** Set `deprecated: true` on operations, parameters, or schema properties that are going away, and use the description to say what replaces them and when the old one will be removed. Renderers usually show a badge and strike through the name.

**Internal operations.** Some operations exist in the document but should not be public. You can keep a separate public document, or use an extension your renderer understands. In Scalar, `x-scalar-ignore: true` (alias `x-internal`) hides an operation or webhook from the reference. Overlays are another option for producing a public variant from a full document.

## Keeping large documents manageable

A document with hundreds of operations is hard to review in one file. Split it:

- Put schemas, parameters, and responses in separate files and `$ref` them.
- Bundle them into a single file for publishing. Bundling pulls external `$ref` targets into `components`, which every tool can read.
- Validate and lint the bundled output in CI.

The [Scalar CLI](/tools/cli/getting-started) has `document bundle`, `document validate`, and `document lint` commands for exactly this workflow.

## Publishing your OpenAPI documentation

Once the document reads well, render and publish it. You have three broad options:

1. **Mount a renderer in your application**, served at a route such as `/docs`, next to the API.
2. **Generate a static site** in CI and host it anywhere.
3. **Use a hosted documentation platform** that adds guides, custom domains, versions, and search around the reference.

Whichever you choose, publish from the same document on every merge so the documentation never lags the API. If you are comparing tools, [what an API reference is](/learn/openapi/what-is-an-api-reference) covers what to look for, and [Swagger UI alternatives](/alternatives/swagger-ui) compares common renderers.

For Scalar specifically, [OpenAPI documentation with Scalar](/solutions/openapi-documentation) explains what happens to your document, which versions are supported, and how the docs stay in sync. To try it on your own document in a minute, the [API reference quickstart](/products/api-references/getting-started) needs only a URL to your file.

## Common mistakes

1. **Summaries that repeat the method and path.** "GET /users/{id}" tells readers nothing they cannot already see.
2. **Empty `description` fields.** A valid document can still be unreadable.
3. **No examples, so tools fill in `"string"`.** Write real ones.
4. **Only `200` responses.** Document errors with the same care.
5. **A single "default" tag.** Hundreds of operations with no grouping.
6. **Tags without descriptions.** Sections with no introduction.
7. **Examples that fail validation.** Readers copy them and hit errors immediately.
8. **Long tutorials inside operation descriptions.** Link to a guide instead.
9. **Mixing version features.** `nullable` in 3.1, or `parent` on tags in a 3.1 document. Keep to the version you declare.

## Frequently asked questions

<scalar-detail title="What is OpenAPI documentation?">
It is API documentation generated from an OpenAPI document. A renderer reads the document and produces an interactive reference with every endpoint, parameter, schema, example, and authentication method. The quality of that documentation depends on the descriptions and examples in the document.
</scalar-detail>

<scalar-detail title="Can I use Markdown in OpenAPI descriptions?">
Yes. Fields marked as supporting CommonMark in the specification, including `info.description`, operation, parameter, schema, response, and tag descriptions, accept Markdown. Many renderers support GitHub-flavored Markdown extensions too. `summary` fields are plain text.
</scalar-detail>

<scalar-detail title="What is the difference between summary and description in OpenAPI?">
`summary` is a short, plain-text label used in navigation and headings. `description` is a longer explanation that can use Markdown. Every operation should have a summary; add a description whenever there is anything non-obvious to say.
</scalar-detail>

<scalar-detail title="How do I group endpoints in OpenAPI documentation?">
Use tags. Add each operation to a tag and describe the tags in the top-level `tags` array. For a second level of grouping, use `x-tagGroups` in OpenAPI 3.0 and 3.1, or the `parent` field on tags in OpenAPI 3.2.
</scalar-detail>

<scalar-detail title="What is x-tagGroups?">
`x-tagGroups` is a vendor extension that groups tags into higher-level sections in the navigation. It is not part of the OpenAPI Specification, but many renderers support it. OpenAPI 3.2 adds native nested tags with the `parent` field, which covers the same need.
</scalar-detail>

<scalar-detail title="How do I add examples to an OpenAPI document?">
Add `examples` (an array) to schemas and properties in OpenAPI 3.1, and `example` or named `examples` to request and response media types. Named examples each have a `summary`, optional `description`, and a `value`, and renderers show them in a picker.
</scalar-detail>

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [API documentation best practices](/learn/openapi/api-documentation-best-practices) · [What is an API reference?](/learn/openapi/what-is-an-api-reference)
- **Docs:** [Scalar OpenAPI extensions reference](/products/api-references/openapi)
- **Product:** [OpenAPI documentation with Scalar](/solutions/openapi-documentation) — turn your OpenAPI document into an interactive reference, API client, SDKs, and MCP server.
