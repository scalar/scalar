# Open-source API client

Send requests, organize collections, and test your APIs in a free, open-source API client that reads your OpenAPI document instead of making you rebuild it by hand.

Scalar API Client is built on the OpenAPI standard and runs offline-first in the browser or as a desktop app for macOS, Windows, and Linux.

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

## Why developers switch to it

- **Open source, MIT licensed.** The client lives in the same repository as the Scalar API Reference, [github.com/scalar/scalar](https://github.com/scalar/scalar), which has 15.7k stars on GitHub.
- **Already in front of your users.** Every Scalar API reference opens this client when someone clicks **Test Request**, including the references in the eight frameworks that ship Scalar as their default documentation UI: Effect, ElysiaJS, HappyX, Litestar, Nitro, oRPC, Platformatic, and Spry.
- **Documented on Microsoft Learn.** The ASP.NET Core OpenAPI guide covers Scalar in [Use Scalar for interactive API documentation](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents#use-scalar-for-interactive-api-documentation), and the request client comes with it.

## Your OpenAPI document is the collection

Most API clients ask you to copy endpoints into a collection and keep the two in sync forever. Scalar skips that step. [Import](import.md) an OpenAPI 3.x file or URL and you get every request, parameter, server, and authentication scheme at once. Swagger 2.0 files are upgraded on import, and Postman collections and cURL commands work too. When the document changes on disk, the client can watch it and update the requests.

## Offline-first by design

Requests and collections are stored locally, and nothing waits on a cloud sync. Open the browser version to try it straight away, or install the desktop app. Working locally matters when you are testing an internal API, working on a plane, or simply do not want request history in someone else's database.

## Environments, scripts, and tests

Switch between local, staging, and production with [environments](environments.md). [Pre-request scripts](scripts.md) set headers or variables before a call, and [post-response tests](testing.md) assert on status codes and bodies, so exploring an API and checking it are the same workflow. Scripts use the Postman-compatible `pm` API, so existing snippets usually carry over.

## From testing to documentation

If you document your API with Scalar, the same OpenAPI document powers the [API reference](/products/api-references), this client, and hosted [Scalar Docs](/products/docs). Framework guides for [.NET](/docs-for/dotnet), [FastAPI](/docs-for/fastapi), and [NestJS](/docs-for/nestjs) show how to get a document out of your code in the first place, and the [learn hub](/learn) explains [what an API client is](/learn/openapi/what-is-an-api-client) if you are comparing options. Teams such as Thomson Reuters, Clerk, Lufthansa, and Zoom publish docs with Scalar; see [our customers](/customers).

Want the client inside hosted docs for your whole team? [Start free](https://dashboard.scalar.com/register) or [book a demo](https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a).

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
      <p class="leading-6">Generate collections from OpenAPI documents and keep them close to your source of truth.</p>
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

## Frequently asked questions

<scalar-detail title="Is Scalar API Client free?">

Yes. The API Client is open source under the MIT license and free to use in the browser at [client.scalar.com](https://client.scalar.com) or as a desktop app.

</scalar-detail>

<scalar-detail title="Is Scalar a Postman alternative?">

For many teams, yes. Scalar covers requests, collections, environments, scripts, and response tests, and it can import Postman collections (v2.0 and v2.1). The main difference is the source of truth: Scalar builds collections from your OpenAPI document, so they stay in sync with the API. See [Scalar vs Postman](/resources/compare/postman) for an honest comparison.

</scalar-detail>

<scalar-detail title="Which platforms does the API Client run on?">

The browser, plus desktop apps for macOS, Windows, and Linux. See [Download](/products/api-client/download) for the installers.

</scalar-detail>

<scalar-detail title="Can I import an OpenAPI or Swagger file?">

Yes. OpenAPI 3.x in JSON or YAML is the native format. Swagger 2.0 files are upgraded to OpenAPI 3.1 on import, and you can also import from a URL, a Postman collection, or a cURL command.

</scalar-detail>

<scalar-detail title="Does the API Client work offline?">

Yes. It is offline-first: requests and collections live on your machine, and the desktop app does not need a network connection except for the requests you send.

</scalar-detail>

<scalar-detail title="Can I write tests for API responses?">

Yes. Post-response scripts let you assert on status codes, headers, and bodies with the Postman-compatible `pm` API. The [testing guide](testing.md) has examples.

</scalar-detail>

## Related

- **Learn:** [What is an API client?](/learn/openapi/what-is-an-api-client) · [What is OpenAPI?](/learn/openapi/what-is-openapi)
- **Docs:** [Getting started with the API Client](/products/api-client/getting-started)
- **Product:** [API Reference](/products/api-references) — the same client, embedded in your API documentation

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
