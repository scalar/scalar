# SDK

Scalar provides SDKs to connect your AI agent to Scalar's OpenAPI MCP servers. Choose the SDK for your language and framework.

## TypeScript

The [`@scalar/agent`](https://www.npmjs.com/package/@scalar/agent) package provides native integrations for the Vercel AI SDK, OpenAI Agents SDK, and Anthropic Claude Agent SDK.

### Installation

```bash
npm i @scalar/agent
```

```bash
pnpm i @scalar/agent
```

```bash
bun i @scalar/agent
```

### Personal Access Token

You can create a personal access token in the [Dashboard](https://dashboard.scalar.com/account) under **Account > API Keys**.

### Setup

Initialize the SDK with your personal token, then create an installation reference using your installation ID.

```ts
import { agentScalar } from '@scalar/agent'

const scalar = agentScalar({
  token: 'your-personal-token',
})

const installation = await scalar.installation('your-installation-id')
```

### Providers

#### Vercel AI SDK

Uses `@ai-sdk/mcp` natively. Returns a tool set ready for `generateText` or `streamText`.

```ts
import { agentScalar } from '@scalar/agent'
import { generateText, stepCountIs } from 'ai'

const scalar = agentScalar({
  token: 'your-personal-token',
})

const installation = await scalar.installation('your-installation-id')

const tools = await installation.createVercelAITools()

const { text } = await generateText({
  model,
  tools,
  stopWhen: stepCountIs(5),
  prompt: 'How do I create a planet?',
})
```

#### OpenAI Agents SDK

Returns options for `MCPServerStreamableHttp` from `@openai/agents`. The agent runtime handles tool discovery and execution natively.

```ts
import { agentScalar } from '@scalar/agent'
import { Agent, MCPServerStreamableHttp, run } from '@openai/agents'

const scalar = agentScalar({
  token: 'your-token',
})

const installation = await scalar.installation('your-installation-id')

const server = new MCPServerStreamableHttp(installation.createOpenAIMCP())
await server.connect()

const agent = new Agent({
  name: 'api-agent',
  mcpServers: [server],
})

const result = await run(
  agent,
  'Which APIs are available that let me create a planet?',
)

await server.close()
```

#### Anthropic Claude Agent SDK

Returns an MCP server configuration for `@anthropic-ai/claude-agent-sdk`.

```ts
import { agentScalar } from '@scalar/agent'
import { query } from '@anthropic-ai/claude-agent-sdk'

const scalar = agentScalar({
  token: 'your-token',
})

const installation = await scalar.installation('your-installation-id')

for await (const message of query({
  prompt: 'Which APIs are available that let me create a planet?',
  options: {
    mcpServers: {
      scalar: installation.createAnthropicMCP(),
    },
    allowedTools: ['mcp__scalar__*'],
  },
})) {
  if ('result' in message) console.log(message.result)
}
```

### Configuration

| Option    | Type     | Description                                                           |
| --------- | -------- | --------------------------------------------------------------------- |
| `token`   | `string` | Your Scalar personal token used to authenticate requests to your MCP  |
| `baseUrl` | `string` | Base URL of the Scalar MCP server. Defaults to the Scalar environment |

## Python

The [`scalar-agent`](https://pypi.org/project/scalar-agent/) package provides native integrations for the OpenAI Agents SDK and Anthropic Claude Agent SDK.

### Installation

```bash
pip install scalar-agent
```

With provider extras:

```bash
# For Anthropic
pip install "scalar-agent[anthropic]"

# For OpenAI
pip install "scalar-agent[openai]"

# Both
pip install "scalar-agent[all]"
```

### Personal Access Token

You can create a personal access token in the [Scalar dashboard](https://dashboard.scalar.com/account) under **Account > API Keys**.

### Setup

Initialize the SDK with your personal token, then create an installation reference using your installation ID.

```python
from scalar_agent import agent_scalar

scalar = agent_scalar(token="your-personal-token")
installation = scalar.installation("your-installation-id")
```

### Providers

#### OpenAI Agents SDK

Returns params for `MCPServerStreamableHttp` from `openai-agents`. The agent runtime handles tool discovery and execution natively.

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

#### Anthropic Claude Agent SDK

Returns an MCP server configuration for `claude_agent_sdk`.

```python
import asyncio

from scalar_agent import agent_scalar
from claude_agent_sdk import query
from claude_agent_sdk.types import ClaudeAgentOptions, ResultMessage

scalar = agent_scalar(token="your-personal-token")
installation = scalar.installation("your-installation-id")

async def main() -> None:
    async for message in query(
        prompt="Which APIs are available that let me create a planet?",
        options=ClaudeAgentOptions(
            mcp_servers={"scalar": installation.create_anthropic_mcp()},
            allowed_tools=["mcp__scalar__*"],
        ),
    ):
        if isinstance(message, ResultMessage):
            print(message.result)

asyncio.run(main())
```

### Configuration

| Parameter  | Type  | Description                                                           |
| ---------- | ----- | --------------------------------------------------------------------- |
| `token`    | `str` | Your Scalar personal token used to authenticate requests to your MCP  |
| `base_url` | `str` | Base URL of the Scalar MCP server. Defaults to the Scalar environment |
