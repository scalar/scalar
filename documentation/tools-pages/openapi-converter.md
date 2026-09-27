# Swagger to OpenAPI 3 Converter

Convert a Swagger 2.0 document to OpenAPI 3.1 or 3.0, or move an OpenAPI 3.0 document to 3.1, and switch between JSON and YAML. It is free, needs no account, and your document never leaves your browser.

<div class="scalar-tool" data-scalar-tool="openapi-converter">
  <div class="scalar-tool-fallback" data-scalar-tool-fallback>
    <p><strong>The converter is loading.</strong> It runs entirely in your browser with JavaScript, so if this message stays, JavaScript is probably turned off or a content blocker stopped <code>cdn.jsdelivr.net</code>.</p>
    <p>You can run the same conversion from a terminal with the Scalar CLI: <code>npx @scalar/cli document upgrade swagger.json --output openapi.json</code></p>
  </div>
  <span data-scalar-tool-end hidden></span>
</div>

The sample is a Swagger 2.0 version of a small Galaxy Planets API. It has a JSON body, a file upload, an API key, and a shared definition, which are the parts of a Swagger 2.0 document that change shape the most in an upgrade. The list above the output tells you what moved.

## How the converter works

The conversion is done by [`@scalar/openapi-parser`](https://github.com/scalar/scalar/tree/main/packages/openapi-parser), which wraps [`@scalar/openapi-upgrader`](/tools/openapi-upgrader/getting-started). Both are MIT licensed.

- **To OpenAPI 3.1** the page calls `upgrade()`. It takes Swagger 2.0 through 3.0 to 3.1 in one pass, and also upgrades OpenAPI 3.0 documents.
- **To OpenAPI 3.0** the page calls `upgradeFromTwoToThree()` and stops there, for toolchains that do not read 3.1 yet.

The output starts with `openapi`, `info`, and `servers`, in the order the specification lists them, and comes as YAML or JSON. Pick the format with the toggle, then copy or download the result.

## What changes from Swagger 2.0 to OpenAPI 3

| Swagger 2.0 | OpenAPI 3.x |
| --- | --- |
| `host`, `basePath`, `schemes` | One `servers` entry, such as `https://galaxy.scalar.com/v1` |
| `definitions` | `components/schemas`, with every `$ref` rewritten |
| `in: body` parameter | `requestBody` with a `content` map |
| `in: formData` parameters | Properties of a `multipart/form-data` or `application/x-www-form-urlencoded` request body schema |
| `type: file` | A file property in the request body (`format: binary` in 3.0, `contentMediaType` in 3.1) |
| `consumes` and `produces` | Media type keys under `content` |
| `securityDefinitions` | `components/securitySchemes` |
| `type` on a parameter | A `schema` object on the parameter |

Going from OpenAPI 3.0 to 3.1 is smaller. The upgrader turns `nullable: true` into a type array that includes `"null"`, `example` into `examples`, and boolean `exclusiveMinimum` or `exclusiveMaximum` into numbers, because 3.1 schemas are plain JSON Schema. The [OpenAPI 3.1 vs 3.0 guide](/learn/openapi/openapi-3-1-vs-3-0) covers the rest.

## Limits

- **No downgrades.** A 3.1 document cannot be converted to 3.0 here. Type arrays, `const`, and other JSON Schema features have no exact 3.0 equivalent, so a downgrade would silently lose meaning.
- **Local references only.** External `$ref` files are not fetched. Bundle the document first with `npx @scalar/cli document bundle`.
- **Review what you get.** An automatic upgrade is faithful to the input, including its mistakes. Run the output through the [OpenAPI validator](/tools/openapi-validator) and read the request bodies, which are where most hand-edits happen afterwards.
- **Comments and formatting.** YAML comments and custom key order are not preserved, because the document is parsed into data and written out again.
- **OpenAPI 3.2.** The upgrader has experimental 3.2 support, but this page stops at 3.1 until more tools read 3.2.

## Convert in a script or CI

For one file, the CLI is the quickest route:

```bash
npx @scalar/cli document upgrade swagger.json --output openapi.json
```

In code, the parser gives you the same result as this page:

```ts
import { upgrade } from '@scalar/openapi-parser'

const { specification, version } = upgrade(swaggerDocument)
// version is '3.1' and specification is the upgraded document
```

## Built on @scalar/openapi-parser

The page loads [`@scalar/openapi-parser`](https://github.com/scalar/scalar/tree/main/packages/openapi-parser) and [`yaml`](https://www.npmjs.com/package/yaml) from jsDelivr, pinned to exact versions, and runs them in your browser. The same upgrade happens automatically when Scalar renders a Swagger 2.0 document, so you do not have to convert before publishing docs. The source for this tool is in the [scalar/scalar repository](https://github.com/scalar/scalar) under `documentation/assets/free-tools`.

## Publish the converted document

Scalar turns the OpenAPI document into an interactive API reference, SDKs, and a hosted MCP server, and keeps them in sync as the document changes.

<div class="flex flex-wrap gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Publish your API reference for free</a>
</div>

## Frequently asked questions

<scalar-detail title="How do I convert Swagger 2.0 to OpenAPI 3?">

Paste the Swagger 2.0 document into the converter above, pick OpenAPI 3.1 or 3.0, and copy or download the output. From a terminal, run `npx @scalar/cli document upgrade swagger.json --output openapi.json`.

</scalar-detail>

<scalar-detail title="Should I convert to OpenAPI 3.0 or 3.1?">

Choose 3.1 unless a tool you depend on only reads 3.0. OpenAPI 3.1 schemas are standard JSON Schema, so validators, form libraries, and code generators that understand JSON Schema work with them directly. The [OpenAPI vs Swagger guide](/learn/openapi/openapi-vs-swagger) explains how the names and versions relate.

</scalar-detail>

<scalar-detail title="Is my document sent to a server?">

No. Conversion runs in your browser. The share link stores your input in the part of the URL after `#`, which browsers never send to servers, so only people you give the link to can see it.

</scalar-detail>

<scalar-detail title="Can I convert OpenAPI JSON to YAML without changing the version?">

Yes. Paste an OpenAPI 3.1 document, keep "OpenAPI 3.1" selected, and switch the output between YAML and JSON. The content stays the same; only the format changes.

</scalar-detail>

<scalar-detail title="Do I need to convert before using Scalar?">

No. Scalar reads Swagger 2.0, OpenAPI 3.0, and OpenAPI 3.1 and upgrades older documents when it loads them. Converting is still worth it if you edit the document by hand or feed it to other tools.

</scalar-detail>

## Related

- **Learn:** [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0) · [OpenAPI vs Swagger](/learn/openapi/openapi-vs-swagger)
- **Docs:** [OpenAPI upgrader](/tools/openapi-upgrader/getting-started) · [Scalar CLI commands](/tools/cli/commands) · [OpenAPI validator](/tools/openapi-validator)
- **Product:** [Scalar API References](/products/api-references) — publish the converted document as interactive docs
