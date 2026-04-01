
# Your API? 0.2% of your context window

![ASCII-style image of a headset](../assets/blog/agent-scalar.jpg)

Make your AI Agents talk to APIs is easy and fun. It's just that bigger APIs are a worst-case workload for agents. Raw API definitions in the prompt overflows context so easily. I mean, we tried that. But all we got is hallucinated endpoints and unreliable responses.

That's something MCP helps with. You just wrap your API as MCP tools, and you're good to go. That's what we thought. Actually, the repeated schemas come with a cost (tokens), too.

I'm glad to say, we found something better. It's called [Agent](../../products/agent/getting-started.md) and our newest product, tightly integrated with our set of tools for your API. And here is why it might be better than your average MCP server:

Agent keeps the tool surface fixed and super small. It fetches just-in-time details. The result is smaller context, fewer steps, and better routing. And happy agents. :-)

## Get Started

<scalar-button
  title="Chat with Agent"
  href="https://agent.scalar.com"
  icon="phosphor/regular/chat-circle-dots">
</scalar-button>

<scalar-button
  title="Create your own MCP"
  href="https://dashboard.scalar.com/register"
  icon="phosphor/regular/cpu">
</scalar-button>

## The problem

If you dump the full OpenAPI document into the prompt, you often blow past the model's context window before the model can do any work. That's exactly what happens with the, for example, the [Zoom Meetings API](https://developers.zoom.us/docs/api/meetings/).

Even when the API is smaller, like [Notions API](https://developers.notion.com/guides/get-started/getting-started), raw OpenAPI is so expensive: It works, sure, but you pay a steep token tax every run. MCP reduces cost a lot, but native MCP still carries schema tokens for every single endpoint.

Agent collapses that into three tools and pulls only the schema it needs.

## Benchmarking what we built

We ran a few benchmarks to test Agent with real-world APIs. And the results are so good, but take a look yourself:

### Benchmark setup

We ran identical tasks across three approaches:

1. Raw OpenAPI documents in prompt
2. Native MCP server (one tool per endpoint)
3. Agent (3 tools: summarize, search and execute)

We used [Zoom Meetings API](https://developers.zoom.us/docs/api/meetings/) (list, create, update) and [Notions API](https://developers.notion.com/guides/get-started/getting-started) (search, create page, get workspace). Example Notion prompts are aligned with Notion's MCP tools guide.

Token counting was done with [tiktoken](https://github.com/openai/tiktoken).

### Zoom Mettings

**Summary**

| Mode         | Task                   | Runs | Success | Avg Tokens                                                         | Avg Latency | Avg Steps |
| ------------ | ---------------------- | ---- | ------- | ------------------------------------------------------------------ | ----------- | --------- |
| raw-openapi  | List upcoming meetings | 1    | 0%      | 385797                                                             | 2205 ms     | 0.0       |
| native-mcp   | List upcoming meetings | 1    | 100%    | 20179                                                              | 47887 ms    | 6.0       |
| agent-scalar | List upcoming meetings | 1    | 100%    | 5531                                                               | 23029 ms    | 2.0       |
| raw-openapi  | Create a meeting       | 1    | 0%      | 385791                                                             | 2011 ms     | 0.0       |
| native-mcp   | Create a meeting       | 1    | 100%    | 95474                                                              | 46529 ms    | 6.0       |
| agent-scalar | Create a meeting       | 1    | 100%    | 39327                                                              | 20637 ms    | 2.0       |
| raw-openapi  | Update a meeting       | 1    | 0%      | 385792                                                             | 1978 ms     | 0.0       |
| native-mcp   | Update a meeting       | 1    | 100%    | 95406                                                              | 45189 ms    | 6.0       |
| agent-scalar | Update a meeting       | 1    | 100%    | <span style="background-color: yellow; color: black;">12674</span> | 13367 ms    | 2.0       |

**Schema Cost (200k context)**

| Approach                          | Tools | Token cost | Schema Tokens | All-in Tokens | Context used (200k)                                               |
| --------------------------------- | ----- | ---------- | ------------- | ------------- | ----------------------------------------------------------------- |
| Raw OpenAPI Spec in prompt        | --    | 295656     | 0             | 295656        | 147.8%                                                            |
| Native MCP (full schemas)         | 183   | 89281      | 89530         | 178811        | 89.4%                                                             |
| Native MCP (required params only) | 183   | 5504       | 89530         | 95034         | 47.5%                                                             |
| Agent (MCP tools)          | 3     | 412        | 412           | 412           | <span style="background-color: yellow; color: black;">0.2%</span> |

### Notion

**Summary**

| Mode         | Task                               | Runs | Success | Avg Tokens                                                        | Avg Latency | Avg Steps |
| ------------ | ---------------------------------- | ---- | ------- | ----------------------------------------------------------------- | ----------- | --------- |
| raw-openapi  | Search for budget approval docs    | 1    | 100%    | 95819                                                             | 114858 ms   | 1.0       |
| native-mcp   | Search for budget approval docs    | 1    | 100%    | 14725                                                             | 39663 ms    | 6.0       |
| agent-scalar | Search for budget approval docs    | 1    | 100%    | 1873                                                              | 51474 ms    | 3.0       |
| raw-openapi  | Create project kickoff page        | 1    | 100%    | 96479                                                             | 75803 ms    | 1.0       |
| native-mcp   | Create project kickoff page        | 1    | 100%    | 14643                                                             | 51163 ms    | 6.0       |
| agent-scalar | Create project kickoff page        | 1    | 100%    | 1454                                                              | 103488 ms   | 2.0       |
| raw-openapi  | Which workspace am I connected to? | 1    | 100%    | 95490                                                             | 22175 ms    | 1.0       |
| native-mcp   | Which workspace am I connected to? | 1    | 100%    | 14385                                                             | 27013 ms    | 6.0       |
| agent-scalar | Which workspace am I connected to? | 1    | 100%    | <span style="background-color: yellow; color: black;">1206</span> | 27580 ms    | 3.0       |

**Schema Cost (200k context)**

| Approach                          | Tools | Token cost | Schema Tokens | All-in Tokens | Context used (200k)                                               |
| --------------------------------- | ----- | ---------- | ------------- | ------------- | ----------------------------------------------------------------- |
| Raw OpenAPI Spec in prompt        | --    | 69114      | 0             | 69114         | 34.6%                                                             |
| Native MCP (full schemas)         | 26    | 2104       | 12803         | 14907         | 7.5%                                                              |
| Native MCP (required params only) | 26    | 829        | 12803         | 13632         | 6.8%                                                              |
| Agent (MCP tools)          | 3     | 400        | 400           | 400           | <span style="background-color: yellow; color: black;">0.2%</span> |

## The Results

Guess who's the clear winner with just 0.2% of your context window: Agent. Why is that?

1. Native MCP scales with endpoint count. Agent does not. Three tools cover the entire API.

2. Instead of loading the full API definition upfront, the agent calls a tiny version, with just the endpoints and schemas it needs.

3. The schema footprint is tiny (hundreds of tokens) even for large APIs like the Zoom Meetings API.

## How it works

1. Upload your OpenAPI document to Scalar.
2. Scalar augments it for search and execution.
3. Agents connect via MCP with three tools:
   * `summarize-openapi-specs` (short summary of specs and available endpoints)
   * `search-openapi-operations` (minified OpenAPI documents for the endpoints matching the user's search), and
   * `execute-request`

## Try it

You can use Agent in two ways:

1. **Chat UI:** upload your OpenAPI and chat at [`agent.scalar.com`](https://agent.scalar.com).
2. **Agent SDK:** connect to Scalar MCP servers from your agent runtime (Vercel AI SDK, OpenAI Agents SDK, Anthropic Claude SDK).

```ts
import { Agent, MCPServerStreamableHttp, run } from '@openai/agents'
import { agentScalar } from '@scalar-org/agent-sdk'

const scalar = agentScalar({
  agentKey: 'YOUR_AGENT_KEY',
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

const result = await run(agent, 'pls list available endpoints in the zoom api thanks')

await Promise.all(servers.map((s) => s.close()))
```

Agent is able to scale across N APIs that you want your agent to have access to, without flooding the context window and yielding the most accurate tool calling. Crazy, eh?

**Mar 5, 2026**
