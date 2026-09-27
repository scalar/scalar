# MCP vs SDK: which one should an agent use?

*Last updated: September 2026*

An SDK is a code library a developer installs and calls from a program they write, while an MCP server is a running service that an AI application connects to at run time, which describes its tools to a model and executes whichever calls the model decides to make. Both let software use your API. The difference is who decides what to call and when: with an SDK a developer decides in advance, and with MCP a model decides in the moment.

That one difference drives almost every other trade-off: typing, cost, reliability, authentication, and how you ship updates. This guide works through them, clears up the three different things people mean by "SDK" in this comparison, and ends with a checklist for API providers deciding which to offer. (Spoiler: most will want both, generated from the same OpenAPI document.)

**On this page**

- [Three meanings of "SDK" in this question](#three-meanings-of-sdk-in-this-question)
- [How each one works](#how-each-one-works)
- [MCP vs SDK side by side](#mcp-vs-sdk-side-by-side)
- [The same task both ways](#the-same-task-both-ways)
- [When an SDK is the better choice](#when-an-sdk-is-the-better-choice)
- [When an MCP server is the better choice](#when-an-mcp-server-is-the-better-choice)
- [Where they meet: agents that write code](#where-they-meet-agents-that-write-code)
- [MCP vs AI SDKs and agent frameworks](#mcp-vs-ai-sdks-and-agent-frameworks)
- [What API providers should ship](#what-api-providers-should-ship)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## Three meanings of "SDK" in this question

"MCP vs SDK" is really three questions, and search results mix them up.

1. **An API SDK.** A client library for one API, such as a TypeScript or Python package for a payments or HR API. This is the comparison most of this page is about. If the term is new, [what is an SDK](/learn/sdk/what-is-an-sdk) covers the basics, and [SDK vs API](/learn/sdk/sdk-vs-api) explains how an SDK relates to the API underneath it.
2. **An AI SDK or agent framework.** Libraries such as the Vercel AI SDK, the OpenAI Agents SDK and the Claude Agent SDK help you build an agent: call a model, loop over tool calls, stream output. They are not alternatives to MCP. They are MCP clients, and they consume MCP servers. There is a [section on them below](#mcp-vs-ai-sdks-and-agent-frameworks).
3. **An MCP SDK.** The official MCP SDKs (TypeScript, Python and others) are libraries for *building* MCP servers and clients. If you are asking "should I use the MCP SDK or write the protocol myself?", the answer is almost always the SDK.

With that out of the way: API SDK versus MCP server.

## How each one works

**An SDK call** is decided at development time. A developer reads the documentation, writes `client.invoices.create({...})`, the compiler checks the types, and the program sends the same request every time it runs. The model, if there is one, never sees the SDK. It sees whatever your code chooses to show it.

**An MCP call** is decided at run time. An AI application connects to the server, fetches the list of tools with `tools/list` (each tool has a name, a description and a JSON Schema for its input), puts those definitions in front of the model, and lets the model pick. When the model emits a tool call, the client sends `tools/call` to the server, which runs the request against your API and returns the result for the model to read. Nothing is compiled. The contract is enforced by schema validation and by how well the model reads your descriptions. [What is MCP](/learn/mcp/what-is-mcp) explains the protocol, and [MCP vs API](/learn/mcp/mcp-vs-api) compares MCP to calling the API directly.

## MCP vs SDK side by side

| | API SDK | MCP server |
| --- | --- | --- |
| Who chooses the call | A developer, in code | A model, at run time |
| When integration happens | Build time: install, write code, deploy | Connect time: add a URL to a client |
| Contract | Language types, checked by a compiler | JSON Schema, checked at run time |
| Typical user | Backend services, scripts, CI jobs, coding agents | Assistants in Claude, Cursor, VS Code and similar clients |
| Authentication | API key or OAuth handled by your code | OAuth in the client, or a key in the client config |
| Pagination, retries, errors | Built in: iterators, backoff, typed exceptions | Up to the server's tool design; errors come back as text |
| Cost per operation | One HTTP request | Model tokens for definitions, arguments and results, plus the request |
| Determinism | Same input, same request | Depends on the model's choice |
| Distribution | Package registries (npm, PyPI, Go modules) | A server URL, or a local package the client launches |
| Updating | New package version, users upgrade | Server changes apply on next `tools/list` |

Two rows deserve a comment.

**Cost.** An SDK call costs one request. An MCP call also costs the tokens needed to describe your tools and read the result, on every turn. That is fine for a user asking an assistant a question, and wasteful for a nightly job that syncs 50,000 records.

**Updating.** When you add an endpoint, SDK users get it after they upgrade and write code for it. MCP users get it as soon as the server exposes it, because the client re-reads the tool list. That is convenient, and it is also a risk: a changed description changes the model's behaviour without anyone reviewing it. [MCP server security](/learn/mcp/mcp-server-security) covers how to control that.

## The same task both ways

Suppose someone needs the details of one health plan from an HR platform's API. With the company's generated TypeScript SDK, a developer writes this once:

```ts
import Warp from 'warp-hr'

const client = new Warp({ apiKey: process.env.WARP_API_KEY })

const plan = await client.benefits.healthPlans.get('chpl_1234')
console.log(plan)
```

This is the published `warp-hr` package, which Warp generates with Scalar from its OpenAPI document ([the Warp story](/customers/warp) has the background). The method name, the argument and the shape of the returned `PublicHealthPlan` are all known to TypeScript before the code runs, and a failed request throws a typed error with the HTTP status attached.

With an MCP server in front of the same API, nobody writes that code. The user types "what does plan chpl_1234 cover?" into their assistant. The client has already fetched a tool definition along these lines:

```json
{
  "name": "get_health_plan",
  "description": "Get one company health plan by its ID (IDs start with chpl_). Returns the plan type, carrier, status and coverage dates.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "id": { "type": "string", "pattern": "^chpl_", "description": "The health plan ID, for example chpl_1234" }
    },
    "required": ["id"]
  }
}
```

The model decides this tool fits, produces `{"id": "chpl_1234"}`, the client sends `tools/call`, and the server makes the HTTP request with credentials the user never sees. The model reads the JSON that comes back and answers in prose.

The tool definition above is an illustration of the shape, not a copy of any real server. What matters is that the same OpenAPI operation feeds both: the SDK method and the tool are two renderings of one description.

## When an SDK is the better choice

Pick an SDK, or tell your users to, when:

- **The workflow is known in advance.** Syncing data, provisioning accounts, processing webhooks. There is no decision for a model to make, so paying for one adds cost and risk.
- **Volume is high.** Thousands of calls a minute belong in code, not in a model's context.
- **Correctness must be checked before running.** Types catch a misspelled field at build time. A model's mistake shows up as a failed call, or worse, a successful wrong one.
- **Latency matters.** A model round trip per step adds seconds.
- **You need the plumbing.** Retries with backoff, idempotency keys, auto-pagination, streaming uploads. Good SDKs handle these once for every user; an MCP tool has to reimplement each in its own design.
- **The user is a coding agent writing software.** When Claude Code or Cursor builds an integration, what it produces is code, and code should call a typed SDK rather than an MCP server.

## When an MCP server is the better choice

Pick MCP when:

- **The user is a person talking to an assistant.** They will not install a package. They will paste a URL into a connector dialog.
- **The task is open-ended.** "Find the customers whose trials end this week and draft a note to each" is a sequence of decisions a model is good at making and a developer would not bother hard-coding.
- **You want one integration for many clients.** An MCP server works in Claude, ChatGPT, Cursor, VS Code and agent frameworks without a per-client plugin.
- **Delegated, revocable access matters.** MCP's OAuth flow lets a user grant an assistant access to their own account and revoke it later, without handing over an API key. [MCP OAuth](/learn/mcp/mcp-oauth) explains how.
- **Non-developers need access.** Support, sales and finance teams can use your API through an assistant without anyone writing code.

## Where they meet: agents that write code

The line between the two is blurring. Anthropic's engineering team [published an approach in November 2025](https://www.anthropic.com/engineering/code-execution-with-mcp) where the agent writes and runs code that calls MCP tools as if they were functions, instead of calling each tool directly through the model. In their example, a workflow went from about 150,000 tokens to about 2,000, largely because intermediate results stayed in the execution environment instead of passing through the model.

In practice that is an agent using MCP tools the way a developer uses an SDK: load only what you need, loop and filter in code, return a summary. Two lessons follow for API providers:

1. **Your SDK is also agent tooling.** Coding agents read SDK types, READMEs and docs. Clear method names and good docstrings help a model as much as they help a person. Making those docs agent-readable is covered in [MCP API documentation](/learn/mcp/mcp-api-documentation).
2. **Your MCP server should stay small and composable.** Tools that return trimmed, structured results are easier for an agent to chain in code as well as in conversation.

## MCP vs AI SDKs and agent frameworks

If your question is "MCP or the Vercel AI SDK?" (or the OpenAI Agents SDK, or the Claude Agent SDK), the answer is both. These frameworks run the agent loop, and they connect to MCP servers to get their tools. You write the agent with the framework; the tools come from MCP.

Here is Scalar's own [Agent SDK](/products/agent/integration/sdk) handing the tools of a Scalar-hosted MCP server to the Vercel AI SDK:

```ts
import { agentScalar } from '@scalar/agent'
import { generateText, stepCountIs } from 'ai'

const scalar = agentScalar({ token: 'your-personal-token' })
const installation = await scalar.installation('your-installation-id')

const tools = await installation.createVercelAITools()

const { text } = await generateText({
  model, // any model supported by the AI SDK
  tools,
  stopWhen: stepCountIs(5),
  prompt: 'Which planets were discovered before 1800?',
})
```

The same installation can be passed to the OpenAI Agents SDK or the Claude Agent SDK. The framework is the agent; the MCP server is the API access. They are layers, not rivals.

## What API providers should ship

If you publish an API, the realistic answer is to offer both, because different users arrive through different doors:

- **Developers and coding agents** want an SDK in their language, on their package registry, with types and pagination handled.
- **People using assistants** want an MCP server they can connect with a URL and an OAuth sign-in.

The expensive part is keeping them consistent. If the SDK and the MCP server are maintained separately, they drift: a field renamed in one, a new endpoint missing in the other. The fix is to treat your [OpenAPI document](/learn/openapi/what-is-openapi) as the single source and generate both from it.

That is how Scalar works. The [SDK generator](/products/sdk-generator) produces SDKs from your OpenAPI document; TypeScript, Python, Go and CLI targets are generally available, and Java, Kotlin, Ruby, C#, PHP, Rust, Swift, Dart and C++ are available as experimental targets. The same document powers a [hosted MCP server](/products/agent/mcp) that Scalar runs for you, where you choose which operations the model can search and execute. When the document changes, both follow. If you are weighing whether to build SDKs in-house at all, [build vs buy SDK](/learn/sdk/build-vs-buy-sdk) runs the numbers, and [generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) is the step-by-step guide.

A short checklist for deciding what to ship first:

1. Who are your API's users today: developers integrating in code, or teams working in assistants? Start with the larger group.
2. Is your API mostly reads? An MCP server is low risk to launch. Mostly high-stakes writes? Ship the SDK first and add MCP with careful tool selection.
3. Does your OpenAPI document have good `operationId`s, summaries and descriptions? Both outputs depend on it; fix it first.
4. Do you already support OAuth? MCP's sign-in flow builds on it. If not, plan for API keys in the client config at first.

## Common mistakes

- **Treating them as either-or.** They serve different users. Most APIs benefit from both.
- **Building a batch job on MCP.** Deterministic, high-volume work belongs in code with an SDK.
- **Handing a coding agent an MCP server to build an integration.** The output of that work is code, and code should call the SDK.
- **Maintaining two hand-written sources.** Generate both from one OpenAPI document or they will drift.
- **Confusing agent frameworks with MCP.** The Vercel AI SDK and similar libraries consume MCP; they do not replace it.
- **Assuming MCP errors behave like SDK exceptions.** A failed tool call comes back as text for the model. Design error messages for a reader, not a `catch` block.

## Frequently asked questions

<scalar-detail title="What is the difference between MCP and an SDK?">
An SDK is a library that a developer calls from code, with the choice of call made when the code is written. An MCP server is a service that describes its tools to an AI model at run time and executes the calls the model chooses. SDKs suit deterministic, high-volume integrations; MCP suits assistants and open-ended tasks.
</scalar-detail>

<scalar-detail title="Does MCP replace SDKs?">
No. MCP gives AI assistants a standard way to reach your API, but applications, scripts and coding agents still need a typed library in their language. Many API providers now publish both, generated from the same OpenAPI document.
</scalar-detail>

<scalar-detail title="Is the Vercel AI SDK an alternative to MCP?">
No. The Vercel AI SDK, the OpenAI Agents SDK and the Claude Agent SDK are frameworks for building agents. They act as MCP clients and load tools from MCP servers, so you typically use one of them together with one or more MCP servers.
</scalar-detail>

<scalar-detail title="Should I build an MCP server or an SDK first?">
Start with the one your users will adopt first. If most integrations are written by developers, ship the SDK. If your customers mainly want to use your product from assistants such as Claude or Cursor, ship the MCP server, beginning with read-only tools. Generating both from one OpenAPI document makes adding the second cheap.
</scalar-detail>

<scalar-detail title="Is MCP slower or more expensive than an SDK?">
Per operation, yes. An MCP call involves a model reading tool definitions and results, which costs tokens and adds latency on top of the HTTP request. That cost buys flexibility: nobody had to write code for the task. For repeated, predictable work, an SDK is cheaper and faster.
</scalar-detail>

<scalar-detail title="Can Scalar generate both an SDK and an MCP server?">
Yes. Scalar's SDK generator produces SDKs from an OpenAPI document, with TypeScript, Python, Go and CLI generally available and nine further languages experimental. The same document can back a Scalar-hosted MCP server, which Scalar runs for you rather than generating server code.
</scalar-detail>

## Related

- **Learn:** [What is an SDK?](/learn/sdk/what-is-an-sdk) · [MCP vs function calling](/learn/mcp/mcp-vs-function-calling) · [REST API to MCP server](/learn/mcp/rest-api-to-mcp-server) · [Remote MCP servers](/learn/mcp/remote-mcp-servers)
- **Docs:** [Agent SDK](/products/agent/integration/sdk) · [SDK generator](/products/sdk-generator)
- **Product:** [Scalar MCP](/products/agent/mcp) — a hosted MCP server and generated SDKs from the same OpenAPI document

*SDK language availability reflects Scalar's generator as of September 2026. The token figures quoted from Anthropic come from its November 2025 engineering post and describe one example workflow.*
