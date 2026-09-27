# Learn OpenAPI

*Last updated: September 2026*

OpenAPI is the open standard for describing HTTP APIs in a machine-readable document, and this hub collects Scalar's guides to writing, documenting, checking, and using those documents. The articles are written for developers and technical writers who work with an API description every day, whether they write it by hand or generate it from code.

Read them in this order if you are new to OpenAPI. Each article stands on its own, so skip ahead to whatever you are working on.

## Start here

1. [What is OpenAPI?](/learn/openapi/what-is-openapi): what the specification is, how a document is structured, and what you can build from one.
2. [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0): what changed, what OpenAPI 3.2 adds, and a migration checklist.
3. [OpenAPI vs Swagger](/learn/openapi/openapi-vs-swagger): why there are two names, and how the specification differs from the Swagger tools.
4. [JSON Schema vs OpenAPI](/learn/openapi/json-schema-vs-openapi): how the Schema Object relates to plain JSON Schema.
5. [OpenAPI security schemes](/learn/openapi/openapi-security-schemes): describing API keys, HTTP auth, OAuth 2.0, OpenID Connect, and mutual TLS.

## Documentation

6. [What is an API reference?](/learn/openapi/what-is-an-api-reference): the part of your docs that describes every endpoint, and what makes a good one.
7. [OpenAPI documentation](/learn/openapi/openapi-documentation): how to write descriptions, examples, tags, and Markdown so your OpenAPI document produces useful docs.
8. [API documentation best practices](/learn/openapi/api-documentation-best-practices): twelve habits that make an API easy to adopt, with a quick audit checklist.
9. [llms.txt for API docs](/learn/openapi/llms-txt-for-api-docs): making API documentation readable by AI tools and agents.

## Quality and governance

10. [OpenAPI linting](/learn/openapi/spectral-rules): catching errors and style problems in API descriptions before they reach users.
11. [Spectral rules](/learn/openapi/spectral-rules): how Spectral rulesets work, which built-in rules matter, and how to write your own.
12. [API catalog](/learn/openapi/api-catalog): keeping track of every API in an organization with a catalog or registry.

## Using the document

13. [What is an API client?](/learn/openapi/what-is-an-api-client): tools for sending and testing requests, and how they import OpenAPI documents.
14. [API mocking](/learn/openapi/api-mocking): running a mock server from an OpenAPI document so frontend and backend work can happen in parallel.

## Why this order

Most people meet OpenAPI the same way. Someone hands them a file called `openapi.yaml` (or `swagger.json`), and the first questions are what it is, which version it uses, and why the names differ. The first section answers those, and adds the two topics that trip people up most once they start editing: schemas and authentication.

The second section is about the most common reason an OpenAPI document exists at all, which is documentation. A renderer can turn any valid document into a reference, but only the descriptions, examples, and tags you write make it a good one. These articles show how, field by field.

Once several people edit a document, or several teams publish APIs, quality stops being a matter of care and becomes a matter of automation. The third section covers linting, rulesets, and catalogs. The last section covers the tools that consume the document day to day.

Every article uses the terminology of the OpenAPI Specification itself and cites the relevant version of it: [3.2.1](https://spec.openapis.org/oas/v3.2.1.html), [3.1.2](https://spec.openapis.org/oas/v3.1.2.html), or [3.0.4](https://spec.openapis.org/oas/v3.0.4.html). The examples are meant to be copied: paste them into a validator or a renderer and see the result for yourself.

We build OpenAPI tooling, so we have an interest here. Where Scalar is a good fit, the articles say so and link to it. They also link to the specification, to open-source alternatives, and to other vendors' documentation where those are the better fit.

When you are ready to go further, the [SDK guides](/learn/sdk) cover generating client libraries from the same document, and the [MCP guides](/learn/mcp/what-is-mcp) cover exposing it to AI agents. The [Learn home page](/learn) lists every topic.

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [OpenAPI documentation](/learn/openapi/openapi-documentation) · [Learn SDKs](/learn/sdk)
- **Docs:** [Scalar and the OpenAPI Specification](/products/api-references/openapi)
- **Product:** [Scalar API reference](/products/api-references) — open-source, interactive documentation from any OpenAPI document.
