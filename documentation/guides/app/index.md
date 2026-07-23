# API Client

A modern, open-source API client built on the OpenAPI standard. Send requests, organize collections, and test your APIs from a beautiful, offline-first interface available on every platform.

<div class="flex gap-2">
  <a class="t-editor__button button__primary" href="https://client.scalar.com/" target="_blank">Try in browser</a>
  <a class="t-editor__button button__secondary" href="/products/api-client/download">Download</a>
</div>

<scalar-image
  class="api-client-hero-image"
  src="/api-client-static.svg"
  src-dark="/api-client-static-dark.svg"
  alt="Scalar API Client interface"
  size="full">
</scalar-image>

## Features

<div class="feature">
  <div class="feature-container">
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-orange">
        <scalar-icon src="phosphor/bold/wifi-slash"></scalar-icon>
        Offline-first
      </b>
      <p class="leading-6">Work locally with requests and collections without waiting on cloud sync.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-orange">
        <scalar-icon src="phosphor/bold/arrow-up-right"></scalar-icon>
        OpenAPI-native
      </b>
      <p class="leading-6">Generate collections from OpenAPI descriptions and keep them close to your source of truth.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-orange">
        <scalar-icon src="phosphor/bold/desktop-tower"></scalar-icon>
        Cross-platform
      </b>
      <p class="leading-6">Use API Client in the browser or on macOS, Windows, and Linux.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-orange">
        <scalar-icon src="phosphor/bold/globe"></scalar-icon>
        Environments
      </b>
      <p class="leading-6">Manage variables for local, staging, and production without duplicating requests.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-orange">
        <scalar-icon src="phosphor/bold/file-code"></scalar-icon>
        Scripts and tests
      </b>
      <p class="leading-6">Automate setup and validate responses with request scripts and test assertions.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-orange">
        <scalar-icon src="phosphor/bold/lock-simple-open"></scalar-icon>
        No vendor lock-in
      </b>
      <p class="leading-6">Build on open standards with an open-source client that keeps your API work portable.</p>
    </div>
  </div>
</div>

## Ready to send your first request?

Start in the browser or download the desktop app for your platform, then follow the [Getting Started guide](getting-started.md).

<div class="flex gap-2">
  <a class="t-editor__button button__primary" href="https://client.scalar.com/" target="_blank">Try in browser</a>
  <a class="t-editor__button button__secondary" href="/products/api-client/download">Download</a>
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

  .api-client-hero-image {
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
