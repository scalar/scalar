# MCP guides

*Last updated: September 2026*

The Model Context Protocol (MCP) is the open standard AI applications use to discover and call tools, and these guides explain it from the point of view of someone who already runs an API. They cover what the protocol is, how it relates to the API and OpenAPI document you already have, how to turn that document into an MCP server, and how to run and secure that server once people depend on it.

## How to use these guides

If MCP is new to you, read the first four guides in order. They build a mental model: what MCP is, where it sits next to your API, how it differs from the function calling you may already use with a model provider, and when an agent should use an MCP server rather than your SDK. Everything after that assumes this model.

If you already know the protocol and want to ship, jump to the second group. Those guides are practical and include working code tested against the current specification revision, 2026-07-28, which made MCP stateless and changed how servers are written. Older tutorials that open a `GET /sse` stream or depend on a session ID describe the 2024 and 2025 revisions; the concepts carry over, but the wire details do not.

The third group is about using a server once it exists: connecting it to a client, getting the configuration right, and testing it. The last group covers running a server in production: hosting it remotely, deciding who may connect, securing it, and learning from servers other teams have built.

A note on perspective. Scalar hosts MCP servers generated from OpenAPI documents, so we have opinions, and we say so where they matter. The guides still explain every approach, including writing your own server with the official SDK and generating code with other tools, and they point out when those are the better choice.

## Understand MCP

1. **[What is MCP?](/learn/mcp/what-is-mcp)** Hosts, clients, and servers; tools, resources, and prompts; stdio vs Streamable HTTP; and what changed in the 2026-07-28 revision.
2. **[MCP vs API](/learn/mcp/mcp-vs-api)** Why MCP is a layer on top of your API rather than a replacement, with the same task done both ways.
3. **[MCP vs function calling](/learn/mcp/mcp-vs-function-calling)** How a model provider's tool calling relates to MCP, and when you need each.
4. **[MCP vs SDK](/learn/mcp/mcp-vs-sdk)** Who decides what gets called, and when an agent is better served by your SDK or by an MCP server.

## Build an MCP server from your API

5. **[REST API to MCP server](/learn/mcp/rest-api-to-mcp-server)** An architecture guide for API providers: which endpoints to expose, how to describe them as tools, and what the server in front of your API must handle.
6. **[Generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi)** Hand-written with the official SDK, generated code, or hosted: a fair comparison, a tested TypeScript server, and the tool-design decisions that matter.
7. **[OpenAPI to MCP server: how the mapping works](/learn/mcp/openapi-to-mcp-server)** Operation by operation and field by field, including `$ref`, recursive schemas, `oneOf`, file uploads, and security schemes.
8. **[MCP API documentation](/learn/mcp/mcp-api-documentation)** Documenting an MCP server for people and models, and publishing your API docs in forms agents can read.

## Connect, configure, and test

9. **[Connect an MCP server to Claude](/learn/mcp/connect-mcp-server-to-claude)** Adding local and remote servers to Claude Code, Claude Desktop, and claude.ai.
10. **[MCP server configuration](/learn/mcp/mcp-server-configuration)** The client config files across major clients, scopes, and the small differences that break copied snippets.
11. **[How to test MCP servers](/learn/mcp/test-mcp-servers)** Protocol checks with the Inspector, unit tests for each tool, CI, and evals with a real model.

## Run it in production

12. **[Remote MCP servers](/learn/mcp/remote-mcp-servers)** Serving MCP over Streamable HTTP, hosting options, and the trade-offs against local stdio servers.
13. **[MCP OAuth](/learn/mcp/mcp-oauth)** How authorization works for remote servers, and how to keep upstream API credentials away from the model.
14. **[MCP server security](/learn/mcp/mcp-server-security)** Threats and controls for production servers: authentication, least privilege, untrusted input, rate limits, and audit trails.
15. **[MCP server examples](/learn/mcp/mcp-server-examples)** Real servers, what they expose, and the design patterns worth copying.

## Try it with your own API

The fastest way to see how your API looks to a model is to convert your OpenAPI document with the [OpenAPI to MCP tool](/tools/openapi-to-mcp). When you want a server other people can use, [Scalar's hosted MCP servers](/products/agent/mcp) read the document directly, let you choose which operations agents may search or execute, and handle authentication, with OAuth for people outside your team.

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [OpenAPI security schemes](/learn/openapi/openapi-security-schemes)
- **Docs:** [MCP servers in Scalar](/products/agent/mcp)
- **Product:** [Scalar MCP & Agent](/products/agent) — hosted MCP servers from your OpenAPI document.
