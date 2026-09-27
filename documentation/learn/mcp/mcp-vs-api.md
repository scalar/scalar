# MCP vs API: what is the difference?

*Last updated: September 2026*

An API is the interface a service exposes so other software can use it, while MCP (the Model Context Protocol) is a standard that lets AI applications discover and call tools, and those tools usually call APIs. So MCP is not an alternative to your API. It is a layer on top of it, designed for a different kind of consumer: a language model working inside a host application such as Claude, ChatGPT, Cursor, or VS Code.

The confusion is understandable. Both involve requests, responses, JSON, and authentication, and both get described as "a way to connect to a service." The difference is who is on the other end and what they need. A developer reads API documentation once, writes code, and runs it many times. A model decides what to call on every turn, from a description it reads in that moment, with no code in between. MCP exists because those two consumers need different things.

**On this page**

- [The short answer](#the-short-answer)
- [What an API is](#what-an-api-is)
- [What MCP is](#what-mcp-is)
- [MCP vs API, side by side](#mcp-vs-api-side-by-side)
- [The same task, two ways](#the-same-task-two-ways)
- [How MCP and APIs work together](#how-mcp-and-apis-work-together)
- [When you need an API, MCP, or both](#when-you-need-an-api-mcp-or-both)
- [Why not just give the model your API?](#why-not-just-give-the-model-your-api)
- [Where OpenAPI fits](#where-openapi-fits)
- [Common misconceptions](#common-misconceptions)
- [Frequently asked questions](#frequently-asked-questions)

## The short answer

- **Your API** is the product surface. It serves your web app, mobile apps, partners, SDKs, and integrations. It is designed for programs written by people.
- **An MCP server** is an adapter that presents some of that surface as tools a model can choose and call. It is designed for AI applications acting on a user's behalf.
- **They stack.** The model asks the host to call an MCP tool, the MCP server calls your API, and the API does the work.

If you run an API today, you do not need to rebuild it for AI. You need a well-described subset of it exposed through MCP, with authentication that keeps secrets away from the model.

## What an API is

"API" covers many interfaces, but in this context it means an HTTP API: a set of endpoints such as `GET /planets/{planetId}` that accept requests and return responses, usually JSON. REST is the most common style; GraphQL and gRPC are others.

An HTTP API has a few defining traits:

- **Its contract is fixed per version.** Clients rely on paths, parameters, and schemas staying put. Breaking changes need a new version.
- **Its consumers are programs.** A developer reads the docs, writes code once, and that code calls the API the same way every time.
- **Its description is for tooling.** The contract is usually written down as an [OpenAPI document](/learn/openapi/what-is-openapi), which powers [API references](/learn/openapi/what-is-an-api-reference), [SDKs](/learn/sdk/what-is-an-sdk), [API clients](/learn/openapi/what-is-an-api-client), mocks, and tests.
- **It is general-purpose.** One API serves many consumers with many goals. It exposes capabilities, not workflows.

## What MCP is

The [Model Context Protocol](https://modelcontextprotocol.io/) is an open standard, introduced by Anthropic in November 2024 and now governed by the Linux Foundation's Agentic AI Foundation, for connecting AI applications to external systems. An MCP server offers three kinds of things: **tools** the model can call, **resources** the application can read, and **prompts** the user can pick. Messages are JSON-RPC 2.0 over one of two transports: stdio for local servers or Streamable HTTP for remote ones. The current specification revision is [2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/changelog).

The traits that matter here:

- **Discovery happens at runtime.** A client asks the server `tools/list` and gets back names, descriptions, and JSON Schema inputs. The model reads them in context and decides what to call.
- **Its consumers are models inside hosts.** The host application shows the user what is happening and, per the [tools specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools), should keep a human in the loop who can deny tool invocations.
- **It is one protocol for every server.** A host that speaks MCP can use any MCP server without custom integration code. That is the whole point.
- **It is task-shaped.** Good MCP servers expose what an assistant needs to get jobs done, which is often less than, and sometimes more composite than, the raw API.

For a deeper introduction, read [what is MCP](/learn/mcp/what-is-mcp).

## MCP vs API, side by side

| | HTTP API | MCP server |
| --- | --- | --- |
| **Primary consumer** | Programs written by developers | Language models inside AI applications |
| **Who decides what to call** | The developer, at build time | The model, at run time, with user oversight |
| **How capabilities are discovered** | Documentation and an OpenAPI document, read ahead of time | `tools/list` at run time, read into the model's context |
| **Wire format** | HTTP methods, paths, status codes, usually JSON bodies | JSON-RPC 2.0 messages such as `tools/call` over stdio or Streamable HTTP |
| **Unit of functionality** | Endpoint (operation) | Tool, resource, or prompt |
| **Input contract** | Path, query, header, cookie parameters plus a body | One JSON object validated by the tool's `inputSchema` |
| **Errors** | HTTP status codes and error bodies | Tool results with `isError: true` that the model can read and act on |
| **Authentication** | API keys, bearer tokens, OAuth, mTLS, defined per API | OAuth-based framework for remote servers; upstream credentials held by the server, never by the model |
| **State** | Up to the API design (usually stateless) | Stateless per request since 2026-07-28; state carried in explicit handles |
| **Cost per call** | Network and compute | Network, compute, and model tokens for tool definitions and results |
| **Change management** | Versioning and deprecation | Tool lists can change; clients can subscribe to list-changed notifications |
| **Typical size** | Tens to thousands of endpoints | Best kept small; clients cap tools (VS Code: [128 per request](https://github.com/microsoft/vscode/issues/290356)) |

## The same task, two ways

Take one task: find out what planet 1 is like, using the Scalar Galaxy example API.

**Through the API.** A developer reads the reference, finds the operation, and writes a request:

```bash
curl https://galaxy.scalar.com/planets/1 \
  -H "Accept: application/json"
```

```json
{
  "id": 1,
  "name": "Mars",
  "description": "The red planet",
  "type": "terrestrial",
  "habitabilityIndex": 0.68
}
```

The developer decided which endpoint to call, knew the ID format from the docs, and will write code that parses `name` and `type`. That code runs the same way forever.

**Through MCP.** An MCP server exposes the same operation as a tool:

```json
{
  "name": "get_planet",
  "title": "Get a planet",
  "description": "Fetch one planet by its numeric ID. Returns name, type, description, physical properties and satellites. Use this when you already know the ID.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "planetId": { "type": "integer", "description": "The ID of the planet, for example 1" }
    },
    "required": ["planetId"]
  },
  "annotations": { "readOnlyHint": true }
}
```

A user asks their assistant, "What is planet 1 like?" The host has already loaded the tool list. The model picks `get_planet`, produces `{ "planetId": 1 }`, and the host sends a `tools/call` request to the MCP server. The server calls `GET /planets/1`, exactly like the curl command above, and returns the JSON as a tool result. The model then answers in plain language.

Nobody wrote code for this specific question. That is what MCP adds. It is also why the tool's description carries so much weight: it is the only documentation the model reads before deciding. The server behind this example is about 40 lines of TypeScript; the full code is in [how to generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi).

## How MCP and APIs work together

In almost every real deployment, the architecture is:

1. **Your API** stays as it is: versioned, documented, serving every existing consumer.
2. **An MCP server** sits in front of it and exposes a curated set of operations as tools. It holds or forwards credentials, trims responses, and turns HTTP errors into readable tool errors.
3. **AI applications** (Claude, ChatGPT, Cursor, VS Code, custom agents) connect to the MCP server, and users interact through them.

The MCP server can be something you write with an official SDK, code you generate from your OpenAPI document, or a hosted service. The mapping from API operations to tools is covered in detail in [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server).

There are exceptions. Some MCP servers do not wrap an API at all: a file system server reads local files, and a database server runs queries. And some tools wrap several API calls into one task ("send an invoice reminder" might be three API calls). But for teams that already have an API, "MCP in front of the API" is the pattern.

## When you need an API, MCP, or both

**You need an API when** software you do not control needs to integrate with your service in a predictable way: partner integrations, mobile apps, webhooks, SDKs, data pipelines. Nothing about MCP changes this.

**You need an MCP server when** you want people to use your service through AI applications. Examples: a support agent that looks up orders, a developer who wants Cursor to create resources in your platform while they code, an internal assistant that queries several internal services at once.

**You need both when** you are an API company, or when AI access is one more channel to the same capabilities. Most SaaS products land here in 2026: the API remains the foundation, and MCP becomes an additional front door, next to the SDKs and the web app.

**You might not need an MCP server yet if** your users do not work in AI applications, your API is purely machine-to-machine (for example, a payments settlement feed), or the actions are too sensitive to delegate to a model even with human confirmation.

## Why not just give the model your API?

Models can call HTTP APIs directly if a developer wires it up with [function calling](/learn/mcp/mcp-vs-function-calling) and some glue code. People tried the obvious shortcut first: paste the whole OpenAPI document into the prompt. It fails for three reasons.

**Context size.** OpenAPI documents for real APIs are large. In [Scalar's own benchmark](/blog/posts/2026-03-05-agent-scalar), the Zoom Meetings OpenAPI document took about 296,000 tokens, more than a 200,000-token context window, and every task attempted that way failed. A native MCP server with one tool per endpoint (183 tools) still used about 89,000 schema tokens. A search-then-execute design used about 400. That is our benchmark on our product, so read it as one data point, but the direction is clear: raw API descriptions are too big to hand a model wholesale.

**Credentials.** If the model calls the API directly, something has to put the API key into the request. If that something is the model, the key is in the context window, in logs, and exposed to prompt injection. An MCP server keeps credentials on the server side.

**Portability.** Glue code written for one model provider's function-calling format has to be rewritten for the next. An MCP server works with every host that speaks the protocol.

## Where OpenAPI fits

OpenAPI and MCP are often mentioned together because they complement each other:

- **OpenAPI** describes your HTTP API in a machine-readable document. It is a description format.
- **MCP** is a runtime protocol between AI applications and servers. It is a communication protocol.

A good OpenAPI document is the best starting point for an MCP server, because it already lists your operations, parameters, schemas, and security schemes. Clear `operationId` values become tool names, and well-written `description` fields become tool descriptions. Investing in the OpenAPI document improves your [API reference](/products/api-references), your [SDKs](/products/sdk-generator), and your MCP server at the same time.

That is also how Scalar approaches it. [Scalar's MCP servers](/products/agent/mcp) are hosted and read your OpenAPI document directly: you choose which operations agents may search or execute, configure upstream authentication once, and share an installation URL. Scalar hosts them; there is no server code to deploy.

## Common misconceptions

**"MCP will replace APIs."** MCP servers call APIs. Replacing the API would remove the thing the MCP server needs.

**"MCP is just an API for AI."** Partly true, and a useful shorthand, but it misses the important parts: runtime discovery, a single protocol across all hosts, human-in-the-loop expectations, and the separation of model from credentials.

**"If I have an OpenAPI document, I already have an MCP server."** You have everything needed to build one quickly. You still need to choose which operations to expose, write model-friendly descriptions, and decide how authentication works.

**"MCP servers must be local processes."** Local stdio servers are common for developer tools, but remote Streamable HTTP servers are the norm for SaaS APIs, because users should not install anything. See [remote MCP servers](/learn/mcp/remote-mcp-servers).

**"MCP is less secure than an API."** The protocol does not make things less secure; exposing powerful tools to a model without confirmation or least privilege does. MCP's authorization framework, covered in [MCP OAuth](/learn/mcp/mcp-oauth), plus careful tool design, keeps it in check.

## Frequently asked questions

<scalar-detail title="Is MCP an API?">
In the broad sense, yes: it is an interface between software systems. In practice, people use "API" to mean your service's HTTP interface, and "MCP" to mean the protocol AI applications use to discover and call tools. An MCP server is usually a thin layer that calls an API.
</scalar-detail>

<scalar-detail title="Does MCP replace REST APIs?">
No. REST APIs keep serving apps, partners, and SDKs. MCP servers typically call those REST APIs on behalf of an AI application, exposing a curated, well-described subset as tools.
</scalar-detail>

<scalar-detail title="What is the difference between MCP and function calling?">
Function calling is a model API feature: you send tool definitions with a request, and the model returns a structured call that your code executes. MCP standardizes where tool definitions come from and who executes them, so one server works across many AI applications. The two work together; MCP hosts typically use function calling under the hood.
</scalar-detail>

<scalar-detail title="Do I need to rewrite my API to support MCP?">
No. You add an MCP server in front of it. If you have an OpenAPI document, you can write that server with an official SDK, generate it, or use a hosted service that reads the document directly.
</scalar-detail>

<scalar-detail title="Is MCP faster than calling an API directly?">
No. An MCP tool call adds a hop, and the model spends tokens reading tool definitions and results. MCP is not about speed. It lets a model use your API without custom integration code and without seeing your credentials.
</scalar-detail>

<scalar-detail title="Can an MCP server call more than one API?">
Yes. A server can wrap several APIs, and a single tool can combine multiple API calls into one task. That is often better for the model than exposing every low-level endpoint.
</scalar-detail>

## Related

- **Learn:** [What is MCP?](/learn/mcp/what-is-mcp) · [MCP vs function calling](/learn/mcp/mcp-vs-function-calling) · [SDK vs API](/learn/sdk/sdk-vs-api)
- **Docs:** [MCP servers in Scalar](/products/agent/mcp)
- **Product:** [Scalar MCP & Agent](/products/agent) — put a hosted MCP server in front of your API, straight from your OpenAPI document.

---

*MCP details reflect specification revision 2026-07-28 as published on modelcontextprotocol.io, checked on 26 September 2026. Benchmark figures come from Scalar's own March 2026 test and are linked inline.*
