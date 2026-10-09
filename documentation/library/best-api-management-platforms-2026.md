# Best API management platforms (2026)

*Last updated: October 2026*

The best API management platform depends on which half of API management you are buying. If you need a runtime gateway that authenticates callers, enforces rate limits, and routes traffic, the options worth evaluating in October 2026 are Kong, Tyk, Gravitee, WSO2, MuleSoft, and IBM API Connect for self-hosted or hybrid deployments, and Apigee, Azure API Management, AWS API Gateway, Zuplo, and Cloudflare API Shield as cloud services. If you need the lifecycle and contract half, the versioned API description, governance, documentation and a developer portal, SDKs, and MCP servers, the options are Scalar, Postman, and Swagger Studio, each of which pairs with a gateway rather than replacing one.

This page is written by Scalar, which builds a lifecycle and governance platform and is on the list in that group. It does not build a gateway, and it does not rank itself against the gateways. Every claim about another product links to that vendor's own documentation, pricing page, repository, or announcement, checked on 7 October 2026. If you are unsure which half you need, [API management vs API gateway](/learn/api-management/api-management-vs-api-gateway) draws the line.

**On this page**

- [Top picks at a glance](#top-picks-at-a-glance)
- [Three shapes of API management platform](#three-shapes-of-api-management-platform)
- [Comparison table](#comparison-table)
- [Self-hosted and hybrid gateways](#self-hosted-and-hybrid-gateways)
- [Cloud gateways](#cloud-gateways)
- [Lifecycle and contract-first platforms](#lifecycle-and-contract-first-platforms)
- [Do you need a gateway?](#do-you-need-a-gateway)
- [When to pick something other than Scalar](#when-to-pick-something-other-than-scalar)
- [Frequently asked questions](#frequently-asked-questions)

## Top picks at a glance

- **Kong**: the default self-hosted gateway, with an Apache-2.0 open-source core and the broadest AI and MCP gateway features, most of them in the Enterprise tier.
- **Tyk**: an MPL-2.0 gateway with every deployment mode on every plan and an open-source AI Studio; it publishes no prices.
- **Gravitee**: Apache-2.0 open-core suite that also covers event APIs; the AI and MCP features need an Enterprise pack.
- **WSO2 API Manager**: the fully open-source (Apache-2.0) suite with a developer portal and MCP gateway in the box; support is a subscription.
- **MuleSoft Anypoint Platform**: the integration-first suite for Salesforce shops; packages start at $2,000 a month.
- **IBM API Connect**: the enterprise suite with on-premises, SaaS, and an MCP-capable gateway; quote-based pricing.
- **Apigee**: Google Cloud's gateway with published pay-as-you-go pricing and a hybrid runtime for subscription customers.
- **Azure API Management**: the natural choice on Azure, with built-in MCP server support on every tier except Consumption.
- **AWS API Gateway**: cheap per-request HTTP APIs, with a new paid developer portal and MCP via AgentCore Gateway.
- **Zuplo**: a managed edge gateway with a free tier, a developer portal on every plan, and OpenAPI operations as MCP tools.
- **Cloudflare API Shield**: API security on Cloudflare's edge for Enterprise customers; not a full management suite.
- **Postman**: the API development platform, with a public API network and an AI-native gateway called Fabric; not a classic API gateway.
- **Swagger Studio**: SmartBear's design and governance product, formerly SwaggerHub, with a separate portal.
- **Scalar**: an OpenAPI-based lifecycle and governance platform with a registry, Spectral-compatible linting, docs and a developer portal, SDKs, and hosted MCP servers that proxy and rate limit agent traffic; for every other caller it works alongside a gateway.

## Three shapes of API management platform

**Self-hosted and hybrid gateways.** Runtime gateways you install, often with a vendor-hosted control plane as an option. Kong, Tyk, Gravitee, WSO2, MuleSoft, and IBM API Connect. Most are open-core: an open-source gateway plus a commercial edition for the dashboard, portal, SSO, and AI features.

**Cloud gateways.** Gateways sold as a cloud service, priced per request or per hour. Apigee, Azure API Management, AWS API Gateway, Zuplo, and Cloudflare API Shield. The fit usually follows the cloud you already run on.

**Lifecycle and contract-first platforms.** Products that start from the API description and the developer experience: design, governance, registry, documentation, SDKs, and agent access. Scalar, Postman, and Swagger Studio. None of these is a general-purpose gateway for your application traffic (Scalar's hosted MCP server proxies agent traffic, and Postman's Fabric is an AI gateway); each pairs with a gateway from the first two groups.

A common mistake is comparing across the groups. A gateway and a lifecycle platform do different jobs, and most organizations with more than a few APIs end up with one of each.

## Comparison table

Prices are as published by each vendor on 7 October 2026. Cloud prices depend on region and are examples; hourly tiers are listed as the vendor shows them.

| Platform | Shape | Licence of the core | Deployment | Developer portal | MCP and AI gateway | Pricing as published |
| --- | --- | --- | --- | --- | --- | --- |
| [Kong](https://konghq.com/pricing) | Self-hosted and hybrid gateway | [Apache-2.0](https://github.com/Kong/kong/blob/master/LICENSE) gateway; Enterprise licence for the rest | Self-hosted, Konnect SaaS control plane, Kong-hosted data planes, Kubernetes | Konnect Dev Portal | AI Gateway; REST to MCP via the AI MCP Proxy plugin (Enterprise) | Konnect Plus from $25 a month plus usage; Enterprise custom; 30-day trial |
| [Tyk](https://tyk.io/pricing) | Self-hosted and hybrid gateway | [MPL-2.0](https://github.com/TykTechnologies/tyk/blob/master/LICENSE.md) except the commercial `ee` folder | Open source, self-managed, Tyk Cloud, hybrid | Tyk Developer Portal (licensed) | MCP Gateway; AI Studio (Community edition AGPL-3.0) | Core, Professional, Enterprise; no prices published; 48-hour trial |
| [Gravitee](https://www.gravitee.io/pricing) | Self-hosted and hybrid gateway | [Apache-2.0](https://github.com/gravitee-io/gravitee-api-management/blob/master/LICENSE.txt); Enterprise licence | Self-hosted, Gravitee Cloud, hybrid, Kubernetes | Classic portal; new portal is Enterprise tech preview | AI Agent Management pack (Enterprise): LLM, MCP, and A2A proxies, MCP Tool Server | Planet $2,500 a month; larger tiers on request |
| [WSO2 API Manager](https://wso2.com/api-platform/pricing/) | Self-hosted and hybrid gateway | [Apache-2.0](https://github.com/wso2/product-apim/blob/master/LICENSE) | Self-hosted, hybrid, SaaS | Included | AI Gateway and MCP Gateway included | SaaS Growth from $119 a month; Enterprise custom; self-managed support by subscription |
| [MuleSoft Anypoint](https://www.salesforce.com/mulesoft/anypoint-platform/pricing/) | Self-hosted and hybrid gateway | Proprietary | Omni Gateway anywhere; CloudHub; Runtime Fabric | Exchange portals; API Community Manager (separate licence) | Omni Gateway lists MCP; MCP Connector | Packages from $2,000 a month billed annually; 30-day trial |
| [IBM API Connect](https://www.ibm.com/products/api-connect/pricing) | Self-hosted and hybrid gateway | Proprietary | SaaS on AWS, reserved instance, on-premises software | Included | DataPower Interact Gateway exposes APIs as MCP tools | Quote-based; 30-day trial |
| [Apigee](https://cloud.google.com/apigee/pricing) | Cloud gateway | Proprietary | Google Cloud; hybrid runtime on Kubernetes (subscription) | Integrated portal, Drupal modules, or DIY | MCP built in; API hub registers tools | Pay-as-you-go from $20 per million standard proxy calls plus environments from $365 a month per region; subscriptions on request; 60-day evaluation |
| [Azure API Management](https://azure.microsoft.com/en-us/pricing/details/api-management/) | Cloud gateway | Proprietary ([portal code](https://github.com/Azure/api-management-developer-portal) is open source) | Azure; self-hosted gateway on Developer and Premium | Included except on Consumption | REST API as MCP server and MCP passthrough, all tiers except Consumption; AI gateway capabilities built in | Consumption from $0.035 per 10,000 calls after 1 million; Developer $0.0658 an hour; Basic v2 $0.20548 an hour; Standard v2 $0.9589 an hour; Premium v2 $3.83562 an hour (East US) |
| [AWS API Gateway](https://aws.amazon.com/api-gateway/pricing/) | Cloud gateway | Proprietary | AWS | API Gateway portals, $125 per portal a month, REST APIs only | MCP proxy through Amazon Bedrock AgentCore Gateway | HTTP APIs $1.00 per million requests; REST APIs $3.50 per million; WebSocket $1.00 per million messages (US East); free tier for 12 months |
| [Zuplo](https://zuplo.com/pricing) | Cloud gateway | Not published for the gateway; [Zudoku](https://github.com/zuplo/zudoku) portal is MIT | Managed edge; dedicated and self-hosted Kubernetes on Enterprise | Included on every plan | MCP Server Handler turns OpenAPI operations into tools; MCP gateway on every plan | Free up to 100,000 requests a month; Builder $25 a month; Enterprise from $1,000 a month on an annual contract |
| [Cloudflare API Shield](https://developers.cloudflare.com/api-shield/plans/) | Cloud API security | Proprietary | Cloudflare edge | None | Not part of API Shield | Enterprise-only add-on; contact sales |
| [Postman](https://www.postman.com/pricing/) | Lifecycle and contract-first | Proprietary | SaaS | Public and Private API Network; published documentation | MCP generator from public APIs in the API Network; Fabric AI gateway; Postman MCP server for Postman resources | Free; Solo $9 a month and Team $19 per user a month billed annually; Enterprise on request |
| [Swagger Studio](https://swagger.io/product/studio/) | Lifecycle and contract-first | Proprietary | SaaS | Swagger Portal (separate product) | Not documented | Free trial; prices not shown in the pricing page markup we could read |
| [Scalar](/pricing) | Lifecycle and contract-first | Closed service; API reference and client are MIT | Hosted; self-hosting with the MIT core | Included | Hosted MCP servers from the OpenAPI document on Pro and above, with rate limiting and per-installation analytics for agent traffic | Free; Pro $150 a month; Business $600 a month; Enterprise custom |

## Self-hosted and hybrid gateways

### Kong

**What it is.** Kong Gateway is a runtime API gateway with an [Apache-2.0 open-source core](https://github.com/Kong/kong/blob/master/LICENSE) and a commercial Enterprise edition that needs a [licence file](https://developer.konghq.com/gateway/entities/license/). Konnect is Kong's SaaS control plane, with Kong-hosted or self-hosted data planes and Kubernetes support through the Kong Ingress Controller. The [Konnect Dev Portal](https://developer.konghq.com/dev-portal/) is the developer portal. Kong's [AI Gateway](https://developer.konghq.com/ai-gateway/) proxies model providers, and its [MCP features](https://developer.konghq.com/mcp/) convert gateway APIs into MCP servers; the [AI MCP Proxy plugin](https://developer.konghq.com/plugins/ai-mcp-proxy/) that does this is only available with AI Gateway Enterprise.

**Pricing.** The [pricing page](https://konghq.com/pricing) lists Konnect Plus from $25 a month plus usage, billed monthly, with a 30-day free trial, and Enterprise as custom annual pricing. Unit prices on Plus include a serverless gateway at $25 a month per control plane, a hybrid gateway at $200 a month per control plane, and an additional developer portal at $200 a month. Self-hosted Enterprise pricing is custom. No permanent free Konnect tier is shown.

**Best for.** Teams that want the most widely deployed open-source gateway, with a path to enterprise features and AI gateway capabilities from the same vendor.

**Watch out for.** Role-based access, SSO, and audit logging are Enterprise features, and so is the MCP proxy. Price the Enterprise tier before you commit to the open-source one.

### Tyk

**What it is.** Tyk Gateway is open source under [MPL-2.0](https://github.com/TykTechnologies/tyk/blob/master/LICENSE.md), with the code in its `ee` folder under a separate commercial licence. Tyk's [options](https://tyk.io/docs/apim/) are the free open-source gateway, Self-Managed, and Tyk Cloud, where the control plane is hosted and data planes can be Tyk-hosted or yours. The [Tyk Developer Portal](https://tyk.io/docs/portal/overview/) is a licensed product. Tyk's [MCP Gateway](https://tyk.io/docs/ai-management/mcp-gateway/overview) implements the 2025-11-25 MCP revision from version 5.13, proxies to remote MCP servers on all licences, and converts REST APIs to MCP in the Enterprise edition from 5.15. [AI Studio](https://tyk.io/docs/ai-management/ai-studio/overview/) has an AGPL-3.0 Community edition and an Enterprise edition.

**Pricing.** The [pricing page](https://tyk.io/pricing) lists Core, Professional, and Enterprise tiers, all supporting cloud, hybrid, and self-managed deployment, with no dollar amounts and a 48-hour Tyk Cloud trial.

**Best for.** Teams that want one plan structure across cloud, hybrid, and self-managed, and an open-source gateway without a separate enterprise image.

**Watch out for.** The dashboard, portal, and multi-data-centre components are licensed, the trial is short and excludes hybrid, and you will need a sales conversation for any price.

### Gravitee

**What it is.** Gravitee API Management is [Apache-2.0](https://github.com/gravitee-io/gravitee-api-management/blob/master/LICENSE.txt) open-core, with an [Enterprise Edition](https://documentation.gravitee.io/apim/introduction/enterprise-edition) unlocked by a licence on the same bundle. It runs [self-hosted, in Gravitee Cloud, or hybrid](https://documentation.gravitee.io/apim/getting-started), and also manages event APIs. There are [two developer portals](https://documentation.gravitee.io/apim/developer-portal): the mature Classic portal and a new portal that is an Enterprise-only tech preview. The AI features, now branded [AI Agent Management](https://documentation.gravitee.io/apim/ai-agent-management) (previously Agent Mesh), include LLM, MCP, and A2A proxies and an MCP Tool Server, all Enterprise with an add-on pack.

**Pricing.** The [pricing page](https://www.gravitee.io/pricing) lists the Planet plan at $2,500 a month for one production gateway, with larger tiers and the Agent Management package on request. No free tier or trial is shown; the open-source gateway is separate.

**Best for.** Teams that need HTTP and event-driven APIs (Kafka, MQTT, webhooks) under one gateway and portal.

**Watch out for.** Every AI and MCP feature, the new portal, audit trail, custom roles, and enterprise SSO are Enterprise. Product naming for the AI features has changed more than once in a year.

### WSO2 API Manager

**What it is.** WSO2 API Manager is a [fully open-source](https://apim.docs.wso2.com/en/4.7.0/get-started/overview/) suite under [Apache-2.0](https://github.com/wso2/product-apim/blob/master/LICENSE) covering the gateway, publisher, and developer portal, deployable self-hosted, hybrid, or as WSO2's SaaS API platform. Its [AI Gateway](https://apim.docs.wso2.com/en/4.7.0/ai-gateway/ai-gateway-overview/) and [MCP Gateway](https://apim.docs.wso2.com/en/4.7.0/ai-gateway/mcp-gateway/overview/) can create an MCP server from an OpenAPI definition or an existing API, or proxy an existing MCP server, and the portal lists MCP servers alongside APIs.

**Pricing.** The [API platform pricing page](https://wso2.com/api-platform/pricing/) lists a 30-day trial, Growth from $119 a month for up to 10 managed interfaces, and Enterprise custom. The self-managed product is free to run; support and updates come with a subscription, priced on request.

**Best for.** Teams that want every component open source with no feature-gated enterprise edition, and are willing to run it or pay for support.

**Watch out for.** The GitHub distribution is described by WSO2 as unsupported; production use generally means a subscription. The SaaS tiers meter "managed interfaces" and gateway events, so model your volumes.

### MuleSoft Anypoint Platform

**What it is.** Salesforce's integration and API platform. [API Manager](https://docs.mulesoft.com/api-manager/latest/latest-overview-concept) governs APIs running on [Omni Gateway](https://docs.mulesoft.com/gateway/latest/) (formerly Flex Gateway), an Envoy-based gateway that runs self-managed or in MuleSoft's managed runtimes and lists MCP among its supported protocols. Exchange provides portals, and [API Community Manager](https://docs.mulesoft.com/api-community-manager/) builds branded developer communities on Salesforce Experience Cloud under a [separate licence](https://docs.mulesoft.com/api-community-manager/licensing-overview). An [MCP Connector](https://docs.mulesoft.com/mcp-connector/latest/) exposes Mule applications and APIs over MCP.

**Pricing.** The [pricing page](https://www.salesforce.com/mulesoft/anypoint-platform/pricing/) states that packages start at $2,000 a month billed annually, with pre-purchase, pre-commit ($50,000 minimum annual commitment), and unlimited buying models, and a 30-day trial.

**Best for.** Salesforce customers and integration-heavy enterprises that want the API gateway, integration runtime, and portal from one vendor.

**Watch out for.** Usage is metered in Mule credits across the platform, and the developer community product is a separate Salesforce licence.

### IBM API Connect

**What it is.** IBM's enterprise API management suite, sold as [SaaS on AWS, a reserved instance on IBM Cloud, or software you deploy](https://www.ibm.com/products/api-connect/pricing) on premises or across clouds, with DataPower and webMethods gateways. The [Developer Portal](https://www.ibm.com/products/api-connect) is included. The [DataPower Interact Gateway](https://www.ibm.com/docs/en/SSCL05_12.1.0/com.ibm.apic.aigateway.doc/co-nanoaigtw_overview.html) adds AI management and exposes existing APIs as MCP tools.

**Pricing.** Pay-as-you-go, Standard, Premium, reserved instance, and software tiers with no published amounts; a 30-day trial and quote on request.

**Best for.** Enterprises with IBM middleware, strict on-premises requirements, or DataPower appliances.

**Watch out for.** No published pricing, and the product line spans several gateways with different capabilities.

## Cloud gateways

### Apigee (Google Cloud)

**What it is.** [Apigee](https://docs.cloud.google.com/apigee/docs/api-platform/get-started/what-apigee) is Google Cloud's API management platform, with [Apigee hybrid](https://docs.cloud.google.com/apigee/docs/hybrid/latest/what-is-hybrid) running the gateway on your Kubernetes with a Google-hosted management plane. [Portal options](https://docs.cloud.google.com/apigee/docs/api-platform/publish/intro-portals) are an integrated hosted portal, Drupal modules, or do-it-yourself. [MCP in Apigee](https://docs.cloud.google.com/apigee/docs/api-platform/apigee-mcp/apigee-mcp-overview) serves `tools/list` and `tools/call` from a managed endpoint and registers tools in API hub.

**Pricing.** The [pricing page](https://cloud.google.com/apigee/pricing) lists pay-as-you-go at $20 per million standard API proxy calls (up to 50 million, falling with volume) and $100 per million extensible proxy calls, plus an environment fee from $365 a month per region (Base, up to 50 QPS) to $3,431 (Comprehensive). Subscription tiers are on request, and there is a 60-day evaluation.

**Best for.** Google Cloud customers, and teams that want a hybrid gateway with a cloud management plane.

**Watch out for.** Hybrid needs a subscription, the Base environment cannot run portals or extensible proxies, and the integrated portal is hosted in one region. Apigee Edge is the older product line with its own lifecycle.

### Azure API Management

**What it is.** Microsoft's managed gateway, in [classic and v2 tiers](https://learn.microsoft.com/en-us/azure/api-management/api-management-features) from Consumption to Premium, with a [self-hosted gateway](https://learn.microsoft.com/en-us/azure/api-management/api-management-features) on the Developer and Premium tiers. The [developer portal](https://learn.microsoft.com/en-us/azure/api-management/developer-portal-overview) is included on every tier except Consumption. The [MCP server feature](https://learn.microsoft.com/en-us/azure/api-management/mcp-server-overview) exposes a REST API as an MCP server or passes through an existing one, on all tiers except Consumption, with tools supported but not resources or prompts; the [AI gateway capabilities](https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities) are part of the service rather than a separate product.

**Pricing.** Microsoft's pricing page renders prices client-side, so these come from its [Retail Prices API](https://prices.azure.com/api/retail/prices?$filter=serviceName%20eq%20%27API%20Management%27%20and%20armRegionName%20eq%20%27eastus%27) for East US on 7 October 2026: Consumption at $0.035 per 10,000 calls after the first million; Developer $0.0658 an hour; Basic $0.2016; Standard $0.9407; Premium $3.829; Basic v2 $0.20548; Standard v2 $0.9589; Premium v2 $3.83562 an hour. The v2 tiers include request allowances and charge per 10,000 calls beyond them.

**Best for.** Azure customers, and teams that want MCP exposure of REST APIs without running anything.

**Watch out for.** Consumption has no portal, no MCP, and no VNet; the Developer tier has no SLA; multi-region is Premium only.

### AWS API Gateway

**What it is.** AWS's managed gateway with [three API types](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html): REST APIs with the full feature set (API keys, usage plans, caching, WAF), cheaper HTTP APIs, and WebSocket APIs. [API Gateway portals](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-portals.html), launched in November 2025, are managed developer portals for REST APIs with Cognito authentication; the older open-source [Serverless Developer Portal](https://github.com/awslabs/aws-api-gateway-developer-portal) is in maintenance mode. [MCP proxy support](https://aws.amazon.com/about-aws/whats-new/2025/12/api-gateway-mcp-proxy-support/) arrived in December 2025 through [Amazon Bedrock AgentCore Gateway](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway.html), which converts APIs and Lambda functions into MCP tools.

**Pricing.** The [pricing page](https://aws.amazon.com/api-gateway/pricing/) for US East (N. Virginia) lists HTTP APIs at $1.00 per million requests for the first 300 million, REST APIs at $3.50 per million for the first 333 million, WebSocket at $1.00 per million messages plus $0.25 per million connection minutes, and portals at $125 per portal a month. The free tier covers one million REST and one million HTTP calls a month for 12 months.

**Best for.** AWS-native teams, serverless backends, and anyone who wants the cheapest per-request gateway on their own cloud.

**Watch out for.** Portals are REST-only, Cognito-only, and charged per portal; MCP is really an AgentCore feature with its own billing; HTTP APIs lack API keys, usage plans, and caching.

### Zuplo

**What it is.** A programmable gateway that runs as a [managed edge service](https://zuplo.com/docs/articles/hosting-options), with dedicated and self-hosted Kubernetes options on Enterprise. The developer portal, built on the MIT-licensed [Zudoku](https://github.com/zuplo/zudoku), is included on every plan. The [MCP Server Handler](https://zuplo.com/docs/handlers/mcp-server) runs a stateless MCP server on the gateway and turns listed OpenAPI operations into tools.

**Pricing.** The [pricing page](https://zuplo.com/pricing) lists Free at $0 for up to 100,000 requests a month with 1,000 MCP tool invocations, Builder at $25 a month, and Enterprise from $1,000 a month on an annual contract.

**Best for.** Developer teams that want a hosted gateway with a real free tier, OpenAPI-driven configuration, and MCP tools without a second product.

**Watch out for.** The gateway runtime is not open source as far as Zuplo's public repositories show, and dedicated or self-hosted deployment is Enterprise-only.

### Cloudflare API Shield

**What it is.** [API Shield](https://developers.cloudflare.com/api-shield/) is Cloudflare's API security product: endpoint discovery, schema validation, and abuse detection at the edge. It is an [Enterprise-only add-on](https://developers.cloudflare.com/api-shield/plans/). It has no developer portal and is not an API lifecycle product.

**Pricing.** Contact sales, on an Enterprise plan.

**Best for.** Cloudflare Enterprise customers who need API security in front of whatever gateway or backend they already have.

**Watch out for.** It is a security layer, not a management suite; you still need a gateway and lifecycle tooling.

## Lifecycle and contract-first platforms

### Postman

**What it is.** Postman describes itself as a [unified platform for designing, testing, distributing, documenting, and monitoring APIs](https://www.postman.com/product/what-is-postman/), with a Public API Network on all plans and a Private API Network on Enterprise. It is not a classic API gateway; its [Fabric Gateway](https://app.fabricgateway.ai/) is an AI-native gateway for agents, LLMs, and MCP traffic. Postman's [MCP generator](https://learning.postman.com/docs/postman-ai/mcp-servers/generate) builds a server from public APIs in the Postman API Network, and its [remote MCP server](https://learning.postman.com/docs/reference/postman-api/postman-mcp-server/overview/) at `mcp.postman.com` lets agents manage Postman resources rather than your API.

**Pricing.** The [pricing page](https://www.postman.com/pricing/) lists Free, Solo at $9 a month billed annually, Team at $19 per user a month billed annually, and Enterprise on request; the former Basic and Professional plans are no longer available to new customers.

**Best for.** Teams whose API work centres on collections and testing, and want distribution through the API Network.

**Watch out for.** No runtime API gateway for your traffic, and generating an MCP server for your own internal API goes through Agent Mode, which Postman labels as beta.

### Swagger Studio (SmartBear)

**What it is.** [Swagger Studio](https://swagger.io/product/studio/) is SmartBear's API design and governance product, renamed from API Hub for Design, itself formerly SwaggerHub, in November 2025. It covers design standards with style validators, domains for reuse, mocking, and linting. [Swagger Portal](https://swagger.io/product/portal/) is the documentation portal product.

**Pricing.** The pricing page renders its plans client-side, and we could not read prices from its markup; a free trial is offered. Check [swagger.io](https://swagger.io/product/pricing/) directly.

**Best for.** Design-first teams standardizing on the Swagger toolchain and SmartBear's wider testing products.

**Watch out for.** Portal is a separate product, there is no gateway, and the product has been renamed twice recently, so older documentation refers to SwaggerHub.

### Scalar

**Disclosure.** Scalar wrote this page.

**What it is.** An OpenAPI-based platform for API lifecycle and governance: a versioned [Registry](/products/registry) for OpenAPI and AsyncAPI documents, JSON Schema, and rules, with breaking-change detection between published versions; Spectral-compatible [linting](/products/registry/rules) in Git and CI; an [API reference and developer portal](/products/docs); [SDKs](/products/sdk-generator); an open-source [API client](/products/api-client); and [hosted MCP servers](/products/agent/mcp), all driven from the same OpenAPI document. The API reference and API client are MIT licensed and can be self-hosted. The hosted MCP server is the runtime piece: it proxies AI agent calls to your API with the credentials you configure, rate limits them, and reports consumption per installation. It is not a general-purpose gateway: it does not sit in front of your API for human or application traffic, enforce quotas or runtime policy for those callers, or handle monetization.

**Pricing.** Free at $0 with up to 3 APIs in the registry; Pro at $150 a month (or $125 billed yearly) with hosted MCP servers, custom domains, and access groups; Business at $600 a month (or $500 yearly) with SSO; Enterprise custom. Figures are from the [pricing page](/pricing) on 7 October 2026.

**Best for.** API teams that want the contract, documentation, SDKs, and agent access to come from one OpenAPI document, next to whichever gateway runs the traffic.

**Watch out for.** If your evaluation is for a gateway in front of all your API traffic, Scalar is the wrong list entry; pair it with one of the gateways above. Its proxying, rate limiting, and analytics apply to agent traffic through the hosted MCP server only.

## Do you need a gateway?

A gateway is for request time: authenticating external callers, enforcing per-consumer limits and plans, routing across services, caching, and measuring usage. If external consumers call your API with keys or plans, if you need rate limiting your framework does not provide, or if you need usage analytics or billing, you need one. If the API is internal and your service mesh or framework already handles authentication and limits, you may not. Lifecycle tooling is for everything before request time: the contract, the review, the documentation, the SDKs, and agent access, and it is needed as soon as more than one team publishes APIs or anyone outside the team reads the docs. [API management vs API gateway](/learn/api-management/api-management-vs-api-gateway) works through both questions.

## When to pick something other than Scalar

- **You need a gateway, rate limiting, quotas, or threat protection for all your API traffic.** Pick a gateway from the first two groups. Scalar's proxying and rate limiting cover agent traffic through its hosted MCP server, not your applications' calls.
- **You need consumption analytics across every caller, or monetization.** Those come from the gateway's traffic data. Kong, Apigee, Azure API Management, MuleSoft, and IBM all offer them; Scalar's analytics cover MCP traffic only and it has no monetization.
- **You want one vendor for gateway and portal.** Kong, Tyk, Apigee, Azure, AWS, Gravitee, WSO2, MuleSoft, and IBM each ship a portal with the gateway, and Zuplo includes one on every plan.
- **You want everything open source with no feature-gated edition.** WSO2 API Manager.
- **Your API work is collection-based rather than OpenAPI-based.** Postman.
- **You are standardizing on SmartBear's design and testing tools.** Swagger Studio.

## Frequently asked questions

<scalar-detail title="What are the best API management platforms in 2026?">
For a runtime gateway: Kong, Tyk, Gravitee, WSO2, MuleSoft, or IBM API Connect if you deploy yourself or hybrid, and Apigee, Azure API Management, AWS API Gateway, or Zuplo as cloud services. For the lifecycle and contract side, which a gateway does not cover well: Scalar, Postman, or Swagger Studio. Most organizations pair one from each group.
</scalar-detail>

<scalar-detail title="What is the best API management platform for developers or DevTools companies?">
It depends on the half you are buying. For the developer-facing half, documentation, SDKs, an API client, and MCP servers from one OpenAPI document, Scalar is built for it, and so is Postman if your workflow is collection-based. For runtime traffic, Zuplo and AWS API Gateway are the lowest-friction cloud options with free tiers, and Kong is the standard self-hosted gateway. Scalar wrote this page; see the disclosure above.
</scalar-detail>

<scalar-detail title="Which API management platforms are open source?">
Kong Gateway (Apache-2.0), Tyk Gateway (MPL-2.0, except its ee folder), Gravitee (Apache-2.0), and WSO2 API Manager (Apache-2.0) have open-source gateways; Kong, Tyk, and Gravitee gate dashboards, portals, or AI features behind commercial editions, while WSO2 keeps every component open source and sells support. Scalar's API reference and API client are MIT licensed; its hosted platform is a service.
</scalar-detail>

<scalar-detail title="Which API management platforms support MCP?">
Most, as of October 2026. Kong (AI MCP Proxy, Enterprise), Tyk (MCP Gateway), Gravitee (Enterprise pack), WSO2 (MCP Gateway), MuleSoft (Omni Gateway and MCP Connector), IBM (DataPower Interact Gateway), Apigee, Azure API Management (all tiers except Consumption), AWS (through AgentCore Gateway), and Zuplo (MCP Server Handler) each expose APIs as MCP tools. Scalar hosts MCP servers from the OpenAPI document on Pro and above. Postman generates MCP servers from public APIs in its network.
</scalar-detail>

<scalar-detail title="Is Scalar an API management platform?">
Scalar is the lifecycle and governance half: registry with breaking-change detection, linting, documentation and developer portal, SDKs, and hosted MCP servers from one OpenAPI document. Its hosted MCP server proxies, rate limits, and measures AI agent traffic, but it is not a gateway for your application traffic and has no monetization, so it is not a full API management platform in the sense the gateway vendors use. It works alongside a gateway.
</scalar-detail>

<scalar-detail title="How much does API management cost?">
Published entry points range from free tiers (Zuplo, AWS API Gateway's 12-month free tier, Azure Consumption's included calls, Scalar Free) through tens of dollars a month (Kong Plus from $25, Zuplo Builder $25, WSO2 Growth from $119, Scalar Pro $150) to thousands (Gravitee Planet $2,500, MuleSoft from $2,000, Apigee environments from $365 a month per region plus per-call fees). Tyk, IBM, Cloudflare API Shield, and all Enterprise tiers are quote-based. Figures are from vendor pricing pages on 7 October 2026.
</scalar-detail>

## Related

- **Learn:** [API management vs API gateway](/learn/api-management/api-management-vs-api-gateway) · [API governance with OpenAPI](/learn/api-management/api-governance) · [API catalog vs API registry](/learn/openapi/api-catalog)
- **Library:** [Best API documentation tools (2026)](/library/best-api-documentation-tools-2026) · [Best MCP server generators (2026)](/library/best-mcp-server-generators-2026)
- **Product:** [Scalar Registry](/products/registry) — the lifecycle and governance layer that pairs with your gateway

---

*Licences, deployment options, features, and prices are taken from each vendor's documentation, pricing pages, repositories, and announcements as of 7 October 2026 and are linked inline. Azure prices come from Microsoft's Retail Prices API for East US because the pricing page renders client-side; AWS prices are for US East (N. Virginia). Where a vendor publishes no price, we say so rather than guess. This page is written by Scalar, which sells the lifecycle and governance products and the hosted MCP servers described in its own entry and does not sell a general-purpose gateway. If you find something wrong or out of date, [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
