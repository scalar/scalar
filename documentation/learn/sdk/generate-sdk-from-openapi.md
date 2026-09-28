# How to generate an SDK from OpenAPI

*Last updated: September 2026*

To generate an SDK from OpenAPI, you give an OpenAPI document to a code generator that turns every operation into a typed method and every schema into a typed model, and then you package the output and publish it to a registry such as npm, PyPI, or Go modules. The generator is the easy part. Most of the quality in a generated SDK comes from the document you feed it, and most of the ongoing cost comes from what happens after the first build: publishing, versioning, and regenerating every time the API changes.

This guide walks through the whole path. It covers preparing the OpenAPI document, choosing between the main generators (open source and commercial), a worked example with Scalar's generator, publishing to the three most common registries, and keeping the SDK in sync from CI. It is written by Scalar, so we link to every other vendor's own documentation and say where their tool is the better fit.

If you are still deciding whether you need an SDK at all, start with [what an SDK is](/learn/sdk/what-is-an-sdk) and [SDK vs API](/learn/sdk/sdk-vs-api), then come back.

## The short version

1. **Validate the OpenAPI document** and fix errors before any generator sees it.
2. **Give every operation a stable `operationId` and a tag**, and move inline schemas into `components/schemas` with meaningful names.
3. **Describe what OpenAPI cannot say on its own**: pagination, retries, and naming, usually through vendor extensions or a generator configuration file.
4. **Pick a generator** based on the languages you need, how idiomatic the output must be, and who will maintain it.
5. **Generate, then read the code** before you publish anything. Call a few endpoints from a scratch project.
6. **Publish** each language to its registry under a package name you control.
7. **Automate regeneration** so a change to the API description produces a reviewed pull request against every SDK.

## What a generator does with your OpenAPI document

Every OpenAPI-based SDK generator performs roughly the same mapping. Knowing it tells you which parts of the document matter most.

| OpenAPI element | What it becomes in the SDK | What goes wrong when it is missing or weak |
| --- | --- | --- |
| `servers` | The default base URL and named environments | Users have to pass a base URL by hand |
| `tags` | Resource groups, such as `client.users` | One flat namespace with hundreds of methods |
| `operationId` | Method names | Names derived from paths, like `usersUserIdGet` |
| `parameters` and `requestBody` | Typed method arguments | Untyped dictionaries or positional arguments |
| `components/schemas` | Named model types | Anonymous types with generated names such as `InlineResponse2003` |
| `responses` | Return types and typed errors | `unknown` return values, generic exceptions |
| `securitySchemes` | Constructor options for credentials | Auth has to be set as a raw header |
| `oneOf`, `anyOf`, `discriminator` | Union types | Loosely typed objects the caller has to inspect |
| Vendor extensions (`x-...`) | Pagination helpers, retries, renames, streaming | List endpoints return one page at a time, no retries |

The last row matters because OpenAPI has no standard way to say "this list endpoint uses cursor pagination" or "retry this request on a 429". Every generator fills that gap with its own extensions or configuration. Plan for it.

## Step 1: Prepare the OpenAPI document

A generator cannot make a vague API description precise. Time spent here pays off in every language you ship.

### Validate first

Run a validator and fix every error. Warnings are worth reading too, because several of them (missing `operationId`, duplicate names, unresolved `$ref`) become confusing code later. With the Scalar CLI:

```bash
npx @scalar/cli document validate openapi.yaml
```

You can also lint against a Spectral ruleset with `scalar document lint`. See [OpenAPI linting](/learn/openapi/spectral-rules) for which rules are worth turning on before SDK generation.

### Name every operation

`operationId` is the single most important field for SDK quality. Make it unique, stable, and verb-first: `listUsers`, `getUser`, `createUser`, `deleteUser`. Changing an `operationId` later usually renames a public method, which is a breaking change for everyone who installed your SDK.

### Tag operations by resource

