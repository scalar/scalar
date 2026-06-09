# MCP & Agent

Connect your APIs to LLMs quickly, securely, and with minimal context.

Upload your OpenAPI documents and instantly expose them as an MCP server; just-in-time tool calls, secure delegated auth, and only 0.2% of your context window no matter how many APIs you need.

<div class="flex gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Get started</a>
  <a class="t-editor__button button__secondary" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Contact sales</a>
</div>

<div class="logowall">
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-bobcat.svg"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-clerk.svg?v=2"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-partech.svg?v=2"></scalar-icon>
  </div>
</div>

## Everything agents need

<div class="feature">
  <div class="feature-container">
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/grid-four"></scalar-icon>
        Just-in-time tool calls
      </b>
      <p class="leading-6">Three tools cover any API. Operation details are retrieved when needed, not dumped into the first turn.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/shield-check"></scalar-icon>
        Secure delegated auth
      </b>
      <p class="leading-6">Configure OAuth, API keys, or bearer tokens per installation. Agents never receive your upstream credentials.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/users-three"></scalar-icon>
        Scoped access
      </b>
      <p class="leading-6">Decide which APIs and endpoints each MCP installation may call. Private by default; share carefully via team flows.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/arrows-out-line-horizontal"></scalar-icon>
        Isolated execution
      </b>
      <p class="leading-6">Sandboxed requests so concurrent agents and automations can share the same catalog safely.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/article"></scalar-icon>
        Markdown in MCP
      </b>
      <p class="leading-6">Expose guides and long-form documentation beside API tools when you want extra context in the server.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/infinity"></scalar-icon>
        Public and internal APIs
      </b>
      <p class="leading-6">Works for public SaaS APIs and for large internal microservice catalogs without growing the tool list.</p>
    </div>
  </div>
</div>

## From API to agent-ready in three steps

No custom wrappers and no token bloat. Scalar sits between your API definition and the agent runtime.

<scalar-steps>
  <scalar-step id="agent-step-upload" title="Upload">

Add one spec or many—paste a URL or upload directly. Scalar parses, indexes, and augments it for search and execution.

  </scalar-step>

  <scalar-step id="agent-step-configure" title="Configure">

Create [installations](./mcp.md), set access, and preconfigure auth (OAuth, API keys, bearer tokens). Agents use your Scalar credentials; your upstream API secrets stay on our execution layer.

  </scalar-step>

  <scalar-step id="agent-step-connect" title="Connect">

Plug in via MCP URL or the [Agent SDK](./sdk.md). The model gets three lean tools that pull schema and operation details just in time.

  </scalar-step>
</scalar-steps>

## Connect from anywhere

Use the chat at [agent.scalar.com](https://agent.scalar.com), or connect from your own agent runtime or IDE. Create a personal access token under [Account → API Keys](https://dashboard.scalar.com/account), then follow the guide for your stack ([SDK](./sdk.md) · [MCP](./mcp.md)).

<div class="connect-platforms" role="list">
  <a class="connect-platform" role="listitem" href="./sdk.md#openai-agents-sdk">
    <img class="connect-platform__logo" src="./openai.svg" alt="" width="22" height="22" />
    <span class="connect-platform__label">OpenAI</span>
  </a>
  <a class="connect-platform" role="listitem" href="./sdk.md#anthropic-claude-agent-sdk">
    <img class="connect-platform__logo" src="https://cdn.simpleicons.org/claude" alt="" width="22" height="22" />
    <span class="connect-platform__label">Anthropic</span>
  </a>
  <a class="connect-platform" role="listitem" href="./mcp.md#connect-to-your-mcp-server">
    <img class="connect-platform__logo" src="https://cdn.simpleicons.org/cursor" alt="" width="22" height="22" />
    <span class="connect-platform__label">Cursor</span>
  </a>
  <a class="connect-platform" role="listitem" href="https://agent.scalar.com">
    <img class="connect-platform__logo" src="https://cdn.simpleicons.org/scalar" alt="" width="22" height="22" />
    <span class="connect-platform__label">Agent Scalar</span>
  </a>
</div>

```python
import asyncio

from scalar_agent import agent_scalar
from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp

async def main() -> None:
    scalar = agent_scalar(token="your-personal-token")
    installation = scalar.installation("your-installation-id")

    server = MCPServerStreamableHttp(**installation.create_openai_mcp())
    await server.connect()

    agent = Agent(name="api-agent", mcp_servers=[server])

    result = await Runner.run(agent, "Which APIs are available that let me create a planet?")
    print(result.final_output)

    await server.cleanup()

asyncio.run(main())
```

## Authentication and access

Configure auth once in the Scalar dashboard—OAuth 2.0, API keys, bearer tokens, or patterns that match your OpenAPI `securitySchemes`. Every MCP connection still requires a Scalar personal access token or team-approved flow so shared URLs do not leak access by themselves.

Read more: [API Authentication](./mcp.md#api-authentication) on the MCP page.

## Ready to connect your APIs?

Spin up your first MCP server in under a minute—no boilerplate servers to maintain.

<div class="flex gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Get started</a>
  <a class="t-editor__button button__secondary" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Contact sales</a>
</div>

<style>
  .t-editor__anchor {
    --font-visited: none;
  }

  main.content {
    overflow-x: clip;
  }

  .t-editor.page {
    position: relative;
  }

  .t-doc .layout-header {
    z-index: 10000;
  }

  .t-editor__button {
    min-width: 160px;
    justify-content: center;
  }

  .feature-container {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 48px;
    row-gap: 36px;
    margin-top: 32px;
  }

  .logowall.logowall {
    margin-top: 48px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    align-items: center;
    gap: 40px;
  }

  .logowall-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .logowall-item svg {
    width: fit-content;
    height: auto;
    max-height: 24px;
  }

  .ign-logo__fill {
    fill: var(--scalar-color-1);
  }

  .fill-current-bg {
    fill: var(--scalar-background-1);
  }

  .connect-platforms {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
    margin-top: 20px;
    margin-bottom: 8px;
  }

  .connect-platform {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-width: 0;
    padding: 10px 16px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius-lg);
    text-decoration: none;
    color: var(--scalar-color-1);
    font-weight: var(--scalar-semibold);
    font-size: 14px;
    line-height: 1.2;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  .connect-platform:hover {
    background: var(--scalar-background-2);
    border-color: var(--scalar-color-3);
  }

  .connect-platform__logo {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    object-fit: contain;
  }

  .dark-mode .connect-platform__logo {
    filter: invert(1);
  }

  @media screen and (max-width: 1000px) {
    .logowall.logowall {
      grid-template-columns: repeat(2, 1fr);
      column-gap: 20px;
      row-gap: 40px;
    }

    .logowall-item {
      justify-content: start;
    }

    .logowall-item svg {
      max-width: 100%;
      height: 100%;
      max-height: 20px;
    }

    .feature-container {
      grid-template-columns: 1fr;
      row-gap: 28px;
    }
  }
</style>
