# How to build an MCP server (TypeScript and Python)

*Last updated: October 2026*

To build an MCP server, you write a small program that registers one or more tools, each with a name, a description, and a JSON Schema for its inputs, and then connect that program to a transport: stdio for a server that runs on the user's machine, or Streamable HTTP for a server other people reach over the network. The official SDKs for [TypeScript](https://github.com/modelcontextprotocol/typescript-sdk) and [Python](https://github.com/modelcontextprotocol/python-sdk) handle the protocol, so a working server is about 40 lines. If your tools wrap an API you already describe with OpenAPI, you can skip most of the code and generate or host the server instead.

This guide shows both: a complete, tested server in TypeScript and in Python, how to connect each to Claude Code and Cursor, how to test it with the MCP Inspector, and when to generate or host a server instead of writing one. The code was run on 7 October 2026 against the versions listed at the end of the page.

**On this page**

- [What an MCP server is](#what-an-mcp-server-is)
- [Choose your path](#choose-your-path)
- [Before you start](#before-you-start)
- [Build an MCP server in TypeScript](#build-an-mcp-server-in-typescript)
- [Build an MCP server in Python](#build-an-mcp-server-in-python)
- [Connect it to Claude Code and Cursor](#connect-it-to-claude-code-and-cursor)
- [Test it with the MCP Inspector](#test-it-with-the-mcp-inspector)
- [Serve it over HTTP](#serve-it-over-http)
- [Turn an existing API into an MCP server](#turn-an-existing-api-into-an-mcp-server)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## What an MCP server is

An MCP server is a program that exposes tools, resources, and prompts to AI applications through the [Model Context Protocol](https://modelcontextprotocol.io), so that a model inside Claude, Cursor, VS Code, or your own agent can discover what the server offers and call it. The protocol defines the messages; your server defines what the tools do. For the full picture of hosts, clients, servers, and the three primitives, read [What is MCP?](/learn/mcp/what-is-mcp)

## Choose your path

There are three ways to end up with an MCP server. They differ in how much code you own and where the server runs.

| | Write it with the official SDK | Generate it from OpenAPI | Use a hosted server |
| --- | --- | --- | --- |
| **What you do** | Write each tool by hand | Point a generator or runtime library at your OpenAPI document | Upload your OpenAPI document and pick the operations to expose |
| **What you get** | A program you run and deploy | A generated project or a runtime proxy you run and deploy | A URL |
| **Control over tool design** | Total | Through config, extensions, or editing generated code | Through a dashboard |
| **Where it runs** | Anywhere: your laptop, a container, a serverless function | Anywhere you deploy it | The vendor's infrastructure |
| **Best for** | A small, curated set of tools, or tools with their own logic | Teams that must run the server inside their own network | Teams that want a working server without deploying anything |
| **This guide** | The rest of this page | [Generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi) | [Hosted MCP servers on Scalar](/products/agent/mcp) |

Write it yourself when the tools do real work: combining several API calls, reading local files, or enforcing rules a generator cannot know about. Generate or host it when every tool is a thin wrapper over an HTTP operation you already document.

## Before you start

- **Decide what the agent should be able to do.** Three well-described tools beat thirty generated ones. Start read-only.
- **Pick a runtime.** The TypeScript example needs Node.js 24 and npm. The Python example needs Python 3.10 or newer and [uv](https://docs.astral.sh/uv/) (pip works too).
- **Know which protocol revision you are targeting.** Both SDKs below implement revision [2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28), which removed protocol sessions and the `initialize` handshake. Tutorials written for the 2024 and 2025 revisions still explain the ideas, but their wire details are out of date.

The example server manages orders. It keeps three orders in memory so it runs anywhere with no API key; in a real server you would replace the array with calls to your API or database.

## Build an MCP server in TypeScript

The TypeScript SDK's stable line is v2, published as [`@modelcontextprotocol/server`](https://www.npmjs.com/package/@modelcontextprotocol/server) for servers and `@modelcontextprotocol/client` for clients. The older single package `@modelcontextprotocol/sdk` is v1 and still receives fixes, but new projects should start on v2.

### Step 1: create the project

```bash
mkdir orders-mcp && cd orders-mcp
npm init -y
npm pkg set type=module
npm install @modelcontextprotocol/server zod
npm install --save-dev tsx typescript @types/node
```

If you use TypeScript 6 or newer with a `tsconfig.json`, add `"types": ["node"]` to `compilerOptions`; the SDK's published types reference `Buffer`. Running with `tsx`, as below, needs no `tsconfig.json` at all.

### Step 2: write the server

Save this as `server.ts`:

```ts
import { McpServer } from '@modelcontextprotocol/server'
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio'
import * as z from 'zod/v4'

// In-memory data so the example runs anywhere. Replace with calls to your API or database.
const ORDERS = [
  { id: 'ord_1001', customer: 'Ada Lovelace', status: 'shipped', total: 42.5 },
  { id: 'ord_1002', customer: 'Grace Hopper', status: 'pending', total: 120 },
  { id: 'ord_1003', customer: 'Ada Lovelace', status: 'paid', total: 15.25 },
]

const server = new McpServer({ name: 'orders', version: '1.0.0' })

server.registerTool(
  'search_orders',
  {
    title: 'Search orders',
    description:
      'Find orders by customer name and/or status (pending, paid, shipped, cancelled). ' +
      'Returns at most 20 matches with id, customer, status and total. Use get_order for one order.',
    inputSchema: z.object({
      customer: z.string().optional().describe('Case-insensitive match on the customer name'),
      status: z.enum(['pending', 'paid', 'shipped', 'cancelled']).optional(),
    }),
    annotations: { readOnlyHint: true },
  },
  async ({ customer, status }) => {
    const results = ORDERS.filter(
      (o) =>
        (!customer || o.customer.toLowerCase().includes(customer.toLowerCase())) &&
        (!status || o.status === status),
    ).slice(0, 20)
    return { content: [{ type: 'text', text: JSON.stringify(results) }] }
  },
)

server.registerTool(
  'get_order',
  {
    title: 'Get an order',
    description: 'Fetch one order by its ID, for example ord_1001.',
    inputSchema: z.object({ orderId: z.string().describe('The order ID') }),
    annotations: { readOnlyHint: true },
  },
  async ({ orderId }) => {
    const order = ORDERS.find((o) => o.id === orderId)
    if (!order) {
      // An isError result goes back to the model as content it can recover from.
      return { isError: true, content: [{ type: 'text', text: `No order with id ${orderId}` }] }
    }
    return { content: [{ type: 'text', text: JSON.stringify(order) }] }
  },
)

await server.connect(new StdioServerTransport())
```

What each part does:

- **`McpServer`** holds the tools and answers protocol requests such as `tools/list` and `tools/call`.
- **`registerTool`** takes a name, metadata, and a handler. The Zod schema becomes the JSON Schema a client shows the model, so the `describe()` strings matter: they are the only documentation the model reads for each argument.
- **`annotations`** tell hosts how careful to be. `readOnlyHint: true` says the tool changes nothing. Add `destructiveHint: true` on tools that delete or overwrite.
- **Errors are results, not exceptions.** Returning `isError: true` with a message lets the model try again with a different ID. A thrown exception becomes a protocol error the model cannot learn from.
- **`StdioServerTransport`** reads JSON-RPC from standard input and writes to standard output. The client starts your process and owns its lifetime.

Do not `console.log` in a stdio server. Standard output is the protocol channel, so stray output corrupts the stream. Use `console.error` for diagnostics.

### Step 3: run it

```bash
npx tsx server.ts
```

A stdio server waits silently for a client. Nothing happening is correct. The next two sections connect a client and run the Inspector.

## Build an MCP server in Python

The Python SDK is the [`mcp`](https://pypi.org/project/mcp/) package. Version 2 renamed the `FastMCP` class to `MCPServer`; if you find a tutorial that imports `mcp.server.fastmcp`, it was written for v1 and will not import on v2.

### Step 1: create the project

```bash
mkdir orders-mcp && cd orders-mcp
uv init
uv add "mcp[cli]"
```

The `cli` extra adds the `mcp` command, which gives you `mcp run` and `mcp dev`. With pip, `pip install "mcp[cli]"` does the same.

### Step 2: write the server

Save this as `server.py`:

```python
from mcp.server import MCPServer
from mcp.server.mcpserver.exceptions import ToolError

# In-memory data so the example runs anywhere. Replace with calls to your API or database.
ORDERS = [
    {"id": "ord_1001", "customer": "Ada Lovelace", "status": "shipped", "total": 42.5},
    {"id": "ord_1002", "customer": "Grace Hopper", "status": "pending", "total": 120.0},
    {"id": "ord_1003", "customer": "Ada Lovelace", "status": "paid", "total": 15.25},
]

mcp = MCPServer("orders", version="1.0.0")


@mcp.tool()
def search_orders(customer: str | None = None, status: str | None = None) -> list[dict]:
    """Find orders by customer name and/or status (pending, paid, shipped, cancelled).

    Returns at most 20 matches with id, customer, status and total. Use get_order for one order.
    """
    results = [
        o
        for o in ORDERS
        if (customer is None or customer.lower() in o["customer"].lower())
        and (status is None or o["status"] == status)
    ]
    return results[:20]


@mcp.tool()
def get_order(order_id: str) -> dict:
    """Fetch one order by its ID, for example ord_1001."""
    for order in ORDERS:
        if order["id"] == order_id:
            return order
    # ToolError becomes an isError result with this message, so the model can recover.
    raise ToolError(f"No order with id {order_id}")


if __name__ == "__main__":
    mcp.run()
```

The differences from the TypeScript version are mostly what the SDK does for you:

- **Type hints are the schema.** `customer: str | None = None` becomes an optional string property in the tool's JSON Schema. The docstring becomes the tool description, so write it for a model.
- **Return values become structured content.** A `list` or `dict` is serialized and also returned as `structuredContent`, which clients can use directly.
- **Raise `ToolError` for errors the model should see.** Any other exception is reported to the client as a generic "Error executing tool" with the detail hidden, which is safer for unexpected crashes but useless for a missing record.
- **`mcp.run()`** defaults to stdio.

### Step 3: run it

```bash
uv run mcp run server.py
```

Or run `uv run python server.py`, which does the same thing through the `if __name__ == "__main__"` block.

## Connect it to Claude Code and Cursor

Both clients start a stdio server as a child process, so they need the command and an absolute path. The formats below were checked against [Claude Code's MCP documentation](https://code.claude.com/docs/en/mcp) and [Cursor's MCP documentation](https://cursor.com/docs/context/mcp) on 7 October 2026. For VS Code, Claude Desktop, and claude.ai, see [MCP server configuration](/learn/mcp/mcp-server-configuration).

### Claude Code

TypeScript:

```bash
claude mcp add orders -- npx tsx /absolute/path/to/orders-mcp/server.ts
```

Python:

```bash
claude mcp add orders -- uv run --directory /absolute/path/to/orders-mcp mcp run server.py
```

Add `--scope project` to write the server into a `.mcp.json` file in the repository so your team shares it. Then ask Claude Code something like "Which orders does Ada have?" and watch it call `search_orders`.

### Cursor

Cursor reads `.cursor/mcp.json` in the project (or `~/.cursor/mcp.json` globally). TypeScript:

```json
{
  "mcpServers": {
    "orders": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/orders-mcp/server.ts"]
    }
  }
}
```

Python:

```json
{
  "mcpServers": {
    "orders": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/orders-mcp", "mcp", "run", "server.py"]
    }
  }
}
```

If a tool needs a credential, pass it through an `env` object in this file or through the environment Claude Code inherits. Credentials never go in tool arguments; the model would see them.

## Test it with the MCP Inspector

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) is the official test client. It has a browser UI and a command-line mode. The command-line mode is the fastest way to confirm a server works, and it is easy to script in CI. Run these from the project directory:

```bash
# List the tools the server exposes
npx -p @modelcontextprotocol/inspector mcp-inspector --cli npx tsx server.ts --method tools/list

# Call one
npx -p @modelcontextprotocol/inspector mcp-inspector --cli npx tsx server.ts \
  --method tools/call --tool-name get_order --tool-arg orderId=ord_1001
```

For the Python server, replace `npx tsx server.ts` with `uv run mcp run server.py` (and `orderId=` with `order_id=`). The SDK also has `uv run mcp dev server.py`, which opens the Inspector UI with the server attached.

The Inspector's README gives the shorter `npx @modelcontextprotocol/inspector` form. On npm 11 that form failed for us with "could not determine executable to run", because the package ships two binaries, which is why the commands above name the `mcp-inspector` binary explicitly; the same failure makes `mcp dev` exit with "Dev server failed" on such machines. Also keep options such as `--directory` out of the server command when you pass it to the Inspector, which parses them as its own.

Three things to check in the Inspector before you connect a real client: the tool list is what you expect, each input schema has the descriptions you wrote, and calling a tool with a bad argument returns an error result rather than crashing the server. [How to test MCP servers](/learn/mcp/test-mcp-servers) goes further, with unit tests for each tool and evals with a real model.

## Serve it over HTTP

A stdio server only reaches people who install it. To share a server with a team, with customers, or with web-based hosts such as claude.ai, serve it over Streamable HTTP, the remote transport in the current specification.

In Python that is one argument:

```bash
uv run mcp run server.py --transport streamable-http
```

This listens on `http://127.0.0.1:8000/mcp`. For deployment, call `mcp.run(transport="streamable-http", host="0.0.0.0", port=8000, stateless_http=True)` from your own entry point so any instance behind a load balancer can answer any request.

In TypeScript, `createMcpHandler` from `@modelcontextprotocol/server` turns a server factory into a web-standard `fetch` handler that works on Cloudflare Workers, Deno, and Bun directly, and on Node.js through `@modelcontextprotocol/node`. A public HTTP server also needs `Origin` validation, TLS, rate limiting, and real authorization before launch. [How to host an MCP server](/learn/mcp/host-mcp-server) has a deploy-ready version of this server, a comparison of hosting platforms, and the launch checklist. [MCP OAuth](/learn/mcp/mcp-oauth) covers who may connect.

## Turn an existing API into an MCP server

If the question behind "how do I build an MCP server" is really "how do I let agents use my API", writing tools by hand is usually the wrong place to start. Every operation in an OpenAPI document already has a name, a description, and a schema, which are exactly the three things a tool needs.

Two routes:

- **Generate or convert it.** Code generators and runtime libraries read the OpenAPI document and produce a server you run. [Generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi) compares them and shows the mapping; [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server) covers the hard cases such as `$ref`, `oneOf`, and file uploads.
- **Host it.** Scalar reads your OpenAPI document and serves the MCP server at `https://mcp.scalar.com/mcp/YOUR_INSTALL_ID`. You choose per operation whether an agent may search it (lookup only) or execute it (real, authenticated requests), store the upstream credential on the installation or let each caller pass their own, and share the URL. Installations are private by default; team members connect with a Personal Access Token and people outside your team sign in with OAuth. The [MCP servers guide](/products/agent/mcp) walks through it in a few minutes. Hosted MCP servers are included on the Pro plan and above, not on the Free plan; see [pricing](/pricing).

Scalar's hosted servers are not the right choice when the server must run inside your own network, when you want to hand-write tools with their own logic, or when you need a custom domain, which is [not supported for MCP servers yet](/products/agent/authentication/customer-access). In those cases use the SDK code above or a generator. Whichever route you take, curate: a large API exposed as one tool per endpoint overwhelms the model's context and the client's tool limits, which is why the hosted server uses a small, fixed set of search-and-execute tools instead.

## Common mistakes

- **Logging to stdout in a stdio server.** It corrupts the protocol stream. Log to stderr.
- **Vague descriptions.** "Get order" tells the model nothing about when to use the tool or what comes back. Say what it returns, its limits, and when to prefer a sibling tool.
- **Throwing instead of returning an error.** In TypeScript return `isError: true`; in Python raise `ToolError`. The model can act on a message; it cannot act on a crash.
- **Relative paths in client config.** Claude Code and Cursor start the server from their own working directory. Use absolute paths.
- **Importing v1 modules on v2.** `@modelcontextprotocol/sdk` and `mcp.server.fastmcp` are the old lines. Use `@modelcontextprotocol/server` and `mcp.server.MCPServer`.
- **Putting credentials in tool arguments.** The model sees every argument. Read secrets from the environment or store them on a hosted installation.
- **Shipping an HTTP+SSE endpoint.** The `GET /sse` transport from 2024 is deprecated. Use Streamable HTTP.

## Frequently asked questions

<scalar-detail title="How do I create an MCP server?">
Install the official SDK for TypeScript (@modelcontextprotocol/server) or Python (mcp), create a server object, register one or more tools with a name, a description and an input schema, and connect a transport: stdio for local use or Streamable HTTP for remote use. The complete examples on this page are about 40 lines each.
</scalar-detail>

<scalar-detail title="Which language should I build an MCP server in?">
Whichever your team already uses. The TypeScript and Python SDKs are both maintained by the MCP project and both implement the current specification. TypeScript is the natural fit for serverless platforms such as Cloudflare Workers; Python is the natural fit if your tools call Python libraries or data tools.
</scalar-detail>

<scalar-detail title="How do I turn my API into an MCP server for AI agents?">
If you have an OpenAPI document, do not write the tools by hand. Either generate a server from the document with a code generator or runtime library and deploy it yourself, or upload the document to a hosted service such as Scalar, which serves the MCP server for you and lets you choose which operations agents may search or execute. See Generate an MCP server from OpenAPI for the comparison.
</scalar-detail>

<scalar-detail title="Do I need to host an MCP server to use it?">
No. A stdio server runs on the user's machine and is started by the client. You only need hosting when other people, or web-based hosts such as claude.ai, must reach the server over the network.
</scalar-detail>

<scalar-detail title="What is the difference between a tool, a resource and a prompt?">
A tool is a function the model can call to do something. A resource is data the host can read and include in context, addressed by a URI. A prompt is a reusable template the user can invoke. Most servers start with tools only.
</scalar-detail>

<scalar-detail title="How many tools should an MCP server expose?">
As few as the tasks require. Tens of tools are fine; hundreds hurt tool selection and hit client limits. For a large API, curate the operations, split servers by audience, or use a search-then-execute design that keeps the tool list constant as the API grows.
</scalar-detail>

## Related

- **Learn:** [What is MCP?](/learn/mcp/what-is-mcp) · [Generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi) · [How to host an MCP server](/learn/mcp/host-mcp-server) · [How to test MCP servers](/learn/mcp/test-mcp-servers)
- **Docs:** [MCP servers in Scalar](/products/agent/mcp)
- **Product:** [Scalar MCP](/products/agent/mcp) — a hosted MCP server from your OpenAPI document, with per-operation control and OAuth

---

*The code on this page was run on 7 October 2026 with @modelcontextprotocol/server 2.3.1, @modelcontextprotocol/client 2.3.1 and zod 4.6.5 on Node.js 24.21.0, and with mcp 2.3.0 on Python 3.11.9 under uv 0.8.15, against MCP specification revision 2026-07-28. Client configuration formats were checked against each vendor's documentation the same day. Scalar wrote this guide and hosts MCP servers, so read the hosted-option section with that in mind. If something is wrong or out of date, [open an issue](https://github.com/scalar/scalar/issues).*
