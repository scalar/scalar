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

> [!NOTE]
> SDK generation is part of our paid plans and costs $100 per month per target. Keep this in mind when selecting what you want to generate.

Make sure you have created a Scalar account and are logged in. If you are new to Scalar, start with the [create account guide](../registry/getting-started.md#create-your-scalar-account).

## Generate your first target

<scalar-steps>
  <scalar-step id="step-1" title="Upload OpenAPI Document">

From the [dashboard](https://dashboard.scalar.com), click "Create new SDK".

If you do not already have an OpenAPI document in the registry, import it directly from the modal.

  </scalar-step>

  <scalar-step id="step-2" title="Select Desired Targets">

Select as many SDKs or CLIs as you need, or choose one target to start. Once you click "Continue", Scalar begins generating your targets.

  </scalar-step>

  <scalar-step id="step-3" title="Manage your new SDKs">

Once created, you will be redirected to the SDK overview page where you can:

- Configure SDK settings
- Add the GitHub integration
- Download the SDK client

  </scalar-step>
</scalar-steps>

<scalar-image
  src="/sdk-dashboard-static.svg"
  src-dark="/sdk-dashboard-static-dark.svg"
  alt="Scalar SDK dashboard"
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
