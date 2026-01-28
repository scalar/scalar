# Scalar vs. Zuplo

Zuplo is an API gateway where your API traffic flows through their infrastructure. They handle proxying, rate limiting, authentication, and monetization and also provide a developer portal for documentation.

Scalar takes a different approach: it lives alongside your API without touching your traffic, focusing on documentation and developer tools. When you migrate your developer portal from Zuplo to Scalar, you unlock a suite of tools to enhance your API experience:

- **Scalar API Client:** A modern, open-source API testing client for Windows, macOS and Linux
- **Scalar SDKs:** Generate type-safe client libraries in TypeScript, Python, Golang, and more
- **Spectral Linting:** Validate and lint your OpenAPI documents with Spectral rules
- **Scalar Mock Server:** Spin up a fully-functional mock server from your OpenAPI document for frontend development and testing
- **Open-Source:** Most of our packages are fully open-source, self-hosting is easy

Scalar is trusted by thousands of developers worldwide, with over 13,000 GitHub stars, millions of npm downloads, and official integrations for all the frameworks including Express, Fastify, Hono, NestJS, Next.js, Nuxt, ASP.NET Core, FastAPI, and more.

Zuplo and Scalar serve different purposes and can be used together. Keep Zuplo as your API gateway (rate limiting, authentication, monetization) while using Scalar for superior documentation and developer tooling - your API traffic can continue to flow through Zuplo.

## Pricing

Scalar offers a more accessible entry point with a free tier and simpler pricing compared to Zuplo.

| Plan       |     Scalar     |      Zuplo       |
| ---------- | :------------: | :--------------: |
| Free       |       ✓        | limited requests |
| Paid       | $24/user/month |   usage-based    |
| Enterprise | custom pricing |  custom pricing  |

- Scalar pricing is user-based (documentation platform), while Zuplo pricing is request-based (gateway usage)
- Scalar has a generous free tier for documentation that doesn't depend on API traffic
- For teams focused on documentation, Scalar provides predictable and often lower costs

