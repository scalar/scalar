# Learn API management

*Last updated: October 2026*

API management is the combination of a runtime gateway and the lifecycle tooling around the API contract, and these guides explain the second half from the point of view of a team that already runs APIs: what the layers are, how they connect through the OpenAPI document, how to govern APIs with rules in CI, and how to keep an inventory that stays accurate.

Scalar builds the lifecycle and governance layers, a registry, linting, documentation and a developer portal, SDKs, and hosted MCP servers, and does not build a gateway. The guides say so wherever the boundary matters, and they point to the gateway vendors where a gateway is what you need.

## Start here

1. [API management vs API gateway vs API lifecycle management](/learn/api-management/api-management-vs-api-gateway): the layers, what a gateway does, what lifecycle tooling does, and an honest decision guide for whether you need each.
2. [API governance with OpenAPI](/learn/api-management/api-governance): the style guide as a ruleset, linting in CI, breaking-change checks, a registry with access control, and a working GitHub Actions workflow.
3. [API catalog vs API registry](/learn/openapi/api-catalog): the inventory people browse versus the store tools read from, the RFC 9727 machine-readable catalog, and how to generate one from a registry.

## Choosing tools

- [Best API management platforms (2026)](/library/best-api-management-platforms-2026): gateways and lifecycle platforms compared on licence, deployment, developer portal, MCP support, and published pricing, with sources.
- [Best API documentation tools (2026)](/library/best-api-documentation-tools-2026): the developer portal layer on its own.

## Related tracks

The [OpenAPI guides](/learn/openapi) cover the contract itself, including [Spectral rules](/learn/openapi/spectral-rules) and [security schemes](/learn/openapi/openapi-security-schemes). The [SDK guides](/learn/sdk) cover client libraries generated from the same document, and the [MCP guides](/learn/mcp) cover exposing it to AI agents. The [Learn home page](/learn) lists every topic.

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [Spectral rules](/learn/openapi/spectral-rules) · [What is MCP?](/learn/mcp/what-is-mcp)
- **Docs:** [Scalar Registry](/products/registry) · [Enterprise](/enterprise)
- **Product:** [Scalar Registry](/products/registry) — versioned OpenAPI and AsyncAPI documents, rules, and schemas, feeding docs, SDKs, and MCP servers alongside your gateway
