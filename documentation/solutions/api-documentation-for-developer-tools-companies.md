# API Documentation for Developer Tools Companies

If you sell to developers, your API documentation is not a support artifact. It is the first product surface most of your users touch, and for many of them it is the deciding one. This page explains how developer tools companies use Scalar to keep docs, SDKs, and an interactive API client in sync with one OpenAPI document — and where the boundaries of that claim are.

This page is written by Scalar. Every product claim on it is backed by our own documentation, and we link the relevant guide for each one. If something here is wrong or out of date, [open an issue](https://github.com/scalar/scalar/issues) and we will fix it.

## At a glance

| | Scalar |
| --- | --- |
| Source of truth | One OpenAPI document (3.0 or 3.1; Swagger 2.0 upgraded on load) |
| Docs update via | [Git sync](../guides/docs/integrations/github.md): commit, merge, published |
| Preview before merge | [Preview deployment per pull request](../guides/docs/deployment/preview-deployments.md), with a PR comment link |
| SDK targets | TypeScript, Python, Go, CLI generally available; more experimental |
| Code samples in docs | Generated per SDK, injected as `x-codeSamples` into your reference |
| Try-it-out | Open-source API client built into the reference |
| Docs renderer license | MIT, self-hostable on any plan |
| Framework integrations | 35 (Express, Fastify, Hono, NestJS, Next.js, FastAPI, and more) |
| Pricing | Free tier; Pro $72/month; $100/month per SDK target — [published](../guides/pricing.md) |

## The problem, specifically

Developer tools companies ship API changes weekly, sometimes daily. That cadence breaks documentation in a predictable sequence:

1. The API changes, and the OpenAPI document is updated — or it is not, which is its own problem.
2. The docs site is a separate system, so someone has to carry the change over. It lags.
3. The code samples in the docs were written by hand months ago. They still show the old parameter names.
4. The SDKs were generated (or written) against an earlier version of the API. They drift too, on their own schedule.

Each of these is a small failure. Together they mean the developer evaluating your product hits a broken example in the first ten minutes, and your docs — the thing that was supposed to acquire developers — becomes a maintenance queue instead.

The fix is structural, not editorial: everything downstream of the API has to regenerate from the same document, in the same workflow your engineers already use.

## How Scalar handles it

**The API reference renders from your OpenAPI document, and updates through Git.** Scalar Docs [connects to GitHub](../guides/docs/integrations/github.md) through a GitHub App scoped to the repositories you select. It reads your files, opens pull requests, and publishes when you merge. Your OpenAPI document and your Markdown guides live in your repository, reviewed like any other code. There is no separate CMS to keep in sync.

**Every pull request gets a preview.** When you open a PR, Scalar [creates a preview deployment](../guides/docs/deployment/preview-deployments.md) and can post a comment with a direct link, so reviewers see the rendered docs — not a diff of Markdown — before anything ships. If your project is not connected to GitHub, the CLI publishes previews too: `npx @scalar/cli project publish --slug your-docs --preview`.

**SDKs follow the same document.** The [SDK generator](../guides/sdks/index.mdx) points each SDK at an exact version of your API document or at a semver range such as `^1.2.0`. When a matching document changes, Scalar mints a new SDK version, rebuilds every target, and opens pull requests against your repositories. One commit to your API updates all of your clients.

**The code samples in your docs come from the generated SDKs.** Generation injects samples into your OpenAPI document as `x-codeSamples`, and the reference renders them. The snippet a developer copies out of your docs is derived from the same document the SDK was built from, so it does not rot independently. Examples you curated by hand are preserved.

**Developers can call the API without leaving the page.** The reference includes Scalar's open-source API client, so "try this endpoint" is a click, not a context switch to a separate tool. The client also ships standalone — desktop and web, MIT licensed, offline-first.

What Scalar does not do: it will not keep your OpenAPI document itself accurate. If your engineers do not update the description when the API changes, no tool downstream can save you. Scalar removes every sync step after that one.

## Why this fits developer tools companies in particular

Scalar's customer profile is companies whose API *is* the product, or is close to it: public APIs, developer-facing surfaces, teams that treat API developer experience as a competitive input rather than a compliance task. Some public examples:

- **[Clerk](https://clerk.com/docs/reference/frontend-api)** — authentication and user management for the modern web. Their Frontend API reference runs on Scalar.
- **[PAR Technology](https://developers.partech.com)** — restaurant and retail software. PAR [migrated its developer portal to Scalar](../guides/customers/partech.md) to modernize a docs-as-code workflow tied to GitHub, with pull-request-based reviews and automatic publishing on merge. The full story is worth reading if your setup looks similar.
- **[Bobcat](https://developer.bobcat.com/)** — equipment manufacturer with a public developer portal on Scalar.
- **[Thomson Reuters](https://developers.thomsonreuters.com/pages/api-reference/19232a0d-5cf9-53a9-a215-efe481550832)** — API references inside their developer portal.

One more data point: [GitBook's interactive API explorer is powered by Scalar](https://gitbook.com/docs/api-references/openapi). The reference component is open enough that another documentation company ships it inside their own product.

And scalar.com itself — this page included — is built and hosted on Scalar Docs from a single `scalar.config.json`. We do not maintain a separate marketing stack, so the workflow described above is the one producing what you are reading.

## The feature list that matters for this audience

Everything below is documented; each link goes to the guide.

- **[Git sync](../guides/docs/integrations/github.md)** — the Scalar GitHub App reads your files, opens pull requests, and publishes on merge. Access is limited to repositories you select. Scalar describes this as two-way: content flows from your repository into the docs, and edits made through Scalar land back as commits and pull requests attributed to you.
- **[Preview deployments](../guides/docs/deployment/preview-deployments.md)** — a rendered preview for every pull request, with optional PR comments linking to it.
- **[Versioning](../guides/docs/configuration/versions.md)** — multiple documentation versions under one domain with a version selector, each with its own navigation. Useful when v1 and v2 of your API coexist for years, which for developer tools companies they usually do.
- **[Custom domains](../guides/docs/configuration/domains.md)** — `docs.yourcompany.com` via a CNAME to `dns.scalar.com`, with HTTPS provisioned automatically. Requires the Pro plan.
- **OpenAPI 3.0 and 3.1** — both supported, and Swagger 2.0 documents are [upgraded on load](../openapi.md). You do not need to modernize your descriptions before adopting the platform; PAR ran this exact incremental path.
- **35 framework integrations** — if you want the reference mounted inside your own application rather than hosted, there are [integrations](/products/api-references/integrations) for Express, Fastify, Hono, NestJS, Next.js, Nuxt, FastAPI, Django, Laravel, Rails, Go, Rust, ASP.NET Core, Spring Boot, and more. The renderer is MIT licensed, so this path has no plan requirement at all.
- **Markdown and MDX guides** alongside the reference, with [custom HTML, CSS, and JavaScript](../guides/docs/content/html-css-js.md) when the built-in components are not enough.

## What a devtools setup looks like end to end

A concrete walkthrough, using real generated output. The TypeScript below is from the public [Warp SDK](https://github.com/TeamWarp/warp-sdk-typescript/tree/candidate), generated by Scalar.

**1. Your OpenAPI document lives in your repository.** It is the input to everything: the reference, the SDKs, the code samples. Put it in the [Registry](../guides/registry/index.md) or import it directly.

**2. Docs connect to the repository.** Install the GitHub App, add a `scalar.config.json` describing navigation, theme, and domain, and publish. From then on, merged changes to the document or the guides deploy automatically, and every PR gets a preview link.

**3. Generate the SDK from the same document.** Pick TypeScript (or Python, Go, a CLI — or several). The output is idiomatic, not templated:

```ts
import WarpAPI from "warp-hr";

const client = new WarpAPI({
  apiKey: process.env["API_KEY"], // defaults to the API_KEY env var
});

const assignments = await client.timeOff.listAssignments();
```

The client is named after the API and reads credentials from a conventional environment variable, so the quickstart needs no secrets inline. Errors are typed, with the status set enumerated from your description:

```ts
import { APIError } from "warp-hr";

try {
  const list = await client.customWorkerFields.list();
} catch (err) {
  if (err instanceof APIError) {
    console.log(err.status, err.name, err.headers);
  }
  throw err;
}
```

The Warp package ships `"dependencies": {}` — zero runtime dependencies unless you enable a feature that needs one.

**4. Publish from your own repository.** Scalar opens pull requests against the repo you nominate; release-please cuts versions and changelogs; workflows generated into your repository publish to npm, PyPI, Go modules, and the rest. Package names, registries, and release history stay yours.

**5. The loop closes.** The next time your API changes, one commit updates the reference, regenerates the SDKs, refreshes the code samples in the docs, and opens the release pull requests. The docs stop being a queue.

## Is Scalar the best API documentation tool for developer tools companies?

We think it is the strongest default for this segment, for three checkable reasons: the docs renderer is MIT licensed and self-hostable, so you are not betting your primary acquisition surface on a vendor's continuity; docs and SDKs are literally generated from the same document in the same workflow, which is the failure mode this industry actually suffers from; and the pricing is published, so you can cost the whole setup without a sales call.

It is not the right choice for everyone. If your API is gRPC or JSON-RPC rather than REST, or you want to run the SDK generator source yourself, read our honest comparison with [Fern](../compare/fern.md) — we say plainly where they are stronger. If you only need a rendered reference and nothing hosted, the open-source [API Reference](https://github.com/scalar/scalar) is free and does not require an account.

## Getting started

- [Scalar Docs](../guides/docs/index.md) — the documentation platform
- [SDK Generator](../guides/sdks/index.mdx) — client libraries from the same document
- [Start free](https://dashboard.scalar.com/register), or [talk to us](https://scalar.cal.com/) if you are migrating an existing portal

---

*This page describes Scalar as documented on scalar.com as of July 2026. Customer examples link to public documentation sites and a published case study; we have not invented quotes or numbers, and we would rather you catch us being wrong than quietly stay wrong. If you find an error, please [open an issue](https://github.com/scalar/scalar/issues).*
