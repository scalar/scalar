<div class="hero-animation container-full">
  <scalar-icon src="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/v1Pu6_BCmly6VhPAuotVZ.svg"></scalar-icon>
</div>
<div class="flex flex-col gap-3 hero small-test">
  <scalar-heading level="2" slug="scalar-docs" class="text-balance">
    The API platform your developers already love.<br>Built for the governance your enterprise needs.
  </scalar-heading>
  <p>
    Build your APIs on an OpenAPI-native platform with modern design workflows, customizable reference documentation and developer portals, hands-on exploration and SDK generation, and governance in Git and CI. Turn those same descriptions into <strong>Model Context Protocol (MCP)</strong> servers so AI agents and copilots call your APIs through a standard, controllable interface — with full visibility and enterprise controls to streamline how your teams ship and keep API quality high.
  </p>
</div>

<div class="flex gap-2">
  <a class="t-editor__button" href="https://dashboard.scalar.com/register">Get Started</a>
  <a class="t-editor__button" href="https://scalar.cal.com/scalar/chat-with-scalar" target="_blank">Book a Demo</a>
</div>

<br>
Powering the world's best API teams
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
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-sfcompute.svg"></scalar-icon>
  </div>
</div>

---

## By the numbers

| | |
| --- | --- |
| **14.3k+** | GitHub stars on [scalar/scalar](https://github.com/scalar/scalar) |
| **40+** | Framework and platform integration guides |
| **$0** | Free tier — upgrade when you need SSO, scale, and Enterprise support |

---

## API documentation and developer experience

### API references developers actually want to read.

Your APIs deserve reference documentation people open on purpose. Scalar renders OpenAPI description documents as fast, interactive references: search, navigation, try-it-out, and branding that matches your product. Publish from Git to custom domains or embed in your own apps — internal and external developers get an experience that feels like your stack, not a dated generic portal.

The same `@scalar/api-reference` package ships in major frameworks and powers Scalar Cloud, so grassroots adoption and central standards stay aligned.

---

## API governance and registry

### Enforce standards across every team without slowing anyone down.

Centralize OpenAPI descriptions in one registry. Connect Git so versions, branches, and reviews live where engineers already work. Enforce design rules with Spectral and catch issues in CI before production. Surface breaking changes, align style guides, and give platform teams visibility without turning API quality into a ticket queue.

Built for organizations that outgrew scattered files, wikis, and “the OpenAPI file somewhere in the repo.”

---

## AI-native APIs on open standards

### Your OpenAPI descriptions are the contract for humans, agents, and MCP.

Agents, copilots, and generated clients all need a machine-readable contract: operations, schemas, examples, and security. When descriptions drift or live in silos, people waste time and automation breaks first. Scalar keeps descriptions authoritative, linted, and published so documentation, SDKs, and AI tooling share one source of truth.

**MCP is becoming the default wire between LLMs and your systems.** The [Model Context Protocol](https://modelcontextprotocol.io/) lets assistants discover and invoke tools in a consistent way across Claude, Cursor, and the rest of the ecosystem. For enterprises, that shift matters as much as REST or OpenAPI did for the last era: without a governed path from description to agent-accessible tools, you get shadow integrations, over-privileged agents, and no audit trail. Scalar generates MCP servers from your OpenAPI descriptions so you choose **which** operations become tools, how they behave (lookup vs execute), and how authentication is handled per installation — the same governance story as your docs and registry, extended to agent workloads.

[Spin up MCP servers from OpenAPI →](../agent/mcp.md)

Open standards are how you scale safe API use — including AI-native workflows — without proprietary lock-in.

---

## Security, access, and deployment

**Single sign-on** — SAML SSO with your identity provider. Enterprise onboarding includes SSO setup support. [Configure SSO →](../sso/getting-started.md)

**Role-based access** — Control who can view, edit, and publish descriptions and documentation across products and environments.

**Auditability** — Activity and change history for reviews and incident response, alongside Git as your system of record.

**Self-hosting** — MIT-licensed core you can run on your own infrastructure when residency or policy requires it. Read and audit the code; deploy on your terms.

**Git-native workflows** — OpenAPI and Markdown beside application code. Branch, review, and release descriptions like any other artifact.

**Privacy-conscious hosting** — No third-party analytics on your custom domains, no visitor tracking cookies for docs traffic, and no IP logging for request traffic. [Docs privacy →](../docs/privacy.md) · [Privacy policy →](../../legal/privacy-policy.md)

**MCP with guardrails** — Expose only the endpoints you want as MCP tools; separate search vs execute modes; configure API authentication per installation so credentials stay off client devices. [MCP setup →](../agent/mcp.md)

---

## From open source to org-wide standard

Teams often start with the npm package in a single service, then expand when they need SSO, a registry, and shared governance. Scalar does not force a proprietary description format — your OpenAPI documents stay portable. Enterprise adds organization controls, SLAs, and migration support on top of the same primitives developers already chose.

Migrating from Stoplight, SwaggerHub, or similar tools typically means moving OpenAPI into Git (or keeping it there), connecting the registry, and recreating lint rules in Spectral. [Stoplight migration guide →](../../migration/stoplight.md)

---

## Open source by conviction

Scalar’s reference and client stack is MIT-licensed and developed in public on GitHub. Fork it, audit it, or self-host it. Enterprise adds operations and procurement-friendly controls — not a different description format.

- **14.3k+** stars and an active contributor community  
- **40+** documented integrations across languages and frameworks  
- Ongoing support for upstream projects the ecosystem relies on  

```html
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
<script>
  Scalar.createApiReference('#app', {
    url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
    proxyUrl: 'https://proxy.scalar.com',
  })
</script>
```

[Full HTML/JS example →](../../integrations/html-js.md)

---

## Talk to us about Enterprise

### Open standards. Enterprise scale.

Tell us about reference documentation, registry, governance, SDKs, MCP and agent access patterns, and how you want to deploy. We will follow up with security materials, pricing, and next steps.

<div class="flex gap-2">
  <a class="t-editor__button" href="https://dashboard.scalar.com/register">Talk to sales</a>
  <a class="t-editor__button" href="https://scalar.cal.com/scalar/chat-with-scalar" target="_blank">Book a Demo</a>
</div>

Prefer email? [support@scalar.com](mailto:support@scalar.com)

**What Enterprise includes**

- Onboarding and migration support  
- SAML SSO setup assistance  
- Priority support and dedicated channels (per agreement)  
- Uptime and SLA options (per agreement)  
- Security questionnaires and architecture reviews  
- MCP strategy: tool scoping, auth, and rollout for AI agents  

**Default OpenAPI reference documentation for:** FastAPI · ASP.NET Core · Hono · Laravel · NestJS · Next.js · Nuxt · Express · Fastify · Spring Boot

---

## FAQ

### Can we self-host?

Yes. Scalar is open source under the MIT License. You can deploy and operate it in your environment when policy requires it. Many teams combine Scalar Cloud with embedded or self-hosted components by product or region. Sales can help you choose a deployment model.

### Does Scalar fit our existing OpenAPI workflow?

Yes. Connect repositories if descriptions already live in Git, or sync from your existing authoring flow. Scalar supports code-first and design-first teams, generated or hand-written OpenAPI, and typical CI patterns. You do not need to replace Git to get a registry and published reference documentation.

### What happens to our API descriptions?

You keep them. They remain standard OpenAPI (YAML or JSON). Scalar does not require a proprietary format for documentation or SDK generation, so export and portability stay under your control.

### How does Enterprise pricing work?

Enterprise is priced for your seats, usage, and deployment needs. Compare tiers on the [Pricing](../pricing.md) page, or contact sales for a quote and contract terms.

### Can we migrate from Stoplight, SwaggerHub, or similar tools?

Yes. Scalar centers on OpenAPI with a modern reference UI, integrated API client, registry, and Git-centric workflows. Export existing work, connect GitHub, and port Spectral rules where you used custom linting. See the [Stoplight migration guide](../../migration/stoplight.md); we help with other sources on a call.

### What security and compliance materials do you provide?

Enterprise buyers receive security documentation, data processing information, and subprocessors as described in our [Privacy policy](../../legal/privacy-policy.md). For self-hosting, SSO, and data location, solutions engineering maps Scalar to your requirements. Contact sales for the current security pack and compliance roadmap.

### How does this relate to AI and our APIs?

Accurate OpenAPI is what tools and agents use to discover operations, parameters, and schemas. Scalar helps keep that contract current in the registry, enforce rules before merge, and publish reference documentation that both people and automation can rely on.

**MCP** is the piece that lets assistants use your API as first-class tools: Scalar can host MCP servers generated from your descriptions, with per-tool configuration (including read-only “search” vs real “execute” modes) and per-installation authentication so enterprise security teams can reason about agent access the same way they reason about API keys and OAuth. See [MCP servers](../agent/mcp.md).

### Why does MCP matter for Enterprise?

The agent ecosystem is standardizing on MCP for tool discovery and invocation. If your APIs are only documented for humans, teams will wire agents ad hoc — with inconsistent auth, no inventory of which operations agents can call, and weak accountability. Treating OpenAPI as the source of truth and MCP as the controlled surface to agents keeps **governance, observability, and least privilege** in one place — the same expectations you have for enterprise AI infrastructure, applied to **your** APIs through standards you already own.

### Who is Enterprise for?

Organizations that need SSO, stronger access control, priority support, SLAs, or tailored onboarding — and want one platform for reference documentation, registry, SDKs, API exploration, and **MCP-backed agent access** without leaving OpenAPI and Git behind.

<style>
    .resources-cta-container {
      border-radius: var(--scalar-radius-lg);
      border: var(--scalar-border-width) solid var(--scalar-border-color);
      width: 100%;
      padding: 12px 8px;
    }
  .resources-cta {
    max-height: fit-content;
    width: 100%;
    top: 12px;
    padding-top: 50px;
    padding-bottom: 200px;
  }
  .full-container-constrained {
    max-width: 720px;
    padding-right: 40px;
  }
  .full-container-constrained > .t-editor__heading {
    margin-top: 44px;
  }
  .full-container-constrained > .t-editor__paragraph {
    margin-top: 12px;
  }
  .hero-animation  {
    position: absolute;
    top: 0;
    z-index: -1;
    transform: scaleY(-1);
    margin-top: 0;
  }
  .hero-animation .fa {
    --fa-orange: rgba(40, 40, 45, .2);
    --fa-yellow: #252529;
    --fa-red: rgba(20, 20, 24, 0);
    --scalar-background-2: var(--scalar-background-1)
  }
  @supports (color: color(display-p3 1 1 1)) {
    .hero-animation .fa {
      --fa-orange: color(display-p3 0.18 0.18 0.19 / 0.2);
      --fa-yellow: color(display-p3 0.16 0.16 0.17);
      --fa-red: color(display-p3 0.1 0.1 0.11 / 0);
    }
  }
  .t-editor__page-title,
  .layout-aside-right,
  .t-editor__page-nav,
  .notify-container,
  .subheading,
  :not(.getting-started).footer,
  .t-editor .page-header,
  .content .page-nav,
  .t-doc__toc {
    display: none;
  }
  main.content {
    overflow-x: clip;
  }
  .t-doc .layout-header {
    z-index: 10000;
  }
  .t-editor__button {
    min-width: 160px;
    justify-content: center;
  }
  .t-editor .editor-content,
  .t-editor {
    padding-bottom: 0;
  }
  h3.t-editor__heading,
  h2.t-editor__heading {
    --font-size: var(--scalar-heading-1);
      margin-top: 0;
  }
  :root {
    --scalar-container-width: 960px;
    --scalar-toc-width: 0;
  }
  .hero.hero {
    margin-top: 88px;
  }
  .small-test {
    max-width: 680px;
    text-wrap: balance;
    margin-top: 44px;
    position: relative;
  }
  .t-editor .editor-static .page-node,
  .t-editor .page-node,
  .t-editor .content {
    max-width: var(--scalar-container-width);
    padding-bottom: 0;
    margin-bottom: 0;
  }
  .container {
    width: var(--scalar-container-width);
    margin: auto;
    position: relative;
  }
  .container-full {
    --scalar-container-sidebar-gap: calc(
      (
        (100dvw - var(--scalar-container-width) - var(--scalar-sidebar-width)) /
          2
      )
    );
    width: calc(100dvw - var(--scalar-sidebar-width));
    margin-left: min(-1 * var(--scalar-container-sidebar-gap), -50px);
  }
  .t-editor.page {
    position: relative;
    margin-right: unset;
  }
  .container {
    width: 900px;
    margin: auto;
    position: relative;
  }
  /* logos */
  .logowall.logowall {
    margin-top: 48px;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    align-items: center;
    gap: 40px;
  }
  .logowall-item {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .logowall-item svg {
    width: 100%;
    height: auto;
    max-height: 24px;
  }
  .ign-logo__fill {
    fill: var(--scalar-color-1);
  }
  .fill-current-bg {
    fill: var(--scalar-background-1);
  }
  /* feature */
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
  /* new stuff  */
  .expander {
    display: grid;
    grid-template-rows: 0fr;
    overflow: hidden;
    opacity: 0;
    transition: grid-template-rows 0.25s, opacity 0.25s ease-in-out;
  }
  .expander-content {
    min-height: 0;
    margin-bottom: 12px;
    margin-top: 6px;
    line-height: 1.45;
    font-size: 14px;
  }
  .expander-hover {
    height: 370px;
    position: relative;
  }
  .expander-hover:hover .expander {
    grid-template-rows: 1fr;
    opacity: 1;
    transition: grid-template-rows 0.5s, opacity 0.5s ease-in-out;
  }
  .expander.expanded .expander-content {
    visibility: visible;
  }
  .expander-hover-title {
    font-size: 20px;
    font-weight: var(--scalar-semibold);
    margin-top: 24px;
  }
  .expander-hover-link {
    --font-color: var(--scalar-color-2);
    --font-visited: var(--scalar-color-2);
    color: var(--font-color, var(--scalar-color-1));
    font-weight: var(--scalar-semibold);
    text-underline-offset: 0.25rem;
    text-decoration-thickness: 1px;
    text-decoration: underline;
    text-decoration-color: color-mix(
      in srgb,
      var(--font-color, var(--scalar-color-1)) 30%,
      transparent
    );
    margin-top: 6px;
  }
  .expander-hover:hover .expander-hover-link {
    --font-color: var(--scalar-color-1);
  }
  .expander-hover-preview {
    position: absolute;
    left: -120px;
    top: -220px;
    width: 1100px;
    mask-image: radial-gradient(circle at top left, black 25%, transparent 40%);
    pointer-events: none;
    opacity: 0;
    transition: all 0.3s ease-in-out;
    transform: rotate(1deg) translate3d(-10px, -10px, 0);
    max-height: 500px;
    overflow: hidden;
  }
  .expander-hover .relative {
    z-index: 1;
  }
  .expander-hover:hover .expander-hover-preview {
    opacity: 1;
    transform: rotate(2deg) translate3d(0, 0, 0);
    transition: all 0.3s ease-in-out 0.2s;
  }
  .expander-hover-preview img {
    margin-left: 0;
    mask-image: linear-gradient(black, transparent);
    width: 100%;
  }
  .expander-hover-sticker {
    height: 143px;
    width: 100%;
    display: flex;
    align-items: center;
    position: relative;
    margin-left: -12px;
    transition: transform 0.3s ease-in-out;
    justify-content: flex-start;
  }
  .expander-hover-sticker object {
    pointer-events: none;
  }
  .expander-hover-sticker img {
    max-height: initial;
    margin-left: initial;
  }
  .expander-hover:hover .expander-hover-sticker {
    transform: rotate(-3deg);
  }
  .expander-container {
    display: flex;
    gap: 44px;
  }
  .cta {
    padding: 80px 0;
    margin-top: 0 !important;
  }
  .mb-11 {
    margin-bottom: 44px;
  }
  /* footer */
  .getting-started.footer {
    position: relative;
    overflow: hidden;
    background: var(--scalar-background-2);
    padding-inline: 20px;
    padding-bottom: 200px;
    margin-top: 100px;
  }
  .footer-animation {
    margin-inline: -20px;
  }
  .footer-animation svg {
    position: absolute;
    bottom: 0;
  }
  .footer-content {
    display: flex;
    gap: 48px;
    max-width: var(--scalar-container-width);
    width: 100%;
    margin: auto;
    padding-top: 92px;
  }
  .footer-content > * {
    flex: 1;
  }
  .footer-content span,
  .footer-content p,
  .footer-content a,
  .footer-content button {
    position: relative;
    z-index: 1;
  }
  .w-1\/3 {
    width: 33.33%
  }
  .light-mode .dark-image {
    display: none;
  }
  .dark-mode .light-image {
    display: none;
  }
  .sticker-clip-client {
    clip-path: path("M158 91.9102C158 95.8908 154.773 99.1172 150.792 99.1172L147.269 99.1172L147.269 105.78C147.268 107.948 145.511 109.705 143.343 109.705L86.2051 109.705C84.0373 109.705 82.2795 107.948 82.2793 105.78L82.2793 99.1172L7.208 99.1172C3.22741 99.1172 1.10673e-05 95.8908 -4.01752e-06 91.9101L-3.50643e-06 80.2178C-3.47119e-06 79.4117 0.135571 78.6109 0.400387 77.8496L25.7949 4.83984C26.8028 1.94219 29.5346 -5.6154e-06 32.6025 -5.4813e-06L150.792 -3.15072e-07C154.773 -1.41078e-07 158 3.22654 158 7.20703L158 91.9102Z")
  }
  .sticker-clip-sdk {
    clip-path: path("M60.0562 8.61129C65.9233 -1.83053 81.0294 -1.61478 86.5955 8.99068L142.416 115.353C144.543 119.406 141.567 124.259 136.991 124.201L114.679 123.918L114.138 135.797C113.962 139.654 110.761 142.678 106.9 142.634L32.9393 141.782C29.1212 141.738 26.0084 138.707 25.864 134.891L25.406 122.787L6.28841 122.544C1.70363 122.486 -1.1476 117.543 1.09835 113.545L60.0562 8.61129Z")
  }
  .sticker-clip-registry {
    clip-path: path("M71.0986 1.13334C75.8537 -0.596969 81.1116 1.85514 82.8428 6.6099L90.3037 27.1079H98.5059C104.199 27.108 108.814 31.7235 108.814 37.4165V77.9663L121.32 112.329C119.703 112.128 118.003 112.298 116.351 112.899C110.96 114.861 108.12 120.659 110.009 125.848C111.898 131.038 117.8 133.654 123.191 131.692C124.844 131.091 126.254 130.127 127.364 128.933L134.608 148.835C136.339 153.591 133.887 158.849 129.132 160.58L73.3945 180.866C68.6393 182.596 63.3816 180.145 61.6504 175.39L58.958 167.994H2.29102C1.02582 167.994 0 166.968 0 165.703V29.398C0.000538247 28.1333 1.02616 27.1079 2.29102 27.1079H9.8125C10.6721 24.5603 12.6383 22.4116 15.3613 21.4204L71.0986 1.13334Z")
  }
  .sticker-clip-docs {
    overflow: hidden;
    border-radius: 20px;
  }
  @media screen and (max-width: 1280px) {
      .resources-cta {
        display: none;
      }
      .full-container-constrained {
        padding-right: 0px;
        max-width: 100%;
      }
    }
  @media screen and (max-width: 1000px) {
    .t-doc {
      --scalar-sidebar-width: 0px;
    }
    .hero.hero {
      margin-top: 188px;
    }
    .t-editor.page {
      padding-inline: 30px;
    }
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
      grid-template-columns: repeat(3, 1fr);
      column-gap: 20px;
      row-gap: 40px;
    }
    .logowall-item {
      justify-content: start;
    }
    .logowall-item svg {
      width: auto;
      max-width: 100%;
      height: 100%;
      max-height: 20px;
    }
    .feature-item {
      flex: 0 0 calc(100% - 22px);
    }
    .expander-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      row-gap: 0;
    }
    .expander-hover {
      width: auto;
    }
    .expander-hover .expander {
      grid-template-rows: 1fr;
      opacity: 1;
    }
    .expander .expander-content {
      visibility: visible;
    }
    .footer-content {
      flex-direction: column;
    }
    .footer-content > * {
      flex: initial;
    }
  }
</style>
