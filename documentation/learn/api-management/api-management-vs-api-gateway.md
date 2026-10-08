# API management vs API gateway vs API lifecycle management

*Last updated: October 2026*

API management is the combination of a runtime API gateway and the lifecycle tooling around it. The gateway runs traffic: it routes requests, authenticates callers, enforces rate limits and quotas, and collects usage data. Lifecycle and governance tooling manages the API contract and everything derived from it: the design standard, the versioned API description, linting in CI, documentation and a developer portal, SDKs, and now MCP servers for AI agents. An "API management platform" bundles both; an API gateway is only the runtime half; API lifecycle management is only the contract half.

The two halves are often bought together and often confused. This guide separates them layer by layer, explains how the OpenAPI document connects them, and gives an honest decision guide for the two questions teams actually ask: do I need a gateway if I already have a portal and a registry, and do I need lifecycle tooling if I already have a gateway. Scalar builds the lifecycle and governance half, and its only runtime component is the hosted MCP server that proxies AI agent traffic to your API. It is not a general-purpose API gateway, and this page says so where it matters.

**On this page**

- [The short answer](#the-short-answer)
- [The layers of API management](#the-layers-of-api-management)
- [How the layers connect: the OpenAPI document as the contract](#how-the-layers-connect-the-openapi-document-as-the-contract)
- [What an API gateway does](#what-an-api-gateway-does)
- [What API lifecycle management does](#what-api-lifecycle-management-does)
- [Do I need a gateway if I already have a portal and a registry?](#do-i-need-a-gateway-if-i-already-have-a-portal-and-a-registry)
- [Do I need lifecycle tooling if I already have a gateway?](#do-i-need-lifecycle-tooling-if-i-already-have-a-gateway)
- [Where Scalar fits, and where it does not](#where-scalar-fits-and-where-it-does-not)
- [Frequently asked questions](#frequently-asked-questions)

## The short answer

- An **API gateway** is a reverse proxy that sits in front of your services at runtime. Every request passes through it. It authenticates, authorizes, rate limits, routes, transforms, caches, and logs.
- **API lifecycle management** is everything that happens to an API before and around runtime: designing the contract, reviewing changes, linting against a style guide, versioning, publishing the description to a registry, generating documentation, SDKs, and MCP servers, and retiring old versions.
- An **API management platform** is a product or suite that claims both. The large vendors (Kong, Apigee, Azure API Management, AWS API Gateway, MuleSoft, Tyk, Gravitee, WSO2, IBM API Connect) started as gateways and added lifecycle features. Lifecycle-first products (Scalar, Postman, Swagger Studio) started from the contract and the developer experience and pair with a gateway for human and application traffic rather than replacing one.

If you remember one thing: a gateway sees requests, lifecycle tooling sees the contract. Both are needed for an API anyone outside your team depends on, and they are different enough that buying one does not give you the other.

## The layers of API management

Vendors draw this picture differently, but the work is the same. The last column is specific about what Scalar does and does not cover, per its product pages, so you can place it correctly.

| Layer | What it does | Typical tools | Scalar |
| --- | --- | --- | --- |
| **Design and contract** | Define the API as an OpenAPI or AsyncAPI document, design-first or generated from code | Swagger Studio, Stoplight, Postman, framework generators, an editor and Git | Yes: an OpenAPI editor, Git sync, framework guides |
| **Governance and linting** | Encode a style guide as rules and enforce it on every change, in CI | Spectral, Redocly CLI, vendor rulesets | Yes: Spectral-compatible rules stored in the registry, `scalar document lint` in CI |
| **Versioning and registry** | Store every version of every API description in one place, with access control, and serve it to tools | SwaggerHub-style registries, Postman Private API Network, Backstage catalogs, Git | Yes: the Registry holds OpenAPI, AsyncAPI, JSON Schema, and rules, public or private |
| **Documentation and developer portal** | Render the reference, write guides, let developers try requests and get keys | Scalar, ReadMe, Mintlify, Redocly, Stoplight, gateway portals (Konnect Dev Portal, Apigee portals, Azure APIM portal, Tyk Developer Portal) | Yes: API reference and docs, custom domains, access groups, Ask AI |
| **SDKs** | Generate and publish client libraries from the contract | Scalar, Speakeasy, Fern, OpenAPI Generator, Kiota | Yes: SDK generator, published through your repositories |
| **MCP and agent access** | Expose operations as tools AI agents can call, with authentication | Scalar hosted MCP, gateway MCP features (Kong AI Gateway, Azure APIM MCP, Apigee MCP, AWS AgentCore Gateway, Tyk MCP Gateway), generators | Yes: hosted MCP servers from the OpenAPI document, OAuth built in |
| **Runtime gateway** | Proxy, route, authenticate, transform, and cache live traffic | Kong, Apigee, Azure APIM, AWS API Gateway, Tyk, Gravitee, Zuplo, MuleSoft, WSO2, Envoy, NGINX | **Agent traffic only.** The hosted MCP server proxies AI agent calls to your API with the credentials you configure; human and application traffic does not pass through Scalar |
| **Rate limiting, quotas, and threat protection** | Enforce per-consumer limits, block abuse, validate requests at the edge | The gateway, plus WAFs and API security products (for example Cloudflare API Shield) | **Agent traffic only.** Hosted MCP traffic is rate limited; there is no policy engine for your API's other traffic |
| **Analytics** | Measure calls, latency, errors, and consumers from live traffic | The gateway's analytics, observability platforms | **Agent traffic only.** Per-installation consumption analytics for calls made through the hosted MCP server; Scalar does not see traffic that bypasses it |
| **Monetization** | Plans, billing, and metering per consumer | Gateway monetization modules, billing systems | **No** |

Three observations about the table. First, the top six layers all consume the same artefact, the API description, and the bottom four all consume live traffic. Second, the gateway vendors' developer portals are the place the two halves overlap, which is why "developer portal" is the layer most often bought twice. Third, no vendor on either side covers every row well; the suites that claim to usually have a strong gateway and a serviceable portal, or a strong portal and a gateway that only sees one kind of traffic.

## How the layers connect: the OpenAPI document as the contract

The reason API management can be split cleanly is that the lifecycle layers share one input. An [OpenAPI document](/learn/openapi/what-is-openapi) describes each operation, its parameters, its schemas, and its security schemes. From that one document:

- A linter checks the design against your rules before the change merges.
- A registry stores the version and tells every other tool where the current description is.
- A documentation renderer produces the reference and the try-it console.
- An SDK generator produces client libraries in each language.
- An MCP server exposes selected operations as tools with the schema the model needs.
- A gateway can import the same document to create routes, and increasingly to validate requests against the schemas and to generate MCP tools of its own.

That last point is the bridge. Kong, Apigee, Azure API Management, AWS API Gateway, Tyk, and Zuplo all accept an OpenAPI document as input, and several of them now derive MCP tool definitions from it. If the document in your registry is the one the gateway imports, the portal, the SDKs, the agents, and the runtime routes all describe the same API. If the gateway has its own hand-maintained route table, they drift, and the drift shows up as a developer following the docs into a 404.

The practical rule: pick one place the description lives, make every other system read from it, and lint it on the way in. [API governance with OpenAPI](/learn/api-management/api-governance) shows the CI setup; [API catalog vs API registry](/learn/openapi/api-catalog) covers the storage side.

## What an API gateway does

A gateway earns its place by doing things that can only be done at request time:

- **Authentication and authorization at the edge.** Validate API keys, JWTs, OAuth tokens, or mutual TLS before a request reaches a service.
- **Rate limiting and quotas.** Per consumer, per plan, per route.
- **Routing and load balancing.** One hostname in front of many services, blue-green and canary releases, retries.
- **Transformation.** Rewrite paths and headers, translate protocols, aggregate responses.
- **Caching.** Serve repeated reads without touching the backend.
- **Observability.** Logs, metrics, and traces for every request, which is also where consumption analytics and monetization come from.
- **Threat protection.** Schema validation, payload limits, bot detection, and WAF integration.

Gateways ship as self-hosted software (Kong Gateway, Tyk, Gravitee, WSO2, Omni Gateway from MuleSoft), as cloud services (Apigee, Azure API Management, AWS API Gateway), or as managed edge services (Zuplo). Most now also act as AI gateways, proxying model providers and serving MCP endpoints from the APIs they front. The [best API management platforms (2026)](/library/best-api-management-platforms-2026) roundup compares them with sourced prices and licences.

## What API lifecycle management does

Lifecycle tooling earns its place by making the contract trustworthy and the API usable:

- **Design standards.** A style guide expressed as rules, so every team's API looks like one organization built it.
- **Review in Git.** Changes to the description go through pull requests, with linting and breaking-change checks as status checks.
- **Versioning and discovery.** A registry that holds every version, with access control, and a catalog people can search.
- **Documentation and a developer portal.** The reference, guides, a try-it console, and the account and key flows developers need.
- **Client libraries.** SDKs generated and published on every release, so the libraries never lag the API.
- **Agent access.** MCP servers so AI agents can use the API with the same curated surface and the same credentials policy.
- **Deprecation.** Marking operations and versions deprecated in the document, with dates, so consumers find out from the same place they found the API.

None of this touches a live request. That is the point: it has to be right before the first request, and it has to stay right as the API changes.

## Do I need a gateway if I already have a portal and a registry?

Yes, if any of these are true:

- **External consumers call the API** and you need per-consumer keys, quotas, or plans. A portal can issue keys; only a gateway can enforce them.
- **You need rate limiting or abuse protection** that your application framework does not provide.
- **You run many services behind one hostname** and need routing, retries, or canary releases.
- **You need usage analytics or billing** based on who called what.

Probably not, if:

- **The API is internal** and your service mesh, ingress controller, or framework middleware already handles authentication and limits.
- **You have one or two services** and the framework's own middleware covers auth and rate limiting. Adding a gateway is a new piece of infrastructure to run and a new place for configuration to drift.
- **Your platform already includes one.** Cloud functions, app platforms, and ingress controllers often ship gateway features you have not turned on.

If you add a gateway later, import the registry's OpenAPI document into it rather than describing routes by hand. The contract you already govern becomes the gateway configuration.

## Do I need lifecycle tooling if I already have a gateway?

Yes, if any of these are true:

- **More than one team publishes APIs** and they look different. A gateway cannot enforce naming conventions or response shapes; a linter can.
- **Developers read your docs and they are wrong.** Gateway portals render whatever description they are given. If the description is maintained by hand next to the gateway config, it will drift from the code.
- **You ship SDKs or want to.** Generating them needs an accurate, versioned description with good schemas, which is a lifecycle problem.
- **AI agents will use the API.** An MCP server is only as good as the operation descriptions and schemas it is built from.
- **You need to know what APIs exist.** A gateway knows what traffic it sees; it does not know who owns an API, which version is current, or whether an undocumented endpoint should exist.

Probably not, if you run one small API, one team maintains both the code and the description, and the gateway's portal is good enough for your consumers.

Most organizations past a handful of APIs end up with both. The mistake to avoid is buying a full API management suite for the gateway and then settling for its weakest half because it came in the box.

## Where Scalar fits, and where it does not

Scalar is an OpenAPI-based platform for API lifecycle and governance: a versioned [registry](/products/registry) for OpenAPI and AsyncAPI documents, JSON Schema, and rules, with breaking-change detection between published versions; Spectral-compatible [linting](/products/registry/rules) that runs in Git and CI; an [API reference and developer portal](/products/docs); [SDKs](/products/sdk-generator); an open-source [API client](/products/api-client); and [hosted MCP servers](/products/agent/mcp), all driven from the same OpenAPI document.

Its one runtime component is the hosted MCP server. Agent calls made through it are proxied to your API with the credentials you configure, rate limited, and measured per installation, so for AI agent traffic Scalar does cover the gateway, rate limiting, and analytics rows above. For every other caller, your applications, partners, and SDK users, Scalar works alongside an API gateway. Concretely, Scalar does not:

- proxy, route, or rate limit traffic that does not come through its hosted MCP server
- provide a general policy engine, quotas, or threat protection for your API
- provide consumption analytics for traffic that bypasses the MCP server
- provide monetization or billing
- replace Kong, Apigee, Azure API Management, AWS API Gateway, MuleSoft, Tyk, Gravitee, WSO2, or IBM API Connect

A typical pairing is a gateway for human and application traffic and Scalar for the contract and for agents: the OpenAPI document is linted and published to the Scalar Registry from CI, the gateway imports it for routes, and Scalar renders the portal, generates the SDKs, and serves the MCP server from the same version. If you need runtime traffic control, quotas, analytics, or monetization across all callers, you need a gateway or an API security product in addition to Scalar, and the [roundup](/library/best-api-management-platforms-2026) lists the categories and vendors to evaluate.

## Frequently asked questions

<scalar-detail title="What is an API management platform?">
A product or suite that combines a runtime API gateway with lifecycle tooling such as a developer portal, a catalog or registry, design and governance features, and analytics. Most started as gateways and added the rest. Lifecycle-first platforms cover the contract side and pair with a gateway.
</scalar-detail>

<scalar-detail title="Is an API gateway the same as API management?">
No. The gateway is the runtime component: a proxy that authenticates, rate limits, routes, and logs requests. API management also covers the lifecycle: designing the contract, governing changes, versioning, documenting, generating SDKs, and exposing the API to agents. A gateway alone is API management without the lifecycle half.
</scalar-detail>

<scalar-detail title="What is API lifecycle management?">
The practice and tooling for managing an API from design through retirement: writing and reviewing the API description, linting it against a style guide, versioning it in a registry, publishing documentation and SDKs, exposing it to AI agents, and deprecating old versions with dates. It is the half of API management that does not touch live traffic.
</scalar-detail>

<scalar-detail title="Can I use Scalar with Kong, Apigee, or Azure API Management?">
Yes. Scalar manages the OpenAPI document, the documentation and developer portal, SDKs, and hosted MCP servers, while the gateway handles human and application traffic. Publish the document from CI to the Scalar Registry and import the same document into the gateway so routes and docs cannot drift.
</scalar-detail>

<scalar-detail title="Does Scalar have an API gateway?">
Not a general-purpose one. Scalar's hosted MCP server proxies AI agent traffic to your API with rate limiting and per-installation consumption analytics, so for agents it plays the gateway role. It does not sit in front of your API for other callers, enforce quotas or runtime policy for them, or provide monetization. For that traffic it works alongside a gateway.
</scalar-detail>

<scalar-detail title="What is the difference between a developer portal and an API gateway?">
A developer portal is a website where developers discover an API, read its documentation, try requests, and get credentials. A gateway is the runtime proxy that then enforces those credentials on each request. Gateway vendors usually bundle a portal; lifecycle platforms such as Scalar provide the portal and leave runtime enforcement to the gateway.
</scalar-detail>

## Related

- **Learn:** [API governance with OpenAPI](/learn/api-management/api-governance) · [API catalog vs API registry](/learn/openapi/api-catalog) · [What is OpenAPI?](/learn/openapi/what-is-openapi) · [What is an API reference?](/learn/openapi/what-is-an-api-reference)
- **Library:** [Best API management platforms (2026)](/library/best-api-management-platforms-2026)
- **Docs:** [Scalar Registry](/products/registry) · [Enterprise](/enterprise)
- **Product:** [Scalar for developer portals](/solutions/developer-portal) — documentation, SDKs, and MCP servers from one OpenAPI document, alongside your gateway

---

*Vendor names in the layer table are examples of products in each category, taken from their own documentation on 7 October 2026; the roundup linked above carries the sourced details, prices, and licences. Scalar wrote this guide and sells the lifecycle and governance layers and hosted MCP servers, not a general-purpose gateway. If something here is wrong or out of date, [open an issue](https://github.com/scalar/scalar/issues).*
