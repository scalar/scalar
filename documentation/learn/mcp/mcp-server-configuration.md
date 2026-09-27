# MCP server configuration: client config files and best practices

*Last updated: September 2026*

MCP server configuration is the small block of JSON, or the equivalent CLI command, that tells an MCP client how to reach a server: a URL and optional headers for a remote server, or a command, arguments and environment variables for a local one, saved at either a user or a project scope. Every major client uses nearly the same shape, and nearly every client differs in one detail that breaks copied snippets.

This guide collects the formats for Claude Code, Claude Desktop, claude.ai, Cursor, VS Code and Windsurf (now Devin Desktop), checked against each vendor's documentation in September 2026. It then covers the practices that keep configurations safe and maintainable: where to keep secrets, what to commit, how to handle many servers, and how server authors should design their own configuration. The last sections show how configuration works for a Scalar-hosted server, where most of it lives in the dashboard rather than in a file.

**On this page**

- [The anatomy of a config entry](#the-anatomy-of-a-config-entry)
- [Client formats at a glance](#client-formats-at-a-glance)
- [Claude Code](#claude-code)
- [Claude Desktop and claude.ai](#claude-desktop-and-claudeai)
- [Cursor](#cursor)
- [VS Code](#vs-code)
- [Windsurf and Devin Desktop](#windsurf-and-devin-desktop)
- [Keeping secrets out of config files](#keeping-secrets-out-of-config-files)
- [Configuration for server authors](#configuration-for-server-authors)
- [Configuring a Scalar-hosted server](#configuring-a-scalar-hosted-server)
- [Managing many servers](#managing-many-servers)
- [Frequently asked questions](#frequently-asked-questions)

## The anatomy of a config entry

Almost every client stores servers as named entries in a JSON object. There are two kinds of entry.

A **remote** entry points at a server that someone else runs, over the Streamable HTTP transport. It needs a URL and, if the server does not use OAuth, a header carrying a credential:

```json
{
  "mcpServers": {
    "my-api": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "headers": { "Authorization": "Bearer ${MY_API_TOKEN}" }
    }
  }
}
```

A **local** entry tells the client how to start a program on your machine and talk to it over stdio. It needs a command, arguments, and usually environment variables:

```json
{
  "mcpServers": {
    "galaxy": {
      "command": "npx",
      "args": ["tsx", "/Users/you/mcp/planets.ts"],
      "env": { "GALAXY_API_TOKEN": "${GALAXY_API_TOKEN}" }
    }
  }
}
```

The name (`my-api`, `galaxy`) is yours to choose. It shows up in the client's UI and often prefixes tool names, so keep it short, lowercase and free of spaces. Whether to run a server locally or connect to a remote one is a separate decision, covered in [remote MCP servers](/learn/mcp/remote-mcp-servers). If you are new to the protocol, [what is MCP](/learn/mcp/what-is-mcp) explains what the client does with these entries. If you would rather test an entry before handing it to users, [how to test MCP servers](/learn/mcp/test-mcp-servers) shows how to point the MCP Inspector at the same URL or command.

## Client formats at a glance

| Client | Config location | Top-level key | Remote entry | Variable syntax | Notes |
| --- | --- | --- | --- | --- | --- |
| Claude Code | `.mcp.json` (project), `~/.claude.json` (local and user) | `mcpServers` | `"type": "http"`, `url`, `headers` | `${VAR}`, `${VAR:-default}` | Also `claude mcp add`; entries need `type` for remote servers |
| Claude Desktop | `claude_desktop_config.json` for local servers | `mcpServers` | Added as connectors, not in the file | None documented | Restart after editing |
| claude.ai | Account or organization settings | Not a file | Custom connector by URL | Not applicable | Must be reachable from the public internet |
| Cursor | `.cursor/mcp.json` (project), `~/.cursor/mcp.json` (global) | `mcpServers` | `url`, `headers` | `${env:NAME}`, `${workspaceFolder}`, `${userHome}` | `envFile` for local servers only |
| VS Code | `.vscode/mcp.json`, user profile `mcp.json`, or portable `.mcp.json` | `servers` (or `mcpServers` in `.mcp.json`) | `"type": "http"`, `url`, `headers` | `${input:id}` prompts, `envFile` | Workspace trust governs startup |
| Devin Desktop (Windsurf) | `mcp_config.json` for the legacy Cascade agent | `mcpServers` | `serverUrl` (or `url`), `headers` | `${env:NAME}`, `${file:/path}` | 100-tool limit in Cascade |

The differences that break copied snippets most often: VS Code's `servers` key, Claude Code's requirement for `"type": "http"` on remote entries, Windsurf's `serverUrl`, and four different variable syntaxes.

## Claude Code

Claude Code reads servers from three [scopes](https://code.claude.com/docs/en/mcp): local (default, this project only, in `~/.claude.json`), project (shared, in `.mcp.json` at the repository root), and user (all your projects, in `~/.claude.json`). The easiest way to write an entry is the CLI:

```bash
claude mcp add --transport http my-api --scope project https://mcp.example.com/mcp \
  --header 'Authorization: Bearer ${MY_API_TOKEN}'
```

Single quotes keep your shell from expanding `${MY_API_TOKEN}` so the reference, not the value, is written to the file. The resulting `.mcp.json` uses `mcpServers`, `"type": "http"`, `url` and `headers`. Things to know:

- An entry with a `url` but no `type` is read as a stdio server and skipped with an error. Always set `"type": "http"` for remote servers (`"streamable-http"` is accepted as an alias).
- `${VAR}` and `${VAR:-default}` expand in `command`, `args`, `env`, `url` and `headers`. An unset variable without a default produces a warning and is passed through unexpanded.
- In a remote server's `url` and `headers`, Claude Code deliberately reads its own and your cloud provider's credential variables (such as `ANTHROPIC_API_KEY`) as empty, so a project file cannot send them to a third party.
- Servers in `.mcp.json` must be approved by each user before they run, and a cloned repository cannot pre-approve its own servers.
- `headersHelper` runs a command at connection time to produce headers, which suits short-lived tokens from an internal SSO.
- `MCP_TIMEOUT` sets the startup timeout, a per-server `timeout` field sets the tool-call limit, and `MAX_MCP_OUTPUT_TOKENS` raises the 25,000-token default cap on tool output.

[Connect an MCP server to Claude](/learn/mcp/connect-mcp-server-to-claude) walks through adding, authenticating and troubleshooting servers in Claude Code step by step.

## Claude Desktop and claude.ai

In claude.ai and the Claude apps, remote servers are **custom connectors** added in the UI under **Customize > Connectors**, or by an Owner under **Organization settings > Connectors** on Team and Enterprise plans. There is no file to edit. The connector settings cover the URL, the authentication mode (sign in now, sign in when needed, or no sign-in), how Claude identifies itself to the server's OAuth authorization server, and, in a beta available to some organizations, up to four fixed request headers. Authentication settings cannot be edited after the connector is added; remove it and add it again. Anthropic's [custom connector guide](https://claude.com/docs/connectors/custom/remote-mcp) has the details.

Local servers in Claude Desktop are configured in `claude_desktop_config.json` (on macOS in `~/Library/Application Support/Claude/`, on Windows in `%APPDATA%\Claude\`), opened from **Settings > Developer > Edit Config** in the app's menu bar menu. Entries use `mcpServers` with `command`, `args` and `env`, and the app must be restarted to pick up changes. Use absolute paths, as the MCP project's own tutorial recommends.

## Cursor

Cursor reads `.cursor/mcp.json` in a project and `~/.cursor/mcp.json` for servers available everywhere ([Cursor MCP docs](https://cursor.com/docs/mcp)). Remote entries have no `type` field; a `url` is enough:

```json
{
  "mcpServers": {
    "my-api": {
      "url": "https://mcp.example.com/mcp",
      "headers": { "Authorization": "Bearer ${env:MY_API_TOKEN}" }
    }
  }
}
```

Cursor interpolates `${env:NAME}`, `${userHome}`, `${workspaceFolder}`, `${workspaceFolderBasename}` and `${pathSeparator}` in `command`, `args`, `env`, `url` and `headers`. Local servers can also load an `envFile`; remote servers cannot. For OAuth servers that do not support dynamic client registration, Cursor accepts static client credentials in an `auth` object with `CLIENT_ID`, an optional `CLIENT_SECRET` and optional `scopes`.

## VS Code

VS Code's own format lives in `.vscode/mcp.json` in a workspace or in the `mcp.json` of your user profile (open it with **MCP: Open User Configuration**), and uses `servers` as the top-level key. It also reads a portable `.mcp.json` with `mcpServers` at the workspace root ([VS Code MCP configuration reference](https://code.visualstudio.com/docs/agents/reference/mcp-configuration)).

VS Code's answer to secrets is input variables: you declare an input, and VS Code prompts for the value the first time the server starts and stores it securely.

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "my-api-token",
      "description": "API token for My API",
      "password": true
    }
  ],
  "servers": {
    "my-api": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "headers": { "Authorization": "Bearer ${input:my-api-token}" }
    }
  }
}
```

Local entries take `type`, `command`, `args`, `env`, `envFile` and `cwd`. Workspace servers inherit workspace trust, so a folder you have not trusted cannot start the servers its configuration defines. **MCP: Add Server** in the Command Palette writes entries for you.

## Windsurf and Devin Desktop

Cognition renamed Windsurf to Devin Desktop on [2 June 2026](https://docs.devin.ai/desktop/devin-desktop-faq). Its [MCP documentation](https://docs.devin.ai/desktop/cascade/mcp) describes `mcp_config.json` for the legacy Cascade agent, with `mcpServers` as the key, `command`, `args` and `env` for local servers, and `serverUrl` (or `url`) plus `headers` for remote ones:

```json
{
  "mcpServers": {
    "my-api": {
      "serverUrl": "https://mcp.example.com/mcp",
      "headers": { "Authorization": "Bearer ${env:MY_API_TOKEN}" }
    }
  }
}
```

It supports `${env:NAME}` and `${file:/path}` interpolation, a `disabledTools` array per server, and a limit of 100 tools in total across all servers. The newer default agent, Devin Local, configures MCP servers through the Devin CLI's config files instead, and Cognition's documentation gives different file locations depending on the page and platform, so check the current docs for your install before editing a file by hand.

## Keeping secrets out of config files

Config files get committed, synced, pasted into chat threads and attached to bug reports, and a leaked key in one is the same incident as a leaked key anywhere else ([MCP server security](/learn/mcp/mcp-server-security) and [MCP OAuth](/learn/mcp/mcp-oauth) cover the server side). Treat any credential written into one as leaked. In order of preference:

1. **Use OAuth when the server supports it.** The client stores and refreshes the token in its own secure storage, the user can revoke it, and nothing sensitive is in the file at all. [MCP OAuth](/learn/mcp/mcp-oauth) explains the flow.
2. **Reference environment variables** with your client's syntax (`${VAR}` in Claude Code, `${env:VAR}` in Cursor and Windsurf) and set them in your shell profile or a secrets manager.
3. **Use the client's secure prompt** where one exists, such as VS Code's `password: true` inputs.
4. **Generate short-lived headers** with a helper command (Claude Code's `headersHelper`) when your organization issues short-lived tokens.

Also: give each server its own least-privileged key rather than reusing an admin key, rotate keys when someone leaves, and watch for trailing whitespace or newlines in pasted tokens, a common cause of mysterious 401s that Claude Code now warns about. [MCP server security](/learn/mcp/mcp-server-security) covers the server side of the same problem.

### User scope, project scope and what to commit

A useful rule: **commit the shape, never the secret.**

- Put servers the whole team needs in the project file (`.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`) with variable references for credentials, and commit it. New teammates get the right servers on clone.
- Put personal servers, experiments and anything with a personal token in user scope.
- If the project file references variables, document them in the README or an `.env.example`.
- Expect your client to ask for approval or workspace trust before running project-defined servers. That friction is deliberate: a repository should not be able to start arbitrary commands on your machine just because you opened it.

## Configuration for server authors

If you build an MCP server, whether by hand or [generated from an OpenAPI document](/learn/mcp/generate-mcp-server-from-openapi), your users configure it through whatever you read at startup. Make that easy to get right:

- **Read credentials from the environment**, never from tool arguments. The model must never see them.
- **Validate configuration at startup** and exit with a clear message if something is missing, rather than failing on the first tool call.
- **Write diagnostics to stderr.** On stdio, stdout is the protocol channel.
- **Give every setting a sensible default** except secrets.
- **Publish copy-paste snippets** for the clients your users actually have, using each client's variable syntax.

A startup check in TypeScript with Zod:

```ts
import * as z from 'zod/v4'

// Read configuration once, at startup, and fail loudly if it is wrong.
const Config = z.object({
  GALAXY_BASE_URL: z.url().default('https://galaxy.scalar.com'),
  GALAXY_API_TOKEN: z.string().min(1),
  GALAXY_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
})

const parsed = Config.safeParse(process.env)

if (!parsed.success) {
  // stderr, never stdout: on stdio, stdout belongs to the protocol.
  console.error(`Invalid configuration:\n${z.prettifyError(parsed.error)}`)
  process.exit(1)
}

export const config = parsed.data
```

With `GALAXY_API_TOKEN` unset, this prints the missing field and exits with code 1, which clients surface in their logs. [How to test MCP servers](/learn/mcp/test-mcp-servers) shows how to check that behaviour in CI.

## Configuring a Scalar-hosted server

With a Scalar-hosted server, the client-side configuration shrinks to a URL, because the server is not something you run. Everything that would otherwise be server configuration lives in the Scalar dashboard:

- **Which API and which operations.** You pick the OpenAPI document and choose per operation whether the model can search it, execute it, or neither. See [MCP tools](/products/agent/mcp).
- **Upstream authentication.** Store one credential on the installation (global auth), or have callers pass their own in a header you nominate (passthrough). See [authentication](/products/agent/authentication).
- **Who can connect.** Private by default; open to your team, to an access group of external emails or domains through OAuth, or to the public.

The client entry is then the installation URL, `https://mcp.scalar.com/mcp/YOUR_INSTALL_ID`, in whichever format your client uses. The [getting started guide](/products/agent/getting-started) shows where to find it. For a private installation, add it without headers and sign in when the client prompts. In Claude Code:

```bash
claude mcp add --transport http my-api https://mcp.scalar.com/mcp/YOUR_INSTALL_ID
```

In Cursor's `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-api": { "url": "https://mcp.scalar.com/mcp/YOUR_INSTALL_ID" }
  }
}
```

For a public installation with [passthrough auth](/products/agent/authentication/public-passthrough), add the header your installation forwards, using the variable syntax from the table above. Team members can also use a personal access token; the [MCP guide](/products/agent/mcp) shows the header format for that.

Scalar docs sites also expose a documentation MCP server at `/mcp` on the docs domain. It is a separate endpoint that searches your published docs rather than calling your API, and it is configured the same way, with just a URL. You can try one now: `https://scalar.com/mcp` serves Scalar's own documentation.

## Managing many servers

Once people have a few servers connected, a new set of problems appears.

- **Tool budget.** Every connected server adds tool definitions. Some clients cap the total (100 in Devin Desktop's Cascade), and others load every definition into context. Disable servers you are not using in a given project, and prefer servers with a small number of well-described tools. [REST API to MCP server](/learn/mcp/rest-api-to-mcp-server) explains why large APIs benefit from a search-and-execute design.
- **Name collisions.** Two servers can both expose a `search` tool. Clients disambiguate by prefixing the server name, so give servers distinct, meaningful names.
- **Duplicate definitions.** The same server defined in two scopes with different URLs leads to confusing sign-in behaviour. Claude Code warns about this; other clients may not. Keep one definition per server.
- **Timeouts and output limits.** Slow upstream APIs need a longer tool timeout; chatty tools may hit output caps. Fix large outputs at the server where you can.
- **Blocking individual tools.** Most clients let you disable single tools per server (`disabledTools` in Windsurf, per-tool permissions in Claude). Use it for write tools you do not need.

## Frequently asked questions

<scalar-detail title="Where is the MCP config file?">
It depends on the client. Claude Code uses .mcp.json in the project and ~/.claude.json for personal servers. Claude Desktop uses claude_desktop_config.json for local servers. Cursor uses .cursor/mcp.json or ~/.cursor/mcp.json. VS Code uses .vscode/mcp.json or the user profile's mcp.json. Devin Desktop, formerly Windsurf, uses mcp_config.json for its legacy Cascade agent.
</scalar-detail>

<scalar-detail title="Is the MCP config format the same in every client?">
Nearly, but not exactly. Most use an mcpServers object with url and headers for remote servers and command, args and env for local ones. VS Code uses servers as the key in its own file, Claude Code requires a type field for remote entries, Windsurf uses serverUrl, and each client has its own variable syntax.
</scalar-detail>

<scalar-detail title="How do I keep API keys out of MCP config files?">
Prefer OAuth where the server supports it, so the client stores the token securely. Otherwise reference an environment variable using your client's syntax, or use a secure prompt such as VS Code's password inputs. Never commit a literal key, and give each server its own least-privileged key.
</scalar-detail>

<scalar-detail title="Should I commit .mcp.json to git?">
Yes, if it contains only server definitions and variable references, not secrets. Committing it gives everyone on the team the same servers. Clients ask each user to approve project-defined servers before running them, which protects against a repository starting unexpected commands.
</scalar-detail>

<scalar-detail title="How many MCP servers can I configure?">
There is no protocol limit, but clients impose practical ones. Devin Desktop's Cascade agent allows 100 tools in total, and clients that load every tool definition into context get slower and less accurate as the list grows. Enable only the servers a project needs.
</scalar-detail>

<scalar-detail title="What configuration does a Scalar-hosted MCP server need?">
On the client side, only the installation URL, plus a header if the installation uses passthrough auth. The API, the exposed operations, upstream authentication and access control are configured in the Scalar dashboard, so there is no server to deploy or environment to manage.
</scalar-detail>

## Related

- **Learn:** [Connect an MCP server to Claude](/learn/mcp/connect-mcp-server-to-claude) · [MCP server security](/learn/mcp/mcp-server-security) · [Remote MCP servers](/learn/mcp/remote-mcp-servers) · [MCP server examples](/learn/mcp/mcp-server-examples)
- **Docs:** [MCP servers](/products/agent/mcp) · [Public MCP with passthrough auth](/products/agent/authentication/public-passthrough)
- **Product:** [Scalar MCP](/products/agent/mcp) — a hosted MCP server where configuration lives in the dashboard and clients need only a URL

*Client formats were checked against Anthropic, Cursor, Microsoft and Cognition documentation on 26 September 2026. Client configuration changes often; when a snippet stops working, the vendor's documentation linked above is the source of truth.*
