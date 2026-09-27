# Learn: OpenAPI, SDKs and MCP

*Last updated: September 2026*

*By Marc Laventure · Reviewed by: pending*

The Scalar knowledge centre is a free library of practical guides to OpenAPI, SDK generation and the Model Context Protocol (MCP), written for developers who build, document and ship APIs. Every article starts with a plain definition, then gets specific: working examples, the trade-offs that matter, common mistakes, and links to the primary sources so you can check anything we say.

## How to use this knowledge centre

The guides are grouped into three tracks that follow the life of an API.

**OpenAPI** is the foundation. An OpenAPI document describes your API in a machine-readable way, and almost everything else in this library is built on top of one. If you are new to the topic, read [What is OpenAPI?](/learn/openapi/what-is-openapi) first, then [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0) to pick a version. After that, jump to whatever you are working on: documentation, linting, mocking, security schemes or catalogues.

**SDKs** are how most developers actually consume an API. This track covers what a client SDK is, when it is worth having one, and how to generate SDKs from the OpenAPI document you already maintain instead of writing them by hand.

**MCP** is how AI agents use APIs. These guides explain the protocol, how it relates to plain APIs and to function calling, how remote servers and OAuth work, and how to turn an OpenAPI document into an MCP server.

A few conventions hold across every article:

- **The first sentence answers the question.** If that is all you needed, you can stop there.
- **Examples are meant to run.** Code and configuration are checked against the relevant specification or the vendor's current documentation, and each article says when that check happened.
- **Terminology is consistent.** We say "OpenAPI" for the specification and "Swagger" only when naming Swagger 2.0 or the Swagger tools; we say "OpenAPI document" or "API description" rather than "API spec".
- **Claims about other products are sourced.** Where we mention another tool, we link to its own documentation and date the check. Where a competitor is the better fit, we say so.
- **Every article has a named author and a last-updated date,** and ends with a short list of related guides, docs and products.

Scalar builds tools for every stage covered here: an open-source [API reference](/products/api-references) and [API client](/products/api-client), hosted [Docs](/products/docs), an [SDK generator](/products/sdk-generator), a [Registry](/products/registry) for API descriptions, and hosted [MCP servers](/products/agent/mcp). The articles explain the concepts first and stay useful whichever tools you choose; each one ends by pointing to the matching Scalar product in case you want to try it.

