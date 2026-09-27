# How to generate an MCP server from OpenAPI

*Last updated: September 2026*

To generate an MCP server from OpenAPI, you turn the operations in your OpenAPI document into MCP tools: each tool gets a name (usually from the `operationId`), a description (from the `summary` and `description`), and a JSON Schema input built from the operation's parameters and request body, and its handler sends the matching HTTP request to your API. You can write that server yourself with an official MCP SDK, generate its code with a tool, or use a hosted service that serves the tools straight from the document.

All three approaches work. They differ in how much code you own, where the server runs, and how well the result holds up when your API has hundreds of operations. This guide walks through each approach honestly, shows a complete, tested TypeScript server built on the official SDK, and then covers the design decisions that decide whether an agent can actually use what you generated: tool selection, naming, descriptions, authentication, pagination, and tool-count limits.

**On this page**

- [Before you start: what you need](#before-you-start-what-you-need)
- [Three ways to get an MCP server from OpenAPI](#three-ways-to-get-an-mcp-server-from-openapi)
- [Approach 1: write it with the official SDK](#approach-1-write-it-with-the-official-sdk)
- [Approach 2: generate the server code](#approach-2-generate-the-server-code)
- [Approach 3: use a hosted MCP server](#approach-3-use-a-hosted-mcp-server)
- [Designing tools from operations](#designing-tools-from-operations)
- [Authentication: keep secrets away from the model](#authentication-keep-secrets-away-from-the-model)
- [Pagination and large responses](#pagination-and-large-responses)
- [Large APIs and tool-count limits](#large-apis-and-tool-count-limits)
- [Testing your server](#testing-your-server)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## Before you start: what you need

**A valid OpenAPI document.** Every approach reads it, so errors in it become errors in your tools. Run it through a validator first; the [OpenAPI validator](/tools/openapi-validator) or any linter will catch missing `operationId` values, broken `$ref` pointers, and schemas that do not parse. If you are new to the format, [what is OpenAPI](/learn/openapi/what-is-openapi) is a good primer.

**A decision about which operations an agent should reach.** This matters more than the tooling. A read-only agent that answers questions about orders needs five operations, not the 180 in your admin API.

**A clear idea of who will use the server.** A local server for your own team, a remote server shared with customers, and a public server for anyone all need different authentication. If you are unsure what MCP itself is, start with [what is MCP](/learn/mcp/what-is-mcp).

The examples here use the Scalar Galaxy example API at `https://galaxy.scalar.com`, whose OpenAPI 3.1 document is public at `https://galaxy.scalar.com/openapi.yaml`.

## Three ways to get an MCP server from OpenAPI

| | Hand-written with the SDK | Generated code | Hosted |
| --- | --- | --- | --- |
| **What you get** | A server you write and own, operation by operation | A project generated from your OpenAPI document that you build, deploy, and regenerate | A URL that serves tools from your OpenAPI document |
| **Where it runs** | Wherever you deploy it (local stdio or your own HTTP service) | Wherever you deploy it | The vendor's infrastructure |
| **Tool design control** | Total | Through config or OpenAPI extensions, plus editing generated code | Through the vendor's dashboard or config |
| **Keeping in sync with the API** | Manual | Regenerate on change | Re-upload or sync the document |
| **Auth handling** | You implement it | Generated scaffolding, you configure | Built in, vendor-specific |
| **Operational burden** | Highest | Medium | Lowest |
| **Examples (as of Sept 2026)** | [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk), Python SDK | [Speakeasy](https://www.speakeasy.com/docs/standalone-mcp/overview), [openapi-mcp-generator](https://github.com/harsha-iiiv/openapi-mcp-generator), [FastMCP `from_openapi`](https://gofastmcp.com/integrations/openapi) (runtime conversion) | [Scalar](/products/agent/mcp), [Speakeasy Gram](https://www.speakeasy.com/blog/release-gram-beta) |
| **Best for** | A small, carefully designed tool set, or tools that combine several API calls | Teams that must run the server inside their own infrastructure | Teams that want a working server without deploying one |

A note on Stainless: it used to generate MCP servers as code alongside its SDKs, but Stainless joined Anthropic in May 2026 and its hosted products are winding down. If you relied on it, our [Stainless wind-down guide](/resources/stainless-wind-down) covers where to go next, including options that are not Scalar.

## Approach 1: write it with the official SDK

Writing the server by hand sounds like the slow option, and for a whole API it is. For three to ten tools it is often the best option, because you decide exactly what the model sees. It is also the clearest way to understand what every generator and hosted service is doing for you.

We use the official TypeScript SDK. As of September 2026 its stable line is **v2**, which ships as `@modelcontextprotocol/server` and `@modelcontextprotocol/client` and [implements the 2026-07-28 specification](https://github.com/modelcontextprotocol/typescript-sdk). The older single package, `@modelcontextprotocol/sdk` (v1.x), still receives fixes but new projects should start on v2. The code below was run against `@modelcontextprotocol/server` 2.1.0, Zod 4, and Node.js 24.

### Step 1: pick the operation

This is the operation from the Galaxy OpenAPI document we will wrap:

```yaml
paths:
  /planets/{planetId}:
    get:
      tags:
        - Planets
      summary: Get a planet
      operationId: getPlanet
      security: []
      parameters:
        - $ref: '#/components/parameters/planetId'
      responses:
        '200':
          description: Planet Found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Planet'
        '404':
          $ref: '#/components/responses/NotFound'
```

The `planetId` parameter resolves to a required path parameter with an `integer` schema (`format: int64`).

### Step 2: install the SDK

```bash
mkdir galaxy-mcp && cd galaxy-mcp
npm init -y
npm pkg set type=module
npm install @modelcontextprotocol/server zod
npm install --save-dev tsx typescript @types/node
```

### Step 3: write the server

Save this as `server.ts`:

```ts
import { McpServer } from '@modelcontextprotocol/server'
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio'
import * as z from 'zod/v4'

// The base URL comes from `servers[0].url` in the OpenAPI document.
const BASE_URL = process.env.GALAXY_BASE_URL ?? 'https://galaxy.scalar.com'
// Credentials come from the environment, never from the model.
const API_TOKEN = process.env.GALAXY_API_TOKEN

const server = new McpServer({ name: 'galaxy', version: '1.0.0' })

server.registerTool(
  // operationId: getPlanet
  'get_planet',
  {
    title: 'Get a planet',
    // summary + description from the operation, rewritten for a model
    description:
      'Fetch one planet by its numeric ID. Returns name, type, description, ' +
      'physical properties and satellites. Use this when you already know the ID.',
    // path parameter `planetId` (schema: integer, format: int64)
    inputSchema: z.object({
      planetId: z.number().int().positive().describe('The ID of the planet, for example 1'),
    }),
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ planetId }) => {
    const response = await fetch(`${BASE_URL}/planets/${encodeURIComponent(planetId)}`, {
      headers: {
        Accept: 'application/json',
        ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
      },
    })

    const body = await response.text()

    if (!response.ok) {
      // Tool errors go back to the model as content so it can recover.
      return {
        isError: true,
        content: [{ type: 'text', text: `GET /planets/${planetId} failed with ${response.status}: ${body}` }],
      }
    }

    return { content: [{ type: 'text', text: body }] }
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
```

A few choices in this code are deliberate:

- **The input schema mirrors the OpenAPI parameter.** `integer` becomes `z.number().int()`, the path parameter is required, and the description tells the model what a valid value looks like.
- **The description is rewritten for a model.** "Get a planet" is fine for a sidebar. A model also needs to know what comes back and when to pick this tool over a search tool.
- **Errors are results, not exceptions.** The [tools specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) separates protocol errors from tool execution errors. An HTTP 404 is a tool execution error: return `isError: true` with a message the model can act on.
- **The token lives in the environment.** The model never sees it, and it never appears in a tool argument.

### Step 4: connect a client

For a local stdio server, the client starts the process. With Claude Code:

```bash
claude mcp add galaxy -- npx tsx /absolute/path/to/galaxy-mcp/server.ts
```

Or in Cursor's `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "galaxy": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/galaxy-mcp/server.ts"],
      "env": { "GALAXY_API_TOKEN": "your-token" }
    }
  }
}
```

Ask "What is planet 1 like?" and the model calls `get_planet` with `{ "planetId": 1 }`.

### Step 5: serve it over HTTP instead

A stdio server only reaches people who install it locally. To share it, serve the same tool over Streamable HTTP. In SDK v2 you pass a factory to `createMcpHandler`, because the 2026-07-28 revision has no protocol sessions and each request can get a fresh server. Install the Node adapter first with `npm install @modelcontextprotocol/node`:

```ts
import { createServer } from 'node:http'
import { McpServer, createMcpHandler } from '@modelcontextprotocol/server'
import { toNodeHandler } from '@modelcontextprotocol/node'
import * as z from 'zod/v4'

// A fresh server per request: the 2026-07-28 revision has no protocol sessions.
const buildServer = (): McpServer => {
  const server = new McpServer({ name: 'galaxy', version: '1.0.0' })

  server.registerTool(
    'get_planet',
    {
      title: 'Get a planet',
      description: 'Fetch one planet by its numeric ID.',
      inputSchema: z.object({ planetId: z.number().int().positive() }),
      annotations: { readOnlyHint: true },
    },
    async ({ planetId }) => {
      const response = await fetch(`https://galaxy.scalar.com/planets/${planetId}`)
      return { isError: !response.ok, content: [{ type: 'text', text: await response.text() }] }
    },
  )

  return server
}

const handler = toNodeHandler(createMcpHandler(buildServer))

createServer((request, response) => {
  if (request.url === '/mcp') return handler(request, response)
  response.writeHead(404).end()
}).listen(3000, () => console.log('MCP server listening on http://localhost:3000/mcp'))
```

Before you expose this beyond your machine, add the pieces a public HTTP server needs: `Origin` validation (the [Streamable HTTP spec](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http) requires it to prevent DNS rebinding), TLS, rate limiting, and real authorization. [Remote MCP servers](/learn/mcp/remote-mcp-servers) and [MCP OAuth](/learn/mcp/mcp-oauth) cover those in depth.

### Doing this for every operation

You can loop over the OpenAPI document and register one tool per operation instead of writing each by hand. That is exactly what generators do, and it is where the tricky parts live: `$ref` resolution, recursive schemas, `readOnly` properties, parameter name collisions, and non-JSON bodies. We wrote a tested, 140-line version of that loop, with the pitfalls explained line by line, in [OpenAPI to MCP server: how the mapping works](/learn/mcp/openapi-to-mcp-server).

## Approach 2: generate the server code

Code generators read your OpenAPI document and write a complete server project. You get something you can read, modify, and run inside your own infrastructure, which is the main reason to choose this route.

Options as of September 2026:

- **[Speakeasy](https://www.speakeasy.com/docs/standalone-mcp/overview)** generates standalone TypeScript MCP servers from OpenAPI. Its documentation describes each operation becoming a tool, customization of tool names and descriptions through OpenAPI extensions, optional Cloudflare Worker configuration, and generated Anthropic Desktop Extensions. Speakeasy's own MCP guides are thorough and worth reading alongside this one. Speakeasy also [open-sourced its generator under AGPL-3.0](https://www.speakeasy.com/blog/partnering-with-google) in September 2026.
- **[openapi-mcp-generator](https://github.com/harsha-iiiv/openapi-mcp-generator)** is an MIT-licensed open source CLI on npm that generates a TypeScript MCP server project from an OpenAPI document.
- **[FastMCP](https://gofastmcp.com/integrations/openapi)** (Python) builds a server from an OpenAPI document at runtime with `FastMCP.from_openapi()`, using route maps to decide which operations become tools, resources, or nothing. Its own docs are candid that curated servers perform significantly better than auto-converted ones, and recommend conversion mainly for prototyping.

What to check before you commit to a generator:

- **Where do customizations live?** If tool descriptions live in the generated code, regeneration overwrites them. Prefer generators that read overrides from the OpenAPI document or a config file.
- **How does it handle your worst schemas?** Try it on your largest, most recursive, most `oneOf`-heavy operation, not on a pet store.
- **What auth flows does it scaffold?** API keys are easy. OAuth for a remote server is where generated projects differ most.
- **Which MCP revision does it target?** Code generated against a 2025 revision still works with most clients through backward compatibility, but you want a path to 2026-07-28.

If you want a wider comparison of generators and hosted options, see [best MCP server generators (2026)](/library/best-mcp-server-generators-2026).

## Approach 3: use a hosted MCP server

A hosted service takes your OpenAPI document and gives you an MCP endpoint. You do not deploy, patch, or scale anything. The trade-off is that the server runs on the vendor's infrastructure and follows the vendor's design choices.

**Scalar** hosts MCP servers from OpenAPI documents. The workflow, from the [MCP servers docs](/products/agent/mcp):

<scalar-steps>
<scalar-step title="Upload your OpenAPI document">

In the [Scalar Dashboard](https://dashboard.scalar.com), create an MCP server and select your API. Scalar parses and indexes the document for search and execution.

</scalar-step>
<scalar-step title="Choose what agents may do">

For each operation, decide whether it is exposed for **search** (lookup only, no requests are sent) or **execute** (real, authenticated requests to your API). Leave everything else out.

</scalar-step>
<scalar-step title="Configure authentication">

Store one credential on the installation (global auth), or let each caller pass their own through a header you nominate (passthrough). Agents never receive a stored credential.

</scalar-step>
<scalar-step title="Connect a client">

Share the installation URL, which looks like `https://mcp.scalar.com/mcp/YOUR_INSTALL_ID`. Installations are private by default: your team connects with a personal access token, and people outside your team sign in with OAuth once you grant them access.

</scalar-step>
</scalar-steps>

With Claude Code, connecting looks like this:

```bash
claude mcp add galaxy \
  https://mcp.scalar.com/mcp/YOUR_INSTALL_ID \
  --header "Authorization: YOUR_PERSONAL_ACCESS_TOKEN" \
  --transport http
```

The design choice that sets Scalar apart is how it handles large APIs. Instead of registering one tool per operation, Scalar's server exposes a small fixed set of tools: one to summarize the available API descriptions, one to search operations (returning a minified slice of the OpenAPI document for just the matching endpoints), and one to execute a request. In [our benchmark against the Zoom Meetings API](/blog/posts/2026-03-05-agent-scalar), a native one-tool-per-endpoint server needed 183 tools and roughly 89,000 schema tokens, while Scalar's three tools cost about 400 tokens. That was our benchmark on our product, so treat it as a data point rather than a law, but the shape of the result holds for any large API.

Where Scalar is not the right fit: Scalar MCP servers are hosted by Scalar, not code you deploy, and custom domains are [not supported for MCP servers yet](/products/agent/authentication/customer-access). If the server must run inside your own network, generated code or the SDK is the better choice. Hosted MCP servers are included on the Pro plan and above; see [pricing](/pricing).

**Speakeasy Gram** is another hosted option. Speakeasy [describes Gram](https://www.speakeasy.com/blog/release-gram-beta) as a platform where you upload an OpenAPI document, group operations into toolsets, compose custom tools from smaller ones, and optionally add an OAuth 2.1 proxy. Our [Scalar vs Speakeasy comparison](/resources/compare/speakeasy) covers the wider product differences.

## Designing tools from operations

Whichever approach you choose, these decisions determine whether the model picks the right tool with the right arguments.

### Choose operations deliberately

Start from tasks, not endpoints. List the ten things an agent should do with your API, then find the operations those tasks need. Leave out internal, admin, deprecated, and bulk-destructive operations unless you have a specific reason. A good first server is often read-only.

### Name tools from the operationId

The `operationId` is the natural tool name: it is unique within the document, stable across releases, and already meaningful. The [tools specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) recommends names of 1 to 128 characters using only ASCII letters, digits, underscore, hyphen, and dot, so `getPlanet`, `get_planet`, and `planets.get` are all fine. If an operation has no `operationId`, add one to the OpenAPI document rather than letting a generator invent `get_planets_planetid`, which will change the moment the path changes.

Keep names verb-first and specific. `search_orders` and `get_order` are easier for a model to choose between than `orders` and `order_details`.

### Write descriptions for a model

The tool description is the only documentation the model reads. Good descriptions answer three questions: what does this do, what does it return, and when should I use it instead of a similar tool? Pull the `summary` and `description` from OpenAPI, then edit. Mention important constraints ("dates are ISO 8601 in UTC", "returns at most 100 results"). Put parameter guidance in each property's `description`, and include an example value.

If your OpenAPI descriptions are written for humans in a sidebar, improving them helps both audiences: the same sentence that tells a model when to call a tool tells a developer when to call the endpoint.

### Add annotations

MCP tool annotations such as `readOnlyHint` and `destructiveHint` tell hosts how careful to be. Map them from the HTTP method as a starting point (`GET` is read-only, `DELETE` is destructive), then correct the exceptions, such as a `POST /search` that is read-only.

### Consider composite tools

Some tasks need three calls in sequence: look up a customer, find their open invoice, send a reminder. A generator produces three tools and hopes the model chains them correctly. A hand-written `send_invoice_reminder` tool does it in one step. Composite tools are the strongest argument for writing at least part of the server yourself, or for a hosted product that supports them.

## Authentication: keep secrets away from the model

The rule is simple: credentials never go in tool arguments and never come back in tool results. The server attaches them when it calls your API. There are two patterns.

**A server-held credential.** The server stores one API key or token and uses it for every call. On stdio, it comes from an environment variable, as in the example above. On a hosted server, it is stored against the installation. This is right for internal tools and for per-customer installations. Scalar calls this [global auth](/products/agent/authentication/shared-key).

**Passthrough.** Each caller supplies their own API credential, and the server forwards it upstream per request without storing it. This is right when every user must act as themselves in your API. Scalar documents this as [public MCP with passthrough auth](/products/agent/authentication/public-passthrough).

Separately, a remote server needs to decide who may connect at all. For HTTP servers the MCP specification defines an OAuth-based authorization framework; [MCP OAuth](/learn/mcp/mcp-oauth) explains the flow. Map your OpenAPI `securitySchemes` to these decisions: an `apiKey` scheme usually becomes a server-held or passthrough header, while an `oauth2` scheme usually means per-user tokens. [OpenAPI security schemes](/learn/openapi/openapi-security-schemes) covers the scheme types.

## Pagination and large responses

APIs paginate because responses get big. Models have the same problem, only worse, because every token of a tool result goes into the context window.

- **Expose pagination parameters explicitly.** Keep `limit`, `offset`, or `cursor` in the tool's input schema with a sensible default and a description of the maximum.
- **Return the next cursor.** If the API returns a `next` link or cursor, make sure it survives into the tool result so the model can ask for more.
- **Default small.** A default page of 10 or 20 items is usually enough for a model to decide what to do next.
- **Trim fields.** A list tool rarely needs every nested object. Returning IDs, names, and statuses and leaving details to a `get_` tool keeps results small.
- **Use structured content when shape matters.** A tool can declare an `outputSchema` and return `structuredContent` alongside a text block, which helps clients that process results programmatically.

## Large APIs and tool-count limits

Every tool definition is sent to the model on every turn. For a 20-operation API that is fine. For a 200-operation API it hurts in three ways: token cost, slower responses, and worse tool selection because the model has to choose among many similar names.

Clients also impose limits. VS Code's agent mode enforces a [hard cap of 128 tools per request](https://github.com/microsoft/vscode/issues/290356) across all connected servers, and other clients have limits or degrade in similar ways. Your server shares that budget with every other server the user has installed.

Strategies, from simplest to most involved:

1. **Curate.** Expose the operations your target tasks need. This alone solves most cases.
2. **Split by audience.** Publish separate servers or toolsets for billing, support, and analytics rather than one server with everything.
3. **Use search-then-execute.** Expose a tool that searches the API description and returns just the relevant operation's schema, plus a generic tool that executes a request. This keeps the tool list constant as the API grows, at the cost of an extra step per task. Scalar's hosted servers use this pattern.
4. **Compose.** Replace chains of low-level calls with a few task-level tools.

## Testing your server

- **Validate the OpenAPI document first.** Many tool bugs are OpenAPI bugs.
- **Use the MCP Inspector.** The official [Inspector](https://github.com/modelcontextprotocol/inspector) (`npx @modelcontextprotocol/inspector`) lets you list tools, read their schemas, and call them without a model in the loop.
- **Write a client test.** The SDK's client package can start your server and call tools in a normal test runner, which is how the examples on this page were checked.
- **Test with real prompts.** Ask a model to do each target task and watch which tools it picks. Wrong picks usually mean a description problem, not a code problem.
- **Point at a mock first.** Running tools against a [mock server](/tools/mock-server/getting-started) generated from the same OpenAPI document lets you test destructive tools safely.

## Common mistakes

- **One tool per endpoint for a big API.** It works in a demo and fails in a real client with other servers installed.
- **Missing or unstable operationId values.** Tool names change when paths change, and saved prompts break.
- **Passing API keys as tool arguments.** The key ends up in the model's context, in logs, and possibly in a prompt-injected exfiltration.
- **Throwing on HTTP errors.** A thrown exception becomes a protocol error the model cannot learn from. Return `isError: true` with the status and message.
- **Inlining every `$ref`.** Recursive schemas never finish inlining, and shared schemas get duplicated into every tool. See the fix in [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server).
- **Asking the model for server-assigned fields.** If `id` is `readOnly` in your schema, it should not be a required tool input.
- **Following a 2024 tutorial.** HTTP+SSE with a `GET /sse` endpoint is deprecated. Use Streamable HTTP.

## Frequently asked questions

<scalar-detail title="Can I automatically convert any OpenAPI document into an MCP server?">
Yes, mechanically. Every operation can become a tool with an input schema. Whether the result is useful depends on the size of the API, the quality of your descriptions, and your schemas. For small, well-described APIs, automatic conversion works well. For large APIs, curate the operations or use a search-then-execute design.
</scalar-detail>

<scalar-detail title="Should I use @modelcontextprotocol/sdk or @modelcontextprotocol/server?">
For new TypeScript projects in 2026, use @modelcontextprotocol/server (and @modelcontextprotocol/client for clients). That is the v2 line, which implements the 2026-07-28 specification. @modelcontextprotocol/sdk is the v1 package and still receives bug and security fixes, so existing servers do not need to migrate immediately.
</scalar-detail>

<scalar-detail title="Does the MCP server replace my API?">
No. The MCP server calls your API. Your API keeps serving your apps, partners, and SDKs. See MCP vs API for the full comparison.
</scalar-detail>

<scalar-detail title="How do I handle authentication for a generated MCP server?">
Keep credentials out of tool arguments. Either the server holds one credential (from an environment variable or stored on a hosted installation), or each user passes their own and the server forwards it. For remote servers, also decide who may connect, which the MCP specification handles with OAuth.
</scalar-detail>

<scalar-detail title="How many tools should an MCP server have?">
As few as the tasks require. Tens of tools are usually fine. Past that, token costs and client limits start to bite; VS Code, for example, caps requests at 128 tools across all servers. Large APIs benefit from curation, splitting, or a search-then-execute design.
</scalar-detail>

<scalar-detail title="Is Scalar's MCP server generated code I can deploy?">
No. Scalar MCP servers are hosted by Scalar and served from mcp.scalar.com. You configure them in the dashboard from your OpenAPI document. If you need code you deploy yourself, use the official SDK or a code generator.
</scalar-detail>

## Related

- **Learn:** [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server) · [What is MCP?](/learn/mcp/what-is-mcp) · [Remote MCP servers](/learn/mcp/remote-mcp-servers)
- **Docs:** [MCP servers in Scalar](/products/agent/mcp)
- **Product:** [Scalar MCP & Agent](/products/agent) — a hosted MCP server from your OpenAPI document in minutes, with OAuth and per-operation control.

---

*Claims about other products are based on their public documentation, repositories, and blog posts as of 26 September 2026, linked inline. The code on this page was tested on that date with @modelcontextprotocol/server 2.1.0 against the Scalar Galaxy API. Scalar wrote this guide, so read the hosted-option section with that in mind; if something here is wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues).*
