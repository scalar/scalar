# Scalar Docs

Documentation that stays in sync with your API and code. Pull content from GitHub, get previews on every pull request, deploy on merge, or publish from anywhere with the CLI.

The site you are reading was built with Docs. Teams use it to combine product guides, API references, OpenAPI-powered search, and release-ready developer portals in one place.

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
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-tr.svg"></scalar-icon>
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

Include interactive API references for a single API or hundreds of APIs. Everything is based on the OpenAPI standard, so your documentation can stay in sync with the API description your team already maintains.

<scalar-callout type="info" icon="phosphor/regular/info">
  Just need an API reference? Use the [API Reference](../../guides/api-references/getting-started.md). It is open source, free, and has integrations for REST API frameworks.
</scalar-callout>

Ready to build? Follow the [Getting Started guide](getting-started.md) to publish your first documentation site in minutes.

## Plans

| Feature | Free | Pro | Enterprise |
| ------- | ---- | --- | ---------- |
| Subdomains, API references, themes, email domain access | Included | Included | Included |
| Custom domains, guides, versions, Git Sync, Markdown, MDX, and landing pages | - | Included | Included |
| SSO/SAML, RBAC, priority support, and dedicated Slack or Teams support | - | - | Included |

[See the full comparison](../pricing.md) for Docs and the other Scalar products.

## Ready to publish?

We are committed to enabling developers and companies to practice the highest API industry standards.

<div class="flex gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Get started</a>
  <a class="t-editor__button button__secondary" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Book a demo</a>
</div>

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
