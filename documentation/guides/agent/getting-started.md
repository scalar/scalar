<div class="hero-animation container-full">
  <scalar-icon src="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/v1Pu6_BCmly6VhPAuotVZ.svg"></scalar-icon>
</div>
<div class="flex flex-col gap-3 hero small-test">
<span data-v-1c61db84="" class="page-breadcrumb">MCP &amp; Agent Scalar</span>
  <scalar-heading level="2" slug="scalar-agent" class="text-balance">
    Connect your APIs to LLMs quickly, securely, and with minimal context
  </scalar-heading>
  <p>
    Upload your OpenAPI documents and instantly expose them as an MCP server; just-in-time tool calls, secure delegated auth, and only 0.2% of your context window no matter how many APIs you need.
  </p>
</div>

<div class="flex gap-2">
  <a class="t-editor__button" href="https://dashboard.scalar.com/register">Get started</a>
  <a class="t-editor__button" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Contact sales</a>
</div>

<br>

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

<div class="flex">
  <div class="full-container-constrained">


## Everything agents need
<div class="feature">
  <div class="flex flex-wrap feature-container">
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/grid-four"></scalar-icon>
        Just-in-time tool calls
      </b>
      <p class="mt-2 text-c-2 text-sm">Three tools cover any API. Operation details are retrieved when needed, not dumped into the first turn.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/shield-check"></scalar-icon>
        Secure delegated auth
      </b>
      <p class="mt-2 text-c-2 text-sm">Configure OAuth, API keys, or bearer tokens per installation. Agents never receive your upstream credentials.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/users-three"></scalar-icon>
        Scoped access
      </b>
      <p class="mt-2 text-c-2 text-sm">Decide which APIs and endpoints each MCP installation may call. Private by default; share carefully via team flows.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/arrows-out-line-horizontal"></scalar-icon>
        Isolated execution
      </b>
      <p class="mt-2 text-c-2 text-sm">Sandboxed requests so concurrent agents and automations can share the same catalog safely.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/article"></scalar-icon>
        Markdown in MCP
      </b>
      <p class="mt-2 text-c-2 text-sm">Expose guides and long-form documentation beside API tools when you want extra context in the server.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/infinity"></scalar-icon>
        Public and internal APIs
      </b>
      <p class="mt-2 text-c-2 text-sm">Works for public SaaS APIs and for large internal microservice catalogs without growing the tool list.</p>
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
    <span class="connect-platform__label">Agent Scalar Chat</span>
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

Configure auth once in the Scalar dashboard—OAuth 2.0, API keys, bearer tokens, or patterns that match your OpenAPI <code>securitySchemes</code>. Every MCP connection still requires a Scalar personal access token or team-approved flow so shared URLs do not leak access by themselves.

Read more: <a href="./mcp.md#api-authentication">API Authentication</a> on the MCP page.

<div class="feature">
  <div class="cta flex flex-col gap-3 small-test">
    <scalar-heading level="2" class="text-balance" slug="ready-to-connect">Ready to connect your APIs?</scalar-heading>
    <p>
      Spin up your first MCP server in under a minute—no boilerplate servers to maintain.
    </p>
    <div class="flex gap-2 mb-11 flex-wrap">
      <a class="t-editor__button" href="https://dashboard.scalar.com/register">Get started</a>
  <a class="t-editor__button" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Contact sales</a>
    </div>
    <a class="expander-hover-link" href="./pricing.md" aria-label="Agent pricing">Pricing →</a>
    <a class="expander-hover-link" href="https://discord.gg/scalar" target="_blank" aria-label="Join Scalar on Discord">Discord →</a>
  </div>
</div>

  </div>
</div>

