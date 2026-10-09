# OpenAPI to MCP converter

Paste an OpenAPI document and preview the MCP tools it maps to, with the name, description, and JSON input schema for each operation, plus install snippets for Claude, Cursor, and VS Code. It is free, and your document never leaves your browser.

<div class="scalar-tool" data-scalar-tool="openapi-to-mcp">
  <div class="scalar-tool-fallback" data-scalar-tool-fallback>
    <p><strong>The preview is loading.</strong> It runs entirely in your browser with JavaScript, so if this message stays, JavaScript is probably turned off or a content blocker stopped <code>cdn.jsdelivr.net</code>.</p>
    <p>To host an MCP server from your OpenAPI document without this preview, <a href="https://dashboard.scalar.com/register">create a free Scalar account</a> and open <em>MCP</em> in the dashboard.</p>
  </div>
  <span data-scalar-tool-end hidden></span>
</div>

<scalar-callout type="info">
This page previews an approximation of how OpenAPI operations map to MCP tools. It is not a copy of the tools a hosted Scalar MCP server exposes, which you configure per endpoint in the Scalar dashboard. Hosting happens in the dashboard, not on this page.
</scalar-callout>

## How the preview works

The [Model Context Protocol](/learn/mcp/what-is-mcp) lets AI clients such as Claude, Cursor, and VS Code call tools. An OpenAPI document already describes everything a tool needs, so the mapping is mostly mechanical. For each operation in your document, the preview builds one tool:

| MCP tool field | Comes from |
| --- | --- |
| `name` | `operationId`, cleaned to letters, digits, `_` and `-`, at most 64 characters. Without an `operationId`, the method and path, like `delete_planets_planetId` |
| `title` | `summary` |
| `description` | `summary` and `description` together, or the method and path if both are missing |
| `inputSchema` | One JSON Schema object: a property per path, query, header, and cookie parameter, plus a `body` property for a JSON or form request body |
| `annotations` | `readOnlyHint` for `GET`, `HEAD`, and `OPTIONS`; `destructiveHint` for `DELETE`; `idempotentHint` for `PUT` and `DELETE` |

A few details follow the specification. Path parameters are always required. Local `$ref` values are inlined, and circular references are cut off with a note so the schema stays finite. `readOnly` properties are removed from request bodies, because clients never send them. `Authorization`, `Accept`, and `Content-Type` header parameters are left out: OpenAPI ignores them, and credentials belong to the server, not the model. Deprecated operations and operations marked `x-scalar-ignore` are skipped. Swagger 2.0 documents are upgraded to OpenAPI 3.1 first with `upgrade()` from `@scalar/openapi-parser`.

Use **Copy tools/list JSON** to get the tool definitions in the shape an MCP server returns from `tools/list`. The [OpenAPI to MCP server guide](/learn/mcp/openapi-to-mcp-server) walks through the same mapping field by field, with a converter you can read.

## From preview to a hosted MCP server

A preview is not a server. A hosted MCP server has to call your API with real credentials, keep those credentials away from the model, and decide who may connect. With Scalar:

1. Create an MCP server in the [Scalar dashboard](https://dashboard.scalar.com/register) from your OpenAPI document.
2. Choose which operations become tools, and whether each one only searches the API description or executes real requests.
3. Create an installation and store how it authenticates to your API: one shared credential, or passthrough of each caller's own key.
4. Connect a client with the installation URL. Private servers ask people to sign in with OAuth, or accept a Scalar personal access token.

The snippets under the preview use a placeholder URL, `https://mcp.scalar.com/mcp/YOUR_INSTALL_ID`. The dashboard gives you the real one. The formats come from each client's documentation as of September 2026: [Claude Code](https://code.claude.com/docs/en/mcp), [custom connectors in the Claude apps](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp), [Cursor](https://cursor.com/docs/context/mcp), and [VS Code](https://code.visualstudio.com/docs/copilot/customization/mcp-servers).

<div class="flex flex-wrap gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Host this MCP server on Scalar</a>
  <a class="t-editor__button button__secondary" href="/products/agent/mcp">Read the MCP docs</a>
</div>

## Limits

- **An approximation.** Naming, descriptions, and schema details on a hosted Scalar server depend on how you configure it and can differ from this preview.
- **Local references only.** External `$ref` files are not fetched. Bundle multi-file documents first.
- **One body media type.** When an operation accepts several request body types, the preview uses the JSON one, then a form type, then the first listed.
- **Tool count.** Every operation becomes a tool here. Large APIs produce more tools than a model handles well, which is why the dashboard lets you pick.

## Built on @scalar/openapi-parser

The page loads [`@scalar/openapi-parser`](https://github.com/scalar/scalar/tree/main/packages/openapi-parser) and [`yaml`](https://www.npmjs.com/package/yaml) from jsDelivr, pinned to exact versions. The parser upgrades Swagger 2.0 input; the mapping itself is a short, readable module in the [scalar/scalar repository](https://github.com/scalar/scalar) under `documentation/assets/free-tools`. Run your document through the [OpenAPI validator](/tools/openapi-validator) first: broken references become broken tools.

## Frequently asked questions

<scalar-detail title="Can I turn any OpenAPI document into an MCP server?">

Any valid OpenAPI 3.x or Swagger 2.0 document maps to tools. Whether the tools are useful depends on the document: clear `operationId` values become clear tool names, and good descriptions help the model pick the right tool.

</scalar-detail>

<scalar-detail title="Is this the same output as Scalar's hosted MCP servers?">

No. It approximates the usual OpenAPI to MCP mapping so you can check your document. A hosted Scalar MCP server is configured in the dashboard, where you choose the exposed operations, their mode, and authentication.

</scalar-detail>

<scalar-detail title="Is my OpenAPI document uploaded?">

No. The preview runs in your browser. Share links keep your document in the part of the URL after `#`, which browsers do not send to servers.

</scalar-detail>

<scalar-detail title="How do I add a remote MCP server to Claude Code?">

Run `claude mcp add --transport http my-api https://mcp.scalar.com/mcp/YOUR_INSTALL_ID`, using the installation URL from the Scalar dashboard. The snippet tabs above also cover the Claude apps, Cursor (`.cursor/mcp.json`), and VS Code (`.vscode/mcp.json`).

</scalar-detail>

<scalar-detail title="What happens to API keys and OAuth in my OpenAPI document?">

They do not become tool arguments. On a hosted Scalar server, the installation stores the credential or forwards the caller's own, so the model never sees a secret. See [MCP authentication with OAuth](/learn/mcp/mcp-oauth).

</scalar-detail>

## Related

- **Learn:** [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server) · [Generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi)
- **Docs:** [MCP servers](/products/agent/mcp) · [OpenAPI validator](/tools/openapi-validator)
- **Product:** [Scalar Agent](/products/agent) — hosted MCP servers from your OpenAPI document, with OAuth
