# MCP vs function calling: what is the difference?

*Last updated: September 2026*

Function calling is a feature of a model's API that lets the model return a structured request to run a function you described, while the Model Context Protocol (MCP) is an open protocol that standardizes how an AI application discovers and calls tools that live in separate servers. They are not competitors. MCP sits one layer above function calling: an MCP client fetches tool definitions from a server and hands them to the model through function calling, then sends the model's chosen call back to the server to run.

So the real question is rarely "MCP or function calling?" It is "should my tools be defined inside my application, or published by a server that any MCP-capable application can connect to?" This article explains both, shows the same tool in each format, and gives a practical way to decide.

**On this page**

- [The short answer](#the-short-answer)
- [What function calling is](#what-function-calling-is)
- [What MCP adds](#what-mcp-adds)
- [How MCP and function calling fit together](#how-mcp-and-function-calling-fit-together)
- [MCP vs function calling compared](#mcp-vs-function-calling-compared)
- [When function calling alone is enough](#when-function-calling-alone-is-enough)
- [When MCP is the better choice](#when-mcp-is-the-better-choice)
- [Calling MCP servers straight from a model API](#calling-mcp-servers-straight-from-a-model-api)
- [The context window problem](#the-context-window-problem)
- [Where OpenAPI fits](#where-openapi-fits)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## The short answer

- **Function calling** is how a model *asks* for a tool. You send tool definitions with each request; the model replies with a tool name and JSON arguments; your code runs it and sends back the result.
- **MCP** is how an application *gets* tools and *runs* them when they belong to someone else. A server publishes tools over a standard protocol, and any compatible client can list and call them.

Every major model provider supports function calling in its own request format. MCP is one protocol that works across providers and across host applications. If you have not met MCP before, [What is MCP?](/learn/mcp/what-is-mcp) is the place to start.

## What function calling is

Function calling (Anthropic calls it tool use) was the first reliable way to let a model take actions. The flow is the same with every provider:

1. You send a request with a list of tools, each with a name, a description and a JSON Schema for its arguments.
2. The model decides whether a tool would help. If so, it stops and returns a structured call instead of text.
3. Your application runs the function with those arguments.
4. You send the result back, and the model continues.

Here is one tool in OpenAI's Responses API format, taken from the [OpenAI function calling guide](https://developers.openai.com/api/docs/guides/function-calling):

```json
{
  "type": "function",
  "name": "get_weather",
  "description": "Retrieves current weather for the given location.",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "City and country e.g. Bogotá, Colombia"
      },
      "units": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"],
        "description": "Units the temperature will be returned in."
      }
    },
    "required": ["location", "units"],
    "additionalProperties": false
  },
  "strict": true
}
```

The model responds with a `function_call` item containing a `call_id`, the `name` and JSON-encoded `arguments`, and you reply with a `function_call_output` that references the same `call_id`.

The same tool for Claude, from Anthropic's [tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview), uses `input_schema` instead of `parameters`:

```json
{
  "name": "get_weather",
  "description": "Get the current weather for a given location.",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": { "type": "string", "description": "City and state, e.g. San Francisco, CA" }
    },
    "required": ["location"]
  }
}
```

Claude replies with `stop_reason: "tool_use"` and a `tool_use` block; you answer with a `tool_result` block carrying the matching `tool_use_id`.

Notice what function calling does *not* cover. It says nothing about where the function lives, how your application learns that it exists, how it authenticates to the system it touches, or how another application could reuse it. All of that is your code.

## What MCP adds

MCP answers exactly those missing questions. It defines:

- **Discovery.** A client calls `tools/list` and gets back every tool a server offers, with names, descriptions and an `inputSchema`.
- **Invocation.** The client calls `tools/call` with a tool name and arguments, and the server runs it.
- **Transport.** Local servers run as subprocesses over stdio; remote servers are reached over HTTP. See [Remote MCP servers](/learn/mcp/remote-mcp-servers).
- **Authorization.** Remote servers use an OAuth 2.1 based flow so a user can sign in once from any client. See [MCP OAuth](/learn/mcp/mcp-oauth).
- **More than tools.** Servers can also offer resources (data the application can read) and prompts (templates the user can pick).

An MCP tool definition looks almost identical to a function definition, which is no accident:

```json
{
  "name": "get_weather",
  "title": "Weather lookup",
  "description": "Get the current weather for a given location.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "location": { "type": "string", "description": "City and state, e.g. San Francisco, CA" }
    },
    "required": ["location"]
  }
}
```

The difference is who owns it. With function calling, this JSON lives in your application's source code. With MCP, the server publishes it and your application fetches it at runtime.

## How MCP and function calling fit together

When you connect an MCP server to Claude Code, Cursor or ChatGPT, this is what happens under the hood:

1. The host's MCP client calls `tools/list` on each connected server.
2. It converts each MCP tool into the model provider's function calling format.
3. It sends the user's message plus those tool definitions to the model.
4. The model returns a function call, exactly as it would for a hand-written tool.
5. The client translates that into an MCP `tools/call` request and sends it to the right server.
6. The server's result goes back to the model as a tool result.

The conversion in step 2 is small. In TypeScript, for a list of MCP tools you already fetched:

```ts
type McpTool = {
  name: string
  description?: string
  inputSchema: Record<string, unknown>
}

/** Converts MCP tool definitions into Anthropic Messages API tools. */
const toAnthropicTools = (tools: McpTool[]) =>
  tools.map((tool) => ({
    name: tool.name,
    description: tool.description ?? '',
    input_schema: tool.inputSchema,
  }))

/** Converts MCP tool definitions into OpenAI Responses API function tools. */
const toOpenAITools = (tools: McpTool[]) =>
  tools.map((tool) => ({
    type: 'function' as const,
    name: tool.name,
    description: tool.description ?? '',
    parameters: tool.inputSchema,
    // Strict mode requires every property to be listed in `required` and
    // `additionalProperties: false`, which arbitrary MCP schemas do not guarantee.
    strict: false,
  }))
```

That is the whole relationship. Function calling is the model-facing interface. MCP is the application-facing and network-facing interface. The model never knows whether a tool came from your codebase or from an MCP server on the other side of the world.

## MCP vs function calling compared

| | Function calling | MCP |
| --- | --- | --- |
| What it is | A model API feature | An open client-server protocol |
| Who defines the tools | Your application, in code | The server, published at runtime |
| Where the tool runs | In your application | In the MCP server (local process or remote service) |
| Tool discovery | None; you pass tools with every request | `tools/list` on each connected server |
| Portability | Tied to one provider's request format | Same server works in any MCP-capable host |
| Authentication to the system behind the tool | Whatever your code does | Standard OAuth 2.1 flow for remote servers, or environment variables for local ones |
| Reuse across apps | Copy the code | Connect the same URL |
| Extra capabilities | Tools only | Tools, resources, prompts |
| Operational overhead | None beyond your app | A server to run, or a hosted one to connect |
| Best fit | Tools that are specific to one application | Tools many applications or users should share |

## When function calling alone is enough

Use plain function calling when:

- **The tool only makes sense inside your product.** A support bot that calls your internal ticket lookup does not need a separate protocol.
- **You control the whole loop.** You pick the model, write the prompts and ship the application. There is no second consumer of the tools.
- **Latency is tight.** An in-process function avoids a network hop and a protocol layer.
- **You have a handful of tools.** Five functions in one file are easy to maintain; wrapping them in a server adds moving parts for no gain.

There is nothing wrong with this. Many production agents are just a model, a loop and a few functions. The SDKs increasingly run the loop for you, for example Anthropic's Tool Runner, which is described on the same tool use overview page.

## When MCP is the better choice

Reach for MCP when:

- **Other people's applications should use your tools.** If you run an API and want customers to use it from Claude, Cursor, VS Code or ChatGPT, publishing an MCP server is the way to be available in all of them without writing an integration per host. That is exactly why so many API companies now host one; see [MCP server examples](/learn/mcp/mcp-server-examples).
- **You want to use tools you did not write.** Connecting GitHub's or Sentry's hosted server is one URL instead of reimplementing their API as functions.
- **Users need their own credentials.** MCP's OAuth flow lets each user sign in with their own account, with consent and revocation, rather than your application holding one shared key.
- **You switch models or hosts.** An MCP server keeps working when you move from one model provider to another, because the host does the format translation.
- **Several internal agents share one set of APIs.** A central MCP server gives you one place for access control, logging and rate limits.

[MCP vs API](/learn/mcp/mcp-vs-api) covers the related question of when an agent should call your REST API directly instead.

## Calling MCP servers straight from a model API

The line between the two has blurred further because model providers now accept remote MCP servers as a kind of tool. The provider's platform acts as the MCP client, so you do not have to write the translation loop above.

OpenAI's Responses API takes a tool of type `mcp` ([docs](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)):

```json
{
  "type": "mcp",
  "server_label": "dmcp",
  "server_description": "A Dungeons and Dragons MCP server to assist with dice rolling.",
  "server_url": "https://dmcp-server.deno.dev/mcp",
  "require_approval": "never"
}
```

Anthropic's Messages API has an [MCP connector](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector), currently in beta under the `mcp-client-2025-11-20` header, which takes an `mcp_servers` array and an `mcp_toolset` tool:

```json
{
  "mcp_servers": [
    {
      "type": "url",
      "url": "https://mcp.example.com/mcp",
      "name": "example-mcp",
      "authorization_token": "YOUR_TOKEN"
    }
  ],
  "tools": [{ "type": "mcp_toolset", "mcp_server_name": "example-mcp" }]
}
```

Both only accept servers reachable over HTTP. Neither can start a local stdio server for you.

## The context window problem

Whichever route you take, every tool definition is sent to the model and counted as input tokens. Anthropic's documentation says so plainly: tool names, descriptions and schemas in the `tools` parameter are billed as input, on top of a fixed system prompt added whenever tools are present.

That is fine for ten tools and a problem for five hundred. A naive MCP server generated from a large API, with one tool per endpoint, can consume a large share of the context window before the user has asked anything, and models pick the wrong tool more often when the list is long.

Providers and server authors have converged on the same fix: fewer, more general tools that look things up on demand. Stripe's MCP server, for example, [exposes `stripe_api_search`, `stripe_api_details`, `stripe_api_read` and `stripe_api_write`](https://docs.stripe.com/mcp) rather than a tool per Stripe endpoint. Scalar's hosted MCP servers take the same approach with a small fixed tool set; our [benchmark post](/blog/posts/2026-03-05-agent-scalar) measured the difference on the Zoom and Notion APIs.

## Where OpenAPI fits

If your tools call an HTTP API, you probably already have their definitions in another form: your OpenAPI document. Every operation has a name, a description, parameters and a request body schema, which is most of what a function definition or MCP tool needs. That is why you can [generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi) instead of writing tool schemas by hand, and keep the tools in sync with the API as it changes.

Scalar does this as a hosted service: upload your OpenAPI document, choose which operations agents can search or execute, and connect the resulting MCP server to any client. You can also skip MCP clients entirely and use the [Agent SDK](/products/agent/integration/sdk), which hands the same tools to the OpenAI Agents SDK, the Vercel AI SDK or the Claude Agent SDK. For programmatic access from your own code without an agent at all, a typed [SDK](/products/sdk-generator) generated from the same document is usually a better fit; [SDK vs API](/learn/sdk/sdk-vs-api) explains the trade-offs.

## Common mistakes

- **Treating MCP as a replacement for function calling.** It is not. The model still uses function calling; MCP decides where tool definitions come from and where calls go.
- **Building an MCP server for a single in-app tool.** If nothing else will ever connect to it, you have added a network hop and an auth layer for no benefit.
- **Hard-coding a third party's API as functions when they host an MCP server.** You will fall behind their API changes and handle their auth yourself.
- **Writing vague descriptions.** In both approaches the model chooses tools from their names and descriptions. "Gets data" is useless; say what, from where, and when to use it.
- **Exposing every endpoint as a tool.** It costs tokens on every request and lowers accuracy. Curate, or use search-style tools.
- **Using strict mode on schemas that do not qualify.** OpenAI's strict mode needs `additionalProperties: false` and every property in `required`. Schemas converted from MCP or OpenAPI often do not meet that.

## Frequently asked questions

<scalar-detail title="Is MCP the same as function calling?">
No. Function calling is a model API feature that lets a model request a tool call in a structured format. MCP is a protocol for publishing and invoking tools that live in separate servers. MCP clients use function calling under the hood to present MCP tools to the model.
</scalar-detail>

<scalar-detail title="Does MCP replace function calling?">
No. MCP depends on it. The host fetches tools from MCP servers, turns them into function definitions for whichever model it uses, and routes the model's calls back to the right server. What MCP replaces is the custom glue code each application used to write for every integration.
</scalar-detail>

<scalar-detail title="Is tool use the same as function calling?">
Yes. Anthropic calls the feature tool use and OpenAI calls it function calling. Both mean the model returns a structured request to run a tool you described, and your application runs it and returns the result.
</scalar-detail>

<scalar-detail title="Should I build an MCP server or just use function calling?">
Use function calling when the tools belong to one application you control. Build or host an MCP server when other applications, other users or other teams should be able to use the same tools, or when users need to sign in with their own accounts.
</scalar-detail>

<scalar-detail title="Can I use MCP servers with OpenAI models?">
Yes. The OpenAI Responses API accepts remote MCP servers as tools of type mcp, and OpenAI's agent tools support MCP servers as well. The server has to be reachable over HTTP for the hosted API to use it.
</scalar-detail>

<scalar-detail title="Do MCP tools use more tokens than function calling?">
Not inherently. An MCP tool becomes a function definition before it reaches the model, so the cost per tool is similar. The difference is that connecting a large MCP server can add many tools at once, so tool count, not the protocol, is what drives token use.
</scalar-detail>

## Related

- **Learn:** [What is MCP?](/learn/mcp/what-is-mcp) · [MCP vs API](/learn/mcp/mcp-vs-api) · [Remote MCP servers](/learn/mcp/remote-mcp-servers) · [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server)
- **Docs:** [MCP servers](/products/agent/mcp) · [Agent SDK](/products/agent/integration/sdk)
- **Product:** [Scalar MCP](/products/agent/mcp) — turn your OpenAPI document into a hosted MCP server any client can call

*Provider request formats were checked against OpenAI and Anthropic documentation on 26 September 2026. MCP details refer to specification revision 2026-07-28.*
