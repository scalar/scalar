# API registry for OpenAPI and AsyncAPI

Keep every OpenAPI and AsyncAPI document your company publishes in one versioned API registry, and power docs, SDKs, and MCP servers from it.

Scalar Registry stores, versions, and manages OpenAPI and AsyncAPI documents, JSON Schema, and Spectral rules in one source of truth with a deep Git integration.

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

## Why teams put their APIs in Scalar

- **One document, every interface.** A single API document in Registry feeds your [API documentation](/products/docs), [SDKs](/products/sdk-generator), and [hosted MCP servers](/products/agent/mcp), so they cannot drift apart.
- **Built on open standards and open source.** Scalar's API tooling is developed in the open at [github.com/scalar/scalar](https://github.com/scalar/scalar), with 15.7k GitHub stars. The API reference that renders your registry documents is documented on [Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents#use-scalar-for-interactive-api-documentation) and is the default docs UI in eight frameworks.
- **Used by teams that run many APIs.** Companies such as Thomson Reuters, Lufthansa, and PAR publish developer portals with Scalar; see [customers](/customers).

## Publish from the command line or CI

Registry fits the way API descriptions are already produced. Push a document with one [CLI](cli.md) command, `scalar registry publish ./openapi.yaml --namespace your-team --slug your-api`, or wire the same step into [GitHub Actions](github-actions.md) or [GitLab CI/CD](gitlab-ci.md) so every merge publishes a new version. The command is the same for OpenAPI and [AsyncAPI](../../asyncapi.md) documents. Prefer clicking? [Upload](upload.md) in the dashboard instead.

## Governance with Spectral rules

Store Spectral-compatible [rules](rules.md) in Registry and lint every document against the same ruleset, locally with `scalar document lint` or in CI before a change is published. Shared [JSON Schema](schemas.md) objects live next to the APIs that reference them, so common models are defined once.

## Where your OpenAPI documents come from

Many teams generate their OpenAPI document from code. The framework guides for [.NET](/docs-for/dotnet), [FastAPI](/docs-for/fastapi), and [NestJS](/docs-for/nestjs) show how, and the [learn hub](/learn) covers OpenAPI itself. Every plan includes Registry; plans differ in how many APIs you can publish (3 on Free, 15 on Pro, 25 on Business, unlimited on Enterprise). [Start free](https://dashboard.scalar.com/register) or [book a demo](https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a).

## Why a Registry?

Managing APIs can get messy fast. Teams need to know where the source of truth lives, how versions are managed, who has access, and how downstream consumers discover updates.

Registry gives your team a central place for OpenAPI and AsyncAPI documents and the workflows around them. Once an API document is in Registry, you can power docs, SDKs, publishing, and automation from the same source.

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
      <p class="leading-6">Keep API documents, schemas, and rules in one managed place.</p>
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
        OpenAPI and AsyncAPI
      </b>
      <p class="leading-6">Version and publish OpenAPI and AsyncAPI documents used by docs, SDKs, and automation.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/brackets-curly"></scalar-icon>
        JSON Schema support
      </b>
      <p class="leading-6">Manage shared schemas alongside the API documents that depend on them.</p>
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
      <p class="leading-6">Control whether API documents are internal, shared with a team, or public.</p>
    </div>
  </div>
</div>

## Ready to manage your APIs?

Follow the [Getting Started guide](getting-started.md) to create an account and upload your first API document.

<div class="flex gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Get started</a>
  <a class="t-editor__button button__secondary" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Book a demo</a>
</div>

## Frequently asked questions

<scalar-detail title="What is an API registry?">

An API registry is the central, versioned store for your API descriptions. Instead of OpenAPI files scattered across repositories and wikis, every team publishes to one place, and docs, SDKs, and other tools read from it.

</scalar-detail>

<scalar-detail title="Does Scalar Registry support AsyncAPI?">

Yes. Registry stores and publishes AsyncAPI documents the same way as OpenAPI. `scalar document lint` also lints AsyncAPI with Spectral's AsyncAPI ruleset; `scalar document validate` is OpenAPI-only today.

</scalar-detail>

<scalar-detail title="How do I publish an OpenAPI document to the registry?">

Run `scalar registry publish ./openapi.yaml --namespace your-team --slug your-api` with the Scalar CLI, use the [GitHub Actions](github-actions.md) or [GitLab CI/CD](gitlab-ci.md) examples, or upload the file in the dashboard.

</scalar-detail>

<scalar-detail title="Can I keep API documents private?">

Yes. You control whether each API document is internal, shared with a team, or public, and the CLI can publish a version as private.

</scalar-detail>

<scalar-detail title="Can I lint API documents with my own rules?">

Yes. Store Spectral-compatible rulesets in Registry and reference them with `scalar document lint --rule`, locally or in CI. See [rules](rules.md).

</scalar-detail>

<scalar-detail title="Is Registry free?">

Registry is part of every plan, including Free. The Free plan covers up to 3 APIs, and larger plans raise that limit. See [pricing](/pricing).

</scalar-detail>

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [API catalog](/learn/openapi/api-catalog)
- **Docs:** [Publish with the CLI](/products/registry/cli)
- **Product:** [SDK generator](/products/sdk-generator) — generate typed clients from the documents in your registry

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
