# OpenAPI Validator

Paste or upload an OpenAPI document and see every error with its JSON pointer and line number, plus a few lint warnings. It is free, needs no account, and your document never leaves your browser.

<div class="scalar-tool" data-scalar-tool="openapi-validator">
  <div class="scalar-tool-fallback" data-scalar-tool-fallback>
    <p><strong>The validator is loading.</strong> It runs entirely in your browser with JavaScript, so if this message stays, JavaScript is probably turned off or a content blocker stopped <code>cdn.jsdelivr.net</code>.</p>
    <p>You can run the same check from a terminal with the Scalar CLI: <code>npx @scalar/cli document validate openapi.yaml</code></p>
  </div>
  <span data-scalar-tool-end hidden></span>
</div>

The sample above is a small Galaxy Planets API with one deliberate mistake: a `200` response without a `description`, which OpenAPI requires. Click the error to jump to the line, add a description, and the result turns green.

## How the OpenAPI validator works

Validation happens in three steps, all inside this page.

1. **Parse.** Your text is read as JSON if it starts with `{` or `[`, and as YAML otherwise. Syntax problems (a missing quote, bad indentation, a duplicate key) are reported with a line and column before anything else runs.
2. **Validate.** The parsed document goes to `validate()` from [`@scalar/openapi-parser`](https://github.com/scalar/scalar/tree/main/packages/openapi-parser). It detects the version from the `swagger` or `openapi` field, checks the document against the official schema for that version, resolves every local `$ref`, and checks that each templated path parameter such as `{planetId}` is declared.
3. **Lint.** Once the document is valid, a handful of extra checks run. They catch things that are allowed by the specification but make generated documentation, SDKs, and MCP tools worse.

Each error shows a JSON pointer, like `/paths/~1planets~1{planetId}/get/responses/200`. In a pointer, `~1` stands for `/` and `~0` for `~`, so that one reads "the `200` response of `GET /planets/{planetId}`". The tool maps pointers back to line numbers in your original text, whether you pasted JSON or YAML.

## What it checks

| Check | Level | Why it matters |
| --- | --- | --- |
| Structure against the official schema for Swagger 2.0, OpenAPI 3.0, 3.1, or 3.2 | Error | Tools reject or misread invalid documents |
| Local `$ref` targets exist | Error | A broken reference becomes a missing schema everywhere downstream |
| Path template parameters are declared | Error | Clients cannot build the URL |
| Every operation has an `operationId` | Warning | SDK method names and MCP tool names come from it |
| `operationId` values are unique | Warning | Duplicate IDs collide in generated code |
| Every operation has a summary or description | Warning | Docs and AI agents need to know what it does |
| Every operation documents a success response | Warning | Clients cannot type what they will get back |
| Every component schema is referenced | Warning | Unused schemas are usually leftovers |

## Limits

- **Local references only.** References to other files or URLs (`$ref: './schemas/planet.yaml'`) are not fetched, because the tool never makes network requests with your document. Bundle multi-file documents first, for example with `npx @scalar/cli document bundle`.
- **Not a Spectral replacement.** The lint checks are a small fixed set. For your own style guide, write [Spectral rules](/learn/openapi/spectral-rules) and run `npx @scalar/cli document lint` in CI.
- **Size.** Uploads are capped at 10 MB. Very large documents validate, but share links for them get too long to be practical.
- **First error wins for structure.** When the structure is invalid, reference and lint checks wait until it is fixed, so fixing one error can reveal the next.

## Validate in CI with the Scalar CLI

The browser tool is for quick checks. To stop invalid documents from being merged, run the Scalar CLI in your pipeline:

```bash
npx @scalar/cli document validate openapi.yaml
```

The [Scalar CLI commands](/tools/cli/commands) page lists `validate`, `lint`, `bundle`, and `upgrade`. If you keep your API descriptions in the [Scalar Registry](/products/registry), you can store shared Spectral rules there and lint every document against the same ruleset.

## Built on @scalar/openapi-parser

This page uses [`@scalar/openapi-parser`](https://github.com/scalar/scalar/tree/main/packages/openapi-parser), the MIT-licensed OpenAPI parser that Scalar maintains in the same open-source repository as the API reference and API client. The page loads it and the [`yaml`](https://www.npmjs.com/package/yaml) package from jsDelivr, pinned to exact versions. To validate in your own code:

```ts
import { validate } from '@scalar/openapi-parser'

const { valid, errors, version } = await validate(document)
```

`document` can be a JSON string, a YAML string, or an object. The source for this tool is in the [scalar/scalar repository](https://github.com/scalar/scalar) under `documentation/assets/free-tools`.

## Turn a valid document into docs

A valid OpenAPI document is all Scalar needs to publish an interactive API reference, generate SDKs, and host an MCP server.

<div class="flex flex-wrap gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Publish your API reference for free</a>
</div>

## Frequently asked questions

<scalar-detail title="Is my OpenAPI document uploaded anywhere?">

No. Parsing, validation, and linting all run in your browser. The only network requests are for the parser and YAML libraries from jsDelivr. Share links store your document in the part of the URL after `#`, which browsers do not send to servers.

</scalar-detail>

<scalar-detail title="Which OpenAPI versions does the validator support?">

Swagger 2.0, OpenAPI 3.0, OpenAPI 3.1, and OpenAPI 3.2. The version is detected from the top-level `swagger` or `openapi` field, and the document is checked against the schema for that version. To move an older document forward, use the [OpenAPI converter](/tools/openapi-converter).

</scalar-detail>

<scalar-detail title="What is the difference between an OpenAPI validator and an OpenAPI linter?">

A validator checks that the document follows the OpenAPI specification. A linter checks it against style rules that are allowed but unwise, such as missing descriptions or duplicate `operationId` values. This tool does both: errors come from validation, warnings from a small set of lint rules. [OpenAPI linting](/learn/openapi/spectral-rules) with Spectral covers custom rules.

</scalar-detail>

<scalar-detail title="Why does a missing description count as an error?">

Because OpenAPI 3.x requires `description` on every response object. Many tools tolerate its absence, but strict ones (and some SDK generators) do not. Adding a one-line description is the fix.

</scalar-detail>

<scalar-detail title="Can I validate an OpenAPI document from a URL?">

Not in this page, because it never fetches anything on your behalf. Download the document and upload it, or run `npx @scalar/cli document validate https://example.com/openapi.json`, which accepts URLs.

</scalar-detail>

## Related

- **Learn:** [Spectral rules for OpenAPI](/learn/openapi/spectral-rules) · [What is OpenAPI?](/learn/openapi/what-is-openapi)
- **Docs:** [Scalar CLI commands](/tools/cli/commands) · [OpenAPI converter](/tools/openapi-converter) · [OpenAPI diff](/tools/openapi-diff)
- **Product:** [Scalar API References](/products/api-references) — turn the document you just validated into interactive docs
