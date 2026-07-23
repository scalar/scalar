# Getting Started

Turn your OpenAPI documents into an MCP server and connect your APIs to LLMs in minutes. No custom wrappers and no token bloat—Scalar sits between your API definition and the agent runtime.

## From API to agent-ready in three steps

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

## Next steps

- Create and manage [MCP installations](./mcp.md)
- Connect from your runtime with the [Agent SDK](./sdk.md)
- Try the hosted chat at [agent.scalar.com](https://agent.scalar.com)

<style>
  .t-editor__anchor {
    --font-visited: none;
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
</style>
