# API documentation platform

Scalar Docs is an API documentation platform that puts product guides and interactive API references in one developer portal, generated from the OpenAPI documents you already maintain.

Write in Markdown or MDX, pull content from GitHub, preview every pull request, and deploy on merge or from anywhere with the CLI, so your docs stay in sync with your code. All of scalar.com is fully built with Scalar Docs.

<div class="flex gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Get Started</a>
  <a class="t-editor__button button__secondary" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Book a Demo</a>
</div>

<scalar-image
  class="docs-hero-image"
  src="/api-docs-static-zoom.svg"
  src-dark="/api-docs-static-zoom-dark.svg"
  alt="Scalar Docs interface"
  size="full">
</scalar-image>


<div class="logowall">
  <div class="logowall-item logowall-item-tr">
    <scalar-icon src="../../assets/remote/logo-tr.svg"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-maersk.svg"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-tailscale.svg"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-supabase.svg"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-flyio.svg"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-clerk.svg?v=2"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-bobcat.svg"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-partech.svg?v=2"></scalar-icon>
  </div>
</div>

## Why API teams choose Scalar Docs

- **Trusted by teams you know.** Bobcat, Thomson Reuters, Clerk, Lufthansa, PAR, Zoom, Tailscale, and Later publish developer documentation with Scalar Docs. PAR moved its public developer portal to Scalar in 2025; [read the PAR story](/customers/partech).
- **Built on an open-source reference with 15.7k GitHub stars.** Every API page is rendered by the MIT-licensed [Scalar API Reference](/products/api-references), which Microsoft Learn documents in [Use Scalar for interactive API documentation](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents#use-scalar-for-interactive-api-documentation).
- **The default docs UI in eight frameworks.** Effect, ElysiaJS, HappyX, Litestar, Nitro, oRPC, Platformatic, and Spry ship the Scalar reference out of the box, so many of your developers have used it before they reach your portal.

## Guides and API references in one site

Most teams end up with two sites: a reference generated from OpenAPI and a separate guides site that drifts out of date. Scalar Docs puts both under one navigation, one search, and one domain. Add one API or hundreds, each with its own interactive reference and a Test Request button that opens the [API client](/products/api-client) in place. [Versions](configuration/versions.md) keep older releases readable next to the current one.

## Docs as code, with a dashboard when you want one

Content lives in your repository as Markdown and MDX, configured by a single [`scalar.config.json`](configuration/scalar.config.json.md). Git Sync publishes on merge, [preview deployments](deployment/preview-deployments.md) put a link on every pull request, and the [CLI](deployment/cli.md) deploys from any CI.

## Ready for AI readers

Every published site serves [`/llms.txt` and `/llms-full.txt`](configuration/llms-txt.md) automatically, [Ask AI](configuration/ask-ai.md) answers questions from your content, and a Docs MCP endpoint lets AI clients search and read your docs. The same OpenAPI document can also power [SDKs](/products/sdk-generator) and [hosted MCP servers](/products/agent/mcp).

## Start from your framework

If your API is not documented yet, begin with the framework you already use: [.NET](/docs-for/dotnet), [FastAPI](/docs-for/fastapi), [NestJS](/docs-for/nestjs), or [Hono](/docs-for/hono). New to OpenAPI? The [learn hub](/learn) covers the basics.

[Start a free 7-day trial](https://dashboard.scalar.com/register) and publish to a hosted subdomain, or [book a demo](https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a) to plan a migration.

<div class="feature">
  <h2>Your documentation, always up to date</h2>
  <div class="flex flex-wrap feature-container">
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/brackets-angle"></scalar-icon>
        Markdown & MDX
      </b>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/brackets-curly"></scalar-icon>
        Custom HTML/CSS/JS
      </b>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/cloud-arrow-up"></scalar-icon>
        Fast CDN
      </b>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/arrow-up-right"></scalar-icon>
        Multiple API references
      </b>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/palette"></scalar-icon>
        Custom themes & layouts
      </b>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/globe"></scalar-icon>
        Custom domains
      </b>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/users"></scalar-icon>
        Fine-grained access
      </b>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/github-logo"></scalar-icon>
        Sync with GitHub
      </b>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/headset"></scalar-icon>
        Ask AI
      </b>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-blue">
        <scalar-icon src="phosphor/bold/robot"></scalar-icon>
        CI/CD integration
      </b>
    </div>
  </div>
</div>

## The modern API documentation

Include interactive API references for a single API or hundreds of APIs. Everything is based on the OpenAPI standard, so your documentation can stay in sync with the API document your team already maintains.

<scalar-callout type="info" icon="phosphor/regular/info">
  Just need an API reference? Use the [API Reference](../../guides/api-references/getting-started.md). It is open source, free, and has integrations for REST API frameworks.
</scalar-callout>

Ready to build? Follow the [Getting Started guide](getting-started.md) to publish your first documentation site in minutes.

## Plans

| Feature | Free | Pro | Enterprise |
| ------- | ---- | --- | ---------- |
| Subdomains, API references, themes, email domain access | - | Included | Included |
| Custom domains, guides, versions, Git Sync, Markdown, MDX, and landing pages | - | Included | Included |
| SSO/SAML, RBAC, priority support, and dedicated Slack or Teams support | - | - | Included |

Publishing a Docs site needs a paid plan. Every new team starts with a 7-day trial that includes Docs publishing.

[See the full comparison](../pricing.md) for Docs and the other Scalar products.

## Ready to publish?

We are committed to enabling developers and companies to practice the highest API industry standards.

<div class="flex gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Get started</a>
  <a class="t-editor__button button__secondary" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Book a demo</a>
</div>

## Frequently asked questions

<scalar-detail title="What is an API documentation platform?">

It is a tool that publishes everything a developer needs to use your API in one place: an interactive reference generated from your OpenAPI document, written guides, search, and access control. Scalar Docs does this with Markdown or MDX content stored in Git.

</scalar-detail>

<scalar-detail title="Is there a free plan?">

Every new team starts with a free 7-day trial that includes Docs publishing. After the trial, publishing a Docs site needs a paid plan, starting with Pro at $150 per month, which adds custom domains, Git Sync, Markdown, and MDX. See [pricing](/pricing) for every plan.

</scalar-detail>

<scalar-detail title="Can I host my docs on my own domain?">

Yes. Custom domains are included from the Pro plan, and subpath hosting is available on Business. See [domains](configuration/domains.md).

</scalar-detail>

<scalar-detail title="Do my docs stay in sync with my OpenAPI document?">

Yes. API references are generated from your OpenAPI or AsyncAPI documents, so publishing a new version of the document updates the reference. With Git Sync, a merge to your branch republishes the site.

</scalar-detail>

<scalar-detail title="Can I keep some documentation private?">

Yes. Access groups, included from the Pro plan, limit who can read your guides and API references. See [private docs](configuration/private-docs.md).

</scalar-detail>

<scalar-detail title="How do I migrate from another documentation tool?">

Most migrations come down to moving Markdown files and pointing Scalar at your OpenAPI document. We have guides for [Swagger UI](/resources/migration/swagger-ui), [Stoplight](/resources/migration/stoplight), and [Bump.sh](/resources/migration/bump), and Enterprise plans include migration services.

</scalar-detail>

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [OpenAPI vs Swagger](/learn/openapi/openapi-vs-swagger)
- **Docs:** [Getting started with Scalar Docs](/products/docs/getting-started)
- **Product:** [API Reference](/products/api-references) — the open-source renderer behind every Scalar Docs API page

<style>
  .t-editor__anchor {
    --font-visited: none;
  }

  main.content {
    overflow-x: clip;
  }

  .t-editor.page {
    position: relative;
  }

  .t-doc .layout-header {
    z-index: 10000;
  }

  .t-editor__button {
    min-width: 160px;
    justify-content: center;
  }

  .container-full {
    --scalar-container-sidebar-gap: calc(
      (
        100dvw - var(--scalar-container-width, 960px) -
          var(--scalar-sidebar-width, 0px) - var(--scalar-toc-width, 0px)
      ) / 2
    );
    width: calc(100dvw - var(--scalar-sidebar-width, 0px));
    margin-left: min(calc(-1 * var(--scalar-container-sidebar-gap)), -50px);
  }

  .docs-hero-image {
    margin-top: 32px;
  }

  .docs-hero-image {
    width: 150%;
    max-width: auto;
  }

  .logowall.logowall {
    margin-top: 48px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    align-items: center;
    gap: 40px;
  }

  .logowall-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .logowall-item svg {
    width: fit-content;
    height: auto;
    max-height: 24px;
  }

  .ign-logo__fill {
    fill: var(--scalar-color-1);
  }

  .fill-current-bg {
    fill: var(--scalar-background-1);
  }

  .feature {
    padding: 60px 0 !important;
  }

  .feature-container {
    gap: 6px;
    margin-top: 32px;
  }

  .feature-item {
    flex: 0 0 calc(50% - 6px);
  }

  @media screen and (max-width: 1000px) {
    .container-full {
      --scalar-container-sidebar-gap: 30px;
      width: 100dvw;
      padding-inline: 30px;
      margin-inline: -30px;
    }

    .hero-animation {
      margin-top: -100px !important;
      padding-inline: 0;
      margin-inline: 0;
    }

    .logowall.logowall {
      grid-template-columns: repeat(2, 1fr);
      column-gap: 20px;
      row-gap: 40px;
    }

    .logowall-item {
      justify-content: start;
    }

    .logowall-item svg {
      max-width: 100%;
      height: 100%;
      max-height: 20px;
    }

    .feature-item {
      flex: 0 0 calc(100% - 22px);
    }
  }
</style>
