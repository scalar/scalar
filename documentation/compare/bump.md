# Scalar vs Bump.sh

*Last updated: September 2026*

Bump.sh is a hosted API documentation platform built around change management: it publishes OpenAPI and AsyncAPI documents as docs and hubs, detects breaking changes between versions, and writes a changelog for you. It also hosts MCP servers built from workflow documents. If your main problem is keeping API consumers informed about what changed, Bump.sh is built for exactly that, and it is worth a close look.

This page is written by Scalar, so read it with that in mind. Every claim we make about Bump.sh links to its own pricing page, help centre, or public repositories. If we have something wrong, tell us and we will fix it.

The short version: Bump.sh is stronger on change detection, changelogs, overlays, and event-driven APIs. Scalar is stronger on openness and breadth: the renderer and API client are MIT licensed and self-hostable, there is a free plan, and the same OpenAPI document drives SDKs and hosted MCP servers as well as docs.

Looking for the command-by-command switch rather than the product comparison? The [Bump.sh migration guide](/resources/migration/bump) maps the Bump CLI and GitHub Action to Scalar's.

## At a glance

| | Scalar | Bump.sh |
| --- | --- | --- |
| Free plan | Yes: up to 3 APIs, 1 editor seat | [No](https://bump.sh/pricing); 14-day trial on Pro |
| Entry paid plan | $150/month flat, 5 editor seats | [Basic $50/month](https://bump.sh/pricing): 10 API docs, 3 internal users |
| Docs renderer licence | MIT, self-hostable on any plan | Hosted; the [CLI is MIT](https://github.com/bump-sh/cli), we found no public renderer repository |
| Try-it explorer | Every plan, and in the open-source renderer | [Pro and above](https://bump.sh/pricing) |
| Breaking-change diff | No | [Pro and above](https://bump.sh/pricing) |
| Automatic changelog | No | [Pro and above](https://bump.sh/pricing) |
| AsyncAPI | Rendering, [work in progress](/products/api-references/asyncapi) | [All plans](https://bump.sh/pricing) |
| Arazzo | No | [All plans](https://bump.sh/pricing) |
| OpenAPI Overlays | No | [CLI `overlay` command](https://github.com/bump-sh/cli) |
| MCP servers | Hosted, generated from OpenAPI operations | [Hosted, built from Flower or Arazzo workflows](https://bump.sh/help/mcp-servers/) |
| SDK generation | Yes | No |
| Standalone API client | Yes, open source | No |

## Where Bump.sh is stronger

We said this on our migration page and we will say it again here, because it is still true.

**Change management is the product.** Bump.sh compares each new version of your API description with the last one, flags [breaking changes](https://bump.sh/pricing), and publishes an automatic changelog on Pro. Its [CLI](https://github.com/bump-sh/cli) exposes the same diff locally, so you can fail a pull request that breaks consumers. Scalar has nothing equivalent built in today. If "tell our consumers what changed, every time" is your main requirement, Bump.sh does it and we do not.

**Event-driven APIs.** Every Bump.sh plan supports [OpenAPI, AsyncAPI, and Arazzo](https://bump.sh/pricing). Scalar renders AsyncAPI documents, but our own docs say the support is still a work in progress, and we do not render Arazzo. If Kafka topics or WebSocket channels are a large part of your API surface, Bump.sh is more complete.

**OpenAPI Overlays.** The Bump CLI can [apply an overlay](https://github.com/bump-sh/cli) to a document, which is a clean way to layer public-facing descriptions over an internal source of truth. Scalar does not support overlays yet.

**Workflow-based MCP servers.** Bump.sh builds MCP servers from declarative workflows: in its own words, ["you describe the API calls and their sequencing, and Bump.sh generates a fully hosted MCP server that executes them"](https://bump.sh/help/mcp-servers/). That is a different design from exposing individual operations as tools, and for multi-step tasks it can give an agent a better-shaped tool.

**A lower entry price.** Bump.sh Basic is [$50/month](https://bump.sh/pricing), a third of Scalar Pro. If you need hosted docs for several APIs and nothing else, that is cheaper.

## Bump.sh vs Scalar

### Openness and where the docs live

Bump.sh is a hosted platform. You deploy documents to it with the CLI, the API, or the GitHub Action, and readers visit your Bump.sh hub or your custom domain. The [Custom plan](https://bump.sh/pricing) adds a reverse proxy and embed mode for serving docs under your own site.

Scalar's API reference is MIT licensed and is the same renderer on the hosted platform. You can use the hosted platform, self-host the reference for free, or mount it inside your application through 35+ framework integrations, including [Express](/products/api-references/integrations/express), [FastAPI](/products/api-references/integrations/fastapi), [NestJS](/products/api-references/integrations/nestjs), [ASP.NET Core](/products/api-references/integrations/aspnetcore/integration), [Laravel](/products/api-references/integrations/laravel), and [Rails](/products/api-references/integrations/ruby-on-rails). Hosted docs can also live under a subpath of your own domain on the Business plan.

This matters for two groups of people: teams that want internal docs to run inside their own network with no vendor in the loop, and teams whose OpenAPI document is produced by their framework at runtime and who would rather the docs update with every deploy.

### Trying requests

On Bump.sh the [API Explorer (try-it-out)](https://bump.sh/pricing) is a Pro feature; Basic docs are read-only. On Scalar, every reference has a full [API client](/products/api-client) on every operation, on every plan and in the open-source renderer: environments, OAuth 2.0 flows, API keys, cookies, history, and code examples in many languages. The same client runs as a desktop and web app.

### Change management

Bump.sh has the stronger story here, as described above. On Scalar, the [registry](/products/registry) versions every document you publish, the CLI validates and lints each version with Spectral-compatible rules, and hosted docs support previews and rollback. What Scalar lacks is the automatic semantic diff and consumer-facing changelog. If you need a diff today, you can run an open-source OpenAPI diff tool in CI alongside `scalar document lint`. That works, but it is glue you own rather than a feature we ship.

### MCP: operations versus workflows

Both products host MCP servers, and the designs are genuinely different.

Scalar generates an MCP server from your OpenAPI document. You choose which operations become tools, set per tool whether it only looks up documentation or makes real authenticated requests, and store credentials against the installation so they never reach the client. OAuth is supported for people outside your team. It is quick to set up because the description you already have is the input. See [MCP servers](/products/agent/mcp).

Bump.sh builds the server from [Flower or Arazzo workflow documents](https://bump.sh/help/mcp-servers/) that describe sequences of calls. You write more up front, and in exchange each tool can represent a task rather than a single endpoint. Private MCP servers are a [Pro feature](https://bump.sh/pricing), and the Custom plan offers an on-premise MCP dataplane.

If your agents mostly need to call individual endpoints, the OpenAPI-driven approach is less work. If they need to complete multi-step business tasks, workflow-defined tools are a strong design.

### SDKs

Bump.sh does not generate SDKs. Scalar generates them from the same document as your docs: TypeScript, Python, Go, Java, Kotlin, and CLI are generally available; Ruby, C#, PHP, Rust, Swift, Dart, and C++ are experimental. One SDK is included on every plan. See [SDK Generator](/products/sdk-generator).

## Pricing

Both vendors publish prices.

| | Scalar | Bump.sh |
| --- | --- | --- |
| Free | $0: up to 3 APIs, 1 editor seat, 1 SDK up to 25 endpoints, try-it included | [No free plan](https://bump.sh/pricing) |
| Entry | [Pro $150/month](/pricing) ($125/month billed yearly): up to 15 APIs, 5 editor seats, custom domains, Git sync, hosted MCP, 1 SDK up to 100 endpoints | [Basic $50/month](https://bump.sh/pricing): 10 API docs, 5 MCP tools, 3 internal and 20 guest users, custom domain and logo; no API Explorer |
| Mid | [Business $600/month](/pricing) ($500/month billed yearly): SSO, subpath hosting, up to 25 APIs, 10 editor seats, SDKs up to 250 endpoints | [Pro $120/month](https://bump.sh/pricing): 30 API docs, 50 MCP tools, 5 internal and 40 guest users, API Explorer, diff, changelog, branches, rollback, private MCP, branding removal |
| Top | Enterprise, custom | [Custom](https://bump.sh/pricing): SSO, reverse proxy and embed mode, on-premise MCP dataplane |
| Trial | Free plan, no card | [14-day trial on Pro](https://bump.sh/pricing) |

The honest read: for documentation alone, Bump.sh is cheaper at every published tier, and its Pro plan includes change management that Scalar does not offer. Scalar's price covers more product: a free tier, try-it on every plan, more editor seats, SDKs, and self-hosting under MIT. Which is better value depends on whether you need those things.

Note that Bump.sh prices by number of API docs and MCP tools, while Scalar prices by number of APIs and SDK size. Count your APIs, your editors, and your MCP tools before comparing.

## Migration path

Both platforms are driven by a CLI and a GitHub Action, so the move is mostly a swap of commands.

<scalar-steps>
  <scalar-step id="bump-account" title="Create a free account">

[Register](https://dashboard.scalar.com/register) and create an API key for CI.

  </scalar-step>

  <scalar-step id="bump-cli" title="Swap the CLI and GitHub Action">

Replace `bump deploy` with `scalar registry publish`, and `bump preview` with `scalar document serve`. The full command, option, and GitHub Actions mapping is in the [Bump.sh migration guide](/resources/migration/bump).

```bash
npx @scalar/cli auth login --token $SCALAR_API_KEY
npx @scalar/cli registry publish openapi.yaml --namespace my-team --slug my-api
```

  </scalar-step>

  <scalar-step id="bump-docs" title="Publish docs and move the domain">

Add the API to a Scalar Docs project with `scalar.config.json`, then point your custom domain at Scalar.

  </scalar-step>

  <scalar-step id="bump-diff" title="Decide what to do about diffs">

If you rely on Bump.sh's breaking-change detection, keep an equivalent diff step in CI before you switch. This is the one capability you should plan for rather than assume.

  </scalar-step>
</scalar-steps>

If AsyncAPI or workflow-based MCP tools are central for you, [talk to us](https://scalar.cal.com/) before migrating so we can tell you exactly what is supported today.

## Which should you choose?

**Choose Bump.sh if** automatic breaking-change detection and changelogs are central to how you communicate with API consumers, you document a lot of AsyncAPI, you use OpenAPI Overlays or Arazzo, or you only need hosted documentation and want the lowest published price.

**Choose Scalar if** you want a free plan and try-it on every plan, an MIT-licensed renderer and API client you can self-host or mount inside your framework, or SDKs and hosted MCP servers generated from the same OpenAPI document as your docs.

[Start free](https://dashboard.scalar.com/register) or [book a migration call](https://scalar.cal.com/).

## Frequently asked questions

<scalar-detail title="Does Bump.sh have a free plan?">
No. As of September 2026, Bump.sh's [pricing page](https://bump.sh/pricing) lists Basic at $50/month, Pro at $120/month, and a Custom plan, with a 14-day free trial on Pro. Scalar has a free plan with up to 3 APIs.
</scalar-detail>

<scalar-detail title="Does Scalar detect breaking changes like Bump.sh?">
Not automatically today. Scalar versions every document in the registry and lints each version, but it does not generate a semantic diff or consumer changelog. Bump.sh does, on its [Pro plan](https://bump.sh/pricing). You can add an open-source diff tool to CI alongside Scalar.
</scalar-detail>

<scalar-detail title="Is the Bump.sh documentation renderer open source?">
The [Bump.sh CLI](https://github.com/bump-sh/cli) is MIT licensed. We could not find a public repository for the documentation renderer itself. Scalar's API reference and API client are MIT licensed on [GitHub](https://github.com/scalar/scalar).
</scalar-detail>

<scalar-detail title="Can I move from Bump.sh to Scalar without changing my OpenAPI documents?">
Yes. Both read standard OpenAPI. If you use Bump.sh overlays, apply them before publishing to Scalar, since Scalar does not apply overlays itself yet.
</scalar-detail>

<scalar-detail title="How do Bump.sh and Scalar MCP servers differ?">
Scalar generates tools from the operations in your OpenAPI document. Bump.sh builds tools from [workflow documents](https://bump.sh/help/mcp-servers/) written in Flower or Arazzo, where each tool can run a sequence of calls. Both are hosted.
</scalar-detail>

<scalar-detail title="Does Scalar support AsyncAPI?">
Scalar renders AsyncAPI documents as an API reference, and the SDK generator accepts AsyncAPI as an experimental input. Our docs describe AsyncAPI rendering as a [work in progress](/products/api-references/asyncapi), so check your document before migrating.
</scalar-detail>

## Related

- **Learn:** [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [Generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi)
- **Docs:** [Migrate from Bump.sh](/resources/migration/bump) · [Registry CLI](/products/registry/cli) · [Scalar CLI commands](/tools/cli/commands)
- **Product:** [Scalar Docs](/products/docs) — hosted docs and API references with a free plan and try-it on every plan

---

*This comparison is based on Bump.sh's public pricing page, help centre, and CLI repository as of September 2026, and on Scalar's own source. Bump.sh's plans and features may change. We have made a genuine effort to be accurate and to state where Bump.sh is better. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
