# How to migrate from Mintlify to Scalar

*Last updated: September 2026*

Moving from Mintlify to Scalar means translating one config file, renaming a handful of MDX components, and pointing your OpenAPI document at a new route. Your Markdown stays Markdown, your OpenAPI document stays as it is, and most teams spend their time on the component pass rather than anything structural.

This guide is the practical how-to, and it assumes you have already picked Scalar. If you are still deciding, start with [Scalar vs Mintlify](/resources/compare/mintlify), which is candid about where Mintlify is stronger (unlimited seats on Pro, and localization in particular), or [Mintlify alternatives](/alternatives/mintlify) for the wider field. For pricing and plan detail on Mintlify's side, see our [Mintlify reviews, pricing and alternatives](/library/mintlify-reviews-pricing-alternatives) page.

## The short version

1. Get your content into a Git repository you own.
2. Translate `docs.json` into `scalar.config.json`.
3. Rename Mintlify components to Scalar components.
4. Add your OpenAPI document as an `openapi` route.
5. Carry your redirects across and add new ones for any URL that changed.
6. Preview, connect Git Sync, then move your custom domain last.

Nothing here needs a proprietary export format. Mintlify content is MDX in a Git repository, and Scalar Docs reads MDX from a Git repository.

## What maps to what

| Mintlify | Scalar | Notes |
| --- | --- | --- |
| `docs.json` (formerly `mint.json`) | `scalar.config.json` | One file at the repository root in both cases |
| `name` | `info.title` | |
| `navigation` tabs, groups, pages | `navigation.tabs` and `navigation.routes` | Scalar keys every route by its URL path and points it at a file |
| `"pages": ["quickstart"]` | `"filepath": "docs/quickstart.mdx"` | Scalar uses the full file path, extension included |
| `openapi` on a tab or group | A route with `"type": "openapi"` | Generates one page per operation |
| `"GET /users"` page references | The generated reference | Scalar renders every operation; hide ones you do not want with `x-scalar-ignore` |
| `logo`, `favicon` | `siteConfig.logo`, `siteConfig.head.links` | |
| `theme`, `colors` | `siteConfig.theme` plus custom CSS | Scalar ships named themes; brand colours go in a stylesheet |
| `redirects` (`source`, `destination`) | `siteConfig.routing.redirects` (`from`, `to`) | Wildcard syntax differs, see step 5 |
| `integrations` (analytics) | `siteConfig.head.scripts` | You add the provider's snippet yourself |
| `seo.metatags` | `siteConfig.head.meta` | |
| `versions` | `versions` | |
| `languages` | No equivalent | Localization is a real gap on Scalar's side |
| Assistant, `/mcp`, `llms.txt` | Ask AI, `/mcp`, `llms.txt` | All three are on by default in Scalar Docs |