Tags usually become the resource namespaces. One tag per operation, named after the resource (`Users`, `Invoices`), gives you `client.users.list()` rather than a flat list of every method in the API.

### Name your schemas

Move request and response bodies into `components/schemas` and give them names a developer would type: `User`, `Invoice`, `CreateInvoiceRequest`. Inline schemas still work, but the generator has to invent names for them.

### Describe authentication and servers

Declare `securitySchemes` and apply them with `security`, so the generator knows to put an `apiKey` option on the client constructor. List at least one entry in `servers`, and add a sandbox environment if you have one.

### Add pagination and retry hints

This is where the document meets the generator. Here is a small, valid OpenAPI 3.1 document with Scalar's extensions for cursor pagination and retries. The same ideas exist in other tools under different names.

```yaml
openapi: 3.1.0
info:
  title: Acme API
  version: 1.0.0
servers:
  - url: https://api.acme.com
    description: Production
security:
  - apiKey: []
x-scalar-pagination:
  - name: cursor
    type: cursor
    request:
      cursor:
        type: cursor
        param: cursor
        location: query
    response:
      items:
        type: items
        location: body
        path: [data]
      next:
        type: cursor
        location: body
        path: [next_cursor]
paths:
  /users:
    get:
      tags: [Users]
      operationId: listUsers
      summary: List users
      x-scalar-pagination: cursor
      x-scalar-retries: 3
      parameters:
        - name: cursor
          in: query
          schema:
            type: string
        - name: limit
          in: query
          schema:
            type: integer
            maximum: 100
      responses:
        '200':
          description: A page of users
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserList'
components:
  securitySchemes:
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
  schemas:
    User:
      type: object
      required: [id, email]
      properties:
        id:
          type: string
        email:
          type: string
          format: email
    UserList:
      type: object
      required: [data]
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/User'
        next_cursor:
          type: [string, 'null']
```

Scalar declares pagination explicitly and never infers it from parameter names, so a method paginates only when it names a scheme. The full vocabulary is in the [pagination guide](/products/sdk-generator/pagination) and the [OpenAPI extensions reference](/products/sdk-generator/openapi-extensions). If your document already carries `x-speakeasy-pagination`, `x-fern-pagination`, or Stainless extensions, Scalar reads those too, which matters if you are moving between generators.

<scalar-callout type="info">
Should the extensions live in the OpenAPI document or in a separate config file? If the document is public and consumed by other tools, a separate config keeps it clean. If the document is the single source of truth your team edits, extensions keep everything in one place. Most generators support both.
</scalar-callout>

## Step 2: Choose a generator

There are two families. **Template-based open-source generators** give you the code and the templates, free, and you own the result and the upkeep. **Managed generators** produce more idiomatic code, handle publishing, and regenerate for you, for a fee. The table summarizes the main options as of September 2026, with each vendor's own page as the source.

