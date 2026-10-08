# Scalar vs Stoplight

*Last updated: September 2026*

Stoplight is a design-first API platform: a visual OpenAPI editor, hosted documentation, style-guide linting, and mock servers, tied together with Git. It also gave the ecosystem three of its most widely used open-source tools, Spectral, Prism, and Elements. If you are choosing where to design and publish your APIs, Stoplight belongs on your list, and so do we.

This page is written by Scalar, so read it with that in mind, and with one more disclosure: several people on the Scalar team previously helped build Stoplight. We know the product well and we like a lot of it. Every claim we make about Stoplight links to its own pricing page, repositories, or public announcements. If we have something wrong, tell us and we will fix it.

**One thing to know up front:** SmartBear [announced its acquisition of Stoplight on 22 August 2023](https://smartbear.com/news/news-releases/smartbear-to-acquire-stoplight/). Stoplight's [pricing page](https://stoplight.io/pricing) is live and plans are still sold, and we found no end-of-life announcement. SmartBear's newer platform is [API Hub](https://swagger.io/api-hub/), and in October 2025 the APIs You Won't Hate newsletter wrote that ["work on Stoplight appears to be slowing"](https://apisyouwonthate.com/newsletter/goodbye-stoplight/). That is an informed opinion, not an announcement, but if you are planning a multi-year commitment it is worth asking SmartBear for the roadmap in writing.

If you already know you are moving, the [Stoplight migration guide](/resources/migration/stoplight) has the step-by-step instructions.

## At a glance

| | Scalar | Stoplight |
| --- | --- | --- |
| Owner | Scalar (independent) | [SmartBear, since 2023](https://smartbear.com/news/news-releases/smartbear-to-acquire-stoplight/) |
| Free plan | Yes: up to 3 APIs, 1 editor seat, 1 SDK up to 25 endpoints | [Yes](https://stoplight.io/pricing): 1 project, 1 user |
| Entry paid plan | $150/month flat, 5 editor seats | [Basic $44/month billed annually](https://stoplight.io/pricing), 3 users |
| OpenAPI editing | [Scalar editor](https://editor.scalar.com/) plus Git sync | [Visual OpenAPI designer](https://stoplight.io/pricing) plus Git |
| Docs renderer | MIT, self-hostable on any plan | Hosted platform; [Elements](https://github.com/stoplightio/elements) is Apache-2.0 |
| Linting | Spectral-compatible rules in the registry | [Shared style guides](https://stoplight.io/pricing) built on [Spectral](https://github.com/stoplightio/spectral) |
| Mock servers | Open-source mock server and CLI | [Instant mock servers](https://stoplight.io/pricing), built on [Prism](https://github.com/stoplightio/prism) |
| Standalone API client | Yes, open source | No |
| SDK generation | Yes | No |
| Hosted MCP servers | Yes, on Pro | No |
| Git providers | GitHub sync | [GitHub, GitLab, Azure DevOps, Bitbucket](https://stoplight.io/pricing) |

## Where Stoplight is stronger

**The visual designer.** Stoplight's form-based OpenAPI designer lets people build a description without writing YAML. For product managers, technical writers, and designers who own API contracts but not code, that is a genuine advantage. Scalar's editor is closer to a code editor, with validation and completion. It is fast for developers and less guided for everyone else.

**Governance at scale.** Stoplight's Pro Team plan includes [shared style guides, up to 20 teams, workspace groups, and LDAP/SAML SSO](https://stoplight.io/pricing), all designed around governing many APIs across an organisation. Scalar supports Spectral-compatible rules, but Stoplight has spent years on the workflow around them.

**It invented the tools everyone else uses.** [Spectral](https://github.com/stoplightio/spectral), [Prism](https://github.com/stoplightio/prism), and [Elements](https://github.com/stoplightio/elements) are all Apache-2.0 and still actively published: the Spectral CLI released [6.16.3](https://www.npmjs.com/package/@stoplight/spectral-cli) in August 2026, Prism [5.16.0](https://www.npmjs.com/package/@stoplight/prism-cli) in July, and Elements [9.0.25](https://www.npmjs.com/package/@stoplight/elements) in August. Scalar's rules extend Spectral's default `spectral:oas` ruleset. We owe these projects a lot.

**More Git providers.** Stoplight connects to [GitHub, GitLab, Azure DevOps, and Bitbucket](https://stoplight.io/pricing). Scalar's Git sync is GitHub; GitLab users publish from CI with the [CLI](/products/registry/gitlab-ci).

**Cheaper for very small teams.** Stoplight Basic is $44/month billed annually for three users. If you need a hosted, private designer for one or two people and nothing else, that is less than Scalar Pro.

## Stoplight vs Scalar

Both products cover the design-first loop: write the description, lint it, mock it, publish docs from it. The differences are in what is open, what comes after the docs, and how the platform is priced.

### The documentation layer

Stoplight's hosted docs are part of the platform. If you want to embed docs in your own site, [Stoplight Elements](https://github.com/stoplightio/elements) provides React and web components under Apache-2.0:

```html
<elements-api
  apiDescriptionUrl="/openapi.yaml"
  router="hash"
  layout="sidebar"
/>
```

Scalar's API reference is MIT licensed and is the same renderer used on the hosted platform, not a separate open-source edition. You can self-host it on any plan, or with no plan at all, and mount it inside your application through 35+ framework integrations such as [Express](/products/api-references/integrations/express), [FastAPI](/products/api-references/integrations/fastapi), [NestJS](/products/api-references/integrations/nestjs), [ASP.NET Core](/products/api-references/integrations/aspnetcore/integration), and [Spring Boot](/products/api-references/integrations/spring-boot).

Every Scalar reference includes a full [API client](/products/api-client) on each operation, with environments, OAuth 2.0 flows, cookies, history, and code examples in many languages. The same client runs as a desktop and web app.

### Linting and governance

Stoplight style guides and Scalar rules are both Spectral under the hood, so the rules themselves carry over. You can export a Stoplight style guide with **Export Spectral File** in Studio, as shown in the [migration guide](/resources/migration/stoplight), and load it as a [Scalar rule](/products/registry). Rules that rely on custom JavaScript functions need rework.

Locally and in CI, Scalar's CLI runs the same rules:

```bash
npx @scalar/cli document lint openapi.yaml
```

### Mocking

Stoplight mocks with Prism, hosted per project. Scalar's [mock server](/tools/mock-server/getting-started) is open source and runs wherever you want it, from the CLI, from Docker, or inside a Node.js app, with custom handlers and seed data:

```bash
npx @scalar/cli document mock openapi.yaml --watch
```

If you prefer Prism, keep using it. It reads the same OpenAPI document.

### After the docs: SDKs and MCP

This is where the products diverge most. Stoplight is a design and documentation platform; it does not generate SDKs or MCP servers.

Scalar generates [SDKs](/products/sdk-generator) from the same OpenAPI document. TypeScript, Python, Go, Java, Kotlin, and CLI are generally available; Ruby, C#, PHP, Rust, Swift, Dart, and C++ are experimental. One SDK is included on every plan. Scalar also hosts [MCP servers](/products/agent/mcp) generated from your OpenAPI document, with OAuth, so AI agents can call the operations you choose.

If your roadmap ends at "publish good docs", this section does not matter. If it continues to client libraries and agent access, having all of it driven by one description in one platform removes a lot of glue.

### Ownership and direction

Stoplight is one product in SmartBear's portfolio, alongside Swagger, SoapUI, and Pact. SmartBear's announcement said Stoplight's open-source catalogue would [join SmartBear's open-source projects](https://smartbear.com/news/news-releases/smartbear-to-acquire-stoplight/). Scalar is an independent company whose whole product is this workflow, with the renderer and client developed in the open on [GitHub](https://github.com/scalar/scalar). Neither structure is inherently better. It is worth knowing which one you are buying into.

## Feature map

Most Stoplight features have a direct counterpart in Scalar. A few do not, and they are listed honestly.

| Stoplight | Scalar equivalent | Notes |
| --- | --- | --- |
| Studio visual designer | [OpenAPI editor](https://editor.scalar.com/) | Code-first editing; less guided for non-developers |
| Git projects | GitHub sync, or CLI publishing from any CI | GitLab, Bitbucket, and Azure DevOps via CI rather than native sync |
| Hosted docs | [Scalar Docs](/products/docs) | Markdown and MDX guides plus one or more API references |
| Elements embed | MIT API reference and framework integrations | Same renderer as the hosted platform |
| Style guides | Registry rules | Spectral-compatible; custom functions need rework |
| Prism mocking | [Mock server](/tools/mock-server/getting-started) | Open source; or keep Prism |
| Workspaces and teams | Namespaces, access groups (Pro), and SSO (Business) | Stoplight's multi-team governance is more elaborate |
| Not available | API client, SDK generation, hosted MCP | Scalar only |

The last row is what Scalar adds on top of the design-first loop. The rows above it are why the move is usually straightforward: the underlying OpenAPI files, Spectral rules, and URLs carry across.

## Pricing

Both vendors publish their prices, which makes this easy to check.

| | Scalar | Stoplight |
| --- | --- | --- |
| Free | $0: up to 3 APIs, 1 editor seat, 1 SDK up to 25 endpoints | [$0](https://stoplight.io/pricing): 1 project, 1 user |
| Entry | [Pro $150/month](/pricing), or $125/month billed yearly: 5 editor seats, up to 15 APIs, custom domains, Git sync, hosted MCP, 1 SDK up to 100 endpoints | [Basic $44/month billed annually, $56 monthly](https://stoplight.io/pricing): 3 users, unlimited projects |
| Mid | [Business $600/month](/pricing), or $500/month billed yearly: SSO, subpath hosting, 10 editor seats, up to 25 APIs, SDKs up to 250 endpoints | [Startup $113/month annually, $147 monthly](https://stoplight.io/pricing): 8 users, private projects, custom domains. [Pro Team $362/month annually, $453 monthly](https://stoplight.io/pricing): 15 users, style guides, SSO |
| Extra seats | Included seats by plan; Enterprise custom | [$11–$27 per user/month](https://stoplight.io/pricing) depending on plan and billing |
| Enterprise | Custom | [Custom](https://stoplight.io/pricing) |
| Trial | Free plan, no card | [14-day trial](https://stoplight.io/pricing) on paid plans |

The comparison depends on team size and on what you need past documentation. For one to three people who only need a private designer, Stoplight Basic is cheaper. Once you need custom domains (Stoplight Startup) or SSO (Stoplight Pro Team at $362/month billed annually, versus Scalar Business at $600/month), the numbers move closer, and Scalar's plans also include SDKs and hosted MCP servers that Stoplight does not offer at any price. Run your own numbers; both pricing pages have enough detail to do it.

## Migration path

The big advantage is that both platforms are built on OpenAPI and Git, so your core descriptions move without conversion.

<scalar-steps>
  <scalar-step id="sl-account" title="Create a free account">

[Register](https://dashboard.scalar.com/register) with no card.

  </scalar-step>

  <scalar-step id="sl-git" title="Connect the same Git repository">

Stoplight Git projects are OpenAPI and Markdown in a repository. Point Scalar's GitHub sync at the same repository, or publish from CI with the [Scalar CLI](/products/registry/cli).

  </scalar-step>

  <scalar-step id="sl-rules" title="Export your style guide">

Use **Export Spectral File** in Stoplight Studio and load the ruleset as a Scalar rule. Comment out rules that depend on custom functions.

  </scalar-step>

  <scalar-step id="sl-domain" title="Move the domain and add redirects">

Point your docs CNAME at Scalar and use `siteConfig.routing.redirects` in `scalar.config.json` so old Stoplight paths keep working.

  </scalar-step>
</scalar-steps>

The full walk-through, including Markdown guides and redirects, is in the [Stoplight migration guide](/resources/migration/stoplight). For larger workspaces, [book a migration call](https://scalar.cal.com/); this is a migration we know from both sides.

## Which should you choose?

**Stay on Stoplight if** your API contracts are designed by people who prefer forms to YAML, you depend on GitLab, Azure DevOps, or Bitbucket integration inside the platform, you have a mature governance programme built around Stoplight style guides and workspaces, or you are a very small team for whom Basic covers everything.

**Choose Scalar if** you want an open-source renderer and API client you can self-host anywhere, docs mounted inside your application, SDKs and hosted MCP servers from the same description, or an independent vendor whose whole product is this workflow.

[Start free](https://dashboard.scalar.com/register) or [talk to us](https://scalar.cal.com/).

## Frequently asked questions

<scalar-detail title="Is Stoplight being discontinued?">
We found no official end-of-life announcement as of September 2026. SmartBear [acquired Stoplight in 2023](https://smartbear.com/news/news-releases/smartbear-to-acquire-stoplight/), its [pricing page](https://stoplight.io/pricing) is live, and its open-source tools are still being published to npm. SmartBear's newer platform is API Hub. Ask SmartBear for the roadmap before a renewal.
</scalar-detail>

<scalar-detail title="Can I keep using Spectral and Prism with Scalar?">
Yes. Both are Apache-2.0 and read standard OpenAPI. Scalar's rules extend Spectral's `spectral:oas` ruleset, and Prism works against any document you publish from Scalar.
</scalar-detail>

<scalar-detail title="Does Scalar have a visual OpenAPI editor like Stoplight Studio?">
Scalar has a web [OpenAPI editor](https://editor.scalar.com/) with validation and completion, and it publishes to the registry, which syncs with Git. It is aimed at people comfortable editing YAML or JSON. Stoplight's form-based designer is more guided for non-developers.
</scalar-detail>

<scalar-detail title="How much does Stoplight cost?">
As of September 2026 Stoplight lists a free plan and paid plans of [$44, $113, and $362 per month billed annually](https://stoplight.io/pricing) (Basic, Startup, and Pro Team), with extra users charged per month and a custom Enterprise tier.
</scalar-detail>

<scalar-detail title="Will my Stoplight docs URLs break if I move?">
Not if you set up redirects. Point your custom domain at Scalar and map old paths to new ones with `siteConfig.routing.redirects`, as described in the [migration guide](/resources/migration/stoplight).
</scalar-detail>

<scalar-detail title="What is the difference between Stoplight Elements and Scalar API Reference?">
Both are open-source components that render an OpenAPI document. Elements is Apache-2.0 and ships as React and web components. Scalar's reference is MIT, ships with a full API client, and has 35+ framework integrations, and it is the same renderer used on Scalar's hosted platform.
</scalar-detail>

## Related

- **Learn:** [Spectral rules](/learn/openapi/spectral-rules) · [API mocking](/learn/openapi/api-mocking)
- **Docs:** [Migrate from Stoplight](/resources/migration/stoplight) · [Stoplight alternatives](/alternatives/stoplight) · [Registry CLI](/products/registry/cli)
- **Product:** [Scalar Docs](/products/docs) — hosted docs, guides, and API references from one Git-synced config

---

*This comparison is based on Stoplight's public pricing page, open-source repositories, npm releases, and SmartBear's acquisition announcement as of September 2026, and on Scalar's own source. Stoplight is owned by SmartBear and its product direction may change. We have made a genuine effort to be accurate and to state where Stoplight is better. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