Want to request a topic or report an error? Open an issue on [GitHub](https://github.com/scalar/scalar) and we will take a look.

## OpenAPI

The [OpenAPI guides hub](/learn/openapi) has the same articles with a suggested reading order.

- [What is OpenAPI?](/learn/openapi/what-is-openapi): the standard for describing HTTP APIs, how a document is structured, and what you can build from one.
- [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0): what changed between the two versions, including full JSON Schema support, and how to migrate.
- [OpenAPI vs Swagger](/learn/openapi/openapi-vs-swagger): why the names are used interchangeably, and how the specification differs from the Swagger tools.
- [What is an API reference?](/learn/openapi/what-is-an-api-reference): the part of your documentation that lists every endpoint, and what makes a good one.
- [API documentation best practices](/learn/openapi/api-documentation-best-practices): how to write docs developers can actually use, from quickstarts to error references.
- [What is an API client?](/learn/openapi/what-is-an-api-client): tools for sending and testing API requests, and how they use OpenAPI documents.
- [API mocking](/learn/openapi/api-mocking): how to run a mock server from an OpenAPI document so front-end and back-end work can happen in parallel.
- [Spectral rules](/learn/openapi/spectral-rules): how Spectral rulesets work, which built-in rules matter, and how to write your own.
- [API catalog](/learn/openapi/api-catalog): keeping track of every API in an organization with a catalogue or registry.
- [JSON Schema vs OpenAPI](/learn/openapi/json-schema-vs-openapi): how the two specifications relate, and where the Schema Object differs from plain JSON Schema.
- [OpenAPI security schemes](/learn/openapi/openapi-security-schemes): describing API keys, HTTP auth, OAuth 2.0 and OpenID Connect in your API description.
- [llms.txt for API docs](/learn/openapi/llms-txt-for-api-docs): what the llms.txt convention is and how to make API documentation readable by AI tools.
- [OpenAPI documentation](/learn/openapi/openapi-documentation): turning an OpenAPI document into interactive documentation, step by step.

## SDKs

The [SDK guides hub](/learn/sdk) has the same articles with a suggested reading order.

- [What is an SDK?](/learn/sdk/what-is-an-sdk): what a software development kit contains and why API providers ship them.
- [SDK vs API](/learn/sdk/sdk-vs-api): how an SDK relates to the API underneath it, and when developers should use each.
- [Build vs buy an SDK](/learn/sdk/build-vs-buy-sdk): the real costs of writing and maintaining SDKs by hand compared with generating them.
- [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi): how SDK generation works, what good generated code looks like, and how to prepare your document.
- [SDK pagination](/learn/sdk/sdk-pagination): the common pagination patterns and how an SDK turns them into one loop over items.
- [SDK error handling](/learn/sdk/sdk-error-handling): typed errors, retries, idempotency keys and timeouts in client libraries.

## MCP

The [MCP guides hub](/learn/mcp) has the same articles with a suggested reading order.

- [What is MCP?](/learn/mcp/what-is-mcp): the Model Context Protocol explained, including hosts, clients, servers, tools, resources and prompts.
- [MCP vs API](/learn/mcp/mcp-vs-api): why agents need more than a REST API, and when an MCP server is worth adding.
- [MCP vs function calling](/learn/mcp/mcp-vs-function-calling): how the protocol and the model feature fit together, and when you need each.
- [MCP vs SDK](/learn/mcp/mcp-vs-sdk): when an agent should use your SDK and when it should use an MCP server.
- [REST API to MCP server](/learn/mcp/rest-api-to-mcp-server): an architecture guide for API providers putting an MCP server in front of their API.
- [Generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi): the approaches for deriving MCP tools from an existing API description.
- [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server): how operations, parameters, schemas and security schemes map to MCP tools.
- [MCP API documentation](/learn/mcp/mcp-api-documentation): documenting MCP servers, and publishing API docs that agents can read.
- [Connect an MCP server to Claude](/learn/mcp/connect-mcp-server-to-claude): adding servers to Claude Code, Claude Desktop and claude.ai.
- [MCP server configuration](/learn/mcp/mcp-server-configuration): client config files, scopes, and the details that differ between clients.
- [How to test MCP servers](/learn/mcp/test-mcp-servers): the Inspector, unit tests, CI and evals with a real model.
- [Remote MCP servers](/learn/mcp/remote-mcp-servers): the Streamable HTTP transport, local vs remote servers, hosting options and client setup.
- [MCP OAuth](/learn/mcp/mcp-oauth): how MCP authentication works, from protected resource metadata to PKCE and client registration.
- [MCP server security](/learn/mcp/mcp-server-security): threats and controls for production MCP servers.
- [MCP server examples](/learn/mcp/mcp-server-examples): real, verifiable MCP servers from the MCP project and companies such as GitHub, Stripe and Sentry.

## Frequently asked questions

<scalar-detail title="Who writes the Scalar knowledge centre?">
The articles are written by the Scalar team, the people who build the open-source Scalar API reference and API client. Each article shows its author and when it was last updated, and is reviewed by a named person before it is published.
</scalar-detail>

<scalar-detail title="Do I need to use Scalar to follow these guides?">
No. The guides explain concepts and standards such as OpenAPI, SDK generation and MCP, and the examples work with any compliant tooling. Each article ends with a pointer to the matching Scalar product if you want to try it.
</scalar-detail>

<scalar-detail title="Where should I start if I am new to OpenAPI?">
Start with What is OpenAPI?, then read OpenAPI 3.1 vs 3.0 to choose a version, and OpenAPI documentation to publish your first interactive reference. From there, pick the SDK or MCP track depending on who will consume your API.
</scalar-detail>

<scalar-detail title="How often are the articles updated?">
Articles carry a last-updated date at the top. Anything that depends on a fast-moving specification or on other vendors' products, such as the MCP guides, notes the date its details were checked, and we revise it when those sources change.
</scalar-detail>

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [What is MCP?](/learn/mcp/what-is-mcp)
- **Docs:** [OpenAPI documentation with Scalar](/solutions/openapi-documentation)
- **Product:** [Scalar Docs](/products/docs) — publish API references and guides from your OpenAPI document
