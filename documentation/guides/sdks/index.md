# SDK Generator

Generate type-safe SDKs and CLIs from OpenAPI in minutes. Build clients for TypeScript, Python, CLI targets, and more without maintaining generator infrastructure.

<div class="flex gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Get started</a>
  <a class="t-editor__button button__secondary" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Book a demo</a>
</div>

<scalar-image
  class="sdks-hero-image"
  src="/sdks-animated.svg"
  src-dark="/sdks-animated-dark.svg"
  alt="Scalar SDK generation interface"
  size="full">
</scalar-image>

## Features

<div class="feature">
  <div class="feature-container">
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/arrow-up-right"></scalar-icon>
        OpenAPI-first
      </b>
      <p class="leading-6">Generate SDKs and CLIs from the OpenAPI documents your team already maintains.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/brackets-square"></scalar-icon>
        Custom code
      </b>
      <p class="leading-6">Customize clients without forking the generated SDK or losing future updates.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/code"></scalar-icon>
        Code samples
      </b>
      <p class="leading-6">Keep SDK usage examples close to your API reference and developer docs.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/fingerprint"></scalar-icon>
        OpenAPI authentication
      </b>
      <p class="leading-6">Generate clients that understand the authentication patterns in your API description.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/terminal-window"></scalar-icon>
        CLI targets
      </b>
      <p class="leading-6">Generate command-line tools alongside SDKs when your API needs terminal workflows.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/file-cloud"></scalar-icon>
        File streaming support
      </b>
      <p class="leading-6">Handle file uploads and streaming responses in generated clients.</p>
    </div>
  </div>
</div>

## Ready to generate SDKs and CLIs?

Follow the [Getting Started guide](getting-started.md) to generate your first target from the dashboard.

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

  .sdks-hero-image {
    margin-top: 32px;
  }

  .feature-container {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 48px;
    row-gap: 36px;
    margin-top: 32px;
  }

  @media screen and (max-width: 1000px) {
    .feature-container {
      grid-template-columns: 1fr;
      row-gap: 28px;
    }
  }
</style>
