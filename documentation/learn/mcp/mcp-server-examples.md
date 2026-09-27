# MCP server examples: real servers worth knowing

*Last updated: September 2026*

MCP server examples fall into two groups: the official reference servers maintained by the Model Context Protocol project, which show how the protocol works, and production servers run by companies such as GitHub, Stripe, Sentry and Linear, which let AI applications use their products. Every server on this page is real and public, and each entry links to the maintainer's own documentation so you can check the details yourself.

We picked servers that are useful to learn from, not only popular ones. Between them they cover local and remote transports, OAuth and API keys, small and large tool sets, and the design choices that separate a pleasant server from a frustrating one.

**On this page**

- [How to read this list](#how-to-read-this-list)
- [At a glance](#at-a-glance)
- [Official reference servers](#official-reference-servers)
- [Developer platform servers](#developer-platform-servers)
- [Business and productivity servers](#business-and-productivity-servers)
- [Local tool servers](#local-tool-servers)
- [Documentation servers](#documentation-servers)
- [What the best MCP servers have in common](#what-the-best-mcp-servers-have-in-common)
- [Where to find more MCP servers](#where-to-find-more-mcp-servers)
- [Building your own from an OpenAPI document](#building-your-own-from-an-openapi-document)
- [Frequently asked questions](#frequently-asked-questions)

## How to read this list

Each example states whether the server is **local** (a process you start, speaking stdio) or **remote** (a URL you connect to over Streamable HTTP). That single fact decides how you install it and how it authenticates. [Remote MCP servers](/learn/mcp/remote-mcp-servers) explains the difference in detail, and [What is MCP?](/learn/mcp/what-is-mcp) covers the protocol itself.

For remote servers, the install command is the same shape in every client. With Claude Code:

```bash
claude mcp add --transport http SERVER_NAME SERVER_URL
```

In Cursor (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "SERVER_NAME": { "url": "SERVER_URL" }
  }
}
```

In VS Code (`.vscode/mcp.json`):

```json
{
  "servers": {
    "SERVER_NAME": { "type": "http", "url": "SERVER_URL" }
  }
}
```

So for each remote server below we only list the URL. Most use OAuth, which means your client opens a browser the first time you connect; [MCP OAuth](/learn/mcp/mcp-oauth) explains what happens during that step.

## At a glance

| Server | Maintainer | Type | Endpoint or install | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| Everything, Fetch, Filesystem, Git, Memory, Sequential Thinking, Time | MCP project | Local | `npx` or `uvx` packages | None / environment | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) |
| GitHub | GitHub | Remote or local | `https://api.githubcopilot.com/mcp/` | OAuth or personal access token | [github/github-mcp-server](https://github.com/github/github-mcp-server) |
| Sentry | Sentry | Remote | `https://mcp.sentry.dev/mcp` | OAuth | [mcp.sentry.dev](https://mcp.sentry.dev/) |
| Linear | Linear | Remote | `https://mcp.linear.app/mcp` | OAuth or API key | [linear.app/docs/mcp](https://linear.app/docs/mcp) |
| Atlassian | Atlassian | Remote | `https://mcp.atlassian.com/v2/mcp` | OAuth 2.1 or API token | [Atlassian support](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/) |
| Supabase | Supabase | Remote | `https://mcp.supabase.com/mcp` | OAuth or personal access token | [Supabase docs](https://supabase.com/docs/guides/getting-started/mcp) |
| Cloudflare | Cloudflare | Remote | `https://docs.mcp.cloudflare.com/mcp` and others | Varies by server | [cloudflare/mcp-server-cloudflare](https://github.com/cloudflare/mcp-server-cloudflare) |
| Stripe | Stripe | Remote | `https://mcp.stripe.com` | OAuth or agent API key | [docs.stripe.com/mcp](https://docs.stripe.com/mcp) |
| Notion | Notion | Remote | `https://mcp.notion.com/mcp` | OAuth | [Notion developers](https://developers.notion.com/docs/mcp) |
| Playwright | Microsoft | Local | `npx @playwright/mcp@latest` | None | [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) |
| AWS MCP servers | AWS Labs | Mostly local | `uvx awslabs.<server>@latest` | AWS credentials | [awslabs/mcp](https://github.com/awslabs/mcp) |
| Context7 | Upstash | Remote | `https://mcp.context7.com/mcp` | API key recommended | [upstash/context7](https://github.com/upstash/context7) |

Endpoints and auth methods were checked against each maintainer's documentation on 26 September 2026.

## Official reference servers

The [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) repository holds seven reference servers. The maintainers are clear that these are "educational examples" for people building servers, not production software. Read them when you want to see how a feature is meant to be implemented.

### Everything

A test server that exercises prompts, resources and tools in one place. It is the fastest way to check whether a new client supports a given MCP feature.

```bash
npx -y @modelcontextprotocol/server-everything
```

### Fetch

Retrieves a web page and converts it to Markdown for the model. It has a single `fetch` tool with `url`, `max_length`, `start_index` and `raw` parameters, and it truncates long pages so the model can read them in chunks. A good example of a tool designed around context limits.

```bash
uvx mcp-server-fetch
```

### Filesystem

Reads and writes files inside directories you allow. It is the clearest illustration of MCP roots: a client that supports roots can change the allowed directories at runtime, and those replace any directories passed on the command line.

```bash
npx -y @modelcontextprotocol/server-filesystem /path/to/allowed/dir
```

### Git

Tools such as `git_status`, `git_diff_unstaged`, `git_commit` and `git_log` for working with a local repository.

```bash
uvx mcp-server-git
```

### Memory

A persistent knowledge graph of entities, relations and observations, stored in a local JSONL file, so an assistant can remember facts across conversations.

```bash
npx -y @modelcontextprotocol/server-memory
```

### Sequential Thinking and Time

Sequential Thinking gives the model a structured way to work through a problem step by step, and Time handles time and timezone conversion. Both are small enough to read in one sitting.

```bash
npx -y @modelcontextprotocol/server-sequential-thinking
uvx mcp-server-time
```

The same repository used to hold servers for GitHub, Slack, PostgreSQL, Sentry and others. Those have been archived, and in several cases the vendor now runs its own server instead, which is what the next sections cover.

## Developer platform servers

### GitHub

GitHub's [official MCP server](https://github.com/github/github-mcp-server) is MIT licensed and available both as a hosted endpoint at `https://api.githubcopilot.com/mcp/` and as a Docker image (`ghcr.io/github/github-mcp-server`) you run yourself. It groups its tools into toolsets such as issues, pull requests, repositories, Actions and code security, and lets you enable only the toolsets you need.

**Why it is a good example:** toolsets are a practical answer to the "too many tools" problem. Instead of one enormous list, users choose the slice they need.

### Sentry

Sentry's hosted server lives at `https://mcp.sentry.dev/mcp` and, per [its documentation](https://mcp.sentry.dev/), every connection uses OAuth; the first connection starts the sign-in flow. The URL can also be scoped to an organization and project.

**Why it is a good example:** scoping through the URL is a simple way to limit what an agent can see without extra configuration screens.

### Linear

Linear [documents](https://linear.app/docs/mcp) `https://mcp.linear.app/mcp` as its Streamable HTTP endpoint and keeps `https://mcp.linear.app/sse` only as a deprecated fallback. Interactive setup uses OAuth 2.1 with dynamic client registration, and you can pass a bearer token or Linear API key instead.

**Why it is a good example:** it shows a sensible migration path, keeping the old transport for older clients while pointing everyone at the new one.

### Atlassian

Atlassian's remote server at `https://mcp.atlassian.com/v2/mcp` covers Jira, Jira Service Management, Confluence and more, according to [Atlassian's getting started guide](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/). It uses OAuth 2.1, with API tokens as an option.

### Supabase

The [hosted Supabase server](https://supabase.com/docs/guides/getting-started/mcp) at `https://mcp.supabase.com/mcp` uses dynamic client registration, so most users never create a token by hand. Two URL parameters are worth copying: `read_only=true` runs every query as a read-only Postgres user, and `project_ref=<id>` limits the server to one project.

```text
https://mcp.supabase.com/mcp?project_ref=abc123&read_only=true
```

**Why it is a good example:** a read-only switch is the single most useful safety control for a server that can touch production data.

### Cloudflare

Cloudflare runs a family of domain-specific remote servers listed in [its repository](https://github.com/cloudflare/mcp-server-cloudflare), including documentation (`https://docs.mcp.cloudflare.com/mcp`), Workers bindings, builds, observability, Radar and more, each on its own subdomain. It also publishes templates for deploying your own remote server on Workers.

**Why it is a good example:** splitting a huge platform into many focused servers keeps each tool list short and lets users connect only what they need.

## Business and productivity servers

### Stripe

Stripe hosts its server at `https://mcp.stripe.com` ([docs](https://docs.stripe.com/mcp)). It supports OAuth for interactive clients and agent API keys for autonomous ones, and it lists which API methods agents can reach. Two design choices stand out. First, instead of a tool per endpoint it exposes `stripe_api_search`, `stripe_api_details`, `stripe_api_read` and `stripe_api_write`, which keeps the tool list small no matter how large the API is. Second, it requires human confirmation before certain write actions such as refunds.

Stripe also notes a change worth knowing about if you use it: from 31 October 2026 its MCP server stops accepting full-access secret keys and restricted keys without the Agent tag.

**Why it is a good example:** search-then-execute tools plus human confirmation for risky writes is a pattern that fits almost any large API.

### Notion

Notion describes its server as ["a remote MCP server hosted by Notion"](https://developers.notion.com/docs/mcp) that uses OAuth. Claude Code's documentation uses `https://mcp.notion.com/mcp` as its example endpoint. Notion's older self-hosted server repository is marked as no longer actively maintained, with users pointed to the hosted one.

**Why it is a good example:** the move from a self-hosted server to a vendor-hosted one is a pattern you will see again and again. Hosted servers are easier to update and let permissions follow the user's own account.

## Local tool servers

### Playwright

Microsoft's [Playwright MCP](https://github.com/microsoft/playwright-mcp) (Apache-2.0) lets a model drive a browser. It works from accessibility snapshots rather than screenshots, so it does not need a vision model.

```bash
npx @playwright/mcp@latest
```

**Why it is a good example:** it is a server that should be local. It controls a browser on the user's machine, so a remote endpoint would make no sense.

### AWS MCP servers

AWS Labs maintains [a collection of MCP servers](https://github.com/awslabs/mcp) under Apache-2.0, covering documentation, infrastructure as code, EKS, ECS, Lambda, Bedrock, DynamoDB and more. Most are installed with `uvx`, for example:

```bash
uvx awslabs.aws-iac-mcp-server@latest
```

**Why it is a good example:** one focused server per service, each using the AWS credentials already on the developer's machine.

## Documentation servers

### Context7

Upstash's [Context7](https://github.com/upstash/context7) (MIT) supplies current, version-specific library documentation and code examples to the model, so it is less likely to invent APIs that do not exist. The remote endpoint is `https://mcp.context7.com/mcp`; a free API key raises rate limits.

Documentation servers are a category of their own. Many docs platforms now serve an MCP endpoint next to the docs so agents can search them. Scalar Docs does this too: a published docs project exposes a Docs MCP at `https://your-docs-domain/mcp`, as described in the [MCP servers guide](/products/agent/mcp). That is separate from the API-calling servers covered in the next section. [llms.txt for API docs](/learn/openapi/llms-txt-for-api-docs) covers the other common way to make docs readable by agents.

## What the best MCP servers have in common

Looking across these examples, the good ones share a handful of habits:

- **Remote first for anything that wraps a network API.** GitHub, Stripe, Sentry, Linear, Atlassian, Supabase and Notion all host their own endpoint. Local servers are reserved for local jobs such as files, Git and browsers.
- **OAuth for people, keys for automation.** Stripe, Linear and GitHub offer both, which covers interactive users and CI or headless agents.
- **A short tool list.** Toolsets (GitHub), many small servers (Cloudflare, AWS) or search-then-execute tools (Stripe) all solve the same problem: every tool definition costs context. [MCP vs function calling](/learn/mcp/mcp-vs-function-calling) explains why.
- **Built-in guard rails.** Read-only modes, project scoping and human confirmation for destructive writes.
- **Streamable HTTP, with SSE only as a fallback.** New servers should not launch with SSE-only endpoints.
- **Clear documentation.** Every server on this page documents its URL, auth options and tools on a public page. That is also why we could verify them.

## Where to find more MCP servers

- **The [Official MCP Registry](https://registry.modelcontextprotocol.io/)**, built by MCP contributors, lists published servers and offers an API for clients and other directories.
- **Your client's directory.** Claude, Cursor and VS Code each surface curated servers you can install in one click.
- **The API vendor's docs.** Search the docs of the product you want to connect for "MCP". Many vendors now document an endpoint.

Treat any third-party server as code that can act on your behalf. Prefer servers published by the vendor of the underlying product, check what tools it exposes before enabling it, and be wary of servers that ask for broad credentials.

## Building your own from an OpenAPI document

If the product you want to expose is your own HTTP API, you do not have to write a server from scratch. The operations, parameters and schemas in your OpenAPI document already describe most of what an MCP tool needs. [Generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi) and [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server) compare the approaches.

Scalar takes the hosted route. You upload your OpenAPI document, choose which operations agents may search or execute, and Scalar serves the MCP server at `https://mcp.scalar.com/mcp/YOUR_INSTALL_ID`. There is no server code for you to deploy. Several of the patterns above are built in:

- a small fixed set of tools that look up operation details on demand, rather than one tool per endpoint;
- per-operation control over what is searchable and what is executable;
- private by default, with OAuth sign-in for your team and for [customers you allowlist](/products/agent/authentication/customer-access), supported since 17 March 2026;
- upstream API credentials that stay on Scalar's side, either one stored credential or each caller's own key passed through.

The [getting started guide](/products/agent/getting-started) takes you from an OpenAPI document to a connected client, and you can keep your API descriptions in the [Scalar Registry](/products/registry) so the MCP server, [API reference](/products/api-references) and SDKs all come from the same source.

## Frequently asked questions

<scalar-detail title="What is an example of an MCP server?">
GitHub's MCP server is a typical example. You connect your client to https://api.githubcopilot.com/mcp/, sign in, and the model can list issues, read pull requests or check Actions runs through tools the server exposes. The official Filesystem server is a typical local example: it runs on your machine and lets the model read and write files in directories you allow.
</scalar-detail>

<scalar-detail title="What are the best MCP servers?">
It depends on what you need. For coding work, GitHub, Sentry, Linear and Playwright are widely used. For data and infrastructure, Supabase, Cloudflare and the AWS servers. For business tools, Stripe, Notion and Atlassian. Prefer servers published by the vendor of the product you are connecting, since they track the product's API and permissions.
</scalar-detail>

<scalar-detail title="Are the official reference MCP servers production-ready?">
No. The modelcontextprotocol/servers repository describes them as educational reference implementations intended to show MCP features and SDK usage. They are useful to learn from and to test clients with, but you should assess security and reliability yourself before relying on them.
</scalar-detail>

<scalar-detail title="Where can I find a list of MCP servers?">
The Official MCP Registry at registry.modelcontextprotocol.io lists published servers and has an API. Claude, Cursor and VS Code also offer curated directories inside the product, and most API vendors document their own server in their developer docs.
</scalar-detail>

<scalar-detail title="Are MCP servers safe to use?">
An MCP server can act with whatever access you grant it, so treat it like any integration. Use servers from the vendor of the underlying product where possible, prefer OAuth over long-lived keys, turn on read-only or scoped modes when they exist, and review which tools are enabled.
</scalar-detail>

<scalar-detail title="Can I build an MCP server from my own API?">
Yes. You can write one with an official SDK, or generate the tools from your OpenAPI document. Scalar hosts MCP servers built from an OpenAPI document, so you choose the operations and access rules and connect clients without deploying server code yourself.
</scalar-detail>

## Related

- **Learn:** [What is MCP?](/learn/mcp/what-is-mcp) · [Remote MCP servers](/learn/mcp/remote-mcp-servers) · [MCP OAuth](/learn/mcp/mcp-oauth) · [Generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi)
- **Docs:** [MCP servers](/products/agent/mcp) · [Getting started with MCP & Agent](/products/agent/getting-started)
- **Product:** [Scalar MCP](/products/agent/mcp) — a hosted MCP server for your own API, generated from your OpenAPI document

*Server URLs, licences and authentication methods were checked against each maintainer's documentation or repository on 26 September 2026. Servers change often; if something here is out of date, tell us and we will fix it.*
