# Learn SDKs

*Last updated: September 2026*

SDKs are the client libraries that let developers call an API in their own language, and this hub collects Scalar's guides to what they are, when they are worth it, and how to generate them from an OpenAPI document. The articles are written for two readers: developers deciding whether to use an SDK or the raw API, and API teams deciding how to give their users one.

Read them in this order if you are new to the topic. Each article stands on its own, so skip ahead if you already know the basics.

## Start here

<scalar-page-link filepath="documentation/learn/sdk/what-is-an-sdk.md" title="1. What is an SDK?" description="What goes into an SDK, the main kinds, and what separates a good one from a frustrating one, with a real generated SDK as the example."></scalar-page-link>

<scalar-page-link filepath="documentation/learn/sdk/sdk-vs-api.md" title="2. SDK vs API" description="How an SDK relates to the API it wraps, the same call made three ways, and when calling the API directly is the better choice."></scalar-page-link>

## Decide and build

<scalar-page-link filepath="documentation/learn/sdk/build-vs-buy-sdk.md" title="3. Build vs buy an SDK" description="A cost model with every assumption written down: engineer-weeks per language, yearly maintenance, and when building still wins."></scalar-page-link>

<scalar-page-link filepath="documentation/learn/sdk/generate-sdk-from-openapi.md" title="4. How to generate an SDK from OpenAPI" description="Prepare the OpenAPI document, choose a generator, generate, publish to npm, PyPI, and Go modules, and regenerate from CI."></scalar-page-link>

## Build a good SDK

<scalar-page-link filepath="documentation/learn/sdk/sdk-pagination.md" title="5. SDK pagination" description="Cursor, offset, and link-header pagination, how an SDK turns them into one loop over items, and how OpenAPI describes them."></scalar-page-link>

<scalar-page-link filepath="documentation/learn/sdk/sdk-error-handling.md" title="6. SDK error handling" description="Typed errors, retries with backoff, idempotency keys, and timeouts: what a client library should handle for the caller."></scalar-page-link>

## Why these topics

Most API teams reach SDKs in the same order. First the question is what an SDK even adds on top of a well-documented API. Then it becomes a budget question, because every language is a codebase to maintain. Finally it is a practical one: how to go from the OpenAPI document you already have to packages your users can install.

The answers depend more on your API description than on any tool. A document with stable `operationId` values, tags, named schemas, documented errors, and declared pagination produces good SDKs from almost any generator, and a vague one produces vague SDKs from all of them. If you are not yet confident in your document, start with [what is OpenAPI](/learn/openapi/what-is-openapi) and then come back to the generation guide.

Once you know which languages you need, the per-language pages go deeper on idioms, typing, retries, pagination, and publishing for [TypeScript](/sdk/typescript), [Python](/sdk/python), and [Go](/sdk/go). They show real generated output rather than templates.

We make an SDK generator, so we have an interest here. The articles link to other vendors' own documentation, include open-source options, and say where hand-writing or another tool is the better fit.

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [What is MCP?](/learn/mcp/what-is-mcp)
- **Docs:** [SDK Generator getting started](/products/sdk-generator/getting-started)
- **Product:** [Scalar SDK Generator](/products/sdk-generator) — typed TypeScript, Python, Go, and CLI clients from your OpenAPI document.