The Mintlify column reflects its [global settings](https://www.mintlify.com/docs/organize/settings), [navigation](https://www.mintlify.com/docs/organize/navigation), and [redirects](https://www.mintlify.com/docs/create/redirects) documentation as of September 2026.

## Step by step

<scalar-steps>
<scalar-step title="Get your content into your own repository">

Mintlify [says](https://www.mintlify.com/docs/deploy/github) that by default your documentation lives in a private, Mintlify-owned repository, and that you can move it to your own GitHub repository from the Git Settings dashboard. If you have not done that yet, do it first. Everything after this step works from a normal clone.

If your repository still has a `mint.json`, Mintlify's [settings page](https://www.mintlify.com/docs/organize/settings) describes it as deprecated in favour of `docs.json` and says `mint dev` upgrades it for you. Upgrading first is optional, but `docs.json` is the shape this guide maps from.

Keep the Mintlify site live until the Scalar one is ready. You will switch DNS at the very end.

</scalar-step>
<scalar-step title="Translate docs.json into scalar.config.json">

Take a typical Mintlify navigation with a guides tab and an API reference tab:

```json
{
  "name": "Acme",
  "navigation": {
    "tabs": [
      {
        "tab": "Guides",
        "groups": [
          { "group": "Get started", "pages": ["introduction", "quickstart"] },
          { "group": "Guides", "pages": ["guides/authentication", "guides/webhooks"] }
        ]
      },
      {
        "tab": "API Reference",
        "groups": [{ "group": "Endpoints", "openapi": "openapi.yaml" }]
      }
    ]
  }
}
```

The same structure in Scalar looks like this. Route keys are the URLs, and a group keyed `/` adds no prefix, so `/quickstart` stays `/quickstart`:

```json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "info": {
    "title": "Acme"
  },
  "navigation": {
    "tabs": [
      { "title": "Guides", "to": "/" },
      { "title": "API Reference", "to": "/api-reference" }
    ],
    "routes": {
      "/": {
        "type": "group",
        "title": "Get started",
        "mode": "flat",
        "children": {
          "/": {
            "type": "page",
            "title": "Introduction",
            "filepath": "introduction.mdx"
          },
          "/quickstart": {
            "type": "page",
            "title": "Quickstart",
            "filepath": "quickstart.mdx"
          }
        }
      },
      "/guides": {
        "type": "group",
        "title": "Guides",
        "mode": "flat",
        "children": {
          "/authentication": {
            "type": "page",
            "title": "Authentication",
            "filepath": "guides/authentication.mdx"
          },
          "/webhooks": {
            "type": "page",
            "title": "Webhooks",
            "filepath": "guides/webhooks.mdx"
          }
        }
      },
      "/api-reference": {
        "type": "openapi",
        "title": "API Reference",
        "filepath": "openapi.yaml"
      }
    }
  },
  "siteConfig": {
    "subdomain": "acme",
    "logo": "https://example.com/logo.svg",
    "theme": "default"
  }
}
```

Three differences catch people out:

- **Titles live in the config.** In Scalar, the route's `title` is what the sidebar shows, whatever the page's frontmatter says. Frontmatter `title` and `description` still apply to the page itself.
- **Extensions are required.** `"filepath"` points at the real file, `.mdx` or `.md`.
- **Groups can shape URLs.** A group keyed `/guides` prefixes its children. If your Mintlify URLs did not have that prefix, key the group `/` instead, as the first group above does.

Validate the result with `npx @scalar/cli project check-config`. [Navigation](/products/docs/configuration/navigation) covers every route type and group mode.

</scalar-step>
<scalar-step title="Rename Mintlify components">

This is the part to budget time for. Scalar Docs supports [MDX](/products/docs/content/mdx), and several Mintlify names already work in Scalar's MDX as aliases: `<Accordion>` renders as a [Detail](/products/docs/components/details), and `<Columns>` and `<CardGroup>` render as a [Row](/products/docs/components/row). The rest need a find and replace.

| Mintlify component | Scalar component | What to change |
| --- | --- | --- |
| `<Note>`, `<Info>` | `<Callout type="info">` | Rename the tag |
| `<Tip>`, `<Check>` | `<Callout type="success">` | Rename the tag |
| `<Warning>` | `<Callout type="warning">` | Rename the tag |
| `<Danger>` | `<Callout type="danger">` | Rename the tag |
| `<Callout>` | `<Callout>` | Check the `icon` value |
| `<Card>` | [`<Card>`](/products/docs/components/cards) | `title`, `icon`, and `href` carry across |
| `<CardGroup>`, `<Columns>` | `<Grid>` (or keep the alias) | Grid is the recommended layout component |
| `<Steps>`, `<Step>` | [`<Steps>`, `<Step>`](/products/docs/components/steps) | Same shape |
| `<Tabs>`, `<Tab>` | [`<Tabs>`, `<Tab>`](/products/docs/components/tabs) | Same shape |
| `<CodeGroup>` | `<Tabs>` with a code block in each `<Tab>` | |
| `<Accordion>`, `<AccordionGroup>`, `<Expandable>` | [`<Detail>`](/products/docs/components/details) | `<Accordion>` works as is; drop the group wrapper |
| `<Frame>` | [`<Image>`](/products/docs/components/images) | Use `caption` for the frame caption |
| `<Icon>` | [`<Icon>`](/products/docs/components/icons) | Scalar uses Phosphor and Simple Icons keys, so check each name |
| `<ParamField>`, `<ResponseField>` | No direct equivalent | Document parameters in OpenAPI and let the reference render them |
| `<RequestExample>`, `<ResponseExample>` | No direct equivalent | Use `x-codeSamples` and response `examples` in OpenAPI |
| `<Mermaid>` | No equivalent today | Render the diagram to SVG and use `<Image>` |
| `<Tooltip>`, `<Badge>`, `<Banner>`, `<Tree>`, `<Color>`, `<Update>`, `<Prompt>`, `<View>` | No equivalent today | Rewrite as prose, a table, or a callout |

The Mintlify column comes from its [components overview](https://www.mintlify.com/docs/components) and [callouts page](https://www.mintlify.com/docs/components/callouts) as of September 2026. Custom React components you wrote for Mintlify will not carry across as they are. Scalar MDX supports JSX, expressions, and importing other MDX files, and you can add site-wide [HTML, CSS, and JavaScript](/products/docs/content/html-css-js), so most of them can be rebuilt, but plan for it.

A quick way to size the job:

```bash
grep -rhoE "<(Note|Info|Tip|Check|Warning|Danger|CodeGroup|Frame|ParamField|ResponseField|RequestExample|ResponseExample|Mermaid|Tooltip|Badge|Banner|Tree|Update)[ />]" --include="*.mdx" . | sort | uniq -c | sort -rn
```

</scalar-step>
<scalar-step title="Point your OpenAPI document at an openapi route">

Your OpenAPI document does not change. Add it as a route, as in step 2, and Scalar renders one page per operation with the built-in API client for trying requests.

Mintlify reads a few of its own OpenAPI extensions, [documented here](https://www.mintlify.com/docs/api-playground/openapi-setup). They are harmless to leave in the file, but they do nothing in Scalar:

| Mintlify extension | In Scalar |
| --- | --- |
| `x-hidden` | [`x-scalar-ignore`](/products/api-references/openapi) (or `x-internal`) |
| `x-mint.metadata.title` | The operation `summary` |
| `x-mint.content` | Move the Markdown into the operation `description` |
| `x-mint.href` | No equivalent; add a redirect for the old URL instead |
| `x-group` on tags | [`x-displayName`](/products/api-references/openapi) |
| `x-default` on security schemes | Prefill credentials with `authentication` in the route's `config` |
| `x-codeSamples` | Read as is |

To prefill credentials, which is what `x-default` did, pass [API reference configuration](/products/api-references/configuration) on the route:

```json
"/api-reference": {
  "type": "openapi",
  "title": "API Reference",
  "filepath": "openapi.yaml",
  "config": {
    "authentication": {
      "preferredSecurityScheme": "bearerAuth"
    }
  }
}
```

</scalar-step>
<scalar-step title="Carry your redirects across">

Two sets of redirects matter: the ones already in your `docs.json`, and new ones for any page whose URL changes in the move. API reference pages are the usual culprit, because Scalar generates its own operation URLs. Preview the site, compare it with your current sitemap, and write a rule for every URL that moved.

Mintlify uses `source` and `destination`. Scalar uses `from` and `to` under [`siteConfig.routing.redirects`](/products/docs/configuration/redirects):

```json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "routing": {
      "redirects": [
        { "from": "/api-reference/endpoint/get-user", "to": "/api-reference" },
        { "from": "/beta/:pathMatch(.*)*", "to": "/guides/authentication" }
      ]
    }
  }
}
```

Mintlify's `:slug*` wildcard becomes `:pathMatch(.*)*` or `:wildcard` in Scalar. Mintlify lets you choose a temporary redirect with `"permanent": false` ([docs](https://www.mintlify.com/docs/create/redirects)); Scalar's redirect object has only `from` and `to`.

</scalar-step>
<scalar-step title="Add analytics, search settings, and AI">

**Analytics.** Mintlify has [built-in integrations](https://www.mintlify.com/docs/integrations/analytics/overview) for 16 providers under `integrations` in `docs.json`. Scalar does not have named integrations. You add the provider's snippet as a script:

```json
"siteConfig": {
  "head": {
    "scripts": [
      { "path": "assets/analytics.js", "defer": true }
    ]
  }
}
```

**Search** is on by default. You can move it to the sidebar or turn it off in [site config](/products/docs/configuration/site-config).

**AI.** Mintlify's assistant is on its [Pro plan and above](https://www.mintlify.com/docs/ai/assistant), and it serves a [search MCP server](https://www.mintlify.com/docs/ai/model-context-protocol) at `/mcp` and an [`llms.txt`](https://www.mintlify.com/docs/ai/llmstxt). Scalar Docs has all three on by default: [Ask AI](/products/docs/configuration/ask-ai), a docs MCP server at `https://<your-domain>/mcp`, and [`llms.txt` and `llms-full.txt`](/products/docs/configuration/llms-txt). Ask AI usage draws on the Agent Scalar credits included with each plan. Separately, Scalar can host an [MCP server generated from your OpenAPI document](/products/agent/mcp), so agents can call your API rather than only read about it.

</scalar-step>
<scalar-step title="Preview, connect Git Sync, and move the domain">

Preview locally until it looks right:

```bash
npx @scalar/cli project preview
```

Then connect the repository through [Git Sync](/products/docs/integrations/github) so every merge publishes. Once published, the site is live on `https://<subdomain>.apidocumentation.com`, which is a good place to review it with your team before any DNS changes.

Move the custom domain last. On Mintlify, your domain points at `cname.mintlify.builders` ([docs](https://www.mintlify.com/docs/customize/custom-domain)). Add `customDomain` to `siteConfig`, publish, and change the CNAME to `dns.scalar.com`. The record must be DNS-only, so turn off Cloudflare's proxy if you use it. Scalar provisions the certificate on the first request. Custom domains are on [Scalar Pro](/pricing) and above. Full details are in [Domains](/products/docs/configuration/domains).

</scalar-step>
</scalar-steps>

## What does not come across

Be clear about these before you start, so none of them turns up as a surprise halfway through:

- **Localization.** Mintlify supports [30+ locales](https://www.mintlify.com/docs/guides/internationalization) with per-language navigation. Scalar Docs has no equivalent. If you publish in several languages, this may be a reason to stay.
- **Mintlify's web editor.** Scalar has its own editor, but content written through Mintlify's editor is just MDX in Git, so nothing is lost; your writers will need to learn a new tool.
- **Components without a Scalar equivalent.** See the table in step 3. Most are cosmetic, but `<ParamField>`-heavy pages need rethinking rather than renaming.
- **Built-in analytics integrations.** You add scripts yourself.
- **Seat pricing.** Mintlify Pro includes [unlimited editor seats](https://www.mintlify.com/pricing). Scalar Pro includes 5, and Business 10. For a large writing team, compare the numbers before you move.

## What you gain

The reasons teams make this move are usually the ones that are not about the docs site itself: an [MIT-licensed API reference](/products/api-references) you can self-host or mount inside your own app, a standalone [API client](/products/api-client), and [SDKs](/products/sdk-generator) generated from the same OpenAPI document as your docs. TypeScript, Python, Go, Java, Kotlin, and CLI SDKs are generally available; Ruby, C#, PHP, Rust, Swift, Dart, and C++ are experimental. Mintlify does not generate SDKs.

## Frequently asked questions

<scalar-detail title="Can Scalar import my docs.json automatically?">
Not today. The translation is manual, but it is mechanical: tabs become `navigation.tabs`, groups become `group` routes, and each page string becomes a route with a `filepath`. For a site with a few dozen pages it usually takes an afternoon.
</scalar-detail>

<scalar-detail title="Will my Mintlify MDX work in Scalar?">
Most of it. Plain Markdown and MDX render as they are, and `<Card>`, `<Steps>`, `<Tabs>`, `<Accordion>`, `<Columns>`, and `<CardGroup>` work directly. Callouts such as `<Note>` and `<Warning>` need renaming to `<Callout type="...">`, and a few Mintlify components have no Scalar equivalent.
</scalar-detail>

<scalar-detail title="Do I need to change my OpenAPI document?">
No. Scalar reads OpenAPI 3.0, 3.1, and 3.2, and Swagger 2.0, as they are. Mintlify's `x-mint` extensions are ignored rather than rejected. If you used `x-hidden`, switch to `x-scalar-ignore` so hidden operations stay hidden.
</scalar-detail>

<scalar-detail title="How do I keep my search rankings when I switch?">
Keep URLs the same wherever you can by choosing route keys that match your current paths, then add a redirect for every URL that changes. Move the custom domain only once the new site is complete, so there is no window where pages return errors.
</scalar-detail>

<scalar-detail title="Does Scalar have an equivalent of Mintlify's AI assistant and MCP server?">
Yes. Every Scalar Docs site has Ask AI, a docs MCP server at `/mcp`, and generated `llms.txt` and `llms-full.txt` files, with no setup. Scalar can also host an MCP server generated from your OpenAPI document, which lets agents call your API.
</scalar-detail>

## Related

- **Learn:** [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [llms.txt for API docs](/learn/openapi/llms-txt-for-api-docs)
- **Docs:** [Scalar vs Mintlify](/resources/compare/mintlify) · [Mintlify alternatives](/alternatives/mintlify) · [Mintlify reviews, pricing and alternatives](/library/mintlify-reviews-pricing-alternatives) · [Navigation](/products/docs/configuration/navigation)
- **Product:** [Scalar Docs](/products/docs) — Markdown, MDX, and your OpenAPI reference from one `scalar.config.json`

---

*Mintlify details on this page come from its own documentation ([settings](https://www.mintlify.com/docs/organize/settings), [navigation](https://www.mintlify.com/docs/organize/navigation), [redirects](https://www.mintlify.com/docs/create/redirects), [components](https://www.mintlify.com/docs/components), [OpenAPI setup](https://www.mintlify.com/docs/api-playground/openapi-setup), [analytics](https://www.mintlify.com/docs/integrations/analytics/overview), [assistant](https://www.mintlify.com/docs/ai/assistant), [MCP](https://www.mintlify.com/docs/ai/model-context-protocol), [GitHub](https://www.mintlify.com/docs/deploy/github), and [custom domains](https://www.mintlify.com/docs/customize/custom-domain)) and [pricing page](https://www.mintlify.com/pricing), as checked on September 26, 2026. Mintlify ships often and its configuration may change. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
