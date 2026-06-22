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

## Get started

[Download the app](./download.md) for macOS, Windows, or Linux, or jump straight into the [browser version](https://client.scalar.com).

<scalar-steps>
  <scalar-step id="step-1" title="Open API Client">

Install the desktop app or open the browser version if you want to try it instantly.

  </scalar-step>

  <scalar-step id="step-2" title="Send your first request">

Enter a URL, choose an HTTP method, and send the request to inspect the response right away.

  </scalar-step>

  <scalar-step id="step-3" title="Import your OpenAPI description">

Drag and drop an OpenAPI file or import from a URL to generate a complete collection with requests, authentication, and documentation.

  </scalar-step>

  <scalar-step id="step-4" title="Keep everything in sync">

When your OpenAPI description changes on disk, API Client can watch for updates and keep requests and collections aligned.

  </scalar-step>

  <scalar-step id="step-5" title="Add response tests">

Use [post-response scripts](./testing.md) to validate responses and automate checks while you explore your API.

  </scalar-step>
</scalar-steps>

## Import and sync OpenAPI

Bring an OpenAPI description into API Client to generate requests, authentication, and collection structure from the API your team already maintains.

Use [Import](./import.md) to bring in local files or URLs, then use [environments](./environments.md) and [dynamic variables](./dynamic-variables.md) to move between local, staging, and production without duplicating requests.

## Test and automate responses

API Client supports request scripts and response tests, so you can automate setup, assertions, and debugging as you work through an API.

Start with [Scripts](./scripts.md) for pre-request and post-response workflows, then use [Testing](./testing.md) to validate status codes, headers, and response bodies.

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

Start in the browser or download the desktop app for your platform.

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
