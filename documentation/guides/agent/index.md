# MCP & Agent

Connect your APIs to LLMs quickly, securely, and with minimal context.

Upload your OpenAPI documents and instantly expose them as an MCP server; just-in-time tool calls, secure delegated auth, and only 0.2% of your context window no matter how many APIs you need.

<div class="flex gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Get started</a>
  <a class="t-editor__button button__secondary" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Contact sales</a>
</div>

<div class="logowall">
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-bobcat.svg"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-clerk.svg?v=2"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-partech.svg?v=2"></scalar-icon>
  </div>
</div>

## Everything agents need

<div class="feature">
  <div class="feature-container">
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/grid-four"></scalar-icon>
        Just-in-time tool calls
      </b>
      <p class="leading-6">Three tools cover any API. Operation details are retrieved when needed, not dumped into the first turn.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/shield-check"></scalar-icon>
        Secure delegated auth
      </b>
      <p class="leading-6">Configure OAuth, API keys, or bearer tokens per installation. Agents never receive your upstream credentials.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/users-three"></scalar-icon>
        Scoped access
      </b>
      <p class="leading-6">Decide which APIs and endpoints each MCP installation may call. Private by default; share carefully via team flows.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/arrows-out-line-horizontal"></scalar-icon>
        Isolated execution
      </b>
      <p class="leading-6">Sandboxed requests so concurrent agents and automations can share the same catalog safely.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/article"></scalar-icon>
        Markdown in MCP
      </b>
      <p class="leading-6">Expose guides and long-form documentation beside API tools when you want extra context in the server.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/infinity"></scalar-icon>
        Public and internal APIs
      </b>
      <p class="leading-6">Works for public SaaS APIs and for large internal microservice catalogs without growing the tool list.</p>
    </div>
  </div>
</div>

## Ready to connect your APIs?

Spin up your first MCP server in under a minute—no boilerplate servers to maintain. Follow the [Getting Started guide](getting-started.md) to upload a spec, configure access, and connect your agent.

<div class="flex gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Get started</a>
  <a class="t-editor__button button__secondary" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Contact sales</a>
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

  .feature-container {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 48px;
    row-gap: 36px;
    margin-top: 32px;
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


  @media screen and (max-width: 1000px) {
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

    .feature-container {
      grid-template-columns: 1fr;
      row-gap: 28px;
    }
  }
</style>
