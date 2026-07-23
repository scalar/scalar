# Registry

Store, version, and manage OpenAPI documents, JSON Schema, and Spectral rules in one source of truth with a deep Git integration.

<div class="flex gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Get started</a>
  <a class="t-editor__button button__secondary" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Book a demo</a>
</div>

<scalar-image
  class="registry-hero-image"
  src="/registry-animated.svg"
  src-dark="/registry-animated-dark.svg"
  alt="Scalar Registry interface"
  size="full">
</scalar-image>

## Why a Registry?

Managing OpenAPI can get messy fast. Teams need to know where the source of truth lives, how versions are managed, who has access, and how downstream consumers discover updates.

Registry gives your team a central place for API descriptions and the workflows around them. Once an API description is in Registry, you can power docs, SDKs, publishing, and automation from the same source.

## Create docs and SDKs

Create API docs from Registry with just a few clicks. Your docs stay connected to OpenAPI changes, so updates move from source to published documentation without copy-paste work.

<scalar-image
  src="/api-docs-static-zoom.svg"
  src-dark="/api-docs-static-zoom-dark.svg"
  alt="Scalar Docs generated from Registry"
  size="full">
</scalar-image>

Generate SDKs from the same OpenAPI documents. Keep client libraries aligned with API changes while Registry handles the connection between the source document and the generated tooling.

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
        <scalar-icon src="phosphor/bold/git-branch"></scalar-icon>
        Single source of truth
      </b>
      <p class="leading-6">Keep API descriptions, schemas, and rules in one managed place.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/arrows-clockwise"></scalar-icon>
        Git integration
      </b>
      <p class="leading-6">Connect Registry to repository workflows so updates can follow your existing review process.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/arrow-up-right"></scalar-icon>
        OpenAPI documents
      </b>
      <p class="leading-6">Version and publish OpenAPI documents used by docs, SDKs, and automation.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/brackets-curly"></scalar-icon>
        JSON Schema support
      </b>
      <p class="leading-6">Manage shared schemas alongside the API descriptions that depend on them.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/warning-octagon"></scalar-icon>
        Spectral rules
      </b>
      <p class="leading-6">Store rules for consistent API governance and validation workflows.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/lock-simple"></scalar-icon>
        Private or public
      </b>
      <p class="leading-6">Control whether API descriptions are internal, shared with a team, or public.</p>
    </div>
  </div>
</div>

## Ready to manage your APIs?

Follow the [Getting Started guide](getting-started.md) to create an account and upload your first OpenAPI document.

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

  .registry-hero-image {
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
