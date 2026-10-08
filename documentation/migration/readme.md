# How to migrate from ReadMe to Scalar

*Last updated: September 2026*

Moving from ReadMe to Scalar starts with getting your content out as Markdown files, which ReadMe supports through Git sync or the `rdme` CLI. From there you add a `scalar.config.json`, point it at your OpenAPI document, and rebuild the handful of ReadMe features that do not have a one-to-one equivalent.

This guide is the practical how-to, and it assumes you have already picked Scalar. If you are still deciding, read [Scalar vs ReadMe](/resources/compare/readme) first. It is direct about the thing ReadMe does that Scalar does not: per-developer API analytics in the Developer Dashboard. If your support team lives in that dashboard, weigh that before anything on this page. [ReadMe alternatives](/alternatives/readme) covers the wider field.

## The short version

1. Export your guides, reference pages, and changelog as Markdown.
2. Take the OpenAPI document you already upload to ReadMe.
3. Write a `scalar.config.json` that mirrors your ReadMe navigation.
4. Convert ReadMe's MDX components, callouts, and recipes.
5. Add redirects from ReadMe's URL patterns, then move your custom domain.

## What maps to what

| ReadMe | Scalar | Notes |
| --- | --- | --- |
| Guides (`/docs/...`) | `page` routes | Markdown or MDX from Git |
| API Reference (`/reference/...`) | An `openapi` route | Generated from your OpenAPI document, one page per operation |
| Custom pages (`/page/...`) | `page` routes | HTML is fine in Markdown pages |
| Changelog (`/changelog/...`) | Pages with a `date`, plus an RSS feed | See step 4 |
| Recipes | A page built with `<Steps>` and code blocks | No modal walkthrough equivalent |
| Versions | `versions` in `scalar.config.json` | |
| `_order.yaml` sidebar order | Route order in `scalar.config.json` | |
| `x-readme.code-samples` | Read as is | Shows under "Code Examples" |
| Personalized docs and user variables | Private docs, access groups, credential prefill | No per-user variables; see below |
| Developer Dashboard and API logs | No equivalent | The main thing you give up |
| Ask AI, MCP server | Ask AI, docs MCP at `/mcp`, `llms.txt` | On by default in Scalar Docs |
| Errors & Redirects | `siteConfig.routing.redirects` | |
| Custom domain | `siteConfig.customDomain` | CNAME to `dns.scalar.com` |

