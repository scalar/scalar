# REST API to MCP server: an architecture guide for API providers

*Last updated: September 2026*

*By Marc Laventure · Reviewed by: pending*

Turning a REST API into an MCP server means deciding which of your endpoints an AI agent should be allowed to call, describing each one as an MCP tool the model can understand, and running a server in front of your API that handles authentication, pagination and errors on the agent's behalf. The protocol work is small. The design work is where the quality of the result is decided.

This guide is for API providers making those decisions. It does not repeat the element-by-element mapping from OpenAPI to MCP tool definitions; [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server) covers that, and [how to generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi) compares hand-written, generated and hosted servers. Here we look at the architecture: which endpoints become tools, how to name and describe them, what to do with credentials, how to page through large results, and how to stay inside a model's tool budget when your API has hundreds of operations.

**On this page**

- [What changes when an agent is the client](#what-changes-when-an-agent-is-the-client)
- [Three architectures for an API MCP server](#three-architectures-for-an-api-mcp-server)
- [Choosing which endpoints become tools](#choosing-which-endpoints-become-tools)
- [Naming and describing tools](#naming-and-describing-tools)
- [Authentication: whose credentials reach your API](#authentication-whose-credentials-reach-your-api)
- [Pagination and large responses](#pagination-and-large-responses)
- [Errors the model can recover from](#errors-the-model-can-recover-from)
- [The tool budget for large APIs](#the-tool-budget-for-large-apis)
- [A worked example in TypeScript](#a-worked-example-in-typescript)
- [Hosting: stateless servers and remote transport](#hosting-stateless-servers-and-remote-transport)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## What changes when an agent is the client

A REST API is designed for a developer who reads the documentation once, writes code, and then runs that code thousands of times. The developer does the interpretation up front. An agent does it on every turn. Each time a model decides what to do next, it reads the names, descriptions and schemas of every tool it has been given, and picks one. If you want a refresher on the protocol itself, start with [what is MCP](/learn/mcp/what-is-mcp).

That has three consequences for anyone wrapping an API:

1. **Descriptions are the interface.** A developer who misreads an endpoint finds out in testing. A model that misreads a tool description calls the wrong tool in production, with a real user watching.
2. **Everything costs tokens.** Tool definitions sit in the model's context window. So do the results. A list endpoint that returns 200 fields per record is fine for code and expensive for a model.
3. **The caller can be steered by text.** A model follows instructions it finds in its context, including instructions hidden in data your API returns. Your server is now part of a security boundary. [MCP server security](/learn/mcp/mcp-server-security) goes deeper on that.

None of this means your REST API was designed badly. It means the MCP server is a new product surface with a different user, and it deserves its own design pass rather than a mechanical export.

## Three architectures for an API MCP server

There are three broad ways to lay out an MCP server in front of a REST API. Most real servers are one of these or a mix.

**One tool per endpoint.** Every operation in your OpenAPI document becomes a tool. This is what most generators produce by default. It is complete and easy to keep in sync, but the tool list grows with your API.

**Curated and composite tools.** You pick the operations that matter for agent tasks, rename and redescribe them, and sometimes combine several calls into one tool (for example `find_customer_invoices` that looks up a customer and then lists their invoices). This gives the best results for a known set of tasks and is the most work to maintain.

**Dynamic discovery.** The server exposes a small fixed set of tools, typically one to search the API, one to fetch the details of an operation, and one to execute a request. The model discovers what it needs at run time instead of receiving every definition up front. The tool list stays the same size no matter how large the API gets.

| | One tool per endpoint | Curated and composite | Dynamic discovery |
| --- | --- | --- | --- |
| Tools the model sees | One per operation (can be hundreds) | Usually 5 to 30 | A small fixed set, often 3 |
| Context cost at start | Grows with the API | Low | Low and constant |
| Calls per task | Usually one per step | Fewest (composite tools do several steps) | One or two extra for search and lookup |
| Precision on known tasks | Good for small APIs, drops as the list grows | Highest | Good, depends on search quality |
| Maintenance | Regenerate from OpenAPI | Hand-maintained, drifts from the API | Regenerate the search index from OpenAPI |
| Best for | Small, focused APIs | A handful of high-value workflows | Large APIs, many APIs, internal catalogs |

Scalar's hosted MCP servers use the third layout by default: a tool to summarize the available API descriptions, one to search operations and return a minified slice of the OpenAPI document, and one to execute the request. You still choose which operations are searchable and which can be executed. The [MCP product docs](/products/agent/mcp) show how that selection works.

## Choosing which endpoints become tools

Whichever layout you use, you need an inventory. Go through your operations and ask four questions about each one.

**Would an agent ever need this?** Health checks, webhook management, OAuth token endpoints and admin-only routes rarely belong in an agent's toolbox. Neither do deprecated operations. If you cannot imagine a user asking an assistant to do it, leave it out.

**What happens if it is called by mistake?** Reading a record is cheap to get wrong. Deleting one is not. Start with read operations, add writes that are easy to undo, and treat irreversible actions (deleting data, sending messages, moving money) as a separate decision with its own review. MCP lets you mark tools with `readOnlyHint` and `destructiveHint` annotations so clients can ask for confirmation, but the [specification is explicit](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) that clients must treat annotations from untrusted servers as untrusted, so do not rely on them as your only control.

**How big is the response?** An endpoint that returns a full export or an unbounded list needs a paged or trimmed tool, not a direct mapping.

**Does it overlap with another tool?** Two tools that both "get a customer" by different keys confuse models. Either merge them into one tool with an optional parameter or make the difference obvious in the names.

Take a small API with these operations as an example:

```text
GET    /planets              list planets
GET    /planets/{id}         get one planet
POST   /planets              create a planet
PUT    /planets/{id}         replace a planet
DELETE /planets/{id}         delete a planet
POST   /planets/{id}/image   upload an image
POST   /auth/token           exchange credentials for a token
GET    /me                   current user
```

A reasonable first release exposes `list_planets`, `get_planet` and `create_planet`, leaves `DELETE` for later with a confirmation requirement, drops `/auth/token` entirely (credentials are the server's job, not the model's), and skips the image upload because binary bodies are awkward to pass through a model. `/me` is worth keeping: it lets the agent answer "which account am I connected to?" without guessing.

In Scalar you make this selection per operation in the dashboard, where each operation can be off, searchable only (the model can read its definition but no request is sent), or executable.

## Naming and describing tools

The MCP specification says tool names should be 1 to 128 characters, case-sensitive, and limited to ASCII letters, digits, underscores, hyphens and dots. Within those rules, a few conventions make models noticeably better at choosing:

- **Verb first, specific noun second.** `list_planets`, `get_planet`, `create_planet`. Avoid bare nouns like `planets`.
- **One naming style per server.** Do not mix `getPlanet` and `list_moons`.
- **Prefix only when needed.** Clients that load several servers may prefix tool names with the server name to avoid collisions, so you rarely need `galaxy_list_planets` yourself.
- **Keep `operationId` stable.** If your names come from OpenAPI, a renamed `operationId` silently renames a tool that users may have allowed or blocked by name.

Descriptions matter more than names. A good tool description answers three questions: when should I use this, what do I get back, and what are the limits? Compare:

```json
{
  "name": "get_planet",
  "description": "Get planet"
}
```

```json
{
  "name": "get_planet",
  "description": "Fetch one planet by its numeric ID, including physical properties and moons. Use this when you already know the ID; use list_planets to find one. Returns an error if the ID does not exist."
}
```

Put the important part first. Claude Code, for example, [truncates each tool description at 2,048 characters by default](https://code.claude.com/docs/en/mcp), so a long description whose key sentence is at the end may never reach the model. If your OpenAPI `description` fields are written for humans browsing a reference, it is often worth writing a separate, shorter summary for agents. [MCP API documentation](/learn/mcp/mcp-api-documentation) covers how to write for both audiences from one source.

Parameter descriptions deserve the same care. Give formats and examples (`"ISO 8601 date, for example 2026-09-26"`), use `enum` for fixed values, and mark required fields as required. Flatten path, query and body parameters into a single input object so the model is not asked to understand HTTP.

## Authentication: whose credentials reach your API

Authentication in an API MCP server has two separate layers, and mixing them up causes most of the security bugs we see.

1. **Who may connect to the MCP server.** The client proves the user is allowed to use this server, usually with OAuth as described in [MCP OAuth](/learn/mcp/mcp-oauth), or with an API key in a header for headless use.
2. **How the server calls your REST API.** This is a separate credential that the server presents upstream.

The MCP authorization specification forbids **token passthrough**: an MCP server must not accept a token that was not issued for it, and must not forward the token it received from the client to another API. The [security best practices page](https://modelcontextprotocol.io/specification/2026-07-28/basic/security_best_practices) explains why: the upstream API cannot tell who is really calling, audit trails break, and a stolen token becomes a way to reach every service that trusts it.

That leaves two legitimate patterns for the upstream credential:

- **A stored credential.** The server holds one API key, service account or OAuth grant and uses it for every call. Simple, but every user acts with the same permissions, so it suits read-only public data or single-tenant internal tools.
- **A per-user credential supplied separately.** Each user provides their own API key in a header the server is configured to forward, or completes a separate OAuth flow with your API. The key is the user's credential for your API, not the token that authenticated them to the MCP server.

Scalar supports both. An installation can store one credential ([global auth](/products/agent/authentication/shared-key)) or forward a caller-supplied credential in a header you nominate without storing it ([passthrough auth](/products/agent/authentication/public-passthrough)). The [authentication overview](/products/agent/authentication) shows how these combine with the connection layer. Whichever you choose, map your OpenAPI security schemes carefully; [OpenAPI security schemes](/learn/openapi/openapi-security-schemes) explains the options.

One rule applies to every pattern: credentials never appear in tool arguments. If a model can see a key, it can repeat it, log it, or be tricked into sending it somewhere else.

## Pagination and large responses

MCP has its own pagination, but it is for listing tools, resources and prompts (`tools/list` returns a `nextCursor`). It does nothing for your data. Paging through a large collection is your tool's job.

The pattern that works best is to expose the paging parameters explicitly and return a continuation value the model can pass back:

- Accept `limit` (with a small default and a hard maximum) and a cursor or offset.
- Return the items plus `next_cursor` or `next_offset`, and `null` when there are no more.
- Say in the description how to get the next page.
- Trim each item to the fields an agent needs. Link to a detail tool for the rest.

Size limits are real. Claude Code warns when a tool result exceeds 10,000 tokens and cuts results off at 25,000 by default. A tool that returns everything will either be truncated or crowd out the conversation. If an agent genuinely needs a whole dataset, consider a tool that filters or aggregates on the server ("count open invoices by status") instead of returning raw rows for the model to add up.

If your API already uses cursor pagination, pass the cursor through as an opaque string. Do not ask the model to construct cursors or compute offsets from page numbers. SDKs solve the same problem with auto-paginating iterators; the [SDK generator's pagination docs](/products/sdk-generator/pagination) show how Scalar declares a paging scheme once and generates helpers from it.

## Errors the model can recover from

MCP distinguishes two kinds of error. **Protocol errors** (an unknown tool, a malformed request) come back as JSON-RPC errors. **Tool execution errors** come back as a normal result with `isError: true` and a text explanation. The [tools specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) asks clients to pass execution errors to the model so it can correct itself, which makes the wording of your errors part of your interface.

Translate HTTP failures into instructions:

- **404:** not `Not Found`, but `No planet with ID 99. Call list_planets to find a valid ID.`
- **422:** not `Unprocessable Entity`, but `discoveredAt must be an ISO 8601 date in the past.`
- **429:** not `Too Many Requests`, but `Rate limited. Wait 30 seconds before retrying; do not loop.`

The shape is always the same: say what went wrong, then what to do next. Never return stack traces or upstream response bodies that might contain secrets.

## The tool budget for large APIs

Every tool definition costs context, and clients have limits of their own. Devin Desktop (formerly Windsurf) [caps its legacy Cascade agent at 100 tools in total](https://docs.devin.ai/desktop/cascade/mcp) across all servers. Claude Code takes a different approach and [defers tool definitions until they are needed](https://code.claude.com/docs/en/mcp) with tool search, which helps, but only tool names and server instructions load up front, so vague names still hurt.

The numbers add up quickly. In [our benchmark against the Zoom Meetings API](/blog/posts/2026-03-05-agent-scalar), a one-tool-per-endpoint server produced 183 tools and about 89,000 tokens of schema, while Scalar's three discovery tools cost around 400 tokens. That is our benchmark of our own product, so treat it as one data point, but the shape holds for any large API: definition cost grows linearly with operations unless you change the architecture.

Options, roughly in order of effort:

1. **Expose fewer operations.** The inventory exercise above often halves the list.
2. **Split by audience.** A billing server and a support server, each with 15 tools, beat one server with 30 tools that nobody needs all of.
3. **Use dynamic discovery.** Search, describe and execute tools keep the list constant.
4. **Let the agent write code.** Anthropic's engineering team described agents calling MCP tools from generated code rather than one tool call at a time, and reported [one workflow dropping from 150,000 to 2,000 tokens](https://www.anthropic.com/engineering/code-execution-with-mcp). If your users run coding agents, a typed SDK may be the better interface anyway; [MCP vs SDK](/learn/mcp/mcp-vs-sdk) weighs the two.

## A worked example in TypeScript

Here is a hand-written `list_planets` tool for the public Scalar Galaxy demo API, using version 2 of the official TypeScript SDK (`@modelcontextprotocol/server` 2.1.0). It shows the decisions above in about 60 lines: a trimmed response, explicit paging, an output schema, a read-only annotation, credentials from the environment, and errors written for a model.

```ts
import { McpServer } from '@modelcontextprotocol/server'
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio'
import * as z from 'zod/v4'

const BASE_URL = process.env.GALAXY_BASE_URL ?? 'https://galaxy.scalar.com'
const API_TOKEN = process.env.GALAXY_API_TOKEN

type Planet = { id: number; name: string; type: string }

// Turn HTTP failures into sentences a model can act on.
const explain = (status: number): string => {
  if (status === 401 || status === 403) return 'The API rejected the credentials. Ask the user to reconnect the server.'
  if (status === 404) return 'Nothing exists at that ID. Call list_planets to find a valid ID.'
  if (status === 422) return 'The API rejected the arguments. Check the types and ranges in the tool schema.'
  if (status === 429) return 'Rate limited. Wait before retrying and do not loop.'
  return `The Galaxy API failed with HTTP ${status}. Try again later.`
}

const server = new McpServer({ name: 'galaxy', version: '1.0.0' })

server.registerTool(
  'list_planets',
  {
    title: 'List planets',
    description:
      'List planets one page at a time, returning only id, name and type. ' +
      'Use get_planet for full details. If next_offset is not null, call again with that offset to get more.',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(50).default(20).describe('Planets per page, 1 to 50'),
      offset: z.number().int().min(0).default(0).describe('How many planets to skip'),
    }),
    outputSchema: z.object({
      planets: z.array(z.object({ id: z.number(), name: z.string(), type: z.string() })),
      next_offset: z.number().nullable(),
    }),
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ limit, offset }) => {
    const url = new URL('/planets', BASE_URL)
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('offset', String(offset))

    const response = await fetch(url, {
      headers: { Accept: 'application/json', ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}) },
    })

    if (!response.ok) {
      return { isError: true, content: [{ type: 'text', text: explain(response.status) }] }
    }

    const body = (await response.json()) as { data: Planet[]; meta: { total: number } }
    // Keep the payload small: three fields per planet instead of the full object.
    const planets = body.data.slice(0, limit).map(({ id, name, type }) => ({ id, name, type }))
    const next = offset + planets.length
    const result = { planets, next_offset: next < body.meta.total ? next : null }

    return {
      structuredContent: result,
      content: [{ type: 'text', text: JSON.stringify(result) }],
    }
  },
)

await server.connect(new StdioServerTransport())
```

Save it as `planets.ts`, install `@modelcontextprotocol/server`, `zod` and `tsx`, and call the tool with the MCP Inspector's CLI mode:

```bash
npx @modelcontextprotocol/inspector --cli npx tsx planets.ts \
  --method tools/call --tool-name list_planets --tool-arg limit=5 --format json
```

We ran this on 26 September 2026 and got back a `structuredContent` object with the trimmed planets and a `next_offset`. The returned text block repeats the same JSON, which the specification recommends for clients that do not read structured content yet. [How to test MCP servers](/learn/mcp/test-mcp-servers) builds on this example with unit tests and CI checks.

## Hosting: stateless servers and remote transport

The example above runs over stdio, which is fine for development and for tools that run on the user's machine. An API provider almost always wants a remote server that speaks Streamable HTTP, so users connect with a URL instead of installing anything. [Remote MCP servers](/learn/mcp/remote-mcp-servers) compares the two transports in detail.

The current MCP revision, [2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/changelog), makes remote hosting simpler. It removed the `initialize` handshake and the `Mcp-Session-Id` header, so every request carries its own protocol version and client capabilities and any instance behind a load balancer can answer it. It also says `tools/list` must not vary per connection, though it may vary with the caller's authorization. If a workflow needs state across calls (a draft order, an open transaction), return an explicit handle from one tool and accept it as an argument on the next, and check on every call that the handle belongs to the caller. Older clients still negotiate the 2025 session model, so test against both if your users have not all upgraded.

If you would rather not run any of this, Scalar hosts the server for you. You upload an OpenAPI document, choose the operations, configure upstream authentication and access, and connect clients to an installation URL. There is no server code to deploy or scale. The [getting started guide](/products/agent/getting-started) walks through it.

## Common mistakes

- **Exporting every endpoint on day one.** Start with the tasks users will actually ask for, then add.
- **Human-oriented descriptions.** "Retrieves the resource" tells a model nothing. Say when to use the tool and what it returns.
- **Credentials as tool arguments.** The server holds or forwards credentials. The model never sees them.
- **Forwarding the MCP access token upstream.** The specification forbids it. Use a separate upstream credential.
- **Unbounded list tools.** Always cap `limit` and return a continuation value.
- **Bare HTTP errors.** `400 Bad Request` gives the model nothing to fix. Explain the problem and the next step.
- **Renaming tools casually.** Tool names are part of users' allow and block lists. Treat them like public API.
- **Ignoring the tool budget.** A server with 200 tools may work in a demo and fail next to three other servers in a real client.

## Frequently asked questions

<scalar-detail title="Can I turn any REST API into an MCP server?">
Yes, as long as an agent can call it over HTTP with credentials the server controls. The quality of the result depends on your descriptions, how you limit response sizes, and which endpoints you expose. An OpenAPI document makes the conversion much faster because it already contains names, parameters, schemas and security schemes.
</scalar-detail>

<scalar-detail title="Should every REST endpoint become an MCP tool?">
Usually not. Leave out authentication endpoints, admin routes, health checks, deprecated operations and anything an assistant would never be asked to do. Treat destructive operations as a separate decision. For large APIs, consider a search and execute design so the model is not handed hundreds of tool definitions at once.
</scalar-detail>

<scalar-detail title="How many tools can an MCP server have?">
The protocol sets no limit, but clients and models do. Devin Desktop's legacy Cascade agent allows 100 tools in total across servers, and every definition consumes context in clients that load them up front. Most well-performing servers expose a few dozen tools at most, or use dynamic discovery.
</scalar-detail>

<scalar-detail title="How should an MCP server handle API authentication?">
Separate who connects to the MCP server from how the server calls your API. Authenticate connections with OAuth or an API key, and use either a stored upstream credential or a per-user credential forwarded from a header you nominate. Never forward the token the client used to authenticate to the MCP server, and never put credentials in tool arguments.
</scalar-detail>

<scalar-detail title="How do MCP tools handle pagination?">
MCP's own cursor pagination only applies to listing tools, resources and prompts. For your data, give list tools a capped limit parameter and a cursor or offset, return the next value (or null when finished), and say in the description how to fetch the next page.
</scalar-detail>

<scalar-detail title="Do I need to write code to turn my API into an MCP server?">
No. You can write one with the official SDKs, generate one from your OpenAPI document, or use a hosted service. Scalar hosts MCP servers built from an OpenAPI document, with tool selection, upstream authentication and access control configured in the dashboard instead of in code.
</scalar-detail>

## Related

- **Learn:** [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server) · [Generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi) · [MCP server security](/learn/mcp/mcp-server-security) · [MCP vs SDK](/learn/mcp/mcp-vs-sdk)
- **Docs:** [MCP servers](/products/agent/mcp) · [MCP authentication](/products/agent/authentication)
- **Product:** [Scalar MCP](/products/agent/mcp) — hosted MCP servers from your OpenAPI document, with per-operation tool selection and delegated auth

*Specification details refer to MCP revision 2026-07-28. Client limits and behaviour were checked against each vendor's documentation on 26 September 2026. The benchmark figures come from Scalar's own March 2026 test and are not an independent measurement.*