For detailed pricing information, visit [Scalar Pricing](../guides/pricing.md) and [Zuplo Pricing](https://zuplo.com/pricing).

## Feature Comparison

| Feature                      |                                                Scalar                                                 |                                       Zuplo Developer Portal                                       |
| ---------------------------- | :---------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------: |
| **Specification Support**    |                                                                                                       |                                                                                                    |
| OpenAPI 3.0                  |                                                   ✓                                                   |                                                 ✓                                                  |
| OpenAPI 3.1                  |                                                   ✓                                                   |                                                 ✓                                                  |
| OpenAPI 3.2                  |                                              in progress                                              |                                                                                                    |
| **Documentation**            |                                                                                                       |                                                                                                    |
| API Reference                |                                                   ✓                                                   |                                                 ✓                                                  |
| API Client                   |                                                   ✓                                                   |                                                 ✓                                                  |
| Unified Search               |                                                   ✓                                                   |                                                 ✓                                                  |
| Markdown Guides              |                                                   ✓                                                   |                                                 ✓                                                  |
| **Customization**            |                                                                                                       |                                                                                                    |
| Custom Domain                |                                                   ✓                                                   |                                                 ✓                                                  |
| Custom Styling (CSS)         |                                                   ✓                                                   |                                                 ✓                                                  |
| Built-in Themes              |                                               11 themes                                               |                                              limited                                               |
| Remove "Powered by" Branding |                                                   ✓                                                   |                                          enterprise-only                                           |
| Custom CSS & JS              |                                                   ✓                                                   |                                                 ✓                                                  |
| **Developer Tools**          |                                                                                                       |                                                                                                    |
| Desktop API Client           |                                                   ✓                                                   |                                                                                                    |
| SDK Generation               |                                           Yes (8 languages)                                           |                                                                                                    |
| Mock Server                  |                                                   ✓                                                   |                                                 ✓                                                  |
| Spectral Linting             |                                                   ✓                                                   |                                                                                                    |
| Code Snippet Generation      |                                             25+ languages                                             |                                              limited                                               |
| **Integrations**             |                                                                                                       |                                                                                                    |
| GitHub Sync                  |                                                   ✓                                                   |                                                 ✓                                                  |
| CLI                          |                                                   ✓                                                   |                                                 ✓                                                  |
| API                          |                                                   ✓                                                   |                                                 ✓                                                  |
| Framework Integrations       |                                            all frameworks                                             |                                              limited                                               |
| **Open Source**              |                                                                                                       |                                                                                                    |
| Self-hostable                |                                                   ✓                                                   |                                                 ✓                                                  |
| **Community**                |                                                                                                       |                                                                                                    |
| GitHub Stars                 |                               [13K+](https://github.com/scalar/scalar)                                |                              [400+](https://github.com/zuplo/zudoku)                               |
| npm Downloads                |                   [100K/week](https://www.npmjs.com/package/@scalar/api-reference)                    |                          [8K/week](https://www.npmjs.com/package/zudoku)                           |
| PRs merged (2025)            | [2,075](https://github.com/scalar/scalar/pulls?q=is%3Apr+is%3Amerged+merged%3A2025-01-01..2025-12-31) | [973](https://github.com/zuplo/zudoku/pulls?q=is%3Apr+is%3Amerged+merged%3A2025-01-01..2025-12-31) |
| Discord                      |                             [discord.gg/scalar](http://discord.gg/scalar)                             |

### Scalar SDKs

Generate type-safe client libraries from your OpenAPI documents. Scalar supports SDK generation in multiple languages:

| Language   | Status    |
| ---------- | --------- |
| TypeScript | Available |
| Python     | Available |
| Go         | Available |
| Java       | Available |
| PHP        | Available |
| Ruby       | Available |
| Swift      | Available |
| C#         | Available |

SDKs sync with your API documentation, so whenever you update your OpenAPI document, your SDKs stay up to date. Learn more in our [SDK documentation](../guides/sdks/getting-started.md).

### Framework Integrations

Scalar provides official integrations for all major web frameworks, making it easy to add API documentation to any stack:

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
| .NET Aspire   | ✓         |
| FastAPI       | ✓         |
| Django Ninja  | ✓         |
| Spring (Java) | ✓         |
| Docker        | ✓         |

All integrations are actively maintained and follow the same configuration patterns, making it easy to switch between frameworks or use Scalar across multiple services.

### Spectral linting

Validate and lint your OpenAPI documents using Spectral rules. Spectral rules can be managed in the Scalar Registry alongside your OpenAPI documents and JSON Schemas.

### API prototyping

Spin up a fully-functional mock server from your OpenAPI document. The mock server automatically generates realistic API responses based on your schemas—perfect for frontend development, API prototyping, and integration testing:

```bash
npx @scalar/cli document mock openapi.json --watch
```

Alternatively, run it in a Docker container or integrate it directly into your Node.js application. Learn more in the [Scalar Mock Server documentation](../guides/mock-server/getting-started.md).

## Migrate from Zuplo to Scalar

Migrating your developer portal from Zuplo to Scalar is straightforward since both platforms are OpenAPI-native. Your OpenAPI documents will transfer cleanly, and you can continue using Zuplo's gateway features while leveraging Scalar for superior documentation and developer tooling.

### Step 1: Export OpenAPI from Zuplo

Zuplo stores your API configuration in OpenAPI format. To export your OpenAPI document:

1. Navigate to your Zuplo project dashboard
2. Go to your project's **Routes** or **OpenAPI** section
3. Locate the `routes.oas.json` file (or similar OpenAPI document)
4. Download or copy the OpenAPI JSON/YAML file

> [!NOTE]
> Zuplo uses vendor extensions like `x-zuplo-route`, `x-zuplo-path`, and `x-zuplo-route` for gateway-specific configuration. Scalar will ignore these extensions but won't break—they're simply not used for documentation purposes.

If you have multiple OpenAPI files in Zuplo (split across different files), you'll need to export each one separately or merge them into a single document.

### Step 2: Create a Scalar Account

Scalar has a free tier, and you can get quite a lot done with it. No credit card needed or gimmick trials that are hard to cancel, just [register over here](https://dashboard.scalar.com/register).

### Step 3: Upload OpenAPI Document

Once you've created your Scalar account:

1. Click **Create Documentation** in the dashboard
2. Choose **Upload File** or **GitHub Sync** (if you want to store your OpenAPI in Git)
3. Upload the exported OpenAPI file from Zuplo
4. Scalar will automatically parse and display your API reference

If you're using GitHub Sync, you can commit your OpenAPI file to a repository and Scalar will automatically sync it.

### Step 4: Set Up Scalar Config

If you're using GitHub Sync, create a `scalar.config.json` file in your repository root to configure your documentation:

```json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "publishOnMerge": true,
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
            "url": "openapi.yaml",
            "title": "API Reference"
          }
        }
      }
    }
  }
}
```

The `"publishOnMerge": true` setting tells Scalar to automatically publish your documentation when a branch is merged into your main branch.

### Step 5: Migrate Custom Styling

If you've customized your Zuplo developer portal with CSS, you can just pass this as `customCss` in the configuration or migrate those styles to Scalar using CSS variables. Scalar provides extensive theming options:

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
2. If using MDX, convert JSX components to standard Markdown (Scalar uses standard Markdown)
3. Add your guides to Scalar using the **Guides** tab in your documentation project
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
            "url": "openapi.yaml",
            "title": "API Reference"
          }
        }
      }
    }
  }
}
```

### Step 7: (Optional) Point Custom Domain to Scalar

If you're using a custom domain with Zuplo (e.g., `developers.example.com`), you can point it to Scalar:

1. Add the custom domain to your Scalar config:

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

Learn more about [custom domains](../guides/docs/configuration/domains.md).

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

**Learn more about [redirects](../guides/docs/configuration/redirects.md).**

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