| Generator | Model | Licence | SDK languages (per the vendor) | Best for |
| --- | --- | --- | --- | --- |
| [OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator) | Open-source CLI, template-based | [Apache 2.0](https://github.com/OpenAPITools/openapi-generator) | [80 client generators](https://openapi-generator.tech/docs/generators), many marked beta or experimental | Breadth, niche languages, full control, zero licence cost |
| [Kiota](https://learn.microsoft.com/en-us/openapi/kiota/overview) (Microsoft) | Open-source CLI | [MIT](https://github.com/microsoft/kiota) | C#, Go, Java, PHP, Python, Ruby, TypeScript and more; [maturity varies by language](https://github.com/microsoft/kiota) | Large APIs where you only need a subset of paths, .NET shops |
| [Scalar](/products/sdk-generator) | Managed, dashboard and config | Generator is closed source; output is yours | TypeScript, Python, Go, CLI generally available; Java, Kotlin, Ruby, C#, PHP, Rust, Swift, Dart, C++ experimental | Idiomatic SDKs plus docs, published from your own repositories, with published pricing |
| [Speakeasy](https://www.speakeasy.com/docs/sdks/create-client-sdks) | CLI plus platform | Generator [open-sourced under AGPL-3.0 on 2026-09-17](https://www.speakeasy.com/blog/partnering-with-google) | TypeScript, Python, Go, Java, C#, PHP, Ruby ([source](https://www.speakeasy.com/blog/partnering-with-google)) | Teams that want to read and run the generator, Terraform providers |
| [Fern](https://buildwithfern.com/learn/sdks/overview/introduction) | CLI plus platform, acquired by [Postman in January 2026](https://buildwithfern.com/post/postman-acquires-fern) | Repository is [Apache 2.0](https://github.com/fern-api/fern) | TypeScript, Python, Go, Java, C#, PHP, Ruby, Swift, Rust ([source](https://buildwithfern.com/learn/sdks/overview/introduction)) | Teams already on Postman, or APIs described in Fern's own definition format |
| [liblab](https://liblab.com) | Managed platform | Commercial | C#, TypeScript, PHP, Java, Go, Python ([source](https://liblab.com)) | Teams that also want generated Terraform providers |

Two notes on the table. Stainless is not listed because its hosted generator stopped taking new signups when [Stainless joined Anthropic on 2026-05-18](https://www.stainless.com/blog/stainless-is-joining-anthropic/); existing customers keep the code they generated. If you are in that position, our [Stainless wind-down write-up](/resources/stainless-wind-down) covers every option, including ones that are not Scalar. And "languages supported" is a weak signal on its own. Ask each vendor which targets are production-ready, then generate from your own document and read the output.

### What to evaluate

- **Idiomatic output.** Does the TypeScript look like TypeScript a person would write, and the Python like Python? Look at method names, argument style, and how errors surface.
- **Runtime features.** Retries with backoff, `Retry-After`, timeouts, auto-pagination, streaming, file uploads, typed errors.
- **Custom code.** Can you add a helper method without it being overwritten on the next generation?
- **Publishing.** Does the tool publish for you, or do you write and maintain release pipelines per language?
- **Who owns the code.** Where does the generated repository live, and under whose package name?
- **Exit cost.** If the vendor changes direction, can you keep the code and move? The Stainless wind-down made this question concrete for a lot of teams.

## Step 3: Generate with an open-source CLI

If you choose an open-source generator, generation is a single command. OpenAPI Generator ships as an npm wrapper, a Docker image, and a JAR:

```bash
npm install @openapitools/openapi-generator-cli -g

openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-fetch \
  -o ./sdk/typescript

openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./sdk/python \
  --additional-properties=packageName=acme_api
```

Kiota works the same way, with a lock file (`kiota-lock.json`) written next to the output so later runs can be repeated with `kiota update`:

```bash
kiota generate -l typescript -d openapi.yaml -c AcmeClient -o ./src/client
```

Both commands come from the tools' own docs ([OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator), [Kiota](https://learn.microsoft.com/en-us/openapi/kiota/using)). What you do not get is everything after the command: a package manifest you are happy with, a README, a release workflow, a changelog, and a plan for custom code. Budget for those. Our [build vs buy analysis](/learn/sdk/build-vs-buy-sdk) puts rough numbers on it, and [OpenAPI Generator alternatives](/alternatives/openapi-generator) covers when teams outgrow templates.

## Step 4: Generate with Scalar

Here is the same job with Scalar's managed generator. Every step below is from the [getting started guide](/products/sdk-generator/getting-started) and the [configuration reference](../../guides/sdks/configuration.md); nothing here needs a local install.

<scalar-steps>
  <scalar-step id="scalar-upload" title="Put the OpenAPI document in the Registry">

Sign in to the [dashboard](https://dashboard.scalar.com) and click **Create new SDK**. If the document is not already in the Registry, import it from the modal. OpenAPI 3.0 and 3.1 are supported, Swagger 2.0 documents are upgraded on load, and AsyncAPI documents work experimentally.

  </scalar-step>

  <scalar-step id="scalar-targets" title="Select targets">

Pick one target or several. TypeScript, Python, Go, and the CLI are generally available. Java, Kotlin, Ruby, C#, PHP, Rust, Swift, Dart, and C++ are experimental. Generation starts as soon as you click **Continue**.

  </scalar-step>

  <scalar-step id="scalar-config" title="Refine the configuration">

Scalar derives a starting configuration from your document. You adjust naming, environments, auth, and pagination in the configuration editor instead of rewriting the description.

```json
{
  "name": "Acme API",
  "environments": {
    "production": "https://api.acme.com",
    "sandbox": "https://sandbox.acme.com"
  },
  "environmentOrder": ["production", "sandbox"],
  "targets": {
    "typescript": { "packageName": "@acme/api" },
    "python": { "packageName": "acme_api", "projectName": "acme-api" },
    "go": { "repo": "acme/acme-go" }
  },
  "clientSettings": {
    "defaultRetries": {
      "maxRetries": 2,
      "initialDelaySeconds": 1,
      "maxDelaySeconds": 10
    }
  },
  "resources": {
    "users": {
      "methods": {
        "list": { "endpoint": "get /users", "paginated": "cursor" },
        "retrieve": "get /users/{user_id}"
      }
    }
  }
}
```

Every build also runs [diagnostics](/products/sdk-generator/diagnostics) against the document and configuration together, reporting what generation had to skip or guess. You can make those findings fail the build.

  </scalar-step>

  <scalar-step id="scalar-read" title="Read the output">

Every target gets a preview repository. Read the generated code, the `api.md` reference, and the README before you connect your own repository.

  </scalar-step>

  <scalar-step id="scalar-link" title="Link your repository">

Connect a GitHub repository per target. Builds push pristine output to `scalar-generated`, merge it with your own commits on `scalar-next`, and keep a release pull request open against your default branch. Your edits survive regeneration through a three-way merge; see [custom code](/products/sdk-generator/custom-code).

  </scalar-step>
</scalar-steps>

### What the output looks like

The [Warp TypeScript SDK](https://github.com/TeamWarp/warp-sdk-typescript/tree/scalar-generated) is a public example of Scalar output, generated for Warp's HR API. The `scalar-generated` branch is the raw generator output. Its README shows this usage:

```ts
import Warp from 'warp-hr'

const client = new Warp({
  apiKey: process.env['WARP_API_KEY'], // defaults to the WARP_API_KEY env var
})

const assignments = await client.timeOff.listAssignments()
```

Errors are typed per status, so callers can branch on what happened instead of parsing messages:

```ts
import Warp, { RateLimitError, NotFoundError, APIError } from 'warp-hr'

const client = new Warp()

try {
  await client.workers.get('wrk_1234')
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log('No such worker')
  } else if (err instanceof RateLimitError) {
    console.log('Slow down, retry later', err.headers)
  } else if (err instanceof APIError) {
    console.log(err.status, err.name)
  }
  throw err
}
```

The repository also carries `api.md` (every method grouped by resource), `SKILL.md` and a `.claude/skills/` entry for coding agents, release-please configuration, and the generated GitHub workflows. Warp's own story, including how they moved four SDK surfaces without breaking customers, is in the [Warp case study](/customers/warp).

The Python and Go targets expose the same resource tree in each language's idiom:

<scalar-tabs default="Python">
<scalar-tab title="Python">

```python
import os

from acme_api import Acme

client = Acme(api_key=os.environ.get("ACME_API_KEY"))

# Iterating fetches the next cursor page for you.
for user in client.users.list(limit=50):
    print(user.id, user.email)
```

</scalar-tab>
<scalar-tab title="Go">

```go
package main

import (
	"context"
	"fmt"
	"os"

	acme "github.com/acme/acme-go"
	"github.com/acme/acme-go/option"
)

func main() {
	client := acme.NewClient(option.WithAPIKey(os.Getenv("ACME_API_KEY")))

	iter := client.Users.ListAutoPaging(context.Background(), acme.UserListParams{
		Limit: acme.Int(50),
	})
	for iter.Next() {
		user := iter.Current()
		fmt.Println(user.ID, user.Email)
	}
	if err := iter.Err(); err != nil {
		panic(err)
	}
}
```

</scalar-tab>
</scalar-tabs>

These two samples use the Acme example from this guide; the exact client name and module path come from your configuration.

## Step 5: Publish to npm, PyPI, and Go modules

Generated code that is not published is a zip file. Each registry works differently.

**npm (TypeScript).** You need a package name you own, a `package.json` with `exports` for ESM and CommonJS, and a publish step. Prefer npm's [trusted publishing](https://docs.npmjs.com/trusted-publishers/) from GitHub Actions over long-lived tokens.

**PyPI (Python).** You need a distribution name (`acme-api`) and an import name (`acme_api`), which are often different. PyPI also supports [trusted publishers](https://docs.pypi.org/trusted-publishers/), so the workflow exchanges a short-lived identity token instead of storing a secret.

**Go modules.** There is no registry upload. A Go module is published by pushing a semver tag, such as `v1.2.3`, to a public repository whose path matches the module path in `go.mod`. The [Go module proxy](https://proxy.golang.org/) fetches it the first time someone runs `go get`.

With Scalar, publishing is opt-in per target. Turn it on in the dashboard or add a `publish` block:

```json
{
  "targets": {
    "typescript": {
      "packageName": "@acme/api",
      "publish": { "npm": true }
    },
    "python": {
      "packageName": "acme_api",
      "projectName": "acme-api",
      "publish": { "pypi": true }
    },
    "go": {
      "repo": "acme/acme-go",
      "publish": { "go": true }
    }
  }
}
```

Scalar writes the release workflows into your repository. release-please computes the version from Conventional Commits and keeps a release pull request open; merging it tags the release and publishes, using OIDC trusted publishing where the registry supports it. Register `release-please.yml` as the trusted publisher's workflow. The [publishing overview](/products/sdk-generator/publishing/overview) has per-registry setup, including Maven Central, RubyGems, NuGet, Packagist, crates.io, and Homebrew for CLIs.

## Step 6: Regenerate from CI

An SDK is only as current as its last generation. The goal is simple: a merged change to the OpenAPI document should produce a reviewable pull request against every SDK, without anyone remembering to run a command.

With an open-source generator, you own that pipeline. A minimal GitHub Actions workflow regenerates on every change to the document and opens a pull request:

```yaml
# .github/workflows/regenerate-sdk.yml
name: Regenerate TypeScript SDK

on:
  push:
    branches: [main]
    paths: ['openapi.yaml']

permissions:
  contents: write
  pull-requests: write

jobs:
  regenerate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - name: Generate
        run: |
          npx @openapitools/openapi-generator-cli generate \
            -i openapi.yaml -g typescript-fetch -o sdk/typescript
      - name: Open a pull request
        uses: peter-evans/create-pull-request@v7
        with:
          branch: sdk/regenerate
          title: 'chore(sdk): regenerate from openapi.yaml'
```

You then repeat that per language, add versioning, and decide what happens to hand edits inside `sdk/typescript` (the next run overwrites them unless you use the generator's ignore file).

With Scalar, CI only has to publish the new document to the Registry. The [Registry GitHub Actions guide](/products/registry/github-actions) uses the Scalar CLI:

```yaml
# .github/workflows/push-to-scalar-registry.yml
name: Push OpenAPI document to the Registry

on:
  push:
    branches: [main]

jobs:
  push-to-scalar-registry:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - name: Validate OpenAPI document
        run: npx @scalar/cli document validate api/openapi.json
      - name: Log in to Registry
        run: npx @scalar/cli auth login --token ${{ secrets.SCALAR_API_KEY }}
      - name: Push to Registry
        run: npx @scalar/cli registry publish --namespace your-team --slug your-api api/openapi.json
```

Each SDK follows its API document by exact version or by a semver range such as `^1.2.0`. When a matching document changes, Scalar mints a new SDK version, rebuilds every target, and updates the release pull request in each repository. You review and merge; nothing reaches a registry until you do.

## Common mistakes

- **Generating before validating.** Generators tolerate a lot, which means errors show up as strange code instead of failures.
- **Unstable `operationId` values.** Renaming them renames public methods. Treat them as API surface.
- **Inline everything.** Anonymous schemas produce anonymous types. Name the ones users will see.
- **Documenting only the success response.** Without error responses, the SDK cannot give you typed errors.
- **Implicit pagination.** If the document does not say an endpoint paginates, the SDK returns one page and callers write the loop themselves.
- **Editing generated files with no merge strategy.** The next regeneration wipes the change. Use the generator's custom-code mechanism, or keep edits in separate files.
- **Publishing without a version policy.** Decide how API changes map to semver before the first release, not after the first breaking change.
- **Skipping the README.** Most developers read the README and one example before anything else.

## Frequently asked questions

<scalar-detail title="Can I generate an SDK from a Swagger 2.0 file?">

Yes, with most tools. [OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator) accepts Swagger 2.0 directly, and Scalar upgrades Swagger 2.0 documents to OpenAPI 3 on load. Converting to OpenAPI 3.1 yourself is still worth doing, because 3.1 aligns schemas with JSON Schema and handles nullable types more cleanly.

</scalar-detail>

<scalar-detail title="What is the best free SDK generator for OpenAPI?">

For breadth and zero licence cost, OpenAPI Generator is the long-standing choice and supports far more languages than any commercial tool. Kiota is a strong alternative if you want a consistent client design across languages and path filtering for large APIs. Scalar's free plan includes one SDK for an API with up to 25 endpoints, which is enough to evaluate the managed approach on a small API.

</scalar-detail>

<scalar-detail title="How long does it take to generate an SDK from OpenAPI?">

The generation step takes seconds to minutes with any tool. The real time goes into cleaning up the OpenAPI document, reviewing the output, and setting up publishing. For a well-described API, expect a first publishable SDK in a day or two with a managed generator, and longer with an open-source one, because you also build the release pipeline.

</scalar-detail>

<scalar-detail title="Can I edit the generated code?">

It depends on the tool. Template generators overwrite files on each run unless you exclude them with an ignore file. Managed generators handle it differently: Scalar uses a three-way merge on a managed branch, so your edits survive and conflicts arrive as a pull request, and Speakeasy [documents a three-way merge too](https://www.speakeasy.com/docs/sdks/customize/basics). Ask any vendor you evaluate to show you this on your own code.

</scalar-detail>

<scalar-detail title="Do I need a separate SDK for every language?">

Yes. Each language needs its own package, its own idioms, and its own registry. Start with the languages your users actually write, which your API logs or support tickets will usually tell you, and add more when demand shows up.

</scalar-detail>

<scalar-detail title="Can I generate an MCP server the same way?">

The inputs are the same (an OpenAPI document with clear operations and schemas), but the output is different. Scalar hosts MCP servers built from your OpenAPI document rather than generating code you deploy. See [how to generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi).

</scalar-detail>

## Related

- **Learn:** [What is an SDK?](/learn/sdk/what-is-an-sdk) · [SDK vs API](/learn/sdk/sdk-vs-api) · [Build vs buy an SDK](/learn/sdk/build-vs-buy-sdk) · [What is OpenAPI?](/learn/openapi/what-is-openapi)
- **Docs:** [SDK Generator getting started](/products/sdk-generator/getting-started) · [Pagination](/products/sdk-generator/pagination)
- **Product:** [Scalar SDK Generator](/products/sdk-generator) — generate TypeScript, Python, Go, and CLI clients from your OpenAPI document and publish them from your own repositories.

---

*Competitor details in this guide come from each vendor's own documentation, repositories, and announcements as of September 26, 2026. Products change; if something here is out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
