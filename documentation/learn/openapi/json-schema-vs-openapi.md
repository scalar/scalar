# JSON Schema vs OpenAPI: what is the difference?

*Last updated: September 2026*

JSON Schema describes the shape of a single piece of JSON data, such as "an object with a required string `email` and an optional integer `age`", and lets you validate data against that description. OpenAPI describes an entire HTTP API (its paths, operations, parameters, responses, servers and authentication) and uses JSON Schema inside it to describe the data those operations send and receive.

So the two are not competitors. JSON Schema is a building block; OpenAPI is the building. The interesting question is how well the block fits, and the answer depends on the OpenAPI version: in OpenAPI 3.0 the fit was awkward, and since OpenAPI 3.1 it is exact.

This guide covers what each one is, how the relationship changed across versions, the keywords that differ, and how to share schemas between standalone JSON Schema files and OpenAPI documents without surprises.

**On this page**

- [The short answer](#the-short-answer)
- [What JSON Schema is](#what-json-schema-is)
- [What OpenAPI is](#what-openapi-is)
- [Side-by-side comparison](#side-by-side-comparison)
- [How the relationship changed across OpenAPI versions](#how-the-relationship-changed-across-openapi-versions)
- [The keywords that differ in OpenAPI 3.0](#the-keywords-that-differ-in-openapi-30)
- [Keywords OpenAPI adds on top of JSON Schema](#keywords-openapi-adds-on-top-of-json-schema)
- [Dialects: $schema and jsonSchemaDialect](#dialects-schema-and-jsonschemadialect)
- [Sharing schemas between JSON Schema and OpenAPI](#sharing-schemas-between-json-schema-and-openapi)
- [Migrating schemas from 3.0 to 3.1](#migrating-schemas-from-30-to-31)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## The short answer

- **JSON Schema** answers "is this JSON value valid?" It knows nothing about URLs, HTTP methods or status codes.
- **OpenAPI** answers "what does this API do and how do I call it?" For the data parts of that answer, it delegates to a Schema Object.
- **OpenAPI 3.1 and 3.2** Schema Objects are a superset of JSON Schema Draft 2020-12, so any valid 2020-12 schema works unchanged inside an OpenAPI document.
- **OpenAPI 3.0** Schema Objects are an "extended subset" of an older JSON Schema draft, with some keywords changed or missing. That gap is the source of most confusion you will find online.

If you are starting a new API, use OpenAPI 3.1 or later and treat your schemas as plain JSON Schema. For the wider version story, read [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0).

## What JSON Schema is

JSON Schema is a vocabulary for describing and validating JSON documents. A schema is itself JSON (or YAML) and lists constraints: types, required properties, string patterns, number ranges, array lengths, and combinations of other schemas.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.example.com/user.json",
  "title": "User",
  "type": "object",
  "required": ["id", "email"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "integer", "minimum": 0 },
    "nickname": { "type": ["string", "null"] }
  },
  "additionalProperties": false
}
```

JSON Schema is used far beyond APIs: configuration files (editors validate `package.json` and `tsconfig.json` with it), form generators, database document validation, and event payloads. It is published by the JSON Schema organization as a series of drafts; Draft 2020-12 is the one OpenAPI 3.1 and 3.2 build on.

## What OpenAPI is

The [OpenAPI Specification](/learn/openapi/what-is-openapi) is a format for describing HTTP APIs. A document lists paths and operations, and wherever data appears (a request body, a response body, a query parameter, a header) it uses a Schema Object to describe that data.

Here is the same `User` schema used inside an OpenAPI 3.1 document:

```yaml
openapi: 3.1.0
info:
  title: Users API
  version: 1.0.0
paths:
  /users/{id}:
    get:
      operationId: getUser
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: The user
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
components:
  schemas:
    User:
      type: object
      required: [id, email]
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        age:
          type: integer
          minimum: 0
        nickname:
          type: [string, 'null']
      additionalProperties: false
```

Everything under `components.schemas.User` is JSON Schema. Everything around it (the path, the parameter's location, the status code, the media type) is OpenAPI.

## Side-by-side comparison

| | JSON Schema | OpenAPI |
| --- | --- | --- |
| Describes | One JSON value | An entire HTTP API |
| Main building blocks | Types, properties, constraints, composition (`allOf`, `oneOf`, `anyOf`, `not`) | Paths, operations, parameters, request bodies, responses, servers, security schemes |
| Knows about HTTP | No | Yes: methods, status codes, headers, media types, authentication |
| Current version | Draft 2020-12 | OpenAPI 3.2 (3.1 is the most widely supported) |
| Relationship | Standalone | Uses JSON Schema for data, via the Schema Object |
| Validation | Validates data instances | Validates as a document; its schemas validate request and response data |
| Typical tools | Validators (Ajv and others), form and type generators | [API references](/products/api-references), [API clients](/learn/openapi/what-is-an-api-client), [SDK generators](/products/sdk-generator), mock servers, linters |
| File name examples | `user.schema.json` | `openapi.yaml`, `openapi.json` |

## How the relationship changed across OpenAPI versions

OpenAPI has used JSON Schema since the Swagger days, but which JSON Schema, and how faithfully, has changed a lot. The details come from each version's own specification text.

| OpenAPI version | Schema Object is... | Practical effect |
| --- | --- | --- |
| Swagger 2.0 ([history](/learn/openapi/openapi-vs-swagger)) | Based on JSON Schema Draft 4, using ["a predefined subset of it"](https://spec.openapis.org/oas/v2.0.html#schema-object) plus extensions | Many JSON Schema keywords unavailable; `type: file` added for uploads |
| OpenAPI 3.0 | ["An extended subset"](https://spec.openapis.org/oas/v3.0.4.html#schema-object) of JSON Schema Draft Wright-00 (the draft often called Draft 5) | Close to JSON Schema, but with changed keywords such as `nullable` and single-value `type` |
| OpenAPI 3.1 | ["A superset of the JSON Schema Specification Draft 2020-12"](https://spec.openapis.org/oas/v3.1.2.html#schema-object) | Any valid 2020-12 schema works; OpenAPI adds a few annotation keywords |
| OpenAPI 3.2 | By default, ["a superset of the JSON Schema Specification Draft 2020-12"](https://spec.openapis.org/oas/v3.2.1.html#schema-object) | Same model as 3.1, with the dialect identified by a dated OAS dialect URI |

The big break is between 3.0 and 3.1. The 3.0 specification spelled out which JSON Schema keywords were allowed and said that any keyword not mentioned "is strictly unsupported". That excluded useful keywords such as `const`, `if`/`then`/`else`, `prefixItems`, `$defs`, `unevaluatedProperties` and `dependentRequired`, and it changed the meaning of several others. OpenAPI 3.1 dropped the subset and adopted full JSON Schema.

## The keywords that differ in OpenAPI 3.0

If you maintain 3.0 documents, or share schemas with tools that still expect 3.0, these are the differences that bite.

**`nullable` instead of a `null` type.** In 3.0, `type` must be a single string, so null is expressed with an OpenAPI-specific keyword:

```yaml
# OpenAPI 3.0
nickname:
  type: string
  nullable: true
```

```yaml
# OpenAPI 3.1 and JSON Schema 2020-12
nickname:
  type: [string, 'null']
```

`nullable` does not exist in 3.1. A 3.1 validator will ignore it, silently rejecting the `null` values you meant to allow.

**`exclusiveMinimum` and `exclusiveMaximum` are booleans in 3.0.** In the older draft they modify `minimum` and `maximum`. In 2020-12 they are numbers in their own right.

```yaml
# OpenAPI 3.0: greater than 0
price:
  type: number
  minimum: 0
  exclusiveMinimum: true
```

```yaml
# OpenAPI 3.1: greater than 0
price:
  type: number
  exclusiveMinimum: 0
```

**`example` vs `examples`.** OpenAPI 3.0 schemas use a singular `example`. JSON Schema has an `examples` array. In 3.1 and 3.2 the Schema Object's `example` field is deprecated in favor of `examples`:

```yaml
# OpenAPI 3.1
email:
  type: string
  format: email
  examples:
    - ada@example.com
```

Note this is the schema-level keyword. Media Type Objects, parameters and headers still have their own `example` and `examples` fields with a different shape (a map of Example Objects).

**`$ref` with siblings.** In 3.0, a Schema Object containing `$ref` is a Reference Object, and the specification says any other properties added to it "SHALL be ignored". So `description` next to `$ref` disappears. In 3.1, a schema `$ref` is an ordinary JSON Schema keyword and sibling keywords apply.

**Binary data.** OpenAPI 3.0 described file content with `type: string` and `format: binary` or `format: byte`. OpenAPI 3.1 uses JSON Schema's `contentMediaType` and `contentEncoding` instead, and the 3.1 specification [says `format` no longer affects content encoding](https://spec.openapis.org/oas/v3.1.2.html#working-with-binary-data):

```yaml
# OpenAPI 3.1: a base64-encoded PNG inside JSON
avatar:
  type: string
  contentMediaType: image/png
  contentEncoding: base64
```

## Keywords OpenAPI adds on top of JSON Schema

Even in 3.1 and 3.2, OpenAPI defines a few fields in the Schema Object that JSON Schema does not. They are annotations for tools; the 3.2 specification states that `discriminator`, for example, "MUST NOT change the validation outcome of the schema".

- **`discriminator`**: names the property that tells tools which of several `oneOf` or `anyOf` schemas a payload uses, with an optional `mapping` from values to schemas. SDK generators use it to produce proper union types; see [how SDKs are generated from OpenAPI](/learn/sdk/generate-sdk-from-openapi).
- **`xml`**: metadata for serializing the schema as XML (element names, attributes, namespaces, wrapping).
- **`externalDocs`**: a link to further documentation for the schema.
- **`example`**: kept for compatibility, deprecated in favor of `examples`.

A generic JSON Schema validator will treat these as unknown keywords and ignore them, which is exactly the right behavior. A polymorphic schema in 3.1 looks like this:

```yaml
components:
  schemas:
    Pet:
      oneOf:
        - $ref: '#/components/schemas/Cat'
        - $ref: '#/components/schemas/Dog'
      discriminator:
        propertyName: petType
        mapping:
          cat: '#/components/schemas/Cat'
          dog: '#/components/schemas/Dog'
    Cat:
      type: object
      required: [petType, livesLeft]
      properties:
        petType:
          const: cat
        livesLeft:
          type: integer
    Dog:
      type: object
      required: [petType, goodBoy]
      properties:
        petType:
          const: dog
        goodBoy:
          type: boolean
```

The `const` keywords do the actual validation (a `Cat` must have `petType: cat`), and `discriminator` tells tools how to pick the branch quickly. Using `const` here would not be allowed in 3.0.

## Dialects: $schema and jsonSchemaDialect

JSON Schema has "dialects": a `$schema` URI at the root of a schema says which draft and vocabularies apply. OpenAPI 3.1 and later support this too.

- By default, every Schema Object in a 3.1 document uses the OpenAPI dialect, identified by `https://spec.openapis.org/oas/3.1/dialect/base`. In 3.2 the default dialect is identified by a dated URI of the form `https://spec.openapis.org/oas/3.2/dialect/YYYY-MM-DD`.
- A document can change that default with the top-level `jsonSchemaDialect` field.
- An individual schema can declare its own `$schema`, which always wins. Tooling must support the OAS dialect and may support others.

In practice you rarely need either field. They matter when you embed schemas written for another draft, or when you want a validator to treat your schemas as plain 2020-12. The 3.1 specification also recommends setting `$schema` explicitly in standalone schema files that will be referenced from OpenAPI, "for maximum interoperability".

## Sharing schemas between JSON Schema and OpenAPI

Because 3.1 schemas are JSON Schema, a model can live in its own file and be referenced from any number of API descriptions:

```yaml
# openapi.yaml
components:
  schemas:
    User:
      $ref: './schemas/user.schema.json'
```

This is how you avoid three slightly different `Address` models across three APIs. A few practical tips:

- **Give shared schemas an `$id`.** It becomes the schema's canonical identity and base URI, which makes relative references inside it resolve predictably.
- **Bundle before distributing.** Some tools cannot follow external references. Bundling pulls external `$ref`s into `components` so the document is self-contained. The [Scalar CLI](/tools/cli/getting-started) does this with `scalar document bundle`.
- **Version shared models.** A change to a shared model is a change to every API that uses it. Publishing shared schemas to a registry with versions makes that visible. The Scalar Registry supports [standalone JSON Schemas](/products/registry/schemas) for exactly this, and they can be referenced across the APIs in your [API catalog](/learn/openapi/api-catalog).
- **Validate data with the same schemas.** The schema that documents your request body can validate that request at runtime in your server, in a gateway, or in a [mock server](/learn/openapi/api-mocking) that returns `422` for invalid requests. One definition, used everywhere.

## Migrating schemas from 3.0 to 3.1

Most migration work is in the schemas. The checklist:

1. Change `openapi: 3.0.x` to `openapi: 3.1.x` (or 3.2).
2. Replace `nullable: true` with a `null` entry in `type` (or add `{ type: 'null' }` to a `oneOf`).
3. Convert boolean `exclusiveMinimum`/`exclusiveMaximum` to numbers and remove the paired `minimum`/`maximum`.
4. Replace schema-level `example` with an `examples` array.
5. Replace `format: binary` and `format: byte` with `contentMediaType` and `contentEncoding` where needed.
6. Review `$ref` siblings, which now take effect.

You do not have to do this by hand. The [Scalar OpenAPI upgrader](/tools/openapi-upgrader/getting-started) converts Swagger 2.0 and OpenAPI 3.0 documents to 3.1, and the CLI exposes it as a single command:

```bash
npx @scalar/cli document upgrade openapi.yaml --output openapi-3.1.yaml
```

Then validate the result with `npx @scalar/cli document validate openapi-3.1.yaml` and run your linting rules. The [Spectral rules guide](/learn/openapi/spectral-rules) has examples.

## Common mistakes

**Using `nullable` in a 3.1 document.** It is not a 3.1 keyword. Validators ignore it and reject `null`.

**Assuming `format` validates.** In JSON Schema 2020-12, and so in OpenAPI 3.1, `format` is an annotation by default; the 3.1 specification notes that "the ability to validate `format` varies across implementations". If an email must really be an email, add a `pattern` or enable format assertion in your validator.

**Forgetting that `additionalProperties` defaults to allowing anything.** A schema without `additionalProperties: false` (or `unevaluatedProperties: false` when using composition) accepts extra fields. That is often right for responses and wrong for requests.

**Mixing up the two `examples`.** Schema `examples` is an array of values. Media type `examples` is a map of named Example Objects. Putting one shape where the other belongs is one of the most common validation errors.

**Pasting 3.0 schemas into a JSON Schema validator.** A 3.0 schema is not valid 2020-12 JSON Schema if it uses `nullable`, boolean `exclusiveMinimum`, or relies on ignored `$ref` siblings. Upgrade first.

**Using `readOnly` and `writeOnly` as if they validate.** They are annotations. The 3.1 specification leaves it to the API to ignore or reject a `readOnly` field sent in a request.

## Frequently asked questions

<scalar-detail title="Is OpenAPI the same as JSON Schema?">
No. JSON Schema describes and validates a single JSON value. OpenAPI describes a whole HTTP API, and uses JSON Schema to describe the request and response data inside it. Since OpenAPI 3.1, the Schema Object is a superset of JSON Schema Draft 2020-12.
</scalar-detail>

<scalar-detail title="Which version of JSON Schema does OpenAPI use?">
OpenAPI 3.1 and 3.2 use JSON Schema Draft 2020-12 by default. OpenAPI 3.0 uses an extended subset of JSON Schema Draft Wright-00, often called Draft 5. Swagger 2.0 uses a subset of Draft 4.
</scalar-detail>

<scalar-detail title="Can I use my existing JSON Schema files in an OpenAPI document?">
Yes, with OpenAPI 3.1 or later. Reference them with `$ref` from `components.schemas` or directly where a schema is expected. If a file targets a different draft, declare it with `$schema`. With OpenAPI 3.0, only schemas that stay within 3.0's supported keywords will work.
</scalar-detail>

<scalar-detail title="Why is nullable not working in OpenAPI 3.1?">
Because `nullable` was removed in OpenAPI 3.1. Use a type array such as `type: [string, 'null']` instead, which is standard JSON Schema.
</scalar-detail>

<scalar-detail title="Do I still need OpenAPI if I have JSON Schema for all my models?">
If you want documentation, API clients, SDKs, mocks or MCP servers, yes. JSON Schema describes your data, but not your endpoints, methods, parameters, status codes, servers or authentication. OpenAPI adds that layer and reuses your schemas for the data.
</scalar-detail>

## Related

- **Learn:** [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0) · [What is OpenAPI?](/learn/openapi/what-is-openapi) · [Spectral rules](/learn/openapi/spectral-rules)
- **Docs:** [OpenAPI upgrader](/tools/openapi-upgrader/getting-started)
- **Product:** [Scalar Registry](/products/registry) — publish shared JSON Schemas once and reference them from every API that needs them.
