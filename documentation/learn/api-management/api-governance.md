# API governance with OpenAPI: style guides, linting in CI, and breaking-change checks

*Last updated: October 2026*

API governance is the set of rules an organization applies to how its APIs are designed, changed, and published, and the automation that enforces those rules so they hold across every team. With OpenAPI, governance becomes concrete: the style guide is a ruleset, the review is a lint step in CI, versioning and breaking-change checks compare two documents, and access control decides who can see or publish each API description.

This guide covers the controls that make up API governance, shows a working GitHub Actions workflow that lints an OpenAPI document with the Scalar CLI, checks it for breaking changes, and publishes it to a registry, and gives an example Spectral-compatible rule you can copy. Every command on this page was run on 7 October 2026 with the versions listed at the end.

**On this page**

- [The short answer](#the-short-answer)
- [The five controls of API governance](#the-five-controls-of-api-governance)
- [Control 1: the style guide as a ruleset](#control-1-the-style-guide-as-a-ruleset)
- [Control 2: linting in CI](#control-2-linting-in-ci)
- [Control 3: versioning and breaking-change checks](#control-3-versioning-and-breaking-change-checks)
- [Control 4: a registry with access control](#control-4-a-registry-with-access-control)
- [Control 5: ownership and lifecycle metadata](#control-5-ownership-and-lifecycle-metadata)
- [The complete GitHub Actions workflow](#the-complete-github-actions-workflow)
- [AsyncAPI and event-driven APIs](#asyncapi-and-event-driven-apis)
- [Where governance ends and the gateway begins](#where-governance-ends-and-the-gateway-begins)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## The short answer

- Write your API style guide as a **Spectral-compatible ruleset** that extends the built-in `spectral:oas` rules.
- Run that ruleset in **CI on every pull request** that touches an API description, and make it a required status check.
- **Compare each change against the published version** and fail the build on breaking changes unless the major version was bumped.
- **Publish the passing document to a registry** from CI, never by hand, with access control per API.
- **Require ownership and lifecycle fields** in the document itself, so the catalog, the docs, and the deprecation notices come from one place.

Governance that lives in a wiki is advice. Governance that lives in CI is policy.

## The five controls of API governance

| Control | Question it answers | Mechanism |
| --- | --- | --- |
| Style guide | Does this API look like our other APIs? | A ruleset, linted on every change |
| Linting in CI | Was the rule applied before the change merged? | A required status check |
| Versioning and breaking changes | Will this change break existing consumers? | A diff against the published version |
| Registry and access control | Where is the current description, and who may see or change it? | A versioned store with permissions |
| Ownership and lifecycle | Who owns this, and is it still supported? | Required metadata in the document |

The rest of this guide takes each in turn. The examples use a small `openapi.yaml` for an Orders API; any valid OpenAPI 3.x document works.

## Control 1: the style guide as a ruleset

A style guide written in prose gets read once. Written as rules, it runs on every change. [Spectral](https://github.com/stoplightio/spectral) (Apache-2.0) is the common rules format; its built-in `spectral:oas` ruleset covers the basics such as every operation having an `operationId`, a description, and tags, and you add your organization's conventions on top. [Spectral rules](/learn/openapi/spectral-rules) explains the format in depth. Here is a ruleset that extends the defaults, promotes three built-in rules to errors, and adds two custom rules:

```yaml
# ruleset.yaml
extends: spectral:oas
rules:
  # Built-in rules we treat as errors rather than warnings
  operation-operationId: error
  operation-description: error
  info-contact: error

  # Every API must name an owning team with an email address
  owner-contact-email:
    description: Every API must name an owning team with an email address.
    given: $.info.contact
    severity: error
    then:
      field: email
      function: truthy

  # Path segments must be kebab-case; path parameters are allowed
  path-kebab-case:
    description: Path segments must be kebab-case.
    given: $.paths[*]~
    severity: warn
    then:
      function: pattern
      functionOptions:
        match: "^(\\/[a-z0-9-]+|\\/\\{[a-zA-Z0-9]+\\})+$"
```

Two conventions make rulesets maintainable. Keep one shared ruleset for the organization and let teams extend it rather than copy it, so an update applies everywhere. Version it like code, in its own repository or in a registry, and reference it by URL.

## Control 2: linting in CI

The Scalar CLI runs Spectral-compatible rulesets with `scalar document lint`. Against a document that follows the rules:

```bash
npx @scalar/cli document lint openapi.yaml --rule ./ruleset.yaml
```

```text
Validation successful
Errors: 0
Warnings: 0
Ignored: 0
```

Against a document missing its contact, descriptions, and operation IDs, the `github-actions` output format turns each finding into an annotation on the pull request, and the command exits non-zero so the check fails:

```bash
npx @scalar/cli document lint bad-openapi.yaml --rule ./ruleset.yaml --format github-actions
```

```text
::error file=bad-openapi.yaml,line=2,col=6,endLine=4,endColumn=17,title=info-contact::Info object must have "contact" object.
::error file=bad-openapi.yaml,line=7,col=9,endLine=10,endColumn=26,title=operation-description::Operation "description" must be present and non-empty string.
::error file=bad-openapi.yaml,line=7,col=9,endLine=10,endColumn=26,title=operation-operationId::Operation must have "operationId".
::warning file=bad-openapi.yaml,line=1,col=1,endLine=10,endColumn=26,title=oas3-api-servers::OpenAPI "servers" must be present and non-empty array.
```

Other formats include `codeframe` (the default), `json`, `junit`, `markdown`, and `summary`. For a legacy API with hundreds of existing findings, `--generate-ignore-file` records the current findings as a baseline so the check only fails on new ones, which is the practical way to adopt governance on an API that predates it.

The ruleset can live in the repository, as above, or in the Scalar Registry, where it has a stable URL and its own access control:

```bash
npx @scalar/cli document lint openapi.yaml \
  --rule https://registry.scalar.com/@your-team/rules/your-rule
```

Run `scalar document validate openapi.yaml` first in the same job. Validation checks the document against the OpenAPI Specification itself; linting checks it against your rules. A document can be valid and still break every convention you have.

## Control 3: versioning and breaking-change checks

A style guide stops ugly APIs. It does not stop a change that renames a field every consumer depends on. For that, compare the proposed document with the version currently published and classify the differences.

The OpenAPI `info.version` field is the place to record the API's version, and the convention most teams adopt is semantic: a breaking change requires a major bump. The check then has two parts: detect breaking changes, and fail unless the major version changed.

The Scalar Registry detects breaking changes between the versions you publish and shows them in the dashboard, so a team that publishes from CI sees what each release would break before it goes out. For the pull-request check itself, this guide uses [oasdiff](https://github.com/oasdiff/oasdiff), an Apache-2.0 tool that classifies OpenAPI differences and runs as a Docker image, because the Scalar CLI has no diff command at the time of writing and a CI check needs an exit code. Given the published `openapi.yaml` and a proposed `openapi-next.yaml` in which the `orderId` path parameter changed from a string to an integer:

```bash
docker run --rm -v "$PWD":/specs tufin/oasdiff breaking /specs/openapi.yaml /specs/openapi-next.yaml
```

```text
1 changes: 1 error, 0 warning, 0 info
error	[request-parameter-type-changed] at /specs/openapi-next.yaml
	in API GET /orders/{orderId}
		for the `path` request parameter `orderId`, the `type` was changed from `string` to `integer`
```

The command exits non-zero when it finds an error-level breaking change, so it works as a status check as is. In the workflow below, the published version is fetched from the registry before the comparison, so the check always runs against what consumers actually have.

Two judgement calls to make deliberately. First, decide which classifications count as breaking for you; oasdiff distinguishes errors, warnings, and informational changes, and removing an enum value or tightening a maximum may matter more or less depending on your consumers. Second, decide how to allow an intentional break: the usual rule is that the job passes if the major version in `info.version` was bumped in the same change.

## Control 4: a registry with access control

Linting proves a change meets the rules. A registry proves which version is current and lets every other tool read it: documentation, SDK generators, mock servers, MCP servers, and the gateway. [API catalog vs API registry](/learn/openapi/api-catalog) covers the difference between the searchable catalog and the versioned store.

Publishing from CI with the Scalar CLI:

```bash
npx @scalar/cli auth login --token "$SCALAR_API_KEY"
npx @scalar/cli registry publish openapi.yaml \
  --namespace your-team \
  --slug orders-api \
  --version 1.4.0
```

`publish` accepts OpenAPI and AsyncAPI documents. Add `--private` to keep the version internal, and `--bundle` to resolve external `$ref` values into one document before upload. Each document in the Scalar Registry can be internal, shared with a team, or public, and rulesets and JSON Schemas get the same controls, which is how you keep an internal API's description off the public portal while still generating its SDK. The registry's [CLI reference](/products/registry/cli) lists the other commands, and the [GitHub Actions](/products/registry/github-actions) and [GitLab CI](/products/registry/gitlab-ci) guides cover per-environment namespaces.

Publishing by hand is how registries go stale. Make CI the only path.

## Control 5: ownership and lifecycle metadata

A rule such as `owner-contact-email` above is how you guarantee that every API in the catalog has an owner. Put the metadata in the document, because the document is the one artefact every tool already reads:

```yaml
info:
  title: Orders API
  version: 1.4.0
  description: Create and track customer orders.
  contact:
    name: Commerce team
    email: commerce@example.com
  x-lifecycle: production
```

OpenAPI's `deprecated: true` flag on an operation (and, in OpenAPI 3.2, on a security scheme) is the standard way to announce a retirement, and documentation renderers display it. Add an extension such as `x-sunset` with a date and a rule that requires it whenever `deprecated` is true, and consumers learn about deprecations from the same page they learned about the API.

## The complete GitHub Actions workflow

This workflow runs on pull requests and on pushes to `main`. On a pull request it validates and lints the document and checks it for breaking changes against the published version. On `main` it also publishes the new version to the registry.

```yaml
# .github/workflows/api-governance.yml
name: API governance

on:
  pull_request:
    paths:
      - 'openapi.yaml'
      - 'ruleset.yaml'
  push:
    branches:
      - main
    paths:
      - 'openapi.yaml'

jobs:
  govern:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24

      - name: Validate against the OpenAPI Specification
        run: npx @scalar/cli document validate openapi.yaml

      - name: Lint against the style guide
        run: npx @scalar/cli document lint openapi.yaml --rule ./ruleset.yaml --format github-actions

      - name: Log in to the Scalar Registry
        run: npx @scalar/cli auth login --token "${{ secrets.SCALAR_API_KEY }}"

      - name: Fetch the currently published version
        run: |
          npx @scalar/cli registry get ${{ vars.SCALAR_NAMESPACE }} orders-api \
            --format yaml --output published.yaml

      - name: Check for breaking changes
        run: |
          docker run --rm -v "$PWD":/specs tufin/oasdiff \
            breaking /specs/published.yaml /specs/openapi.yaml \
            --fail-on ERR --format githubactions

      - name: Publish to the registry
        if: github.ref == 'refs/heads/main'
        run: |
          VERSION=$(yq '.info.version' openapi.yaml)
          npx @scalar/cli registry publish openapi.yaml \
            --namespace ${{ vars.SCALAR_NAMESPACE }} \
            --slug orders-api \
            --version "$VERSION"
```

Notes on the workflow:

- `SCALAR_API_KEY` is a repository secret from [dashboard.scalar.com/user/api-keys](https://dashboard.scalar.com/user/api-keys); `SCALAR_NAMESPACE` is a repository variable with your team namespace. `yq` is preinstalled on GitHub-hosted Ubuntu runners.
- Protect `main` so the `govern` job is a required status check. That is what turns the rules into policy.
- The first run has nothing to compare against. Publish the current version once by hand, or make the breaking-change step conditional until a version exists.
- To allow an intentional breaking change, add a step that reads the major version from `info.version` in both files and skips the oasdiff failure when it increased.

We ran the validate, lint, and oasdiff steps locally with the files on this page. The registry steps use the documented CLI commands; run the workflow once against your own namespace before relying on it.

## AsyncAPI and event-driven APIs

Governance that stops at HTTP misses the webhooks, Kafka topics, and WebSocket channels that are also contracts. `scalar document lint` detects an AsyncAPI document and runs Spectral's `spectral:asyncapi` ruleset instead of `spectral:oas`, and `scalar registry publish` accepts AsyncAPI documents with the same command. `scalar document validate` is OpenAPI-only today, so the validate step above should be skipped or replaced for AsyncAPI files. The [AsyncAPI guide](/asyncapi) covers rendering and publishing event-driven APIs.

## Where governance ends and the gateway begins

Everything on this page happens before a request is served. It makes the contract correct, consistent, versioned, and discoverable. It does not enforce anything at runtime for your applications' traffic: authentication of callers, rate limits, quotas, and traffic analytics across every consumer are the job of an API gateway. Scalar's one runtime surface is the hosted MCP server, which proxies, rate limits, and measures AI agent calls to the operations you expose; everything else goes through your gateway. The two fit together through the same OpenAPI document: the version your CI publishes to the registry is the version the gateway should import for its routes and request validation, so the documentation, SDKs, MCP tools, and runtime routes never describe different APIs. [API management vs API gateway](/learn/api-management/api-management-vs-api-gateway) draws the full boundary.

## Common mistakes

- **Rules nobody can pass.** Adopt governance on an existing API with a baseline (`--generate-ignore-file`), then ratchet. A check that fails on day one gets disabled on day two.
- **Linting without a required check.** A warning in a log is not governance. Make the job required on the protected branch.
- **Comparing against the branch, not the published version.** The consumers have what was published. Fetch that for the breaking-change check.
- **Versioning the file, not the API.** Bump `info.version` deliberately as part of the change; do not derive it from a build number.
- **Owner in a wiki.** The owner belongs in `info.contact`, enforced by a rule, or it will be wrong after the next reorganization.
- **Governing only the public APIs.** Internal APIs are where most inconsistency and most unknown attack surface live. Lint them all and control visibility with the registry's access settings instead.
- **Treating gateway import as governance.** A gateway will happily import an inconsistent document. Lint first, then import.

## Frequently asked questions

<scalar-detail title="What is API governance?">
The rules an organization applies to how APIs are designed, changed, and published, and the automation that enforces them. With OpenAPI, that means a style guide expressed as a ruleset, linting in CI, breaking-change checks between versions, a registry with access control, and required ownership metadata.
</scalar-detail>

<scalar-detail title="What are the best tools for API governance and OpenAPI linting?">
Spectral is the common format for rulesets, and most tools run Spectral-compatible rules: the Scalar CLI's document lint command, Spectral's own CLI, and Redocly CLI among others. For breaking-change detection, oasdiff is a widely used open-source option. For storing rules and documents with access control, use a registry such as the Scalar Registry. Pick tools that run in CI and read the same OpenAPI document your documentation and SDKs are built from.
</scalar-detail>

<scalar-detail title="What is an API style guide?">
A set of conventions for naming, structure, errors, pagination, versioning, and documentation that every API in an organization follows. Written as a Spectral ruleset, it can be enforced automatically on every change instead of in code review.
</scalar-detail>

<scalar-detail title="How do I detect breaking changes in an OpenAPI document?">
Compare the proposed document with the published version using a tool that classifies differences, such as oasdiff, and fail the build on error-level changes unless the major version was bumped. Run it in CI on every pull request that touches the document. The Scalar Registry also flags breaking changes between the versions you publish, which catches anything that reached the registry by another route.
</scalar-detail>

<scalar-detail title="Does Scalar enforce API governance at runtime?">
Only for AI agent traffic. Scalar's governance runs on the API description: linting, versioning, breaking-change detection, registry access control, and the documentation, SDKs, and MCP servers generated from it. Its hosted MCP server then proxies and rate limits agent calls to the operations you chose to expose. Runtime enforcement for your applications' traffic, such as authentication, rate limits, and quotas across every consumer, is the job of an API gateway, which Scalar works alongside.
</scalar-detail>

<scalar-detail title="Can I govern AsyncAPI documents the same way?">
Mostly. The Scalar CLI lints AsyncAPI documents with Spectral's AsyncAPI ruleset and publishes them to the registry with the same command. The validate command is OpenAPI-only today, and breaking-change tools for AsyncAPI are less mature than for OpenAPI.
</scalar-detail>

## Related

- **Learn:** [Spectral rules](/learn/openapi/spectral-rules) · [API catalog vs API registry](/learn/openapi/api-catalog) · [API management vs API gateway](/learn/api-management/api-management-vs-api-gateway) · [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0)
- **Docs:** [Registry rules](/products/registry/rules) · [Registry CLI](/products/registry/cli) · [GitHub Actions](/products/registry/github-actions)
- **Product:** [Scalar Registry](/products/registry) — versioned OpenAPI and AsyncAPI documents, JSON Schema, and Spectral-compatible rules with access control, feeding docs, SDKs, and MCP servers

---

*The lint, validate, and breaking-change commands on this page were run on 7 October 2026 with @scalar/cli 2.10.0 on Node.js 24.21.0 and the tufin/oasdiff Docker image (version 6de374d). Spectral was at 6.17.0 the same day. The registry publish and fetch steps follow the Scalar CLI documentation and were not executed against a live registry for this page. Scalar wrote this guide and sells the registry it describes. If something is wrong or out of date, [open an issue](https://github.com/scalar/scalar/issues).*