<style>
  .resources-cta-container {
    border-radius: var(--scalar-radius-lg);
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    width: 100%;
    padding: 12px 8px;
  }
  .resources-cta {
    max-height: fit-content;
    width: 100%;
    top: 12px;
    padding-top: 50px;
    padding-bottom: 200px;
  }
  .full-container-constrained {
    max-width: 720px;
    padding-right: 40px;
  }
  .full-container-constrained > .t-editor__heading {
    margin-top: 44px;
  }
  .full-container-constrained > .t-editor__paragraph {
    margin-top: 12px;
  }
  .hero-animation {
    position: absolute;
    top: 0;
    z-index: -1;
    transform: scaleY(-1);
    margin-top: 0;
  }
  .hero-animation .fa {
    --fa-orange: rgba(180, 186, 196, 0.28);
    --fa-yellow: #a8adb8;
    --fa-red: rgba(140, 145, 155, 0);
    --scalar-background-2: var(--scalar-background-1);
  }
  @supports (color: color(display-p3 1 1 1)) {
    .hero-animation .fa {
      --fa-orange: color(display-p3 0.71 0.73 0.76 / 0.28);
      --fa-yellow: color(display-p3 0.65 0.68 0.72);
      --fa-red: color(display-p3 0.55 0.57 0.6 / 0);
    }
  }
  .t-editor__page-title,
  .t-editor__page-nav,
  .notify-container,
  .subheading,
  :not(.getting-started).footer,
  .t-editor .page-header,
  .content .page-nav {
    display: none;
  }
  main.content {
    overflow-x: clip;
  }
  .t-doc .layout-header {
    z-index: 10000;
  }
  .t-editor__button {
    min-width: 160px;
    justify-content: center;
  }
  .t-editor .editor-content,
  .t-editor {
    padding-bottom: 0;
  }
  h3.t-editor__heading,
  h2.t-editor__heading {
    --font-size: var(--scalar-heading-1);
    margin-top: 0;
  }
  :root {
    --scalar-container-width: 960px;
  }
  .hero.hero {
    margin-top: 88px;
  }
  .small-test {
    max-width: 680px;
    text-wrap: balance;
    margin-top: 44px;
    position: relative;
  }
  .t-editor .editor-static .page-node,
  .t-editor .page-node,
  .t-editor .content {
    max-width: var(--scalar-container-width);
    padding-bottom: 0;
    margin-bottom: 0;
  }
  .container-full {
    --scalar-container-sidebar-gap: calc(
      (
        (100dvw - var(--scalar-container-width) - var(--scalar-sidebar-width)) /
          2
      )
    );
    width: calc(100dvw - var(--scalar-sidebar-width));
    margin-left: min(-1 * var(--scalar-container-sidebar-gap), -50px);
  }
  .t-editor.page {
    position: relative;
    margin-right: unset;
  }
  .logowall.agent-integrations {
    margin-top: 32px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    align-items: center;
    gap: 16px 24px;
  }
  .logowall.agent-integrations .logowall-item {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .feature.agent-stats {
    padding: 32px 0 16px !important;
  }
  .feature-container {
    gap: 6px;
    margin-top: 32px;
  }
  .feature.agent-stats .feature-container {
    margin-top: 0;
  }
  .feature-item {
    flex: 0 0 calc(50% - 6px);
  }
  .feature.agent-stats .feature-item {
    flex: 0 0 calc(33.333% - 6px);
  }
  .cta {
    padding: 80px 0;
    margin-top: 0 !important;
  }
  .mb-11 {
    margin-bottom: 44px;
  }
  .expander-hover-link {
    --font-color: var(--scalar-color-2);
    --font-visited: var(--scalar-color-2);
    color: var(--font-color, var(--scalar-color-1));
    font-weight: var(--scalar-semibold);
    text-underline-offset: 0.25rem;
    text-decoration-thickness: 1px;
    text-decoration: underline;
    text-decoration-color: color-mix(
      in srgb,
      var(--font-color, var(--scalar-color-1)) 30%,
      transparent
    );
    margin-top: 6px;
    display: inline-block;
    margin-right: 16px;
  }
  .expander-hover-link:hover {
    --font-color: var(--scalar-color-1);
  }
  @media screen and (max-width: 1280px) {
    .resources-cta {
      display: none;
    }
    .full-container-constrained {
      padding-right: 0px;
      max-width: 100%;
    }
  }
  @media screen and (max-width: 1000px) {
    .t-doc {
      --scalar-sidebar-width: 0px;
    }
    .hero.hero {
      margin-top: 188px;
    }
    .t-editor.page {
      padding-inline: 30px;
    }
    .container-full {
      --scalar-container-sidebar-gap: 30px;
      width: 100dvw;
      padding-inline: 30px;
      margin-inline: -30px;
    }
    .hero-animation {
      margin-top: -100px !important;
      padding-inline: 0;
      margin-inline: 0;
    }
    .logowall.agent-integrations {
      grid-template-columns: repeat(2, 1fr);
    }
    .feature-item,
    .feature.agent-stats .feature-item {
      flex: 0 0 calc(100% - 22px);
    }
  }
  /* logos */
  .logowall.logowall {
    margin-top: 24px;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    align-items: center;
    gap: 40px;
  }
  .logowall-item {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .logowall-item svg {
    width: 100%;
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
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
    margin-bottom: 8px;
  }
  .connect-platform {
    display: inline-flex;
    align-items: center;
    gap: 10px;
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
</style>
