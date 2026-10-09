# Scalar vs. Zuplo

*Last updated: September 2026*

Zuplo is an API gateway where your API traffic flows through their infrastructure. They handle proxying, rate limiting, authentication, and monetization, and every plan also includes a [developer portal](https://zuplo.com/pricing) for documentation, built on their open-source [Zudoku](https://github.com/zuplo/zudoku) framework.

Scalar takes a different approach: it lives alongside your API without touching your traffic, focusing on documentation and developer tools. When you move your developer portal from Zuplo to Scalar, you get a suite of tools around your API:

- **API Client:** A modern, open-source API testing client for Windows, macOS and Linux
- **SDKs:** Generate type-safe client libraries. TypeScript, Python, Go, Java, Kotlin, Ruby, and CLI are generally available, with more languages in experimental status
- **MCP servers:** Hosted MCP servers generated from the same OpenAPI document
- **Spectral Linting:** Validate and lint your OpenAPI documents with Spectral rules
- **Mock Server:** Spin up a fully-functional mock server from your OpenAPI document for frontend development and testing
- **Open-Source:** The API Reference and API Client are MIT licensed, and self-hosting is easy

Scalar has [15.7k GitHub stars](https://github.com/scalar/scalar), over a million weekly npm downloads of [`@scalar/api-reference`](https://www.npmjs.com/package/@scalar/api-reference), and official integrations for frameworks including Express, Fastify, Hono, NestJS, Next.js, Nuxt, ASP.NET Core, FastAPI, and more.

Zuplo and Scalar serve different purposes and can be used together. Keep Zuplo as your API gateway (rate limiting, authentication, monetization) while using Scalar for documentation and developer tooling. Your API traffic can continue to flow through Zuplo.

## Pricing

The two products are priced on different things, so compare them by what you actually need.

| Plan       | Scalar                                                   | Zuplo                                                                  |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| Free       | $0 (up to 3 APIs, 1 editor seat)                         | [$0](https://zuplo.com/pricing) (100K requests/month)                  |
| Paid       | Pro: $150/month, or $125/month billed yearly (5 seats)   | [Builder](https://zuplo.com/pricing): $25/month, 100K requests included, then $100 per 100K |
| Higher     | Business: $600/month, or $500/month billed yearly (10 seats) | —                                                                  |
| Enterprise | Custom pricing                                           | [Enterprise](https://zuplo.com/pricing): from $1,000/month, billed annually |

- Scalar pricing is based on seats, APIs, and SDKs (a documentation platform), while Zuplo pricing is based on requests (gateway usage).
- Zuplo includes its developer portal on every plan, including Free, according to its [pricing page](https://zuplo.com/pricing). If a portal on top of the gateway you already pay for is all you need, staying on Zuplo is the cheaper option.
- Scalar is worth paying for when you want more than a portal: SDK generation, hosted MCP servers generated from your OpenAPI document, a desktop API client, and a docs platform that does not depend on your API traffic.

For detailed pricing information, visit [Scalar Pricing](/pricing) and [Zuplo Pricing](https://zuplo.com/pricing).

## Feature Comparison

The Zuplo column reflects Zuplo's public pricing and docs as of September 2026. A dash means we did not verify the feature either way, not that Zuplo lacks it.

| Feature                      | Scalar                    | Zuplo Developer Portal |
| ---------------------------- | :-----------------------: | :--------------------: |
| **Specification Support**    |                           |                        |
| OpenAPI 3.0                  | ✓                         | ✓                      |
| OpenAPI 3.1                  | ✓                         | ✓                      |
| OpenAPI 3.2                  | ✓                         | —                      |
| **Documentation**            |                           |                        |
| API Reference                | ✓                         | ✓                      |
| API Client / Playground      | ✓                         | ✓ ([playground](https://zuplo.com/docs/dev-portal/zudoku/components/playground)) |
| Unified Search               | ✓                         | —                      |
| Markdown and MDX Guides      | ✓                         | ✓ ([MDX](https://zuplo.com/docs/dev-portal/overview)) |
| **Customization**            |                           |                        |
| Custom Domain                | Pro and up                | ✓ ([pricing](https://zuplo.com/pricing)) |
| Custom Styling (CSS)         | ✓                         | ✓ (theming)            |
| Built-in Themes              | 11 themes                 | —                      |
| **Developer Tools**          |                           |                        |
| Desktop API Client           | ✓                         | —                      |
| SDK Generation               | ✓ (7 GA, 6 experimental)  | —                      |
| Hosted MCP servers           | ✓                         | —                      |
| Mock Server                  | ✓                         | ✓ ([mock policy](https://zuplo.com/docs/policies/mock-api-inbound)) |
| Spectral Linting             | ✓                         | —                      |
| Code Snippet Generation      | 25+ languages             | —                      |
| **Integrations**             |                           |                        |
| GitHub Sync                  | ✓                         | —                      |
| CLI                          | ✓                         | —                      |
| Framework Integrations       | many (see below)          | —                      |
| **Open Source**              |                           |                        |
| Self-hostable                | ✓ (MIT)                   | ✓ ([Zudoku](https://github.com/zuplo/zudoku), MIT) |
| **Community**                |                           |                        |
| GitHub Stars                 | [15.7k](https://github.com/scalar/scalar) | [596](https://github.com/zuplo/zudoku) |
| npm Downloads (week to Sept 25, 2026) | [1.2M](https://www.npmjs.com/package/@scalar/api-reference) | [52K](https://www.npmjs.com/package/zudoku) |
| PRs merged (2025)            | [2,075](https://github.com/scalar/scalar/pulls?q=is%3Apr+is%3Amerged+merged%3A2025-01-01..2025-12-31) | [937](https://github.com/zuplo/zudoku/pulls?q=is%3Apr+is%3Amerged+merged%3A2025-01-01..2025-12-31) |
| Discord                      | [discord.gg/scalar](https://discord.gg/scalar) |                        |

### SDKs

Generate type-safe client libraries from your OpenAPI documents. The SDK generator also accepts AsyncAPI and gRPC as inputs; AsyncAPI generation is [experimental](/products/sdk-generator/asyncapi).

| Language   | Status              |
| ---------- | ------------------- |
| TypeScript | Generally available |
| Python     | Generally available |
| Go         | Generally available |
| CLI        | Generally available |
| Java       | Generally available |
| Kotlin     | Generally available |
| Ruby       | Generally available |
| C#         | Experimental        |
| PHP        | Experimental        |
| Rust       | Experimental        |
| Swift      | Experimental        |
| Dart       | Experimental        |
| C++        | Experimental        |

Experimental targets generate working code, but talk to us before you depend on one in production. SDKs sync with your API documentation, so whenever you update your OpenAPI document, your SDKs stay up to date. Learn more in our [SDK documentation](/products/sdk-generator).

### Framework Integrations

Scalar provides official integrations for many popular web frameworks, making it easy to add API documentation to any stack:

| Framework     | Available |
| ------------- | --------- |
| Express       | ✓         |
| Fastify       | ✓         |
| Hono          | ✓         |
| NestJS        | ✓         |
| Next.js       | ✓         |
| Nuxt          | ✓         |
| SvelteKit     | ✓         |
| Docusaurus    | ✓         |
| Astro         | ✓         |
| ASP.NET Core  | ✓         |
| Aspire   | ✓         |
| FastAPI       | ✓         |
| Django Ninja  | ✓         |
| Spring (Java) | ✓         |
| Docker        | ✓         |

All integrations are actively maintained and follow the same configuration patterns, making it easy to switch between frameworks or use Scalar across multiple services.

### Spectral linting

Validate and lint your OpenAPI documents using Spectral rules. Spectral rules can be managed in the Registry alongside your OpenAPI documents and JSON Schemas.

### API prototyping

Spin up a fully-functional mock server from your OpenAPI document. The mock server automatically generates realistic API responses based on your schemas, which is handy for frontend development, API prototyping, and integration testing:

```bash
npx @scalar/cli document mock openapi.json --watch
```

Alternatively, run it in a Docker container or integrate it directly into your Node.js application. Learn more in the [Mock Server documentation](/tools/mock-server/getting-started).

## Migrate from Zuplo to Scalar

Migrating your developer portal from Zuplo to Scalar is straightforward since both platforms are OpenAPI-native. Your OpenAPI documents will transfer cleanly, and you can continue using Zuplo's gateway features while using Scalar for documentation and developer tooling.

### Step 1: Export OpenAPI from Zuplo

Zuplo stores your API configuration in OpenAPI format. To export your OpenAPI document:

1. Navigate to your Zuplo project dashboard
2. Go to your project's **Routes** or **OpenAPI** section
3. Locate the [`routes.oas.json`](https://zuplo.com/docs/articles/openapi) file, Zuplo's default OpenAPI routing file
4. Download or copy the OpenAPI JSON file

> [!NOTE]
> Zuplo uses the vendor extensions [`x-zuplo-route` and `x-zuplo-path`](https://zuplo.com/docs/articles/openapi) for gateway-specific configuration. Scalar ignores these extensions, so they do not break anything; they are simply not used for documentation. Routes you hid from Zuplo's portal with `x-internal: true` stay hidden in Scalar too, because Scalar treats `x-internal` as an alias of [`x-scalar-ignore`](/products/api-references/openapi).

Zuplo lets you [split routes across several `.oas.json` files](https://zuplo.com/docs/articles/openapi). If you do, export each one separately and either add each as its own reference in Scalar or bundle them into a single document.

### Step 2: Create a Scalar Account

Scalar has a free plan, and you can get quite a lot done with it. No credit card needed, just [register over here](https://dashboard.scalar.com/register).

### Step 3: Upload OpenAPI Document

Once you have created your Scalar account:

1. Open **Docs** in the dashboard and click **New Project**
2. Choose **Create new docs**, or **Import Docs** if you want to store your OpenAPI in a GitHub or Bitbucket repository
3. In a new project, click **+** in the editor's sidebar, choose **Add API Reference**, then **Import a new API**, and upload the exported OpenAPI file from Zuplo
4. Scalar will automatically parse and display your API reference

If you are using Git Sync, you can commit your OpenAPI file to your repository and Scalar will automatically sync it.

### Step 4: Set Up Scalar Config

If you are using Git Sync, create a `scalar.config.json` file in your repository root to configure your documentation:

```json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "subdomain": "name-of-your-api"
  },
  "navigation": {
    "routes": {
      "/": {
        "type": "group",
        "title": "Your API",
        "children": {
          "/api": {
            "type": "openapi",
            "filepath": "openapi.yaml",
            "title": "API Reference"
          }
        }
      }
    }
  }
}
```

Automatic deployment publishes your site whenever changes land on your tracked branch, and it is on by default. Change it, or the branch Scalar publishes from, in the editor under **Settings → Git Sync**.

### Step 5: Migrate Custom Styling

If you have customized your Zuplo developer portal with CSS, you can pass it as `customCss` in the configuration or migrate those styles to Scalar using CSS variables. Scalar provides extensive theming options:

```css
:root {
  --scalar-font: 'Your Font', sans-serif;
  --scalar-color-accent: #your-color;
  --scalar-background-1: #ffffff;
  --scalar-color-1: #121212;
}

.dark-mode {
  --scalar-background-1: #1a1a1a;
  --scalar-color-1: rgba(255, 255, 255, 0.9);
}
```

Scalar also includes 11 built-in themes that you can use as a starting point:
- `default`, `alternate`, `moon`, `purple`, `solarized`, `bluePlanet`, `saturn`, `kepler`, `mars`, `deepSpace`, `laserwave`

### Step 6: (Optional) Migrate Markdown Guides

If you have Markdown guides in your Zuplo developer portal:

1. Export any MDX or Markdown content from Zuplo
2. Scalar Docs supports Markdown and MDX, so most pages move as they are. Components specific to Zudoku, or custom React pages, need replacing with Scalar components or plain Markdown
3. Add your guides to Scalar with **+** → **Add Page** in the editor's sidebar, or add the `.md` files to your project
4. Or, if using GitHub Sync, add them to your repository and reference them in `scalar.config.json`:

```json
{
  "navigation": {
    "routes": {
      "/": {
        "type": "group",
        "title": "Your API",
        "children": {
          "/guides": {
            "type": "group",
            "title": "Guides",
            "children": {
              "getting-started": {
                "type": "page",
                "filepath": "docs/getting-started.md",
                "title": "Getting Started"
              }
            }
          },
          "/api": {
            "type": "openapi",
            "filepath": "openapi.yaml",
            "title": "API Reference"
          }
        }
      }
    }
  }
}
```

### Step 7: (Optional) Point Custom Domain to Scalar

If you are using a custom domain with Zuplo (e.g., `developers.example.com`), you can point it to Scalar:

1. Add the custom domain to your Scalar config (custom domains need Scalar Pro or above):

```json
{
  "siteConfig": {
    "subdomain": "name-of-your-api",
    "customDomain": "developers.example.com"
  }
}
```

2. Update your DNS CNAME record to point to `dns.scalar.com`
3. Wait a few minutes for DNS propagation

Learn more about [custom domains](/products/docs/configuration/domains).

### Step 8: (Optional) Set Up Redirects

If you had traffic going to your Zuplo developer portal, you might want to set up redirects to ensure existing links keep working. Scalar supports redirects via the `siteConfig.routing.redirects` configuration:

```json
{
  "siteConfig": {
    "routing": {
      "redirects": [{
        "from": "/old-path/:wildcard",
        "to": "/new-path/:wildcard"
      }]
    }
  }
}
```

Learn more about [redirects](/products/docs/configuration/redirects).

## Using Zuplo Gateway with Scalar Documentation

Since Zuplo and Scalar have different architectures, they work together:

- Zuplo handles your API traffic
- Scalar lives alongside your API

If your OpenAPI document is hosted by Zuplo's gateway, you can link to it directly from Scalar:

```json
{
  "navigation": {
    "routes": {
      "/api": {
        "type": "openapi",
        "url": "https://your-zuplo-gateway.com/openapi.json",
        "title": "API Reference"
      }
    }
  }
}
```

This way, your documentation stays in sync with your gateway configuration automatically.

## Summary

The biggest advantage in this migration is that both tools are fundamentally OpenAPI-based, which means your core specifications will transfer cleanly.

Scalar's team is happy to offer migration assistance and consultation to help streamline this process, particularly for teams with complex Zuplo implementations.

## Frequently asked questions

<scalar-detail title="Do I have to stop using Zuplo to use Scalar?">
No. Zuplo is a gateway and Scalar does not touch your traffic, so the common setup is Zuplo for rate limiting, authentication, and monetization, and Scalar for docs, SDKs, and the API client. Point Scalar at the OpenAPI document your gateway already serves.
</scalar-detail>

<scalar-detail title="Is Scalar cheaper than Zuplo's developer portal?">
Not if the portal is all you need. Zuplo includes its developer portal on every plan, starting with a free plan and a $25/month Builder plan ([pricing](https://zuplo.com/pricing)), while Scalar Pro is $150/month. Scalar makes sense when you also want SDK generation, hosted MCP servers, or a docs platform that is independent of your gateway.
</scalar-detail>

<scalar-detail title="Will Zuplo's x-zuplo extensions break my Scalar docs?">
No. Scalar ignores `x-zuplo-route` and `x-zuplo-path`. Routes marked `x-internal: true` are hidden in Scalar as well.
</scalar-detail>

<scalar-detail title="Can I move my MDX pages from Zuplo?">
Mostly. Scalar Docs supports Markdown and MDX. Components that come from Zudoku, or custom React pages, need replacing with Scalar components or plain Markdown.
</scalar-detail>

<scalar-detail title="Which SDK languages does Scalar support?">
TypeScript, Python, Go, Java, Kotlin, Ruby, and CLI are generally available. C#, PHP, Rust, Swift, Dart, and C++ are experimental.
</scalar-detail>

## Related

- **Learn:** [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [API documentation best practices](/learn/openapi/api-documentation-best-practices)
- **Docs:** [Custom domains](/products/docs/configuration/domains) · [Redirects](/products/docs/configuration/redirects)
- **Product:** [Scalar Docs](/products/docs) — docs and API references that live alongside your gateway, not in front of it

---

*Zuplo details on this page come from its [pricing page](https://zuplo.com/pricing), [documentation](https://zuplo.com/docs/articles/openapi), and the [Zudoku repository](https://github.com/zuplo/zudoku) as checked on September 26, 2026. Download and pull-request figures come from the npm registry and GitHub search on the same date. Zuplo's plans and features may change. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
