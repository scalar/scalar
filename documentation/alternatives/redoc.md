# Best Redoc alternatives (2026)

*Last updated: September 2026*

The best Redoc alternative is the one that keeps Redoc's clean, readable reference and adds the thing Redoc's open-source edition leaves out: letting readers send a real request from the page.

This page is about [Redoc](https://github.com/Redocly/redoc), the MIT-licensed open-source renderer you drop into an HTML page or build with `npx @redocly/cli build-docs`. If you are weighing Redocly's commercial platform instead, read [Redocly alternatives](/alternatives/redocly); the reasons people leave each one are different.

We make Scalar, so it is listed first. Each claim about another project links to its source. Redoc is good software with a decade behind it, and we say below when you should keep it.

## Why teams look for a Redoc alternative

**No way to call the API from the docs.** The single most-requested feature on the Redoc repository is an [API console](https://github.com/Redocly/redoc/issues/53). It was opened in May 2016, has more than 230 reactions and over 100 comments, and is still open. Redoc's README is clear about why: the try-it console is listed under [hosted Redoc](https://github.com/Redocly/redoc#redoc-vs-hosted-redoc), Redocly's paid product. Readers can read about an endpoint but have to copy it into another tool to try it.

**Code samples are manual.** The open-source edition shows code samples only when you write them yourself in the `x-codeSamples` vendor extension. [Automatically generated samples](https://github.com/Redocly/redoc#redoc-vs-hosted-redoc) are a hosted feature, and the request to [generate cURL samples](https://github.com/Redocly/redoc/issues/15) has been open since January 2016. For a large API that means either a lot of hand-written YAML or no examples.

**OpenAPI 3.1 edges.** Redoc lists OpenAPI 3.1 support, but a tracking issue for [3.1 support problems](https://github.com/Redocly/redoc/issues/1715) has been open since 2021, alongside open reports such as [3.1 examples not rendering correctly](https://github.com/Redocly/redoc/issues/1905) and [type arrays producing wrong property labels](https://github.com/Redocly/redoc/issues/2364). Most documents render fine. If yours uses 3.1 features heavily, test before you commit.

**A slower release rhythm.** The 2.x line moved from [2.5.0 in April 2025 to 2.5.3 in May 2026](https://github.com/Redocly/redoc/releases). Redocly has announced [Redoc 3.0 as "coming soon"](https://redocly.com/redoc-ce) with OpenAPI 3.2, AsyncAPI, GraphQL and MCP rendering, which is good news. The same page keeps the interactive console (Replay) and mock servers on the hosted tier, so the main gap does not close in 3.0.

**It is a renderer, not a site.** Redoc gives you one page per API. Guides, changelogs, versioned sites and a custom domain are yours to build around it.

## Redoc alternatives at a glance

| Tool | License | Send requests from the docs | Auto-generated code samples | Layout | Best for |
| --- | --- | --- | --- | --- | --- |
| **Scalar** | [MIT](https://github.com/scalar/scalar) | Yes, full client | Yes | Three-column or classic | Keeping Redoc's look and adding a client |
| [Hosted Redoc (Redocly)](https://redocly.com/pricing) | Proprietary | Yes (Replay) | Yes | Three-panel | Staying with Redoc's renderer and paying for the extras |
| [Swagger UI](https://github.com/swagger-api/swagger-ui) | Apache 2.0 | Yes, per operation | cURL | Single column | Internal tools where familiarity matters |
| [Stoplight Elements](https://github.com/stoplightio/elements) | Apache 2.0 | Yes | Yes | Sidebar + panel | React sites |
| [RapiDoc](https://github.com/rapi-doc/RapiDoc) | MIT | Yes | cURL | Configurable | Tinkering with layout through attributes |
| [docusaurus-openapi-docs](https://github.com/PaloAltoNetworks/docusaurus-openapi-docs) | MIT | Yes | Yes | Docusaurus pages | Docs that already live in Docusaurus |

Checked against each project's GitHub repository, README, or pricing page on 26 September 2026.

## The options, one by one

### 1. Scalar

Scalar is the closest like-for-like swap. Its default layout is a navigation sidebar, a description column, and request and response examples on the right, which Redoc users tend to find familiar. The difference is the button on every operation that opens a full API client: environments, authentication (API keys, HTTP, OAuth 2.0 flows), headers and cookies, and responses rendered in place. Code examples for many languages and HTTP clients are generated from the operation, and any `x-codeSamples` you already wrote for Redoc are [shown as well](/products/api-references/openapi).

It is MIT licensed, like Redoc, and deploys the same ways: a script tag, a React component, a Docker image, or a package for your web framework. It reads Redoc's navigation extensions (`x-tagGroups` and `x-displayName`), so your sidebar keeps its shape. Hosted docs, SDK generation and hosted MCP servers exist on [paid plans](/pricing), but you do not need them to replace Redoc.

**Verdict:** the upgrade Redoc users usually want: the same reading experience, with interactivity included in the free edition.
**Best for:** public references where developers will want to try calls before they write code.

### 2. Hosted Redoc on Redocly

If you like Redoc's rendering exactly as it is, the vendor's own answer is hosting it on Redocly, which adds Replay, generated samples and mock servers. Redocly's [Pro plan is $10 per seat per month](https://redocly.com/pricing) with one project and a 100-page limit. One thing to know: Redocly's migration docs say this version of Redoc is ["not licensed for use on other platforms"](https://redocly.com/docs/realm/get-started/migrate-api-reference), so you publish through Redocly's platform rather than your own hosting.

**Verdict:** the lowest-change path if you are happy to move from self-hosting to a vendor.
**Best for:** small teams who want Redoc plus try-it and do not mind per-seat pricing.

### 3. Swagger UI

[Swagger UI](https://github.com/swagger-api/swagger-ui) has request sending built in, which is exactly what Redoc lacks. You give up Redoc's three-panel reading layout, and each operation needs a "Try it out" click before it will send.

**Verdict:** a sideways move: interactivity in, polish out.
**Best for:** internal APIs where the audience already knows Swagger UI. Our [Swagger UI alternatives](/alternatives/swagger-ui) guide covers its trade-offs.

### 4. Stoplight Elements

[Elements](https://github.com/stoplightio/elements) is an Apache 2.0 web component and React library with a request panel. It is maintained under SmartBear, which [acquired Stoplight in 2023](https://smartbear.com/news/news-releases/smartbear-to-acquire-stoplight/); the [npm package](https://www.npmjs.com/package/@stoplight/elements) was still publishing in August 2026.

**Verdict:** a reasonable choice if you are embedding a reference inside a React app.
**Best for:** product teams who want the reference as one component among many.

### 5. RapiDoc

[RapiDoc](https://github.com/rapi-doc/RapiDoc) is a single web component with a try-it panel and many layout attributes. Its [latest npm release](https://www.npmjs.com/package/rapidoc) is from October 2024.

**Verdict:** flexible and light, with the risk that comes with a quiet project.
**Best for:** side projects and internal pages.

### 6. docusaurus-openapi-docs

The [docusaurus-openapi-docs plugin](https://github.com/PaloAltoNetworks/docusaurus-openapi-docs) generates one Docusaurus page per operation, with a request panel. It is MIT licensed and actively released.

**Verdict:** only worth it if Docusaurus is already your docs home.
**Best for:** teams who want the reference inside an existing Docusaurus site. Scalar also plugs into Docusaurus through its [Docusaurus integration](/products/api-references/integrations/docusaurus).

## Moving from Redoc to Scalar

Most Redoc setups are one of three shapes. Here is each one next to its replacement.

**HTML tag.** Redoc's zero-build setup:

```html
<redoc spec-url="/openapi.yaml"></redoc>
<script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
```

The Scalar equivalent:

```html
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
<script>
  Scalar.createApiReference('#app', { url: '/openapi.yaml' })
</script>
```

**Static build in CI.** If you run `npx @redocly/cli build-docs openapi.yaml` to produce `redoc-static.html`, the simplest replacement is to publish the HTML file above next to your document. If you would rather have a hosted site with previews on every pull request, `npx @scalar/cli project publish` deploys Scalar Docs from CI.

**React.** `RedocStandalone` becomes `ApiReferenceReact`:

```tsx
import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'

export const ApiDocs = () => (
  <ApiReferenceReact configuration={{ url: '/openapi.yaml' }} />
)
```

Things that carry over without edits: your OpenAPI document, `x-tagGroups`, `x-displayName`, and `x-codeSamples`. Things to redo: Redoc's `theme` object does not map one to one, so you will set colours through Scalar's [themes and CSS variables](/products/api-references/themes) instead. If you want readers to keep a read-only page, set `hideTestRequestButton: true`.

## When to stay on Redoc

- **Your readers never send requests.** For a published, stable API where the docs are read rather than exercised, Redoc's three-panel layout remains excellent and needs nothing else.
- **You have a heavily customised Redoc theme.** Rebuilding a mature theme is real work. If it is working, that effort may not pay back.
- **You are waiting for Redoc 3.** If OpenAPI 3.2, AsyncAPI or GraphQL rendering in one open-source renderer is the thing you need, it is on [Redocly's roadmap](https://redocly.com/redoc-ce). Scalar already renders [AsyncAPI](/products/api-references/asyncapi) documents (support is still a work in progress), but it does not render GraphQL.
- **You already use Redocly CLI for linting.** Keeping Redoc next to it is one fewer vendor. Note that you can lint with Redocly CLI and render with Scalar; the two do not conflict.

## Frequently asked questions

<scalar-detail title="Does Redoc have a Try it out button?">
Not in the open-source edition. Redoc's README lists the try-it console as a feature of hosted Redoc on Redocly. The feature request on GitHub has been open since 2016. Scalar, Swagger UI, Stoplight Elements and RapiDoc all include request sending for free.
</scalar-detail>

<scalar-detail title="Is Redoc still maintained?">
Yes. Redocly still publishes 2.x releases (2.5.4 reached npm in September 2026) and has announced Redoc 3.0 as coming soon. The cadence is slower than it was a few years ago, and many long-standing feature requests remain open.
</scalar-detail>

<scalar-detail title="Can I keep my Redoc vendor extensions if I switch?">
The common ones, yes. Scalar reads `x-tagGroups` for sidebar groups, `x-displayName` for tag labels, and `x-codeSamples` (or `x-code-samples`) for custom examples. Redoc-specific display options, such as its theme object, need to be set again in Scalar's configuration.
</scalar-detail>

<scalar-detail title="What is the difference between Redoc and Redocly?">
Redoc is the open-source, MIT-licensed renderer. Redocly is the company that maintains it and sells a hosted platform (Realm, Revel, Reef) with extras such as the Replay console, mock servers and analytics. People searching for a Redoc alternative usually want a free renderer; people leaving Redocly are usually leaving the platform.
</scalar-detail>

<scalar-detail title="Is Scalar or Redoc better for large OpenAPI documents?">
Both are used on large APIs. The practical difference for big references is navigation: Scalar has built-in search plus a request client, while Redoc has search and a three-panel layout but no client. Test your own document in each; it takes minutes with a script tag.
</scalar-detail>

## Related

- **Learn:** [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0)
- **Docs:** [Scalar and your OpenAPI extensions](/products/api-references/openapi)
- **Product:** [Scalar API References](/products/api-references) — an MIT renderer with a built-in API client, the part Redoc keeps on its hosted tier.

---

*This page is based on Redoc's public GitHub repository, README and releases, Redocly's public documentation and pricing page, and the public repositories of every other tool listed, as of 26 September 2026. Redoc 3.0 had been announced but not released at that date. We have made a genuine effort to be accurate and fair. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