The ReadMe column reflects its [URL paths](https://docs.readme.com/main/docs/url-paths-in-readme), [bi-directional sync](https://docs.readme.com/main/docs/bi-directional-sync), and [OpenAPI extensions](https://docs.readme.com/main/docs/openapi-extensions) documentation as of September 2026.

## Step by step

<scalar-steps>
<scalar-step title="Export your content from ReadMe">

You have two routes out, and both give you Markdown files with YAML frontmatter.

**Bi-directional sync.** ReadMe [syncs with GitHub, GitLab, or Bitbucket](https://docs.readme.com/main/docs/bi-directional-sync). Every content type syncs, including guides, API reference pages, custom pages, recipes, and changelogs. Page order is kept in `_order.yaml` files, and each Git branch maps to a ReadMe version with exactly the same name. ReadMe requires the target repository to be empty when you connect it. If you already sync, your content is in Git and you can skip ahead.

**The `rdme` CLI.** Version 10 of [`rdme`](https://github.com/readmeio/rdme) is built for ReadMe Refactored projects. Its [`docs export`](https://github.com/readmeio/rdme/blob/next/documentation/commands/docs.md) command writes your guides to a folder:

```bash
npx rdme docs export ./docs --key "$README_API_KEY" --branch stable
```

Repeat with `--branch` for each version you still publish. `rdme` also has a `reference` command for exporting API reference pages, which matters only if you wrote long-form content on those pages; the reference itself will come from your OpenAPI document.

**Your OpenAPI document.** If you upload it with `rdme openapi upload`, the source file is already in your repository. Before you move, run ReadMe's own inspector to see which ReadMe-specific features the document uses:

```bash
npx rdme openapi inspect openapi.yaml
```

The `inspect` command [analyses ReadMe feature usage](https://github.com/readmeio/rdme/blob/next/documentation/commands/openapi.md), which gives you a checklist for step 3.

</scalar-step>
<scalar-step title="Create scalar.config.json">

Scalar keys every route by its URL. If you keep ReadMe's `/docs` prefix as a group, your guide URLs can stay the same. Use the slugs from your exported files and the order from `_order.yaml`:

```json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "info": {
    "title": "Acme Developer Hub"
  },
  "navigation": {
    "tabs": [
      { "title": "Guides", "to": "/docs/getting-started" },
      { "title": "API Reference", "to": "/reference" },
      { "title": "Changelog", "to": "/changelog" }
    ],
    "routes": {
      "/docs": {
        "type": "group",
        "title": "Guides",
        "mode": "flat",
        "children": {
          "/getting-started": {
            "type": "page",
            "title": "Getting started",
            "filepath": "docs/getting-started.md"
          },
          "/authentication": {
            "type": "page",
            "title": "Authentication",
            "filepath": "docs/authentication.mdx"
          }
        }
      },
      "/reference": {
        "type": "openapi",
        "title": "API Reference",
        "filepath": "openapi.yaml"
      },
      "/changelog": {
        "type": "group",
        "title": "Changelog",
        "mode": "folder",
        "children": {
          "/2026-09-launch": {
            "type": "page",
            "title": "September launch",
            "filepath": "changelog/2026-09-launch.md"
          }
        }
      }
    }
  },
  "siteConfig": {
    "subdomain": "acme",
    "rss": {
      "path": "/changelog",
      "title": "Acme Changelog",
      "entries": "pages"
    }
  }
}
```

If you publish several ReadMe versions, use [`versions`](/products/docs/configuration/versions) instead of `navigation`, with a `default` version for the one ReadMe serves when no version is in the URL. Check the file with `npx @scalar/cli project check-config`.

</scalar-step>
<scalar-step title="Bring your OpenAPI document across">

Your OpenAPI document renders in Scalar as it is. Code samples you wrote under `x-readme.code-samples` show up without edits, in the "Code Examples" group of the language picker. The rest of ReadMe's [extensions](https://docs.readme.com/main/docs/openapi-extensions) are ignored rather than rejected, so nothing breaks, but here is how to get the same behaviour:

| ReadMe extension | In Scalar |
| --- | --- |
| `code-samples` | Read as is |
| `samples-languages` | [`defaultHttpClient`](/products/api-references/configuration) and `hiddenClients` in the route's `config` |
| `explorer-enabled: false` | `hideTestRequestButton: true` |
| `proxy-enabled` | `proxyUrl` |
| `x-internal` | Read as is (an alias of [`x-scalar-ignore`](/products/api-references/openapi)) |
| `x-enumDescriptions` | Read as is; Scalar also accepts `x-enum-descriptions` |
| `x-default` on security schemes | Prefill with `authentication` in the route's `config` |
| `oauth-options` (PKCE) | `x-usePkce` in the `authentication` config |
| `headers` | No equivalent; document the headers as parameters |
| `metrics-enabled` | Not applicable; Scalar has no API metrics |

Configuration goes on the route:

```json
"/reference": {
  "type": "openapi",
  "title": "API Reference",
  "filepath": "openapi.yaml",
  "config": {
    "defaultHttpClient": { "targetKey": "node", "clientKey": "undici" },
    "authentication": {
      "preferredSecurityScheme": "apiKey"
    }
  }
}
```

</scalar-step>
<scalar-step title="Convert components, callouts, recipes, and the changelog">

ReadMe pages are MDX. Scalar Docs supports [MDX](/products/docs/content/mdx) too, but only in files with an `.mdx` extension, so rename any exported file that uses components.

| ReadMe | Scalar | What to change |
| --- | --- | --- |
| Blockquote callouts (`> 📘`) | `<Callout type="info">` | ReadMe [writes callouts](https://docs.readme.com/main/docs/mdx) as a blockquote led by an emoji; replace each with a callout of the matching type |
| `<Tabs>`, `<Tab>` | [`<Tabs>`, `<Tab>`](/products/docs/components/tabs) | Same shape |
| `<Accordion>` | [`<Detail>`](/products/docs/components/details) | `<Accordion>` also works as an alias; its `icon` maps to `title-icon` |
| `<Cards>`, `<Card>` | [`<Grid>`](/products/docs/components/grid) with `<Card>` | Swap the wrapper |
| `<Columns>`, `<Column>` | `<Grid>` | Put each column's content in the grid |
| `<Glossary>` | No equivalent | Link to a glossary page instead |
| `{user.name}` and other user variables | No equivalent | See personalized docs below |
| Custom components | Rebuild | ReadMe custom components are React, [available on Pro and Enterprise](https://docs.readme.com/main/docs/building-custom-mdx-components); Scalar MDX supports JSX and imports of other MDX files |

The ReadMe column comes from its [built-in components](https://docs.readme.com/main/docs/built-in-components) and [features](https://docs.readme.com/rdmd/docs/features) documentation.

**Recipes.** ReadMe [recipes](https://docs.readme.com/main/docs/recipes) are step-by-step code walkthroughs that open as modals from guides or the reference. Scalar has no modal walkthrough. The closest equivalent is a regular page built from [`<Steps>`](/products/docs/components/steps), with a code block in each step, linked from the relevant guide.

**Changelog.** Each exported changelog post becomes a page under `/changelog`. Add a `date` to its frontmatter and set `"entries": "pages"` on the feed, as in step 2, and Scalar publishes `/changelog/rss.xml` with one item per post:

```markdown
---
date: 2026-09-15
---

# September launch

New endpoints for webhooks and a longer rate limit window.
```

</scalar-step>
<scalar-step title="Decide what to do about personalized docs">

ReadMe's [personalized docs](https://docs.readme.com/main/docs/personalized-docs) log developers in through ReadMe, your own login via JWT, or SSO on Enterprise, then show each developer their own API keys and server variables, and let you use [user data as variables](https://docs.readme.com/main/docs/user-data-options) in your pages.

Scalar covers part of this, and it is worth being exact about which part:

- **Restricting who can read the docs** is covered. [Private docs](/products/docs/configuration/private-docs) with access groups are on Pro and above, and you can brand the sign-in page with a custom login portal.
- **Prefilling credentials in the API client** is covered with the [`authentication`](/products/api-references/configuration) configuration, but the values are set per site, not per logged-in developer.
- **Per-developer keys and variables in page content** are not covered. If your onboarding depends on showing each developer their own key, plan to handle that in your dashboard and link to it from the docs.

</scalar-step>
<scalar-step title="Add redirects and move the domain">

ReadMe URLs follow `/{version}/{type}/{slug}`, where the version segment is optional and the type is `docs`, `reference`, `changelog`, or `page` ([docs](https://docs.readme.com/main/docs/url-paths-in-readme)). If you kept `/docs` and `/changelog` as group paths in step 2, most guide URLs survive unchanged. Reference pages will not, because Scalar generates its own operation URLs, and neither will custom pages or versioned URLs.

Existing ReadMe redirects live under **Settings > Errors & Redirects**, one `oldurl -> newurl` rule per line, with JavaScript regular expressions allowed ([docs](https://docs.readme.com/main/docs/error-pages)). Copy those across, then add rules for everything that moved, under [`siteConfig.routing.redirects`](/products/docs/configuration/redirects):

```json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "routing": {
      "redirects": [
        { "from": "/page/support", "to": "/docs/support" },
        { "from": "/reference/get-user", "to": "/reference" },
        { "from": "/v1.0/:pathMatch(.*)*", "to": "/docs/getting-started" }
      ]
    }
  }
}
```

Scalar's documented wildcard and regex examples send every match to one destination, so list individual rules for any page that should land somewhere specific.

Preview with `npx @scalar/cli project preview`, connect [Git Sync](/products/docs/integrations/github) so merges publish, and review the site on its `apidocumentation.com` subdomain. Move the custom domain last. ReadMe has you point a CNAME at a `readmessl.com` target ([docs](https://docs.readme.com/main/docs/setting-up-custom-domain)); for Scalar, add `customDomain` to `siteConfig`, publish, then change the CNAME to `dns.scalar.com` with any proxy turned off. Custom domains are on [Scalar Pro](/pricing) and above. See [Domains](/products/docs/configuration/domains).

</scalar-step>
</scalar-steps>

## What does not come across

- **The Developer Dashboard and API logs.** ReadMe's [Developer Dashboard](https://docs.readme.com/main/docs/developer-dashboard) shows per-developer API usage and errors, fed by its Metrics SDK. Scalar has nothing equivalent today. If that is the reason you are on ReadMe, stay.
- **Per-developer variables and keys in content,** covered in step 5.
- **Recipes as modals and glossary tooltips.** Both become ordinary pages and links.
- **Discussion forums.** ReadMe lists a `/discuss` section among its [URL types](https://docs.readme.com/main/docs/url-paths-in-readme). Scalar Docs has no forum; point people at GitHub Discussions or your community tool of choice.
- **ReadMe's editor workflow.** Scalar has an editor too, but it is Git-first. Writers used to ReadMe's editor will need a little time.

## What you gain

Teams usually move for reasons beyond the docs site: an [MIT-licensed API reference](/products/api-references) you can self-host or mount inside your app, a standalone [API client](/products/api-client), and [SDKs](/products/sdk-generator) generated from the same OpenAPI document as your docs. TypeScript, Python, Go, Java, Kotlin, Ruby, and CLI are generally available; C#, PHP, Rust, Swift, Dart, and C++ are experimental. Scalar can also host an [MCP server generated from your OpenAPI document](/products/agent/mcp), with OAuth.

## Frequently asked questions

<scalar-detail title="How do I export my docs from ReadMe?">
Connect bi-directional sync to an empty GitHub, GitLab, or Bitbucket repository, which writes every content type to Git as Markdown. Or run `rdme docs export` from version 10 of the `rdme` CLI to write your guides to a local folder. Your OpenAPI document is the file you already upload with `rdme openapi upload`.
</scalar-detail>

<scalar-detail title="Will my x-readme code samples work in Scalar?">
Yes. Scalar reads `x-readme.code-samples` and shows them in the language picker under "Code Examples". Other `x-readme` settings are ignored without errors; the table in step 3 shows the Scalar equivalent for each one.
</scalar-detail>

<scalar-detail title="Can I keep my ReadMe URLs?">
Most guide and changelog URLs, yes, by keeping `/docs` and `/changelog` as group paths in `scalar.config.json`. API reference, custom page, and versioned URLs will change, so add a redirect for each of them before you move the domain.
</scalar-detail>

<scalar-detail title="Does Scalar support personalized docs like ReadMe?">
Partly. Scalar has private docs with access groups and custom login portals, and it can prefill credentials in the API client. It does not show each logged-in developer their own API keys or user variables in page content.
</scalar-detail>

<scalar-detail title="Is there a replacement for ReadMe's API metrics?">
Not in Scalar. ReadMe's Developer Dashboard is its strongest feature and Scalar has no equivalent today. If you rely on it every week, you would need to rebuild that view in your own observability tooling, or stay on ReadMe.
</scalar-detail>

## Related

- **Learn:** [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [API documentation best practices](/learn/openapi/api-documentation-best-practices)
- **Docs:** [Scalar vs ReadMe](/resources/compare/readme) · [ReadMe alternatives](/alternatives/readme) · [Redirects](/products/docs/configuration/redirects)
- **Product:** [Scalar Docs](/products/docs) — Markdown, MDX, and your OpenAPI reference from one `scalar.config.json`

---

*ReadMe details on this page come from its own documentation ([bi-directional sync](https://docs.readme.com/main/docs/bi-directional-sync), [URL paths](https://docs.readme.com/main/docs/url-paths-in-readme), [OpenAPI extensions](https://docs.readme.com/main/docs/openapi-extensions), [MDX](https://docs.readme.com/main/docs/mdx), [built-in](https://docs.readme.com/main/docs/built-in-components) and [custom](https://docs.readme.com/main/docs/building-custom-mdx-components) components, [personalized docs](https://docs.readme.com/main/docs/personalized-docs), [redirects](https://docs.readme.com/main/docs/error-pages), and [custom domains](https://docs.readme.com/main/docs/setting-up-custom-domain)) and the [`rdme` repository](https://github.com/readmeio/rdme), as checked on September 26, 2026. ReadMe's product and CLI may change. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
