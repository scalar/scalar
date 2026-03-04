
# Safely use APIs with AI

![ASCII-style image of a headset](../assets/blog/agent-scalar.jpg)

Large APIs are a worst-case workload for agent tool use. Raw OpenAPI in the prompt overflows context. Native MCP helps but still pays a large, repeated schema cost. Agent Scalar keeps the tool surface fixed and fetches just-in-time details. The result is smaller context, fewer steps, and better routing.

## The problem

If you dump a full OpenAPI document into the prompt, you often blow past the model's context window before the model can do any work. That's exactly what happens with Zoom Meetings in our benchmark.

Even when the API is smaller (Notion), raw OpenAPI is expensive: it works, but you pay a steep token tax every run. MCP reduces cost, but native MCP still carries schema tokens for every endpoint. Agent Scalar collapses that into three tools and pulls only the schema it needs.

Token counting was done with [tiktoken](https://github.com/openai/tiktoken) BTW.

## Benchmark setup

We ran identical tasks across three approaches:

- Raw OpenAPI in prompt
- Native MCP (tool per endpoint)
- Agent Scalar (3 tools: search, mini-spec, execute)

We used Zoom Meetings (list/create/update) and Notion (search/create page/get workspace). Example Notion prompts are aligned with Notion's MCP tools guide.

## Zoom Meetings — Summary

| Mode         | Task                   | Runs | Success | Avg Tokens | Avg Latency | Avg Steps |
| ------------ | ---------------------- | ---- | ------- | ---------- | ----------- | --------- |
| raw-openapi  | List upcoming meetings | 1    | 0%      | 385797     | 2205 ms     | 0.0       |
| native-mcp   | List upcoming meetings | 1    | 100%    | 20179      | 47887 ms    | 6.0       |
| agent-scalar | List upcoming meetings | 1    | 100%    | 5531       | 23029 ms    | 2.0       |
| raw-openapi  | Create a meeting       | 1    | 0%      | 385791     | 2011 ms     | 0.0       |
| native-mcp   | Create a meeting       | 1    | 100%    | 95474      | 46529 ms    | 6.0       |
| agent-scalar | Create a meeting       | 1    | 100%    | 39327      | 20637 ms    | 2.0       |
| raw-openapi  | Update a meeting       | 1    | 0%      | 385792     | 1978 ms     | 0.0       |
| native-mcp   | Update a meeting       | 1    | 100%    | 95406      | 45189 ms    | 6.0       |
| agent-scalar | Update a meeting       | 1    | 100%    | 12674      | 13367 ms    | 2.0       |

## Zoom Meetings — Schema Cost (200k context)

| Approach                          | Tools | Token cost | Schema Tokens | All-in Tokens | Context used (200k) |
| --------------------------------- | ----- | ---------- | ------------- | ------------- | ------------------- |
| Raw OpenAPI Spec in prompt        | --    | 295656     | 0             | 295656        | 147.8%              |
| Native MCP (full schemas)         | 183   | 89281      | 89530         | 178811        | 89.4%               |
| Native MCP (required params only) | 183   | 5504       | 89530         | 95034         | 47.5%               |
| Agent Scalar (MCP tools)          | 3     | 412        | 412           | 412           | 0.2%                |

## Notion — Summary

| Mode         | Task                               | Runs | Success | Avg Tokens | Avg Latency | Avg Steps |
| ------------ | ---------------------------------- | ---- | ------- | ---------- | ----------- | --------- |
| raw-openapi  | Search for budget approval docs    | 1    | 100%    | 95819      | 114858 ms   | 1.0       |
| native-mcp   | Search for budget approval docs    | 1    | 100%    | 14725      | 39663 ms    | 6.0       |
| agent-scalar | Search for budget approval docs    | 1    | 100%    | 1873       | 51474 ms    | 3.0       |
| raw-openapi  | Create project kickoff page        | 1    | 100%    | 96479      | 75803 ms    | 1.0       |
| native-mcp   | Create project kickoff page        | 1    | 100%    | 14643      | 51163 ms    | 6.0       |
| agent-scalar | Create project kickoff page        | 1    | 100%    | 1454       | 103488 ms   | 2.0       |
| raw-openapi  | Which workspace am I connected to? | 1    | 100%    | 95490      | 22175 ms    | 1.0       |
| native-mcp   | Which workspace am I connected to? | 1    | 100%    | 14385      | 27013 ms    | 6.0       |
| agent-scalar | Which workspace am I connected to? | 1    | 100%    | 1206       | 27580 ms    | 3.0       |

## Notion — Schema Cost (200k context)

| Approach                          | Tools | Token cost | Schema Tokens | All-in Tokens | Context used (200k) |
| --------------------------------- | ----- | ---------- | ------------- | ------------- | ------------------- |
| Raw OpenAPI Spec in prompt        | --    | 69114      | 0             | 69114         | 34.6%               |
| Native MCP (full schemas)         | 26    | 2104       | 12803         | 14907         | 7.5%                |
| Native MCP (required params only) | 26    | 829        | 12803         | 13632         | 6.8%                |
| Agent Scalar (MCP tools)          | 3     | 400        | 400           | 400           | 0.2%                |

## Why Agent Scalar wins

1. **Fixed tool surface.** Native MCP scales with endpoint count; Agent Scalar does not. Three tools cover the entire API.
2. **Spec on demand.** Instead of loading the full spec upfront, the agent calls a mini-spec for only the endpoints it needs.
3. **Lower and more predictable token cost.** The schema footprint is tiny (hundreds of tokens) even for large APIs like Zoom.

## How it works (short)

1. Upload your OpenAPI document to Scalar.
2. Scalar augments it for search and execution.
3. Agents connect via MCP with three tools: `get-openapi-specs-summary`, `get-mini-openapi-spec`, `execute-request`.

## Try it

You can use Agent Scalar in two ways:

1. **Chat UI:** upload your OpenAPI and chat at [`agent.scalar.com`](https://agent.scalar.com).
2. **Agent SDK:** connect to Scalar MCP servers from your agent runtime (Vercel AI SDK, OpenAI Agents SDK, Anthropic Claude SDK).

```ts
import { Agent, MCPServerStreamableHttp, run } from '@openai/agents'
import { agentScalar } from '@scalar-org/agent-sdk'

const scalar = agentScalar({
  agentKey: 'your-agent-key',
})

const session = await scalar.session()

const serverOptions = session.createOpenAIMCPServerOptions()
const servers = serverOptions.map((opts) => new MCPServerStreamableHttp(opts))
await Promise.all(servers.map((s) => s.connect()))

const agent = new Agent({
  name: 'api-agent',
  instructions: 'You help users interact with APIs.',
  mcpServers: servers,
})

const result = await run(agent, 'List the available endpoints in the Zoom API')

await Promise.all(servers.map((s) => s.close()))
```

Agent Scalar is able to scale across N APIs that you want your agent to have access to, without flooding the context window and yielding the most accurate tool calling.

**Mar 4, 2025**
