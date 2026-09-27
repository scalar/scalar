# Remote MCP servers: how they work and where to host them

*Last updated: September 2026*

A remote MCP server is a Model Context Protocol server that runs on a network host and is reached over HTTP, instead of being started as a local subprocess on the same machine as the AI application. The client connects to a URL such as `https://mcp.example.com/mcp`, authenticates, and then lists and calls the server's tools exactly as it would with a local server.

That one change, a URL instead of a command, is why remote servers have taken over for anything a team shares. Nobody installs Node or Python to use them, the provider can update them without asking anyone to upgrade, and access can be granted and revoked per person with OAuth. The trade-off is that you now operate a network service, with everything that implies about authentication, uptime and abuse.

This guide explains the transport remote servers use, how they differ from local servers, the realistic hosting options, and the exact configuration to connect one to Claude, Cursor and VS Code.

**On this page**

- [The short answer](#the-short-answer)
- [How a remote MCP server works](#how-a-remote-mcp-server-works)
- [Local vs remote MCP servers](#local-vs-remote-mcp-servers)
- [When a remote server is the right choice](#when-a-remote-server-is-the-right-choice)
- [MCP server hosting options](#mcp-server-hosting-options)
- [Connect a remote MCP server to Claude, Cursor and VS Code](#connect-a-remote-mcp-server-to-claude-cursor-and-vs-code)
- [Testing a remote MCP server](#testing-a-remote-mcp-server)
- [Security checklist](#security-checklist)
- [Common mistakes](#common-mistakes)
- [Hosting remote MCP servers with Scalar](#hosting-remote-mcp-servers-with-scalar)
- [Frequently asked questions](#frequently-asked-questions)

## The short answer

If you are new to the protocol itself, start with [What is MCP?](/learn/mcp/what-is-mcp). The quick version: MCP defines how an AI application (the host, with an MCP client inside it) discovers and calls tools, reads resources and fetches prompts from an MCP server. The protocol is the same whether the server is local or remote. Only the transport changes.

- A **local** server uses the stdio transport. The client launches the server as a child process and they exchange JSON-RPC messages over standard input and output.
- A **remote** server uses the Streamable HTTP transport. The client sends each JSON-RPC message as an HTTP POST to a single endpoint and reads the reply as JSON or as a short Server-Sent Events stream.

Both are defined in the [MCP specification's transports section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports). Everything else in this article follows from that difference.

## How a remote MCP server works

The [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http) was introduced in protocol version 2025-03-26 as the replacement for the older HTTP+SSE transport from 2024-11-05. The server exposes one URL, the MCP endpoint, and the client talks to it with plain HTTP requests.

In the current revision of the specification, **2026-07-28**, the flow is deliberately simple:

1. Every client message is its own `POST` to the MCP endpoint, with an `Accept` header listing both `application/json` and `text/event-stream`.
2. The server answers a request with either a single JSON object or an SSE stream scoped to that one request. The stream can carry progress notifications before the final response.
3. Protocol metadata travels with every request. The body carries the protocol version and client capabilities in `_meta`, and the transport mirrors key fields into headers (`MCP-Protocol-Version`, `Mcp-Method`, and `Mcp-Name` for tool calls) so gateways and load balancers can route without parsing JSON.
4. Closing the response stream cancels the request.

Here is a real `tools/list` request against a server that implements 2026-07-28:

```bash
curl -X POST https://mcp.example.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: tools/list' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {
      "_meta": {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientInfo": { "name": "curl", "version": "1.0.0" },
        "io.modelcontextprotocol/clientCapabilities": {}
      }
    }
  }'
```

### What changed in 2026-07-28

This matters because much of what you will read online describes the earlier shape. The [2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog) made MCP stateless: the `initialize` handshake is gone, protocol-level sessions and the `Mcp-Session-Id` header are gone, the standalone `GET` stream is gone, and SSE resumability via `Last-Event-ID` is gone. Long-lived change notifications now use a `subscriptions/listen` request instead.

Revisions 2025-03-26 through 2025-11-25 used sessions, an `initialize` call before anything else, and an optional `GET` stream for server-initiated messages. Plenty of servers and clients in the wild still speak those versions, and the specification describes how a modern client detects an older server and falls back. When you test a server by hand, check which version it implements first.

For a hosted server this change is good news. A stateless server can sit behind an ordinary load balancer with no sticky sessions, which is exactly what you want from something that has to scale with the number of agents calling it.

### The deprecated HTTP+SSE transport

You will still see URLs ending in `/sse`. Those belong to the 2024-11-05 HTTP+SSE transport, which has been deprecated since 2025-03-26 and is formally listed as Deprecated in the current specification. Linear, for example, [documents `https://mcp.linear.app/sse` as a deprecated fallback](https://linear.app/docs/mcp) next to its primary `https://mcp.linear.app/mcp` endpoint. New servers should not offer SSE-only endpoints.

## Local vs remote MCP servers

| | Local (stdio) | Remote (Streamable HTTP) |
| --- | --- | --- |
| How the client connects | Launches a command, talks over stdin/stdout | Sends HTTP POST requests to a URL |
| Where the code runs | The user's machine | A server, container or serverless platform |
| Install step for users | Runtime plus package (for example `npx`, `uvx`, Docker) | Paste a URL |
| Authentication | Credentials from environment variables; the spec says stdio servers SHOULD NOT use the OAuth flow | OAuth 2.1 per the MCP authorization spec, or API keys in headers |
| Updates | Each user upgrades their own copy | Provider deploys once |
| Access to local files and apps | Direct | None, unless you expose them some other way |
| Works in web-based hosts (claude.ai, ChatGPT, API connectors) | No | Yes, if reachable from the public internet |
| Who pays for compute | The user | The provider |
| Typical examples | Filesystem, Git, Playwright browser automation | GitHub, Stripe, Sentry, Linear, Notion |

The authentication row comes straight from the [authorization specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization): HTTP-based implementations SHOULD follow the OAuth flow, while stdio implementations SHOULD NOT and should read credentials from the environment instead. We cover the OAuth side in depth in [MCP OAuth](/learn/mcp/mcp-oauth).

## When a remote server is the right choice

Pick a remote server when any of these are true:

- **The tools wrap a network API.** If every tool call ends up as an HTTPS request to your API anyway, running a local process in between adds install friction and nothing else.
- **Users should not handle raw credentials.** OAuth lets a user sign in through a browser and revoke access later, without pasting an API key into a JSON file.
- **You need web-based hosts.** Anthropic's help centre is explicit that custom connectors in Claude must be ["reachable over the public internet from Anthropic's IP ranges"](https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp). A stdio server on a laptop cannot serve those.
- **You want one place to control access.** Revoking a person, scoping tools, rate limiting and audit logs are all easier when every call passes through your infrastructure.

Stay local when the server's job is local: reading the working directory, driving a browser on the user's machine, or talking to a database on `localhost`. Microsoft's [Playwright MCP](https://github.com/microsoft/playwright-mcp) is a good example; it runs with `npx @playwright/mcp@latest` because it controls a browser next to the user.

If you are still deciding whether MCP is the right interface at all, [MCP vs API](/learn/mcp/mcp-vs-api) and [MCP vs function calling](/learn/mcp/mcp-vs-function-calling) cover that question.

## MCP server hosting options

There are four realistic ways to put an MCP server on the internet. They differ mostly in how much code you own afterwards.

### 1. Use the vendor's hosted server

If you want to use someone else's API from an agent, check whether they already host an MCP server. Many do, including GitHub, Stripe, Sentry, Linear, Notion, Atlassian, Supabase and Cloudflare. You do not host anything; you paste a URL. See [MCP server examples](/learn/mcp/mcp-server-examples) for a verified list with endpoints.

### 2. Write your own and deploy it

You write the server with an official SDK (the [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk), Python SDK, and others), then deploy it like any HTTP service: a container on your usual platform, or a serverless function. Cloudflare publishes templates for this; its [remote MCP server guide](https://developers.cloudflare.com/agents/model-context-protocol/guides/remote-mcp-server/) starts from:

```bash
npm create cloudflare@latest -- remote-mcp-server-authless --template=cloudflare/ai/demos/remote-mcp-authless
```

This gives you full control. It also means you own the OAuth implementation, the tool definitions, upgrades to new protocol revisions (2026-07-28 was a breaking change), and on-call.

### 3. Put a gateway in front of a stdio server

Some teams already have a stdio server and expose it through a proxy that speaks Streamable HTTP on one side and stdio on the other. It works as a bridge. Be careful with it in production: a single process shared by many users is rarely what the original author designed for, and the authentication layer still has to come from somewhere.

### 4. Use a managed platform that generates tools from your API description

If the MCP server exists to expose an HTTP API you already describe with OpenAPI, the tools can be derived from that document instead of written by hand. A managed platform hosts the endpoint, runs the OAuth flow and makes the upstream calls. [Generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi) and [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server) compare the approaches, and [our roundup of MCP server generators](/library/best-mcp-server-generators-2026) looks at the vendors.

The honest rule of thumb: if your tools are mostly thin wrappers over API operations, options 1 or 4 save you a lot of code. If your tools do real work of their own (multi-step logic, local computation, stateful workflows), write the server yourself.

## Connect a remote MCP server to Claude, Cursor and VS Code

Configuration formats below were checked against each vendor's documentation on 26 September 2026. Replace the URL with your server's endpoint.

### Claude Code

[Claude Code's MCP docs](https://code.claude.com/docs/en/mcp) use `claude mcp add` with `--transport http`:

```bash
claude mcp add --transport http my-api https://mcp.example.com/mcp
```

Add `--scope project` to write the server into a `.mcp.json` file in the repository so your team shares it, or `--scope user` to make it available in all your projects. If the server needs a static header instead of OAuth, pass it with `--header`:

```bash
claude mcp add --transport http my-api https://mcp.example.com/mcp \
  --header "Authorization: Bearer YOUR_TOKEN"
```

For OAuth servers, run `/mcp` inside Claude Code and follow the browser sign-in. The project file looks like this:

```json
{
  "mcpServers": {
    "my-api": {
      "type": "http",
      "url": "https://mcp.example.com/mcp"
    }
  }
}
```

### Claude (web and desktop)

In Claude, remote servers are added as custom connectors. Per [Anthropic's help article](https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp), individual users go to **Customize > Connectors**, choose **Add custom connector**, and paste the server URL. OAuth client credentials can be set under advanced settings if the server needs them. On Team and Enterprise plans an owner adds the connector under organization settings first. The same article notes that Free users are limited to one custom connector.

### Cursor

[Cursor's MCP docs](https://cursor.com/docs/context/mcp) read `.cursor/mcp.json` in the project or `~/.cursor/mcp.json` globally. A remote server only needs `url`:

```json
{
  "mcpServers": {
    "my-api": {
      "url": "https://mcp.example.com/mcp"
    }
  }
}
```

Add a `headers` object for static credentials. For servers that require a pre-registered OAuth client, Cursor accepts an `auth` object with `CLIENT_ID`, and optionally `CLIENT_SECRET` and `scopes`.

### VS Code

VS Code uses `.vscode/mcp.json` with a top-level `servers` key and an explicit `type`. Per the [VS Code MCP configuration reference](https://code.visualstudio.com/docs/agents/reference/mcp-configuration), you can prompt for secrets with `inputs` instead of hard-coding them:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "my-api-token",
      "description": "API token for my-api",
      "password": true
    }
  ],
  "servers": {
    "my-api": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${input:my-api-token}"
      }
    }
  }
}
```

Leave out `inputs` and `headers` for OAuth servers; VS Code runs the flow itself. It also tries Streamable HTTP first and falls back to SSE for older servers.

### Model APIs

You can also skip the desktop client and attach a remote server to a model request. OpenAI's Responses API takes a tool of `"type": "mcp"` with a `server_url` ([docs](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)), and Anthropic's Messages API has an [MCP connector](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector) that takes an `mcp_servers` array. Both only work with servers reachable over HTTP; neither can launch a stdio process.

## Testing a remote MCP server

Three checks catch most problems before a user does.

**1. Unauthenticated requests are rejected properly.** A protected server should answer with `401` and a `WWW-Authenticate` header pointing at its protected resource metadata. This is what an MCP client uses to start OAuth:

```bash
curl -i -X POST https://mcp.example.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

```http
HTTP/2 401
www-authenticate: Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource/mcp"
```

**2. Tool listing works with valid credentials.** Use the `tools/list` request from earlier with a real token, or open the server in the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) (`npx @modelcontextprotocol/inspector`), which gives you a UI for listing and calling tools.

**3. A real client can complete the whole loop.** Add the server to Claude Code or VS Code and ask for something that requires a tool call. Watch for the browser sign-in, then check that the tool result is what you expect.

## Security checklist

A remote server is an internet-facing service that executes actions on behalf of people. The specification's [transport security section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http) and [authorization security considerations](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations) are short and worth reading in full. The essentials:

- **Serve over HTTPS.** Authorization server endpoints MUST use HTTPS, and redirect URIs MUST be `localhost` or HTTPS.
- **Validate the `Origin` header.** Servers MUST reject an invalid `Origin` with `403` to prevent DNS rebinding. When running locally, bind to `127.0.0.1`, not `0.0.0.0`.
- **Validate token audience.** Accept only tokens issued for your server, and never forward the client's token to an upstream API. The spec calls this token passthrough and forbids it.
- **Expose the fewest tools that do the job.** Every tool is something a prompt-injected model can call. Read-only by default is a sensible starting point.
- **Require confirmation for destructive actions.** Stripe, for example, [requires human confirmation](https://docs.stripe.com/mcp) for some write actions such as refunds.
- **Rate limit and log.** Agents retry, loop and fan out in ways people do not.

## Common mistakes

- **Shipping an SSE-only endpoint.** It is deprecated. Offer Streamable HTTP at `/mcp`.
- **Assuming the session model.** Code written for 2025-11-25 that relies on `Mcp-Session-Id` or an `initialize` call will not match a 2026-07-28 client. Decide which revisions you support and test both.
- **Putting API keys in shared config files.** A `.mcp.json` checked into Git is visible to everyone with repository access. Use OAuth, environment variables or VS Code `inputs`.
- **Not handling 401 correctly.** Clients discover your authorization server from the `401` response. If you return `403` or a redirect instead, OAuth never starts.
- **One tool per endpoint on a large API.** Hundreds of tool definitions eat the model's context window before the user has typed anything. Group, filter or search tools instead.
- **Hosting behind a VPN.** Web-based hosts cannot reach it. Desktop clients on the VPN can, which makes the bug look intermittent.

## Hosting remote MCP servers with Scalar

Scalar hosts MCP servers for you, built from the OpenAPI documents you already have. You do not deploy or maintain server code: you upload an API description, choose which operations agents may search or execute, and Scalar serves the endpoint at `https://mcp.scalar.com/mcp/YOUR_INSTALL_ID`. The [MCP guide](/products/agent/mcp) walks through it.

A few details that relate to the topics above:

- **Small, fixed tool surface.** Instead of one tool per endpoint, Scalar exposes a small set of tools that look up operation details when needed. Our [context window benchmark](/blog/posts/2026-03-05-agent-scalar) explains why that matters for large APIs.
- **OAuth since 17 March 2026.** Installations are private by default. Team members connect with a personal access token or OAuth, and people outside your team can sign in with OAuth via [access groups](/products/agent/authentication/customer-access). The unauthenticated response is a standard `401` with a `resource_metadata` link, as described in [MCP OAuth](/learn/mcp/mcp-oauth).
- **Upstream credentials stay server-side.** You either store one credential on the installation or let each caller pass their own through a nominated header. See [Authentication](/products/agent/authentication).
- **Current limitation:** custom domains are not supported for MCP servers yet, so the URL is always on `mcp.scalar.com`.

Connecting from Claude Code uses the command from our docs:

```bash
claude mcp add \
  YOUR_MCP_SERVER_NAME \
  https://mcp.scalar.com/mcp/YOUR_MCP_SERVER_ID \
  --header "Authorization: YOUR_PERSONAL_ACCESS_TOKEN" \
  --transport http
```

If you would rather connect from your own agent code, the [Agent SDK](/products/agent/integration/sdk) returns ready-made configuration for the OpenAI Agents SDK, the Vercel AI SDK and the Claude Agent SDK.

## Frequently asked questions

<scalar-detail title="What is the difference between a local and a remote MCP server?">
A local server runs as a subprocess on the user's machine and talks to the client over stdin and stdout. A remote server runs on a network host and the client reaches it over HTTP using the Streamable HTTP transport. The tools, resources and prompts work the same way in both cases; what changes is installation, authentication and who runs the compute.
</scalar-detail>

<scalar-detail title="Which transport should a remote MCP server use?">
Streamable HTTP. It has been the standard remote transport since protocol version 2025-03-26. The older HTTP+SSE transport is deprecated and should only be kept as a fallback for old clients.
</scalar-detail>

<scalar-detail title="Do remote MCP servers need OAuth?">
Authorization is optional in the MCP specification, and some servers are public or accept API keys in a header. For any server that acts on a user's data, OAuth 2.1 as defined in the MCP authorization spec is the recommended approach, because users sign in through a browser and can revoke access without rotating keys.
</scalar-detail>

<scalar-detail title="Can I use a remote MCP server from claude.ai or ChatGPT?">
Yes, as long as the server is reachable from the public internet. Claude calls them custom connectors, and the OpenAI Responses API accepts them as tools with type mcp. A server that only runs locally or behind a VPN cannot be used from web-based hosts.
</scalar-detail>

<scalar-detail title="Where should I host an MCP server?">
If the tools mostly wrap an existing HTTP API, use a managed platform or the API vendor's own hosted server. If the tools contain their own logic, deploy the server like any stateless HTTP service, on a container platform or a serverless provider such as Cloudflare Workers. The 2026-07-28 revision removed protocol sessions, which makes horizontal scaling simpler.
</scalar-detail>

<scalar-detail title="How do I test a remote MCP server?">
Send an unauthenticated POST with curl and confirm you get a 401 with a WWW-Authenticate header, then list tools with a valid token or through the MCP Inspector, and finally connect a real client such as Claude Code or VS Code and trigger a tool call.
</scalar-detail>

## Related

- **Learn:** [What is MCP?](/learn/mcp/what-is-mcp) · [MCP OAuth](/learn/mcp/mcp-oauth) · [MCP server examples](/learn/mcp/mcp-server-examples) · [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server)
- **Docs:** [MCP servers](/products/agent/mcp) · [Getting started with MCP & Agent](/products/agent/getting-started)
- **Product:** [Scalar MCP](/products/agent/mcp) — hosted MCP servers from your OpenAPI document, with OAuth built in

*Specification details refer to MCP revision 2026-07-28. Client configuration formats and third-party server URLs were checked against each vendor's documentation on 26 September 2026. If something has changed, tell us and we will update this page.*
