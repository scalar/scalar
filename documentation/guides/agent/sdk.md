# SDK

The [`@scalar/agent`](https://www.npmjs.com/package/@scalar/agent) SDK connects your AI agent to Scalar's OpenAPI MCP servers. It provides native integrations for the Vercel AI SDK, OpenAI Agents SDK, and Anthropic Claude Agent SDK.

## Installation

```bash
npm i @scalar/agent
```

```bash
pnpm i @scalar/agent
```

```bash
bun i @scalar/agent
```

## Personal Access Token

You can create a personal access token in the [Scalar dashboard](https://dashboard.scalar.com/account) under **API Keys**.

## Setup

Initialize the SDK with your personal token, then create an installation reference using your installation ID.

```ts
import { agentScalar } from '@scalar/agent'

const scalar = agentScalar({
  token: 'your-personal-token',
})

const installation = await scalar.installation('your-installation-id')
```

## Providers

### Vercel AI SDK

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

### OpenAI Agents SDK

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

### Anthropic Claude Agent SDK

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

## Configuration

| Option    | Type     | Description                                                           |
| --------- | -------- | --------------------------------------------------------------------- |
| `token`   | `string` | Your Scalar personal token used to authenticate requests to your MCP  |
| `baseUrl` | `string` | Base URL of the Scalar MCP server. Defaults to the Scalar environment |
