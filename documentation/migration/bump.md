# How to migrate from Bump.sh to Scalar

*Last updated: September 2026*

Bump.sh is a hosted API documentation platform that publishes both OpenAPI and AsyncAPI documents, with change detection and changelogs built in. Scalar covers most of the same documentation ground, and when you bring your API into Scalar you also get a set of tools that sit around the docs:

- **API Client:** A modern, open-source API testing client for Windows, macOS and Linux
- **SDKs:** Generate type-safe client libraries. TypeScript, Python, Go, Java, Kotlin, and CLI targets are generally available, with more languages in experimental status
- **MCP servers:** Hosted MCP servers generated from the same OpenAPI document as your docs
- **Spectral Linting:** Validate and lint your OpenAPI documents with Spectral rules
- **Mock Server:** Spin up a fully-functional mock server from your OpenAPI document for frontend development and testing

Be honest with yourself about what you use Bump.sh for, though. If automatic change detection, changelogs, or OpenAPI Overlays are central to how you publish, Bump.sh is stronger there today. Scalar does not generate a semantic diff or a consumer changelog, and it does not apply overlays for you. Scalar does render AsyncAPI documents, but that support is still [a work in progress](/products/api-references/asyncapi), so check your document before you switch.

## Pricing

Scalar has a free plan. As of September 2026, Bump.sh does not; its [pricing page](https://bump.sh/pricing) offers a 14-day trial on Pro instead.

| Plan       | Scalar                                                   | Bump.sh                                              |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------- |
| Free       | $0 (up to 3 APIs, 1 editor seat)                         | ✗                                                    |
| Entry paid | Pro: $150/month, or $125/month billed yearly (5 seats)   | [Basic](https://bump.sh/pricing): $50/month (10 API docs, 3 internal users) |
| Mid tier   | Business: $600/month, or $500/month billed yearly (10 seats) | [Pro](https://bump.sh/pricing): $120/month (30 API docs, 5 internal users) |
| Enterprise | Custom pricing                                           | [Custom](https://bump.sh/pricing): contact sales     |

- Scalar offers a free plan, Bump.sh does not.
- Bump.sh is cheaper at the entry level. Basic at $50/month is a third of Scalar Pro, and if all you need is published OpenAPI docs on a custom domain, that matters.
- Scalar Pro includes 5 editor seats, up to 15 APIs, and one SDK. Business adds SSO and subpath hosting with 10 seats and up to 25 APIs.
- On Bump.sh, diff is on every plan, while the API Explorer, automatic changelog, and branches start at Pro. SSO, custom CSS and JS, embed mode, custom webhooks, and removing Bump.sh branding are listed on Custom only, according to its [pricing page](https://bump.sh/pricing).
- Bump.sh [offers free Pro access](https://bump.sh/pricing) to open source projects on application.

For detailed pricing information, visit [Scalar Pricing](/pricing) and [Bump.sh Pricing](https://bump.sh/pricing).

## Feature Comparison

The Bump.sh column reflects its [pricing page](https://bump.sh/pricing) as of September 2026. Where a feature needs a specific Bump.sh plan, the plan is noted.

| Feature                                  |           Scalar            |        Bump.sh         |
| ---------------------------------------- | :-------------------------: | :--------------------: |
| **Specification Support**                |                             |                        |
| OpenAPI                                  |              ✓              |           ✓            |
| AsyncAPI                                 |   ✓ (work in progress)      |           ✓            |
| OpenAPI Overlays                         |              ✗              |           ✓            |
| **Documentation Publication**            |                             |                        |
| API Reference                            |              ✓              |           ✓            |
| API Registry                             |              ✓              |           ✓            |
| Unified Search                           |              ✓              |           ✓            |
| API Explorer (Try-it-out)                |       ✓ (every plan)        |       Pro and up       |
| Automatic Changelog | ✗ | Pro and up |
| Branches Management | ✓ | Pro and up |
| Automatic API Key Filling (OAuth) | ✓ | Custom only |
| **Access Management**                    |                             |                        |
| Role Based Access Management | ✓ | ✓ |
| Email Invitations                        |              ✓              |           ✓            |
| Single Sign-On (SSO)                     |      Business and up        |      Custom only       |
| **Release Management**                   |                             |                        |
| Diff (Breaking Changes Detection) | ✗ | ✓ |
| Previews                                 |              ✓              |           ✓            |
| Unrelease a Version (Rollback) | ✓ | Pro and up |
| Release Notes | ✗ | Pro and up |
| Manual Release Management | ✓ | Custom only |
| **Branding Customization**               |                             |                        |
| Custom Domain                            |        Pro and up           |           ✓            |
| Custom Logo, Color, Favicon & Meta Image |              ✓              |           ✓            |
| Custom CSS & JS | ✓ | Custom only |
| Embed docs in your own site              | ✓ (open-source component)   |      Custom only       |
| **Integrations**                         |                             |                        |
| CLI                                      |              ✓              |           ✓            |
| API                                      |              ✓              |           ✓            |
| Deploy Docs with GitHub Action           |              ✓              |           ✓            |
| Comments on PRs with GitHub Action | ✓ | Pro and up |
| Slack Notifications                      |              ✗              |       Pro and up       |
| Custom Webhooks on API Changes           |              ✗              |      Custom only       |
| **Beyond docs**                          |                             |                        |
| SDK generation                           |              ✓              |           ✗            |
| Hosted MCP servers                       |              ✓              | ✓ ([workflow-based](https://bump.sh/help/mcp-servers/)) |
| **Procurement & Compliance**             |                             |                        |
| Wire Transfer | ✓ | Custom only |
| Custom Security Review | ✓ | Custom only |
| Custom Contract | ✓ | Custom only |

### SDKs

Generate type-safe client libraries from your OpenAPI documents. The SDK generator also accepts AsyncAPI and gRPC as inputs; AsyncAPI generation is [experimental](/products/sdk-generator/asyncapi).

| Language   | Status                  |
| ---------- | ----------------------- |
| TypeScript | Generally available     |
| Python     | Generally available     |
| Go         | Generally available     |
| CLI        | Generally available     |
| Java       | Generally available     |
| Kotlin     | Generally available     |
| Ruby       | Experimental            |
| C#         | Experimental            |
| PHP        | Experimental            |
| Rust       | Experimental            |
| Swift      | Experimental            |
| Dart       | Experimental            |
| C++        | Experimental            |

Experimental targets generate working code, but talk to us before you depend on one in production. SDKs sync with your API documentation, so whenever you update your OpenAPI document, your SDKs stay up to date. Learn more in our [SDK documentation](/products/sdk-generator).

### Spectral linting

Validate and lint your OpenAPI documents using Spectral rules. Spectral rules can be managed in the Registry alongside your OpenAPI documents and JSON Schemas.

### API prototyping

Spin up a fully-functional mock server from your OpenAPI document. The mock server automatically generates realistic API responses based on your schemas, which is handy for frontend development, API prototyping, and integration testing:

```bash
npx @scalar/cli document mock openapi.json --watch
```

Alternatively, run it in a Docker container or integrate it directly into your Node.js application. Learn more in the [Mock Server documentation](/tools/mock-server/getting-started).

## Migrate from Bump.sh to Scalar

While the user interfaces between Bump.sh and Scalar differ, most of what you publish on Bump.sh can be published on Scalar. Migrating your setup will require some manual steps.

However, transitioning via the CLI is typically more straightforward:

### Bump CLI → Scalar CLI

#### Package

| Bump.sh                                          | Scalar        |
| ------------------------------------------------ | ------------- |
| [`bump-cli`](https://github.com/bump-sh/cli)     | `@scalar/cli` |

#### Commands

| Bump.sh                      | Scalar                                 |
| ---------------------------- | -------------------------------------- |
| `bump deploy [file]`         | `scalar registry publish [file]`       |
| `bump preview [file]`        | `scalar document serve [file]`         |
| `bump preview --live [file]` | `scalar document serve --watch [file]` |
| `bump diff`                  | No equivalent today                    |
| `bump overlay`               | No equivalent today                    |

If you rely on overlays, you do not have to give them up. The Bump.sh CLI is [MIT licensed](https://github.com/bump-sh/cli), so you can keep running `bump overlay` in CI to produce the final document, then publish that output to Scalar. The same goes for breaking change checks: keep a diff step in CI alongside Scalar.

#### Options

| Bump.sh             | Scalar                                        |
| ------------------- | --------------------------------------------- |
| `--doc <slug>`      | `--slug <slug>`                               |
| `--hub <slug>`      | `--namespace <namespace>`                     |
| `--token <token>`   | Use `scalar auth login --token <token>` first |
| `--branch <branch>` | `--version <version>`                         |

#### Environment Variables

| Bump.sh      | Scalar                                     |
| ------------ | ------------------------------------------ |
| `BUMP_TOKEN` | `scalar auth login --token SCALAR_API_KEY` |

#### GitHub Actions

Replace:

```yaml
- uses: bump-sh/github-action@v1
  with:
    doc: my-doc
    token: ${{ secrets.BUMP_TOKEN }}
    file: api.yaml
```

With:

```yaml
- run: npx @scalar/cli auth login --token ${{ secrets.SCALAR_API_KEY }}
- run: npx @scalar/cli registry publish api.yaml --namespace my-team --slug my-doc
```

#### Authentication

Replace token flags with a one-time login:

```bash
# Before (on every command)
bump deploy api.yaml --token $TOKEN

# After (login once, then publish)
scalar auth login --token $TOKEN
scalar registry publish api.yaml --namespace my-team --slug my-doc
```

#### Additional Scalar Commands

These commands have no Bump equivalent but may be useful. The full list is in the [CLI reference](/tools/cli/commands).

| Command                          | Description                   |
| -------------------------------- | ----------------------------- |
| `scalar document lint [file]`    | Lint with Spectral rules      |
| `scalar document mock [file]`    | Start a mock server           |
| `scalar document bundle [file]`  | Resolve all `$ref` references |
| `scalar document format [file]`  | Format OpenAPI document       |
| `scalar document upgrade [file]` | Upgrade to OpenAPI 3.1        |

## Frequently asked questions

<scalar-detail title="Is Scalar cheaper than Bump.sh?">
Not at the entry level. As of September 2026, Bump.sh Basic is $50/month and Pro is $120/month ([pricing](https://bump.sh/pricing)), while Scalar Pro is $150/month. Scalar has a free plan, which Bump.sh does not, and Scalar Pro includes try-it requests, which Bump.sh reserves for Pro and up, plus SDK generation, which Bump.sh does not offer.
</scalar-detail>

<scalar-detail title="Can I keep my OpenAPI documents unchanged when moving from Bump.sh?">
Yes. Both platforms read standard OpenAPI. If you use Bump.sh overlays, apply them before publishing to Scalar, since Scalar does not apply overlays itself.
</scalar-detail>

<scalar-detail title="Does Scalar detect breaking changes like Bump.sh?">
Not automatically today. Scalar versions every document in the registry and can lint each version, but it does not produce a semantic diff or a consumer changelog. Bump.sh includes diff on every plan and an automatic changelog from Pro ([pricing](https://bump.sh/pricing)). If that is the main reason you use Bump.sh, it may be the better fit for you.
</scalar-detail>

<scalar-detail title="Does Scalar support AsyncAPI?">
Scalar renders AsyncAPI documents as an API reference, with support still marked [work in progress](/products/api-references/asyncapi). The SDK generator also accepts AsyncAPI as an [experimental input](/products/sdk-generator/asyncapi).
</scalar-detail>

<scalar-detail title="Which SDK languages are production-ready?">
TypeScript, Python, Go, Java, Kotlin, and CLI are generally available. Ruby, C#, PHP, Rust, Swift, Dart, and C++ are experimental.
</scalar-detail>

## Related

- **Learn:** [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi)
- **Docs:** [Scalar vs Bump.sh comparison](/resources/compare/bump) · [Scalar CLI commands](/tools/cli/commands)
- **Product:** [Scalar Docs](/products/docs) — hosted docs and API references with a free plan and try-it on every plan

---

*Bump.sh details on this page come from its [pricing page](https://bump.sh/pricing), [help centre](https://bump.sh/help/mcp-servers/), and [CLI repository](https://github.com/bump-sh/cli) as checked on September 26, 2026. Bump.sh's plans and features may change. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
