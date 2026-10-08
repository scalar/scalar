# What is an API catalog?

*Last updated: October 2026*

An API catalog is a searchable inventory of an organization's APIs, where each entry records what the API does, who owns it, which version is current, and where its machine-readable description (usually an OpenAPI or AsyncAPI document) and its documentation live. It answers the question every growing engineering team eventually asks: "Do we already have an API for this, and where is it?"

An API registry is closely related. The catalog is the index people browse; the registry is the versioned store that holds the actual API descriptions and serves them to tools. In practice most teams want both, and many products combine them. This guide explains the difference, how both relate to a developer portal and an API gateway, what belongs in a catalog entry, the IETF standard for publishing a machine-readable catalog, how to build one that stays accurate, and which tools to use for each part.

**On this page**

- [The short answer](#the-short-answer)
- [Why API catalogs exist](#why-api-catalogs-exist)
- [API catalog vs API registry vs developer portal vs gateway](#api-catalog-vs-api-registry-vs-developer-portal-vs-gateway)
- [What goes into a catalog entry](#what-goes-into-a-catalog-entry)
- [The machine-readable catalog: /.well-known/api-catalog](#the-machine-readable-catalog-well-knownapi-catalog)
- [Catalogs inside developer platforms](#catalogs-inside-developer-platforms)
- [How to build an API catalog that stays accurate](#how-to-build-an-api-catalog-that-stays-accurate)
- [Governance: rules, ownership and lifecycle](#governance-rules-ownership-and-lifecycle)
- [Building a catalog with the Scalar Registry](#building-a-catalog-with-the-scalar-registry)
- [Generate the catalog file from the registry](#generate-the-catalog-file-from-the-registry)
- [Which tools to use](#which-tools-to-use)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## The short answer

- An **API catalog** is a list of APIs with enough metadata to find, evaluate and start using each one.
- An **API registry** is the system of record that stores each API's description document, with versions and access control, so other tools (docs, SDK generators, linters, mock servers, AI agents) can fetch it.
- A catalog is only trustworthy if its entries are generated from the registry, and the registry is only trustworthy if documents flow into it automatically from where APIs are built.

Everything else in this guide is about making those three sentences true in a real organization.

## Why API catalogs exist

Nobody sets out to have 400 APIs. It happens one service at a time, and the costs show up later.

**Duplication.** Two teams build two customer-lookup services because neither could find the other's. Both need maintaining forever.

**Slow onboarding.** A new engineer spends a week asking in chat channels which service owns invoices and where its documentation lives.

**Unknown attack surface.** Security teams cannot protect APIs they do not know exist. An inventory of every API, with its authentication and owner, is a prerequisite for any serious review.

**Broken change management.** When a team wants to deprecate an endpoint, they need to know who calls it. A catalog that links APIs to owners and consumers makes that a query instead of an investigation.

**Machine consumers.** SDK generators, [mock servers](/learn/openapi/api-mocking), contract tests and now AI agents all need a reliable URL for "the current description of this API". An MCP server generated from a stale document gives an agent a stale API.

## API catalog vs API registry vs developer portal vs gateway

These four overlap in marketing copy. They do different jobs.

| | API catalog | API registry | Developer portal | API gateway |
| --- | --- | --- | --- | --- |
| Main job | Discovery: find the right API | Storage: hold the canonical description, versioned | Consumption: docs, guides, keys for users of an API | Runtime: route, authenticate and rate-limit traffic |
| Unit | An entry per API | A document per API version | A site per product or audience | A route per endpoint |
| Primary user | Engineers, architects, security | Tools and pipelines | External or internal developers | Production traffic |
| Source of data | Registry plus metadata | CI, Git, publish commands | Registry plus hand-written content | Its own configuration |
| Question it answers | "Which API does this?" | "What exactly is version 2.3 of this API?" | "How do I use this API?" | "Should this request go through?" |

A gateway sees live traffic, which makes it good at discovering undocumented APIs, but it does not know what an API is for. A developer portal is beautifully written but usually covers only the APIs someone decided to publish. The catalog and registry are what tie them together: the gateway config, the portal and the SDKs should all be derived from the same registered description. [API management vs API gateway](/learn/api-management/api-management-vs-api-gateway) covers the wider split between runtime and lifecycle tooling.

## What goes into a catalog entry

A useful entry is short. It needs enough to decide "is this the API I want?" and a link to go deeper.

- **Name and one-sentence purpose.** Plain language, not the service's internal code name.
- **Owner.** A team, not a person, plus a way to contact them.
- **Description document.** A stable URL to the [OpenAPI](/learn/openapi/what-is-openapi) or AsyncAPI document, ideally with a "latest" alias and pinned versions.
- **Version and lifecycle.** Experimental, production, deprecated, retired, with dates for deprecation.
- **Audience.** Internal, partner or public, which drives who can see the entry at all.
- **Authentication.** Which security schemes the API uses, taken straight from `components.securitySchemes`. See [OpenAPI security schemes](/learn/openapi/openapi-security-schemes).
- **Environments.** Base URLs for production, staging and sandboxes, from the document's `servers`.
- **Documentation.** A link to the human-readable [API reference](/learn/openapi/what-is-an-api-reference) and guides.
- **Derived artifacts.** SDK packages, the MCP server, the mock server, the Postman or API client collection.
- **Quality signals.** Last updated date, lint score against your ruleset, whether contract tests pass.

Notice how much of this is already in the OpenAPI document: title, description, version, servers, security, contact, tags. That is the strongest argument for generating catalog entries from registered documents rather than typing them into a wiki.

## The machine-readable catalog: /.well-known/api-catalog

In June 2025 the IETF published [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727), which standardizes a machine-readable API catalog. A publisher serves a document at `/.well-known/api-catalog` on its domain, and clients (including automated agents) can fetch it to discover the publisher's APIs.

The RFC requires the catalog to be available in the Linkset format, `application/linkset+json` from RFC 9264. Each entry uses link relations to point at the pieces of an API:

- `service-desc` for the machine-readable description, such as an OpenAPI document
- `service-doc` for human-readable documentation
- `service-meta` for other metadata, such as usage policies
- `status` for a health or status endpoint

A minimal catalog for two APIs looks like this:

```http
GET /.well-known/api-catalog HTTP/1.1
Host: example.com
Accept: application/linkset+json
```

```json
{
  "linkset": [
    {
      "anchor": "https://api.example.com/orders",
      "service-desc": [
        {
          "href": "https://api.example.com/orders/openapi.yaml",
          "type": "application/yaml"
        }
      ],
      "service-doc": [
        {
          "href": "https://docs.example.com/orders",
          "type": "text/html"
        }
      ]
    },
    {
      "anchor": "https://api.example.com/billing",
      "service-desc": [
        {
          "href": "https://api.example.com/billing/openapi.json",
          "type": "application/json"
        }
      ],
      "service-doc": [
        {
          "href": "https://docs.example.com/billing",
          "type": "text/html"
        }
      ]
    }
  ]
}
```

The response's content type should carry the RFC's profile: `application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"`. The RFC also defines an `api-catalog` link relation, so a homepage can point at the catalog with a `Link` header, and it allows catalogs to link to other catalogs when APIs span several domains.

The design choice worth copying is that the catalog does not repeat the API description; it links to it. If you already publish OpenAPI documents at stable URLs, generating an RFC 9727 file is a small build step. It pairs well with the other agent-facing files covered in [llms.txt for API docs](/learn/openapi/llms-txt-for-api-docs).

## Catalogs inside developer platforms

Internal developer portals often include an API catalog as one section of a wider software catalog. [Backstage](https://backstage.io/docs/features/software-catalog/descriptor-format#kind-api), the open source developer portal framework, models an API as an entity of kind `API` with a type, lifecycle, owner and definition:

```yaml
apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: orders-api
  description: Create and track customer orders
spec:
  type: openapi
  lifecycle: production
  owner: commerce-team
  system: storefront
  definition: |
    openapi: 3.1.0
    info:
      title: Orders API
      version: 1.4.0
    paths: {}
```

The `definition` field can hold the document inline, as above, but inline copies are the fastest way to a stale catalog. Point it at the registered document instead so there is one copy of the truth. The same principle applies to any platform: the catalog should reference the registry, never duplicate it.

## How to build an API catalog that stays accurate

Every team that has tried a spreadsheet catalog knows how this goes: it is accurate the week it is created. Accuracy comes from automation, not diligence.

<scalar-steps>
  <scalar-step id="step-1" title="Inventory what exists">

Start from repositories and gateway configuration, not from asking teams. Search repositories for `openapi:` and `swagger:` files, list the routes your gateway serves, and flag anything served but not described.

  </scalar-step>

  <scalar-step id="step-2" title="Pick one source of truth per API">

Each API needs one canonical description document, whether it is written by hand (design-first) or generated by the framework at build time (code-first). Upgrade stragglers: Swagger 2.0 documents convert to OpenAPI 3.1 with the Scalar CLI command `scalar document upgrade`.

  </scalar-step>

  <scalar-step id="step-3" title="Publish from CI, not by hand">

Add a step to each service's pipeline that validates the document and pushes it to the registry on every merge to the main branch. Publishing by hand is how registries go stale.

  </scalar-step>

  <scalar-step id="step-4" title="Lint every publish">

Run a shared ruleset on every document before it is published, so the catalog enforces the metadata it depends on (owner contact, descriptions, tags, servers). [Spectral rules](/learn/openapi/spectral-rules) are the standard way to do this.

  </scalar-step>

  <scalar-step id="step-5" title="Generate everything downstream">

Documentation, SDKs, mocks, MCP servers and the catalog entry itself should be derived from the registered document. If a human edits any of them by hand, that is a place drift will start.

  </scalar-step>
</scalar-steps>

## Governance: rules, ownership and lifecycle

A catalog becomes a governance tool when it can answer questions reliably. Three practices make that possible.

**Shared rules, versioned.** Encode your API style guide as a ruleset and version it like code. Teams extend it rather than copying it, so an update applies everywhere. A rule such as "every document must have `info.contact`" is how you guarantee every catalog entry has an owner.

**Ownership as data.** Put the owning team in the document (`info.contact`, or an extension like `x-owner`) and require it through linting. Ownership that lives only in a wiki is ownership nobody updates after a reorg.

**Lifecycle states with dates.** Mark operations or whole APIs as deprecated in the document (OpenAPI has a `deprecated` flag on operations and, in 3.2, on security schemes), publish the retirement date, and let the catalog show it. Consumers learn about deprecations from the same place they discovered the API.

## Building a catalog with the Scalar Registry

The [Scalar Registry](/products/registry) is a registry first: it stores, versions and serves OpenAPI and AsyncAPI documents, standalone JSON Schemas and Spectral rulesets, with public or private access per resource. Docs, SDKs and MCP servers are built on top of what is registered.

A typical setup has three parts.

**Publish from the pipeline.** The Scalar CLI validates and publishes a document with a namespace, a slug and an optional version:

```bash
npx @scalar/cli document validate api/openapi.yaml
npx @scalar/cli registry publish api/openapi.yaml \
  --namespace acme \
  --slug orders-api \
  --version 1.4.0
```

In GitHub Actions the same commands run on every push to `main`, after logging in with an API key stored as a secret. The [GitHub Actions guide](/products/registry/github-actions) has a ready-made workflow, including publishing to different namespaces per branch, and there is a GitLab CI guide too.

**Share schemas across APIs.** When several APIs use the same `Address` or `Money` model, publish it once as a [Registry schema](/products/registry/schemas) and reference it from each document, so a change to the shared model is versioned and visible. Why this works so cleanly with OpenAPI 3.1 is covered in [JSON Schema vs OpenAPI](/learn/openapi/json-schema-vs-openapi).

**Enforce one ruleset.** Store your style guide as a [Registry rule](/products/registry/rules) and lint every document against it, from the CLI or as a publish gate in [Scalar Docs](/products/docs).

From there, the same registered document powers an [API reference](/products/api-references), [generated SDKs](/products/sdk-generator) and a [hosted MCP server](/products/agent/mcp), so the catalog entry, the docs and the client libraries all describe the same version of the API. The Free plan includes up to three APIs, and larger limits are on the [pricing page](/pricing).

If you are consolidating from another registry, the [SwaggerHub/API Hub migration guide](/resources/migration/api-hub) walks through moving documents over.

## Generate the catalog file from the registry

Once the registry is the source of truth, the RFC 9727 catalog is a build step. The CLI lists what is registered and fetches any version:

```bash
# Every API registered under a namespace
npx @scalar/cli registry list --namespace acme

# One document, latest version, as YAML
npx @scalar/cli registry get acme orders-api --format yaml --output orders-api.yaml
```

From that list, a short script turns each entry into a Linkset member. This one reads a JSON array of `{ name, anchor, description, docs }` objects, where `description` is the stable URL of the registered document and `docs` is the published reference, and writes the catalog:

```js
// build-catalog.mjs
// Build an RFC 9727 api-catalog (Linkset, RFC 9264) from a list of registered APIs.
// Usage: node build-catalog.mjs apis.json > .well-known/api-catalog
import { readFileSync } from 'node:fs'

const apis = JSON.parse(readFileSync(process.argv[2], 'utf8'))

const linkset = apis.map((api) => ({
  anchor: api.anchor,
  'service-desc': [
    {
      href: api.description,
      type: api.description.endsWith('yaml') ? 'application/yaml' : 'application/json',
    },
  ],
  'service-doc': [{ href: api.docs, type: 'text/html' }],
}))

process.stdout.write(JSON.stringify({ linkset }, null, 2) + '\n')
```

Serve the output at `/.well-known/api-catalog` with the content type `application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"`, and run the script in the same CI job that publishes documents, so a new API appears in the catalog on the merge that registers it. We ran the script on 7 October 2026 on Node.js 24; the `registry` commands are the documented CLI commands and need a logged-in session.

## Which tools to use

| Need | Tool category | Examples |
| --- | --- | --- |
| Store and version the descriptions | API registry | Scalar Registry, Postman Private API Network, Swagger Studio, Git plus a convention |
| Browse and search every API, with owners and lifecycle | API catalog | Backstage software catalog, Scalar Registry's dashboard, the catalog pages of gateway suites such as Kong Konnect, Apigee API hub, and Azure API Center |
| Enforce the metadata the catalog depends on | Linter in CI | Spectral-compatible rules with `scalar document lint`, Spectral CLI, Redocly CLI |
| Let consumers read docs and get credentials | Developer portal | Scalar Docs, ReadMe, Redocly, the portal that ships with your gateway |
| Discover undocumented traffic and enforce access at runtime | API gateway | Kong, Apigee, Azure API Management, AWS API Gateway, Tyk, Gravitee, Zuplo |
| Publish the catalog for machines | RFC 9727 file | A script like the one above, served from your domain |

The registry and linter are the parts to get right first; everything else reads from them. [API governance with OpenAPI](/learn/api-management/api-governance) has the CI workflow, and [best API management platforms (2026)](/library/best-api-management-platforms-2026) compares the gateway suites and their portals with sourced prices.

## Common mistakes

**Building the catalog by hand.** A catalog someone has to remember to update will be wrong within a quarter. Generate entries from registered documents.

**Cataloging only public APIs.** Internal APIs are where most duplication and most unknown attack surface live. Catalog them, and control visibility with access rules rather than leaving them out.

**Storing descriptions inline in the catalog.** An inline copy of an OpenAPI document is a fork. Link to the registry.

**No owner field.** An entry without an owner cannot be deprecated, secured or improved. Make ownership required through linting.

**Treating the catalog as a documentation project.** Documentation is one output. The catalog's real value is that pipelines, SDK generators and agents can rely on it, which means stable URLs, versioning and access control matter more than page design.

**Ignoring AsyncAPI.** Event-driven APIs (Kafka topics, webhooks, WebSocket channels) are APIs too. A catalog that only lists HTTP endpoints hides half of how your services talk.

## Frequently asked questions

<scalar-detail title="What is the difference between an API catalog and an API registry?">
An API catalog is the searchable index people use to discover APIs. An API registry is the versioned store that holds each API's description document and serves it to tools. A good catalog is generated from the registry, so the two stay in sync.
</scalar-detail>

<scalar-detail title="Is an API catalog the same as a developer portal?">
Not quite. A developer portal is aimed at people using a specific API and focuses on documentation, guides and credentials. A catalog covers all of an organization's APIs and focuses on discovery, ownership and lifecycle. Many portals include a catalog page, and the best ones generate it from a registry.
</scalar-detail>

<scalar-detail title="What is /.well-known/api-catalog?">
It is the well-known URI defined by RFC 9727, published by the IETF in June 2025. A site serves a Linkset document there that links to each of its APIs' descriptions, documentation and status endpoints, so clients and agents can discover the APIs automatically.
</scalar-detail>

<scalar-detail title="Do I need OpenAPI to build an API catalog?">
You can catalog APIs without descriptions, but the entries will be thin and go stale. With an OpenAPI or AsyncAPI document per API, most of each entry (title, version, servers, authentication, operations) is generated for you, and the same document drives docs, SDKs and mocks.
</scalar-detail>

<scalar-detail title="How do I keep an API catalog up to date?">
Publish each API's description from CI on every merge, lint it against a shared ruleset before publishing, and generate the catalog entry, documentation and client libraries from the registered document. Manual steps are where drift comes from.
</scalar-detail>

<scalar-detail title="What tools should I use for an API catalog and registry?">
A registry to store and version the descriptions (the Scalar Registry, Postman's Private API Network, Swagger Studio, or Git with a convention), a linter in CI to enforce the metadata the catalog needs, and a catalog view on top, which can be the registry's own dashboard, Backstage, or the catalog page of a gateway suite. Publish an RFC 9727 file from the registry so machines can discover the APIs too.
</scalar-detail>

## Related

- **Learn:** [API governance with OpenAPI](/learn/api-management/api-governance) · [API management vs API gateway](/learn/api-management/api-management-vs-api-gateway) · [Spectral rules](/learn/openapi/spectral-rules) · [llms.txt for API docs](/learn/openapi/llms-txt-for-api-docs)
- **Library:** [Best API management platforms (2026)](/library/best-api-management-platforms-2026)
- **Docs:** [Registry getting started](/products/registry/getting-started) · [Registry CLI](/products/registry/cli)
- **Product:** [Scalar Registry](/products/registry) — one versioned home for your OpenAPI documents, schemas and rulesets, feeding docs, SDKs and MCP servers.

---

*RFC 9727 details were re-checked against rfc-editor.org on 7 October 2026; the catalog script on this page was run the same day on Node.js 24.21.0. Scalar wrote this guide and sells the registry it describes. If something is wrong or out of date, [open an issue](https://github.com/scalar/scalar/issues).*
