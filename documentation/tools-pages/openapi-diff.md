# OpenAPI Diff

Compare two versions of an OpenAPI document and see which operations, parameters, and schema properties were added, removed, or changed, with breaking changes flagged first. It is free, needs no account, and your documents never leave your browser.

<div class="scalar-tool" data-scalar-tool="openapi-diff">
  <div class="scalar-tool-fallback" data-scalar-tool-fallback>
    <p><strong>The diff tool is loading.</strong> It runs entirely in your browser with JavaScript, so if this message stays, JavaScript is probably turned off or a content blocker stopped <code>cdn.jsdelivr.net</code>.</p>
    <p>It compares two OpenAPI documents operation by operation and reports removed operations, new required parameters, removed response fields, and type changes as breaking.</p>
  </div>
  <span data-scalar-tool-end hidden></span>
</div>

The sample compares version 1.0.0 and 2.0.0 of a small Galaxy Planets API. Version 2 removes the delete operation, adds a required `galaxy` query parameter, changes planet IDs from integers to strings, and drops the `radius` field, so it reports seven breaking changes. That is a realistic day: most of them come from one schema edit.

## How the OpenAPI diff works

Both documents are parsed as JSON or YAML. Swagger 2.0 input is first upgraded to OpenAPI 3.1 with `upgrade()` from [`@scalar/openapi-parser`](https://github.com/scalar/scalar/tree/main/packages/openapi-parser), so you can compare a Swagger 2.0 document with its OpenAPI 3 successor. Local `$ref` values are inlined, so a change to a shared schema shows up in every operation that uses it.

Operations are matched by method and path. Path parameter names do not matter for matching: `/planets/{planetId}` and `/planets/{id}` are the same route to a client, and the rename is reported as a note. For each matched operation the tool compares parameters, the request body, and every response, walking into schema properties and array items.

Direction matters when deciding what breaks. A request schema may accept more than before, but not less. A response schema may promise more than before, but not less. So adding `null` to a request field's type is fine, and adding it to a response field's type is breaking, because clients that assumed a string now get `null`.

## What counts as breaking

| Change | Severity |
| --- | --- |
| Operation removed | Breaking |
| Required parameter added, or an optional one made required | Breaking |
| Path parameter removed | Breaking |
| Required request body field added, or a field made required | Breaking |
| Response field removed | Breaking |
| Type changed incompatibly (for example `integer` to `string`) | Breaking |
| Enum value removed from a request field | Breaking |
| Success (2xx) response removed | Breaking |
| Optional parameter or request field removed | Warning |
| Response field no longer required | Warning |
| Enum value added to a response field | Warning |
| Operation, optional parameter, response field, or response added | Info |

Warnings are changes that break some clients: a strict client that validates enums rejects a value it has never seen. **Copy report** gives you a plain-text list to paste into a pull request or changelog.

## Limits

- **Structure, not behavior.** The diff compares what the documents say. A change in validation rules, rate limits, or error behavior that the documents do not describe is invisible to it.
- **A focused rule set.** It covers operations, parameters, request bodies, responses, and schema properties, types, required lists, and enums. Security requirements, headers on responses, examples, and descriptions are not compared.
- **JSON bodies first.** When an operation has several media types, the JSON one is compared.
- **Composition keywords.** Schemas built with `oneOf`, `anyOf`, and `allOf` are compared on their top-level type and properties only, so review those by hand.
- **Local references only.** External `$ref` files are not fetched. Bundle multi-file documents first.

## When to run a diff

Run it before you release, on the document your server will publish, against the one clients are using today. If the report has breaking changes, you have three options: undo them, ship them in a new major version, or give clients a deprecation period. The [API documentation best practices guide](/learn/openapi/api-documentation-best-practices) covers changelogs, and generated [SDKs](/products/sdk-generator) make the new version easy to adopt.

## Built on @scalar/openapi-parser

The page loads [`@scalar/openapi-parser`](https://github.com/scalar/scalar/tree/main/packages/openapi-parser) and [`yaml`](https://www.npmjs.com/package/yaml) from jsDelivr, pinned to exact versions. The comparison is a short module you can read in the [scalar/scalar repository](https://github.com/scalar/scalar) under `documentation/assets/free-tools`. Validate both documents with the [OpenAPI validator](/tools/openapi-validator) first, because a diff of an invalid document is hard to trust.

## Keep docs in sync with every version

Scalar can republish your API reference automatically whenever your OpenAPI document changes, so the docs your users read always match the version you shipped.

<div class="flex flex-wrap gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Publish your API reference for free</a>
</div>

## Frequently asked questions

<scalar-detail title="What is a breaking change in an API?">

A change that makes an existing client fail without the client changing. Removing an operation or a response field, adding a required parameter, and changing a field's type are the common ones. Adding optional things is usually safe.

</scalar-detail>

<scalar-detail title="Can I compare Swagger 2.0 with OpenAPI 3?">

Yes. Swagger 2.0 input is upgraded to OpenAPI 3.1 before comparing, so a Swagger 2.0 document and its OpenAPI 3 replacement can be diffed directly. Differences caused only by the upgrade, such as moved definitions, do not show up as changes.

</scalar-detail>

<scalar-detail title="Why is renaming a path parameter not breaking?">

Clients send the value, not the name, in the path. `/planets/{planetId}` and `/planets/{id}` produce the same URL. Renaming a query parameter or a body field is breaking, because the name is sent.

</scalar-detail>

<scalar-detail title="Are my documents uploaded?">

No. The comparison runs in your browser. Share links keep both documents in the part of the URL after `#`, which browsers do not send to servers.

</scalar-detail>

<scalar-detail title="Can I run this OpenAPI diff in CI?">

Not as a command today. The logic is a small JavaScript module you can copy from the repository and run with Node, or you can use a dedicated breaking-change checker in your pipeline and keep this page for quick reviews.

</scalar-detail>

## Related

- **Learn:** [API documentation best practices](/learn/openapi/api-documentation-best-practices) · [What is OpenAPI?](/learn/openapi/what-is-openapi)
- **Docs:** [OpenAPI validator](/tools/openapi-validator) · [OpenAPI converter](/tools/openapi-converter) · [Scalar CLI commands](/tools/cli/commands)
- **Product:** [Scalar Registry](/products/registry) — version your OpenAPI documents in one place, with docs that follow each release
