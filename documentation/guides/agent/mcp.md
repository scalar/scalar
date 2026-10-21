# MCP server generator: hosted MCP servers from OpenAPI

Turn your OpenAPI document into a hosted MCP server that AI agents can call in minutes, with no server code to write, deploy, or keep running.

Scalar spins up MCP Servers ([Model Context Protocol](https://modelcontextprotocol.io/)) from your OpenAPI documents and runs them for you at `mcp.scalar.com`. You choose which endpoints to expose (and which not), configure how each one behaves, and connect it to your LLM or AI Agent (Claude, Cursor, etc.).

<div class="flex gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Start free</a>
  <a class="t-editor__button button__secondary" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Book a demo</a>
</div>

## Why a hosted MCP server

Most "MCP server generators" hand you a code project. You then own a runtime, secrets, deploys, and a new service to patch every time your API changes. Scalar takes a different route: the MCP server is generated from your OpenAPI document and hosted by Scalar, so there is nothing to deploy. Tools map directly to the operations in your OpenAPI document, so the API description stays the source of truth.

- **OAuth built in.** Since March 2026, people outside your team can sign in to an MCP server through OAuth, gated by email or domain with access groups. Team members connect with a Personal Access Token. [How MCP OAuth works](/blog/posts/2026-03-25-scalar-mcp-oauth).
- **Your credentials stay on the server.** Store a shared upstream credential, choose credentials per access group, or let callers bring their own. Agents never receive the keys you store.
- **Built by the team behind Scalar's open-source API tooling.** The MIT-licensed [Scalar API Reference](/products/api-references) has 15.7k GitHub stars and is documented on Microsoft Learn for ASP.NET Core.

## Small context, any size of API

Dumping every operation of a large API into the first turn wastes an agent's context window. A Scalar MCP server exposes a small, fixed set of tools and fetches operation details just in time, when the agent actually needs them. Per endpoint, you decide whether a tool can only **search** the API description or **execute** real, authenticated requests.

## From OpenAPI to agent in one place

The OpenAPI document behind your MCP server can also power [API documentation](/products/docs), [SDKs](/products/sdk-generator), and the [API client](/products/api-client). If your document is generated from code, start with the framework guides for [.NET](/docs-for/dotnet), [FastAPI](/docs-for/fastapi), or [NestJS](/docs-for/nestjs). If MCP is new to you, the [learn hub](/learn) explains [remote MCP servers](/learn/mcp/remote-mcp-servers) and [MCP OAuth](/learn/mcp/mcp-oauth). Scalar customers such as Warp, Clerk, and PAR already publish their APIs with Scalar; see [customers](/customers).

Hosted MCP servers are included on the Pro, Business, and Enterprise plans. See [pricing](/pricing), [start free](https://dashboard.scalar.com/register), or [book a demo](https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a).

## Docs MCP and API MCP servers

The **Docs MCP** at `https://your-docs-domain/mcp` lets clients search and read your published documentation. A docs project's generated server follows the project's privacy: public docs allow anonymous access; private docs require admitted sign-in. These generated servers do not appear in MCP Studio's overview. Manage the docs connection from the docs project's settings.

Servers you create in **MCP Studio** expose tools for selected APIs. Copy the server's address from the dashboard, for example `https://mcp.scalar.com/@acme/payments`. Select an environment such as staging with `?env=staging`, or use a [custom domain](custom-domains.md). Older `/mcp/<installation-id>` addresses remain supported; use the dashboard's connection URL for new setups.

## Create an MCP Server

1. Open **MCP** in the [Scalar Dashboard](https://dashboard.scalar.com) and create a server for your API.
2. Select the API and environment you want to configure.
3. Open **Configure → MCP Tools** to select the operations to expose.
4. Open **Configure → Authorization** to decide how callers sign in and which credentials the server sends upstream.
5. Save your configuration, then copy the environment's connection URL from the dashboard.

See [MCP configuration](configuration.md) for variables, stored secrets, and limits.

## Connect to your MCP Server

For an OAuth Gated server, an OAuth-capable client starts sign-in when it connects. Team members can also use a Personal Access Token from [Account → API Keys](https://dashboard.scalar.com/account). Use the connection instructions shown by the dashboard for your environment's authorization mode.

### Claude Code

Add an OAuth connection without a static header:

```bash
claude mcp add --transport http payments https://mcp.scalar.com/@acme/payments
```

Replace the example URL with your server's URL and complete authentication in the client when prompted. For team-member access with a Personal Access Token:

```bash
claude mcp add --transport http payments https://mcp.scalar.com/@acme/payments \
  --header "Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN"
```

A team-member token cannot call tools that require [per-access-group credentials](authentication/customer-access.md#sharing-one-server-with-many-customers), because it has no access group.

## Tools

Open the API and environment in your MCP server, then use **Configure → MCP Tools** to choose which operations clients may discover or execute. Keep operations that should not make requests in search-only mode.

| Mode | Description |
| --- | --- |
| Search | Makes an operation available for lookup without sending an API request. |
| Execute | Allows an authenticated request to the upstream API. |

## Large responses and files

A tool result has a size limit. When a response is too large to return whole, the MCP server returns the start of it with a note, plus a download link to the whole response. An operation that answers with a file gets a download link instead of its body. A link is valid for 30 minutes and runs the request again each time it is opened. `GET` operations get links by default; mark any other operation that is safe to run again with [`x-scalar-download`](openapi-extensions.md#downloads).

## API Authentication

Configure authorization separately from tool exposure. Callers can bring API credentials, use a shared stored credential, or sign in through Scalar and use a credential selected for their access group. See [Authentication](authentication/index.md) for the available recipes.

## Billing

Successful API MCP tool calls consume the server owner's Agent credits. Documentation search and read tools do not incur MCP tool-call charges. The in-docs Ask AI widget consumes chat-message credits. See [Agent pricing](pricing.md) for conversions, included allowances, and monthly overage billing.

## Rate Limiting and Abuse Protection

Scalar applies edge rate limits to MCP endpoints, including docs sites' `/mcp` routes. The standard edge budget is **150 requests per minute per client IP**, shared across hosts covered by the shared rule. Selected hosts have their own budgets, so this is not a separate 150-request allowance for every server. Edge counters also depend on the data centre handling the request.

A limit violation returns `429` and temporarily blocks requests for 60 seconds. Reduce concurrency and use delayed retries instead of retrying immediately. Limits are not a per-project dashboard setting; contact support if your traffic needs different handling. Other service limits may also apply.

## Frequently asked questions

<scalar-detail title="Do I need to deploy or host the MCP server myself?">

No. Scalar hosts the server at `mcp.scalar.com`. You configure it in the dashboard from your OpenAPI document, and there is no generated code to run on your own infrastructure.

</scalar-detail>

<scalar-detail title="Can I generate an MCP server from an OpenAPI document?">

Yes, that is exactly how it works. Import or select an API in the Scalar Dashboard, choose the operations to expose, configure authorization, and connect a client. See [Create an MCP Server](#create-an-mcp-server) above.

</scalar-detail>

<scalar-detail title="Does the MCP server support OAuth?">

Yes. People outside your team can sign in through OAuth once you grant them access with an access group, and team members can use a Personal Access Token or OAuth. See [Authentication](./authentication/index.md). If your API has its own OAuth authorization server, [OAuth passthrough](./authentication/oauth-passthrough.md) lets clients sign in there instead and forwards the token they receive to your API.

</scalar-detail>

<scalar-detail title="Which AI clients can connect?">

Any client that supports remote MCP servers over HTTP, including Claude Code, Claude, and Cursor. The exact steps depend on the client; the Claude Code command is shown above.

</scalar-detail>

<scalar-detail title="Can agents change data through my API?">

Only if you allow it. Each operation is set to Search, which only lets the agent look it up, or Execute, which sends real authenticated requests. Keep write operations on Search until you are comfortable.

</scalar-detail>

<scalar-detail title="What does it cost?">

Hosted MCP servers are part of the Pro, Business, and Enterprise plans. Usage draws on the Agent Scalar credits in your plan, where one credit covers 200 MCP tool calls or 2 Docs chat messages. See [Billing](#billing) above and [pricing](/pricing).

</scalar-detail>

## Related

- **Learn:** [Remote MCP servers](/learn/mcp/remote-mcp-servers) · [MCP OAuth](/learn/mcp/mcp-oauth)
- **Docs:** [MCP authentication](/products/agent/authentication) · [MCP OpenAPI extensions](/products/agent/openapi-extensions)
- **Product:** [SDK generator](/products/sdk-generator) — give developers a typed client for the same API your agents call
