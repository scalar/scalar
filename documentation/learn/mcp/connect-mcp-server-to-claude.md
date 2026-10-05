# How to use MCP with Claude: connect a server to Claude Code, Claude Desktop and claude.ai

*Last updated: September 2026*

To use an MCP server with Claude, you give the Claude product you use either the server's URL (for a remote server) or the command that starts it (for a local server): `claude mcp add` in Claude Code, **Customize > Connectors** in claude.ai and the Claude apps, or the `claude_desktop_config.json` file for local servers in Claude Desktop. Once connected, Claude sees the server's tools and can call them during a conversation, asking your permission as it goes.

This guide covers each of those routes step by step, with commands and settings checked against Anthropic's documentation in September 2026. It uses two servers as worked examples: Scalar's public documentation server at `https://scalar.com/mcp`, which you can connect right now, and a placeholder for a Scalar-hosted API server, which is what you would connect for your own API.

**On this page**

- [Which Claude product, which kind of server](#which-claude-product-which-kind-of-server)
- [Before you start](#before-you-start)
- [Claude Code: add a remote server](#claude-code-add-a-remote-server)
- [Claude Code: scopes and sharing with a team](#claude-code-scopes-and-sharing-with-a-team)
- [Claude Code: add a local server](#claude-code-add-a-local-server)
- [claude.ai and the Claude apps: custom connectors](#claudeai-and-the-claude-apps-custom-connectors)
- [Claude Desktop: local servers](#claude-desktop-local-servers)
- [Worked example: a Scalar-hosted MCP server](#worked-example-a-scalar-hosted-mcp-server)
- [From your own code: the Claude Agent SDK](#from-your-own-code-the-claude-agent-sdk)
- [Troubleshooting](#troubleshooting)
- [Frequently asked questions](#frequently-asked-questions)

## Which Claude product, which kind of server

MCP servers come in two shapes. A **remote** server runs somewhere else and you connect to it with an HTTPS URL. A **local** server is a program on your computer that the client starts and talks to over standard input and output (stdio). [Remote MCP servers](/learn/mcp/remote-mcp-servers) explains the difference in depth. Which Claude product you use decides which shapes you can add and where the configuration lives.

| Claude product | Remote servers (URL) | Local servers (command) | Where the configuration lives | Sign-in |
| --- | --- | --- | --- | --- |
| Claude Code | `claude mcp add --transport http` | `claude mcp add ... -- <command>` | `~/.claude.json` (local and user scope) or `.mcp.json` (project scope) | OAuth via `/mcp` or `claude mcp login`, or headers |
| claude.ai (web) | Custom connector by URL | Not supported | Your claude.ai account or organization | OAuth, or request headers (beta) |
| Claude Desktop | Custom connector by URL (same as claude.ai) | `claude_desktop_config.json` or a desktop extension (`.mcpb`) | Account connectors, plus a local config file | OAuth for connectors; environment variables for local servers |
| Claude mobile apps | Connectors added on your account | Not supported | Your claude.ai account | OAuth |

Two points from that table catch people out. First, connectors you add in claude.ai follow your account, so they also appear in Claude Desktop and the mobile apps, and in Claude Code when you are signed in with a claude.ai subscription. Second, a remote connector is reached from Anthropic's cloud, not from your laptop, so a server on your private network will not connect as a custom connector. Anthropic's [custom connector guide](https://claude.com/docs/connectors/custom/remote-mcp) says the server must be reachable over the public internet.

## Before you start

You need three things:

1. **The server URL or command.** For a hosted server, the provider's documentation gives you a URL, usually ending in `/mcp`. For a local server, you get a command such as `npx -y some-package`.
2. **The authentication method.** Most hosted servers now use OAuth, which means you sign in through a browser after adding the server. Some expect an API key in a header instead.
3. **A reason to trust it.** A server's tools can read and change data in the service they connect to. Only connect servers from publishers you trust. [MCP server security](/learn/mcp/mcp-server-security) explains what can go wrong.

If you want something to practise on, Scalar's documentation server at `https://scalar.com/mcp` is public and needs no sign-in. It has one tool, `search-documentation`, that searches Scalar's docs.

## Claude Code: add a remote server

Claude Code manages MCP servers with the `claude mcp` command. To add a remote server over Streamable HTTP:

```bash
claude mcp add --transport http scalar-docs https://scalar.com/mcp
```

The general form is `claude mcp add --transport http <name> <url>`. The name is your label for the server; it can contain letters, numbers, hyphens and underscores. Check that it connected:

```bash
claude mcp get scalar-docs
claude mcp list
```

Inside a Claude Code session, run `/mcp` to see every server, its status and its tools. Then just ask: "Using scalar-docs, how does passthrough authentication work?" Claude will ask permission the first time it calls the tool.

**Servers that need OAuth.** Add the server the same way, without any credentials. When Claude Code sees a `401` from the server, it marks the server as needing authentication. Run `/mcp`, choose the server, and follow the browser sign-in. You can also sign in from the shell without starting a session:

```bash
claude mcp login my-server
```

Tokens are stored and refreshed automatically. To sign out, use **Clear authentication** in the `/mcp` menu or run `claude mcp logout my-server`. The details of what happens during that sign-in are in [MCP OAuth](/learn/mcp/mcp-oauth).

**Servers that need an API key.** Pass the header with `--header`. Include the scheme your server expects; for a bearer token that means the word `Bearer` and a space:

```bash
claude mcp add --transport http my-api https://mcp.example.com/mcp \
  --header "Authorization: Bearer $MY_API_TOKEN"
```

If the server rejects a header you configured, Claude Code reports a failed connection rather than falling back to OAuth, so remove the header if you meant to sign in instead.

## Claude Code: scopes and sharing with a team

Every server you add is stored at one of three [scopes](https://code.claude.com/docs/en/mcp):

- **Local** (the default): only you, only this project. Stored in `~/.claude.json` under the project's path.
- **Project**: everyone who works in this repository. Stored in `.mcp.json` at the project root, which you commit.
- **User**: only you, in every project. Stored in `~/.claude.json`.

Pick the scope with `--scope`:

```bash
claude mcp add --transport http scalar-docs --scope project https://scalar.com/mcp
```

That writes a `.mcp.json` like this:

```json
{
  "mcpServers": {
    "scalar-docs": {
      "type": "http",
      "url": "https://scalar.com/mcp"
    }
  }
}
```

When a teammate opens the project, Claude Code asks them to approve servers from `.mcp.json` before using them. Never commit a token into that file. Use environment variable expansion instead, which Claude Code supports in `url`, `headers`, `command`, `args` and `env`:

```json
{
  "mcpServers": {
    "my-api": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${MY_API_TOKEN}"
      }
    }
  }
}
```

Each person sets `MY_API_TOKEN` in their own shell. `${VAR:-default}` supplies a fallback. One safety feature to know about: in a remote server's `url` and `headers`, Claude Code reads its own credential variables such as `ANTHROPIC_API_KEY` as empty, so a project file cannot send your Claude credentials to a third-party server. If you need one of those values, copy it into a variable with a different name. [MCP server configuration](/learn/mcp/mcp-server-configuration) compares this with how other clients handle secrets.

## Claude Code: add a local server

For a local server, put the command after `--`. Everything after the double dash is passed to the server untouched; everything before it is for Claude Code. Environment variables go in `--env`:

```bash
claude mcp add galaxy --env GALAXY_API_TOKEN=your-token -- npx tsx /path/to/planets.ts
```

That example runs the `list_planets` server from our [REST API to MCP server](/learn/mcp/rest-api-to-mcp-server) guide. If you already configured servers in Claude Desktop, `claude mcp add-from-claude-desktop` imports them on macOS and WSL.

## claude.ai and the Claude apps: custom connectors

In claude.ai, Claude Desktop and the mobile apps, MCP servers are called **connectors**. Many popular services are in Anthropic's connector directory already. For anything else, add a **custom connector** with the server's URL. According to [Anthropic's help center](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp), custom connectors are available on the Free, Pro, Max, Team and Enterprise plans, and Free plans are limited to one custom connector.

**On a Free, Pro or Max plan:**

1. Go to **Customize > Connectors**.
2. Click **Add custom connector**.
3. Enter the server URL, for example `https://scalar.com/mcp`.
4. If the server needs OAuth credentials you registered in advance, enter them under the authentication or advanced settings. Otherwise leave them empty.
5. Click **Add**, then **Connect** if the server asks you to sign in.

**On a Team or Enterprise plan,** an Owner adds the connector for the organization under **Organization settings > Connectors** (**Add**, then **Custom**, then **Web** if asked for a type). Members then find it under **Customize > Connectors**, marked **Custom**, and click **Connect** to sign in with their own account.

The connector dialog offers three authentication modes: sign in now, sign in when the server asks, or no sign-in. For servers that take a fixed API key, Anthropic documents a **Request headers** section where you can store up to four headers, but it is in beta for a limited set of organizations, so you may not see it. When you enter an `Authorization` header there, include the scheme yourself (`Bearer your-token`); Claude sends the value exactly as typed. You cannot edit authentication settings after adding a connector; remove it and add it again.

In a conversation, open the **+** menu and choose **Connectors** to switch individual connectors on or off for that chat. Under **Customize > Connectors** you can also set individual tools to **Blocked**, which is worth doing for any write tool you do not need.

## Claude Desktop: local servers

Remote servers in Claude Desktop are connectors, exactly as above. Local servers are different: the app starts them itself, so they are configured on your machine. There are two ways.

**Desktop extensions.** A local server packaged as an `.mcpb` file can be installed from **Settings > Extensions** by dragging the file onto the page. This is the easiest route when a publisher offers one.

**The configuration file.** For any other local server, open the Claude menu in your system menu bar (not the settings inside the chat window), choose **Settings**, then **Developer**, then **Edit Config**. That opens `claude_desktop_config.json`, which lives at:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Add servers under `mcpServers`:

```json
{
  "mcpServers": {
    "galaxy": {
      "command": "npx",
      "args": ["tsx", "/Users/you/mcp/planets.ts"],
      "env": {
        "GALAXY_API_TOKEN": "your-token"
      }
    }
  }
}
```

Use absolute paths. Quit Claude Desktop completely and reopen it; the app only reads this file at startup. If the server does not appear, the logs are in `~/Library/Logs/Claude` on macOS (`mcp.log`, plus `mcp-server-<name>.log` with each server's stderr) and `%APPDATA%\Claude\logs` on Windows. The [MCP project's local server tutorial](https://modelcontextprotocol.io/docs/2026-07-28/develop/connect-local-servers) has more troubleshooting steps.

## Worked example: a Scalar-hosted MCP server

When you create an MCP server for your own API in Scalar, you get an installation URL of the form:

```text
https://mcp.scalar.com/mcp/YOUR_INSTALL_ID
```

There is no server for you to run; Scalar hosts it. How you connect depends on how the installation's access is set up, which is explained in the [authentication guide](/products/agent/authentication).

**A private installation (the default).** Connections are authenticated. People outside your team sign in through OAuth if their email or domain is on an access group attached to the installation. In Claude Code:

```bash
claude mcp add --transport http my-api https://mcp.scalar.com/mcp/YOUR_INSTALL_ID
```

Then run `/mcp` (or `claude mcp login my-api`) and complete the sign-in in your browser. In claude.ai, add the same URL as a custom connector and click **Connect**. Team members can also connect with a personal access token from **Account > API Keys** in the Scalar dashboard; the [MCP guide](/products/agent/mcp) shows the exact header to use for that.

**A public installation with passthrough auth.** Anyone can connect, and each user supplies their own credential for your API in a header you nominated when you set up the installation. Scalar forwards that header upstream without storing it:

```bash
claude mcp add --transport http my-api https://mcp.scalar.com/mcp/YOUR_INSTALL_ID \
  --header "Authorization: Bearer YOUR_API_CREDENTIAL"
```

Replace the header name and value with whatever your API expects. See [public MCP with passthrough auth](/products/agent/authentication/public-passthrough) for the setup.

**A public installation with OAuth passthrough.** Each user signs in with your API's own authorization server, and Scalar forwards the token they receive to your API. Add the URL with no header, exactly as for a private installation, and sign in with `/mcp`. The browser opens on your API's sign-in page instead of Scalar's. See [OAuth passthrough](/products/agent/authentication/oauth-passthrough) for the setup, including authorization servers without dynamic client registration.

A quick way to check which setup you are talking to: a private installation and one using OAuth passthrough both answer an unauthenticated request with `401` and a `WWW-Authenticate` header. The metadata document that header points to names Scalar's authorization server for a private installation and your API's own for OAuth passthrough. An installation ID that does not exist answers with `404`.

Once connected, try a question that needs your API: "list the five most recent orders" or "which endpoints can create a customer?". Scalar's server gives Claude a small set of tools to search your API description and execute requests, so the model looks up only the operations it needs.

## From your own code: the Claude Agent SDK

If you are building your own agent rather than using a Claude app, the Claude Agent SDK accepts MCP servers in its options. Scalar's [Agent SDK](/products/agent/integration/sdk) returns a ready-made configuration for a Scalar installation:

```ts
import { query } from '@anthropic-ai/claude-agent-sdk'
import { agentScalar } from '@scalar/agent'

const scalar = agentScalar({ token: 'your-personal-token' })
const installation = await scalar.installation('your-installation-id')

for await (const message of query({
  prompt: 'Which endpoints let me create a planet?',
  options: {
    mcpServers: { scalar: installation.createAnthropicMCP() },
    allowedTools: ['mcp__scalar__*'],
  },
})) {
  if ('result' in message) console.log(message.result)
}
```

Anthropic's API also offers an [MCP connector](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector) for calling remote MCP servers directly from the Messages API. If you are unsure whether an agent should use MCP at all or a typed library, [MCP vs SDK](/learn/mcp/mcp-vs-sdk) compares the two.

## Troubleshooting

**Claude Code says the entry has a `url` but no `type`.** In `.mcp.json` and `~/.claude.json`, an entry without `"type"` is read as a local stdio server. Add `"type": "http"`.

**Status shows "Pending approval".** A server from a project's `.mcp.json` has not been approved yet. Run `claude` in the project and approve it.

**401 or "needs authentication".** For OAuth servers, run `/mcp` and authenticate. For header-based servers, check that the token is valid and that your header includes `Bearer ` if the server expects it. Claude Code warns about leading or trailing whitespace in header values, a common result of pasting a token.

**A `${VAR}` header arrives empty.** The variable is unset, or it is one of the credential variables Claude Code deliberately reads as empty for remote servers. Rename it.

**A custom connector will not connect in claude.ai.** The server must be reachable from Anthropic's infrastructure on the public internet. A server behind a VPN or firewall will fail; for servers that must stay private, Anthropic documents [MCP tunnels](https://claude.com/docs/connectors/mcp-tunnels/overview).

**Tool results are cut off.** Claude Code warns above 10,000 tokens and limits a tool result to 25,000 tokens by default. Raise the limit with `MAX_MCP_OUTPUT_TOKENS`, or better, ask the server provider for tools that return smaller pages.

**Slow servers time out.** Set a startup timeout with `MCP_TIMEOUT` (milliseconds) or a per-server `timeout` field in `.mcp.json`.

If you are building the server yourself and something looks wrong at the protocol level, test it outside Claude first with the MCP Inspector, as described in [how to test MCP servers](/learn/mcp/test-mcp-servers).

## Frequently asked questions

<scalar-detail title="How do I add an MCP server to Claude Code?">
Run claude mcp add --transport http followed by a name and the server URL for a remote server, or claude mcp add with a name, then --, then the launch command for a local server. Use --scope project to share it through a committed .mcp.json file. Check it with claude mcp list or /mcp inside a session.
</scalar-detail>

<scalar-detail title="Can I use MCP servers in the free version of Claude?">
Yes. Custom connectors using remote MCP are available on the Free plan, limited to one custom connector. Pro, Max, Team and Enterprise plans can add more. Claude Code and local servers in Claude Desktop are configured separately.
</scalar-detail>

<scalar-detail title="Where is the Claude Desktop MCP config file?">
On macOS it is ~/Library/Application Support/Claude/claude_desktop_config.json, and on Windows it is %APPDATA%\Claude\claude_desktop_config.json. Open it from the Claude menu under Settings, Developer, Edit Config, and restart Claude Desktop after editing it. Remote servers are added as connectors instead.
</scalar-detail>

<scalar-detail title="Do claude.ai connectors work in Claude Code?">
Yes, when Claude Code is signed in with a claude.ai subscription. Connectors you added at claude.ai appear in /mcp automatically. They are not loaded when Claude Code authenticates with an API key or a third-party provider.
</scalar-detail>

<scalar-detail title="Can Claude connect to an MCP server on localhost?">
Not as a custom connector. Custom connectors in claude.ai and the Claude apps are reached from Anthropic's cloud, so a server on localhost or a private network is not reachable. Use Claude Code or a local server in Claude Desktop for anything running on your machine, or deploy the server somewhere public.
</scalar-detail>

<scalar-detail title="How do I connect a Scalar MCP server to Claude?">
Copy the installation URL from the Scalar dashboard, which looks like https://mcp.scalar.com/mcp/ followed by your installation ID. In Claude Code, add it with claude mcp add --transport http and sign in with /mcp. In claude.ai, add it as a custom connector and click Connect. Public installations with passthrough auth take your API credential in a header instead, and with OAuth passthrough the sign-in happens on the API's own authorization server.
</scalar-detail>

## Related

- **Learn:** [MCP server configuration](/learn/mcp/mcp-server-configuration) · [Remote MCP servers](/learn/mcp/remote-mcp-servers) · [MCP OAuth](/learn/mcp/mcp-oauth) · [MCP server examples](/learn/mcp/mcp-server-examples)
- **Docs:** [MCP servers](/products/agent/mcp) · [Getting started with Scalar MCP](/products/agent/getting-started)
- **Product:** [Scalar MCP](/products/agent/mcp) — turn an OpenAPI document into a hosted MCP server you can connect to Claude with one URL

*Commands, menu paths and plan limits were checked against Anthropic's Claude Code, connector and help center documentation on 26 September 2026. Claude's interfaces change often; if a menu name differs, search Anthropic's help center for "custom connectors".*
