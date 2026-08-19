# Scalar Chat Protocol

[![Version](https://img.shields.io/npm/v/%40scalar/chat-protocol)](https://www.npmjs.com/package/@scalar/chat-protocol)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/chat-protocol)](https://www.npmjs.com/package/@scalar/chat-protocol)
[![License](https://img.shields.io/npm/l/%40scalar%2Fchat-protocol)](https://www.npmjs.com/package/@scalar/chat-protocol)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

The framework-free protocol layer shared by every Scalar agent chat surface: tool name constants and input schemas, the wire error envelope with `parseChatError()`, the declarative approval policy registry, the canonical tool-card status machine, shared limits, and scrubbed message fixtures.

No Vue, no CSS. The only runtime dependency is `zod`.

## What lives here

| Entry point | Contents |
|---|---|
| `@scalar/chat-protocol` | Tool part model, status machine, approval policies, error parsing |
| `@scalar/chat-protocol/error` | Wire envelope schema, error codes, `parseChatError()` |
| `@scalar/chat-protocol/approval` | Approval policy registry + canonical tool-card status machine |
| `@scalar/chat-protocol/limits` | Shared size limits (prompt, response, context) |
| `@scalar/chat-protocol/tools/openapi` | The four OpenAPI surface tools |
| `@scalar/chat-protocol/tools/editor` | The nine editor surface tools |
| `@scalar/chat-protocol/tools/mcp` | MCP surface tools (including the server-side `execute-request` variant) |
| `@scalar/chat-protocol/tools/dynamic` | The dynamic-tool model for curated MCP tools |
| `@scalar/chat-protocol/fixtures` | Scrubbed message fixtures for playgrounds and tests |

## Design rules

- **Permissive by default.** Frozen clients (published docs sites, customer-embedded API references) never send a version header. Servers validate strictly only when a client opts in.
- **Legacy encodings are forever.** The pre-native rejection texts and the legacy `documentIdentifier`/`uniqueIdentifier` fields stay recognized permanently; they are contained here rather than deleted.
- **Fixtures are synthetic.** A test fails the build if production hostnames or UUIDs appear in fixture data.

## Community

We are API nerds. Join us on [Discord](https://discord.gg/scalar).

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
