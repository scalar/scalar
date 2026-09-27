# OpenAPI 3.1 vs 3.0: what changed and how to migrate

*Last updated: September 2026*

The main difference between OpenAPI 3.1 and 3.0 is that 3.1 makes the Schema Object a full superset of JSON Schema Draft 2020-12, while 3.0 used its own extended subset of an older JSON Schema draft. Almost every practical change follows from that: `nullable` is gone in favor of type arrays, `exclusiveMinimum` becomes a number, schema examples move to an `examples` array, and file uploads are described with `contentMediaType` instead of `format: binary`. On top of the schema changes, 3.1 adds top-level `webhooks`, makes `paths` optional, adds an SPDX `identifier` to the license, and allows `summary` and `description` next to a `$ref`.

This guide goes through each change with before-and-after examples taken from the specifications themselves, then covers what OpenAPI 3.2 adds, and ends with a migration checklist.

**On this page**

- [The short version](#the-short-version)
- [Why 3.1 is a bigger change than the number suggests](#why-31-is-a-bigger-change-than-the-number-suggests)
- [Schemas: full JSON Schema 2020-12](#schemas-full-json-schema-2020-12)
- [nullable becomes a type array](#nullable-becomes-a-type-array)
- [Examples](#examples)
- [Webhooks](#webhooks)
- [Document structure: paths, license, info, and $ref](#document-structure-paths-license-info-and-ref)
- [File uploads and binary data](#file-uploads-and-binary-data)
- [A full before-and-after document](#a-full-before-and-after-document)
- [What about OpenAPI 3.2?](#what-about-openapi-32)
- [Migration checklist](#migration-checklist)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## The short version

All references below point to [OpenAPI 3.0.4](https://spec.openapis.org/oas/v3.0.4.html) and [OpenAPI 3.1.2](https://spec.openapis.org/oas/v3.1.2.html), the latest patch releases of each line.

| Area                                    | OpenAPI 3.0                                      | OpenAPI 3.1                                                                               |
| --------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Schema language                         | Extended subset of JSON Schema (Wright draft 00) | Superset of JSON Schema Draft 2020-12                                                     |
| Null values                             | `nullable: true`                                 | `type: [string, 'null']`                                                                  |
| Multiple types                          | Not supported (`type` must be a string)          | `type` can be an array                                                                    |
| `exclusiveMinimum` / `exclusiveMaximum` | Boolean modifier on `minimum` / `maximum`        | A number in its own right                                                                 |
| Schema examples                         | `example` (single value)                         | `examples` (array); `example` deprecated                                                  |
| Webhooks                                | Not supported (vendor `x-webhooks` at best)      | Top-level `webhooks` map                                                                  |
| Required top-level fields               | `openapi`, `info`, `paths`                       | `openapi`, `info`, plus one of `paths`, `components`, `webhooks`                          |
| `responses` on an operation             | Required                                         | Optional                                                                                  |
| License                                 | `name` + `url`                                   | `name` + `url` **or** SPDX `identifier`                                                   |
| `info.summary`                          | Not available                                    | Available                                                                                 |
| `$ref` siblings                         | Ignored                                          | Reference Objects may override `summary` and `description`; schemas may have any siblings |
| Reusable path items                     | Not available                                    | `components.pathItems`                                                                    |
| Mutual TLS                              | Not available                                    | `type: mutualTLS` security scheme                                                         |
| Binary file bodies                      | `type: string`, `format: binary`                 | `contentMediaType` (or no schema at all)                                                  |
| Schema dialect                          | Fixed                                            | `jsonSchemaDialect` and `$schema` let you choose                                          |

## Why 3.1 is a bigger change than the number suggests

If you expect a minor version to be backward compatible, 3.1 is a surprise: a valid 3.0 document is not automatically a valid 3.1 document. The specification says so openly. The [versioning section of 3.1.2](https://spec.openapis.org/oas/v3.1.2.html#versions) notes that "non-backwards compatible changes may be made in `minor` versions of the OAS where impact is believed to be low relative to the benefit provided."

The benefit here was ending years of friction. In 3.0, the [Schema Object](https://spec.openapis.org/oas/v3.0.4.html#schema-object) was "an extended subset" of an old JSON Schema draft: some JSON Schema keywords were missing, some behaved differently, and OpenAPI added its own (`nullable`). You could not take a schema from a JSON Schema tool and drop it into an OpenAPI 3.0 document with confidence. In 3.1, you can. For the longer story of how the two standards relate, see [JSON Schema vs OpenAPI](/learn/openapi/json-schema-vs-openapi).

## Schemas: full JSON Schema 2020-12

The [3.1.2 Schema Object](https://spec.openapis.org/oas/v3.1.2.html#schema-object) is "a superset of the JSON Schema Specification Draft 2020-12." In practice that unlocks keywords 3.0 did not allow:

- `type` as an array: `type: [string, integer]`
- `const` for a single fixed value
- `prefixItems` for tuples
- `if` / `then` / `else` for conditional validation
- `dependentRequired` and `dependentSchemas`
- `unevaluatedProperties` and `unevaluatedItems`
- `$defs`, `$id`, `$anchor`, and `$dynamicRef`
- `contentMediaType`, `contentEncoding`, and `contentSchema`
- `examples` as an array

It also changes `exclusiveMinimum` and `exclusiveMaximum`. In 3.0 they were booleans that modified `minimum` and `maximum`:

```yaml
# OpenAPI 3.0: the value must be greater than 0
type: number
minimum: 0
exclusiveMinimum: true
```

In 3.1 they hold the bound directly:

```yaml
# OpenAPI 3.1: the value must be greater than 0
type: number
exclusiveMinimum: 0
```

Two more consequences worth knowing:

- **`$ref` with siblings works in schemas.** In 3.0, anything next to a `$ref` was ignored. In 3.1 a schema like `{ $ref: '#/components/schemas/Address', description: 'Billing address' }` is evaluated as JSON Schema 2020-12 evaluates it: both apply.
- **You can choose the dialect.** The new top-level `jsonSchemaDialect` field, and `$schema` inside a schema, let you declare which JSON Schema dialect applies. Most documents never touch this, and the default OpenAPI dialect is what tools expect.

## nullable becomes a type array

This is the change that touches the most documents. OpenAPI 3.0 had a [`nullable`](https://spec.openapis.org/oas/v3.0.4.html#schema-object) keyword, because `type` could only be a single string and `null` was not an allowed type. OpenAPI 3.1 drops `nullable` and uses JSON Schema's own mechanism.

```yaml
# OpenAPI 3.0
nickname:
  type: string
  nullable: true
```

```yaml
# OpenAPI 3.1
nickname:
  type: [string, 'null']
```

Quote `'null'` in YAML. An unquoted `null` is the YAML null value, not the string `"null"` that JSON Schema expects, and validators will reject it.

For a nullable reference, 3.0 authors often wrote `nullable: true` next to a `$ref`, which 3.0 technically ignored. In 3.1, use a union:

```yaml
# OpenAPI 3.1: an Address object or null
billingAddress:
  anyOf:
    - $ref: '#/components/schemas/Address'
    - type: 'null'
```

`oneOf` works too, as long as the referenced schema does not itself allow `null`.

## Examples

OpenAPI has two example mechanisms, and 3.1 changed one of them.

**Schema examples.** In 3.0 a Schema Object had a single `example`. In 3.1 the JSON Schema `examples` keyword (an array) is the preferred form, and the [3.1.2 specification](https://spec.openapis.org/oas/v3.1.2.html#schema-object) marks `example` as deprecated: "Use of `example` is discouraged, and later versions of this specification may remove it."

```yaml
# OpenAPI 3.0
status:
  type: string
  example: active
```

```yaml
# OpenAPI 3.1
status:
  type: string
  examples: [active, suspended]
```

**Media type, parameter, and header examples** did not change in the same way. They still offer `example` (a single value) or `examples` (a map of named [Example Objects](https://spec.openapis.org/oas/v3.1.2.html#example-object) with `summary`, `description`, and `value`). The naming collision trips people up: inside a schema, `examples` is an array; next to a schema in a media type, `examples` is a map. Named media type examples are what most API references show in their example picker, so they are worth writing well. [OpenAPI documentation](/learn/openapi/openapi-documentation) covers how.

## Webhooks

OpenAPI 3.0 could describe callbacks: requests your API sends back to a URL the consumer supplied in an earlier call. It could not describe webhooks registered out of band, for example in a dashboard. OpenAPI 3.1 adds a top-level [`webhooks`](https://spec.openapis.org/oas/v3.1.2.html#oas-webhooks) map for exactly that.

```yaml
webhooks:
  orderShipped:
    post:
      summary: An order was shipped
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Order'
      responses:
        '200':
          description: Return 200 to acknowledge the event.
```

Each key is a name for the event, and the value is a Path Item Object describing the request your API will send. If you used a vendor extension such as `x-webhooks` in 3.0, move it to `webhooks`.

## Document structure: paths, license, info, and $ref

Several smaller changes make documents more flexible:

- **`paths` is optional.** The [3.1.2 OpenAPI Object](https://spec.openapis.org/oas/v3.1.2.html#openapi-object) requires `openapi` and `info`, plus at least one of `paths`, `components`, or `webhooks`. That makes webhook-only APIs and shared schema libraries (a document with only `components`) valid.
- **`responses` is optional on an operation.** In 3.0 it was required. Leaving it out is allowed, but documenting at least your success response is still good practice.
- **License `identifier`.** The [License Object](https://spec.openapis.org/oas/v3.1.2.html#license-object) accepts an [SPDX](https://spdx.org/licenses/) expression such as `Apache-2.0`. It is mutually exclusive with `url`.
- **`info.summary`.** A short one-line summary of the API, separate from the longer `description`.
- **Reference Object overrides.** A `$ref` outside a schema may carry `summary` and `description`, which override those of the referenced component. Handy when a shared parameter needs slightly different wording in one place.
- **`components.pathItems`.** Reusable Path Item Objects, which pair nicely with `webhooks`.
- **`mutualTLS` security scheme.** A new security scheme type for client certificate authentication. More on each type in [OpenAPI security schemes](/learn/openapi/openapi-security-schemes).

## File uploads and binary data

In 3.0, a raw file body was described as a string with `format: binary`, and a base64-encoded one with `format: byte`. Since JSON Schema 2020-12 has proper keywords for this, 3.1 uses them. The [3.1.2 specification](https://spec.openapis.org/oas/v3.1.2.html#working-with-binary-data) includes a migration table; the common cases are:

| Use case                              | OpenAPI 3.0                      | OpenAPI 3.1                                                |
| ------------------------------------- | -------------------------------- | ---------------------------------------------------------- |
| Raw binary request body (`image/png`) | `type: string`, `format: binary` | No schema needed, or `contentMediaType: image/png`         |
| Base64-encoded string                 | `type: string`, `format: byte`   | `type: string`, `contentEncoding: base64`                  |
| File inside `multipart/form-data`     | property with `format: binary`   | property with `contentMediaType: application/octet-stream` |

```yaml
# OpenAPI 3.1: uploading a PNG
requestBody:
  content:
    image/png: {}
```

## A full before-and-after document

Here is a small but complete OpenAPI 3.0 document that uses the features that change the most:

```yaml
openapi: 3.0.4
info:
  title: Accounts API
  version: 1.0.0
  license:
    name: Apache 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0.html
paths:
  /accounts/{id}:
    get:
      summary: Get an account
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: The account.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Account'
components:
  schemas:
    Account:
      type: object
      required: [id, balance]
      properties:
        id:
          type: string
          example: acc_123
        nickname:
          type: string
          nullable: true
        balance:
          type: number
          minimum: 0
          exclusiveMinimum: true
```

And the same API in OpenAPI 3.1, with a webhook added to show the new capability:

```yaml
openapi: 3.1.1
info:
  title: Accounts API
  summary: Read accounts and receive balance events.
  version: 1.0.0
  license:
    name: Apache 2.0
    identifier: Apache-2.0
paths:
  /accounts/{id}:
    get:
      summary: Get an account
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: The account.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Account'
webhooks:
  balanceChanged:
    post:
      summary: An account balance changed
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Account'
      responses:
        '200':
          description: Return 200 to acknowledge the event.
components:
  schemas:
    Account:
      type: object
      required: [id, balance]
      properties:
        id:
          type: string
          examples: [acc_123]
        nickname:
          type: [string, 'null']
        balance:
          type: number
          exclusiveMinimum: 0
```

Both documents are valid against their declared version. Swap the `openapi` values and neither one would be.

## What about OpenAPI 3.2?

[OpenAPI 3.2.0](https://spec.openapis.org/oas/v3.2.0.html) was released on September 19, 2025, and the patch release [3.2.1](https://spec.openapis.org/oas/v3.2.1.html) followed on September 10, 2026. The Schema Object stays on JSON Schema 2020-12, so 3.1 to 3.2 is a much smaller jump than 3.0 to 3.1. It is mostly additions. Checked against the 3.2.1 text, the notable ones are:

- **Nested tags.** The [Tag Object](https://spec.openapis.org/oas/v3.2.1.html#tag-object) gains `parent` (the name of the tag it sits under), `summary` (a display title), and `kind` (such as `nav` or `badge`). This standardizes what many tools did with the `x-tagGroups` extension.
- **New HTTP methods.** Path items get a `query` field for the QUERY method and an [`additionalOperations`](https://spec.openapis.org/oas/v3.2.1.html#path-item-object) map for any other method, such as `LINK` or `PURGE`.
- **Whole query string parameters.** A new [`in: querystring`](https://spec.openapis.org/oas/v3.2.1.html#parameter-locations) location treats the entire query string as one value described with `content`.
- **Streaming.** The Media Type Object adds [`itemSchema`](https://spec.openapis.org/oas/v3.2.1.html#media-type-object) to describe each item of a sequential media type such as `application/jsonl` or `text/event-stream`, plus `prefixEncoding` and `itemEncoding` for multipart.
- **Clearer examples.** The Example Object adds `dataValue` and `serializedValue`, which separate the data from its wire format.
- **Security updates.** OAuth gains a `deviceAuthorization` flow and an `oauth2MetadataUrl` for [RFC 8414](https://datatracker.ietf.org/doc/html/rfc8414) metadata, and any security scheme can be marked `deprecated`.
- **Smaller additions.** `$self` for a document's own URI, a `name` on Server Objects, a `summary` on Response Objects, `defaultMapping` on the Discriminator Object, and a `nodeType` field for XML modeling.

A small 3.2 document using nested tags:

```yaml
openapi: 3.2.0
info:
  title: Store API
  version: 1.0.0
tags:
  - name: store
    summary: Store
  - name: orders
    summary: Orders
    parent: store
paths:
  /orders:
    get:
      tags: [orders]
      summary: List orders
      responses:
        '200':
          description: A list of orders.
```

Should you move to 3.2 now? Only when your whole pipeline supports it. Scalar's API reference [renders 3.2 features](/products/api-references/openapi) such as nested tags and `querystring` parameters, and the [Scalar OpenAPI upgrader](/tools/openapi-upgrader/getting-started) has experimental 3.1 to 3.2 support. Check your SDK generator, linter, gateway, and validator before changing the `openapi` field.

## Migration checklist

Work through this list to move a 3.0 document to 3.1. The [Scalar OpenAPI upgrader](/tools/openapi-upgrader/getting-started) automates the mechanical steps (it rewrites `nullable`, `exclusiveMinimum`/`exclusiveMaximum`, schema `example`, `format: binary`/`byte`, and a root-level `x-webhooks`), either as an npm package or from the CLI:

```bash
npx @scalar/cli document upgrade openapi.yaml --output openapi-3.1.yaml
```

You can also paste a document into the [OpenAPI converter](/tools/openapi-converter) in your browser. Then review by hand:

1. **Change `openapi: 3.0.x` to `openapi: 3.1.1`** (or 3.1.2; tools should treat all 3.1 patches the same).
2. **Replace every `nullable: true`** with a type array, or with `anyOf` plus `type: 'null'` when it sits next to a `$ref`.
3. **Convert boolean `exclusiveMinimum` and `exclusiveMaximum`** to numeric values and remove the paired `minimum` or `maximum`.
4. **Move schema `example` to `examples`** (an array). Leave media type `example`/`examples` alone.
5. **Rewrite `format: binary` and `format: byte`** using `contentMediaType` and `contentEncoding`.
6. **Move `x-webhooks` to `webhooks`**, if you used it.
7. **Consider `license.identifier`** instead of `url`, and add an `info.summary`.
8. **Review `$ref` siblings.** Anything you put next to a `$ref` in a schema will now be evaluated. Remove leftovers that were silently ignored in 3.0.
9. **Validate against 3.1.** Run `npx @scalar/cli document validate openapi-3.1.yaml` (see the [CLI command reference](/tools/cli/commands)), or use the [OpenAPI validator](/tools/openapi-validator). Then lint; see [OpenAPI linting](/learn/openapi/spectral-rules).
10. **Test your consumers.** [Regenerate SDKs](/learn/sdk/generate-sdk-from-openapi), reload your API reference, and re-run contract tests. The document format is only half of the migration; the tools that read it are the other half.

## Common mistakes

- **Unquoted `null` in YAML type arrays.** `type: [string, null]` is wrong; write `type: [string, 'null']`.
- **Leaving `nullable` in a 3.1 document.** JSON Schema 2020-12 allows unknown keywords, so a validator may not flag it. It simply has no effect, so fields you meant to be nullable are not.
- **Upgrading the version string only.** Changing `openapi: 3.0.3` to `3.1.0` without the schema changes gives you a document that claims to be 3.1 but behaves like 3.0 in places.
- **Using 3.2 fields while declaring 3.1.** Some editors accept `itemSchema` or `additionalOperations` in any 3.x document. Validators and generators that respect the declared version will reject or ignore them.
- **Assuming every tool supports 3.1.** Most maintained tools do. Older generators and gateways may not. Check before you ship.

## Frequently asked questions

<scalar-detail title="Is OpenAPI 3.1 backward compatible with 3.0?">
No, not fully. The specification allows minor versions to include breaking changes when the benefit is high, and 3.1 does: `nullable` is removed, `exclusiveMinimum` changes type, and schemas follow JSON Schema 2020-12. Most documents need a handful of mechanical edits, which the Scalar OpenAPI upgrader can make for you.
</scalar-detail>

<scalar-detail title="Should I use OpenAPI 3.0 or 3.1 for a new API?">
Use 3.1 unless a tool you depend on only supports 3.0. 3.1 has broad support across documentation renderers, validators, and generators, and it lets you reuse standard JSON Schema.
</scalar-detail>

<scalar-detail title="How do I make a field nullable in OpenAPI 3.1?">
Use a type array such as `type: [string, 'null']`. For a referenced schema, use `anyOf` with the `$ref` and `type: 'null'`. The `nullable` keyword from 3.0 no longer exists.
</scalar-detail>

<scalar-detail title="What is the difference between OpenAPI 3.1.0, 3.1.1 and 3.1.2?">
They are patch releases with clarifications and fixes, not new features. The specification says tools supporting 3.1 should be compatible with all 3.1.x versions and should not distinguish between them.
</scalar-detail>

<scalar-detail title="Does OpenAPI 3.2 replace x-tagGroups?">
For new 3.2 documents, yes: the Tag Object's `parent` field describes nesting natively. `x-tagGroups` still works for earlier versions and in tools like Scalar, which fall back to it when no valid `parent` relationships exist.
</scalar-detail>

<scalar-detail title="How do I convert Swagger 2.0 to OpenAPI 3.1?">
Run `npx @scalar/cli document upgrade swagger.json --output openapi.json`. The Scalar upgrader goes from Swagger 2.0 to 3.0 and then 3.1 in one step. Review the result against the checklist above.
</scalar-detail>

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [OpenAPI vs Swagger](/learn/openapi/openapi-vs-swagger) · [JSON Schema vs OpenAPI](/learn/openapi/json-schema-vs-openapi)
- **Docs:** [Scalar OpenAPI upgrader](/tools/openapi-upgrader/getting-started)
- **Product:** [Scalar API reference](/products/api-references) — renders Swagger 2.0, OpenAPI 3.0, 3.1 and 3.2 documents without a manual conversion step.
