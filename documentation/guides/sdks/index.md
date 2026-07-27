<div class="flex flex-col gap-3 hero">
  <scalar-heading level="1" slug="sdk-generator" class="text-balance">
    SDK Generator
  </scalar-heading>
  <a
    class="inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-b-2 hover:bg-b-3 px-3 py-2 text-xs leading-none text-c-1 no-underline"
    href="/resources/migration/stainless">
    <span class="font-medium">Migrate off Stainless</span>
    <span class="text-c-3" aria-hidden="true">•</span>
    <span class="inline-flex items-center gap-2 text-c-2">
      Read more
      <span aria-hidden="true">→</span>
    </span>
  </a>
  <p>
    Idiomatic, type-safe client libraries generated from the OpenAPI document your team already maintains. Pick your targets, review real code in minutes, and publish from your own repositories through pull requests you control.
  </p>
  <div class="flex flex-wrap gap-2">
    <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Get started</a>
    <a class="t-editor__button button__secondary" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Book a demo</a>
  </div>
</div>

<div class="code-switcher">

<scalar-tabs default="TypeScript">
  <scalar-tab title="TypeScript">

```ts index.ts
import WarpAPI from "warp-hr";

const client = new WarpAPI({
  apiKey: process.env["API_KEY"], // defaults to the API_KEY env var
});

const assignments = await client.timeOff.listAssignments();
```

  </scalar-tab>
  <scalar-tab title="Python">

```python main.py
import os

from warp import Warp

client = Warp(
    api_key=os.environ.get("WARP_API_KEY"),
)

time_off = client.time_off.list_assignments()
```

  </scalar-tab>
  <scalar-tab title="Go">

```go main.go
package main

import (
	"context"
	"os"

	sdk "github.com/TeamWarp/warp-go-sdk"
	"github.com/TeamWarp/warp-go-sdk/option"
)

func main() {
	client := sdk.NewClient(
		option.WithAPIKey(os.Getenv("WARP_API_KEY")),
	)

	timeOff, err := client.TimeOff.ListAssignments(context.Background(), sdk.TimeOffListAssignmentsParams{})
	if err != nil {
		panic(err)
	}
	_ = timeOff
}
```

  </scalar-tab>
</scalar-tabs>

</div>

<div class="feature">
  <div class="feature-container">
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/arrow-up-right"></scalar-icon>
        OpenAPI-first
      </b>
      <p class="leading-6">Generate from the OpenAPI 3.0 or 3.1 document your team already maintains. Swagger 2.0 is upgraded on load.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/code"></scalar-icon>
        Idiomatic per language
      </b>
      <p class="leading-6">Each target is written to the conventions of its language, not templated from one shared shape.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/brackets-square"></scalar-icon>
        Custom code survives
      </b>
      <p class="leading-6">Edit generated files directly. Every rebuild carries your changes forward through a three-way merge.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/fingerprint"></scalar-icon>
        Authentication built in
      </b>
      <p class="leading-6">API keys, Basic, Bearer, OAuth 2.0, and OIDC, wired from the security schemes in your description.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/git-branch"></scalar-icon>
        Publishes through pull requests
      </b>
      <p class="leading-6">Versions, changelogs, and releases land as reviewable pull requests in your own repository.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/terminal-window"></scalar-icon>
        CLI targets
      </b>
      <p class="leading-6">Generate a full command-line client alongside your SDKs, with typed flags and structured output.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/file-cloud"></scalar-icon>
        Streaming and uploads
      </b>
      <p class="leading-6">Server-sent events, newline-delimited JSON, WebSockets, and multipart file uploads.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/robot"></scalar-icon>
        Ready for coding agents
      </b>
      <p class="leading-6">Every SDK ships an Agent Skill and a generated reference, so agents call your API correctly.</p>
    </div>
  </div>
</div>

## Targets and registries

Every target publishes to the registry its ecosystem expects, using workflows generated into your repository.

<div class="target-columns">
<div>

**Generally available**

| Target | Package registry |
| ------ | ---------------- |
| TypeScript | npm |
| Python | PyPI |
| Go | Go modules |
| CLI | npm and Homebrew |

</div>
<div>

**Experimental**

| Target | Package registry |
| ------ | ---------------- |
| Java | Maven Central |
| Kotlin | Maven Central |
| Ruby | RubyGems |
| C# | NuGet |
| PHP | Packagist |
| Rust | crates.io |
| Swift | Swift Package Manager |
| Dart | pub.dev |
| C++ | No standard registry |

</div>
</div>

<scalar-callout type="info" icon="phosphor/regular/info">
  Generally available targets carry end-to-end tests that generate, build, and run against a live server on every change. Experimental targets generate working code, and Java, Kotlin, Ruby, and C# sit in the same test matrix, but the label is there for a reason: talk to us before you depend on one.
</scalar-callout>

## Generated, not templated

Template-based generators map each operation to a method mechanically. The result compiles, but nobody wants to write against it: the resource noun appears twice in every call, optional parameters arrive positionally, and the response is buried behind a transport object.

```ts Template-based generator
import { Configuration, TimeOffApi } from "./generated";

const config = new Configuration({
  basePath: "https://api.warp.dev",
  apiKey: process.env.WARP_API_KEY,
});

const api = new TimeOffApi(config);

const response = await api.timeOffListAssignmentsGet(
  undefined, // limit
  undefined, // cursor
  undefined, // options
);
const assignments = response.data;
```

```ts Scalar
import WarpAPI from "warp-hr";

const client = new WarpAPI({
  apiKey: process.env["API_KEY"], // defaults to the API_KEY env var
});

const assignments = await client.timeOff.listAssignments();
```

Two details do most of that work. The client is named after your API and exported as the default export, so the import reads like the product. And credentials come from a conventional environment variable, so the happy path does not require passing a secret at all.

The third is method naming. Scalar strips the redundant resource noun and normalizes the verb, so the same handful of methods appears on every resource:

| `operationId` | Template-based generator | Scalar |
| ------------- | ------------------------ | ------ |
| `listPets` | `client.pets.listPets()` | `client.pet.list()` |
| `getPetById` | `client.pets.getPetById()` | `client.pet.retrieve()` |
| `addPet` | `client.pets.addPet()` | `client.pet.create()` |

Across a large API that consistency is the difference between guessing a method name and knowing it. For a fuller side-by-side against another generator, see [Scalar vs Fern](../../compare/fern.md).

## Everything a hand-written SDK does

### Types

- **Typed request and response models** for every operation, generated from your schemas.
- **`oneOf`, `anyOf`, and `allOf`** lowered into real union types, with discriminator support.
- **Typed errors** exposing status, headers, the parsed response body, and request metadata.
- **Documented error statuses** enumerated per operation, so handling failures is not guesswork.
- **Zero runtime dependencies** unless you enable a feature that needs one. The generated Warp package ships `"dependencies": {}`.

### Networking

- **Auto-paginating iterators** across ten pagination schemes: cursor, cursor id, cursor URL, offset, page number, `Link` header, header token, body link, compound cursor, and `hasMore`.
- **Streaming responses** over server-sent events and newline-delimited JSON, with event metadata preserved.
- **WebSockets** with separate Node and browser adapters.
- **File uploads** as multipart, URL-encoded, or raw binary.
- **Multi-content-type operations** get a content-type selector instead of a guess.

### Reliability

- **Retries on temporary failures**, defaulting to two attempts and covering network errors, 408, 409, 429, and 5xx responses.
- **`Retry-After` is honored** when the server sends it, with configurable backoff otherwise.
- **Timeouts** default to 60 seconds and can be overridden per request.
- **Idempotency keys** per request, using the header your API expects.
- **Raw response access** so you can read the underlying response and parse it yourself.
- **Custom HTTP client injection** for your own transport, middleware, or instrumentation.

### Authentication

- **API keys** in a header, query parameter, or cookie.
- **HTTP Basic and Bearer**, with Basic split into separate username and password options.
- **OAuth 2.0 and OIDC** schemes declared in your description.
- **Environment variable defaults** per credential, so the quickstart needs no secrets inline.
- **Async credential providers** for tokens you have to fetch or refresh yourself.
- **Typed webhook events** from `webhooks` and operation `callbacks`, with HMAC-SHA256 signature verification, multi-secret rotation, and timestamp tolerance.

### Docs and agents

- **An Agent Skill** written to `SKILL.md` and `.claude/skills/`, so coding agents discover how to call your API.
- **A generated `api.md`** listing every method grouped by resource, with request and response types linked to source.
- **Code samples injected into your OpenAPI** as `x-codeSamples` and rendered in your API reference. Examples you curated by hand are preserved.
- **A generated README** with authentication, client option, and request option tables filled in from your description.
- **An async counterpart** in languages that have one, exposing the same resource tree.

### Releases

- **Version and changelog pull requests** managed by release-please against the branch you nominate.
- **Publishing workflows** generated into your repository for eleven registries, with actions pinned by commit SHA.
- **Trusted publishing** where the registry supports it, so no long-lived tokens are needed.
- **Conventional Commit messages** describing what actually changed in the SDK surface, marked as breaking when they are.
- **Smoke tests** that call every operation against a mock server and report the result.

## How it works

<scalar-steps>
  <scalar-step id="step-openapi" title="Start from your OpenAPI document">

Put your API description in [Registry](../registry/index.md), or import it while creating the SDK. OpenAPI 3.0 and 3.1 are supported, and Swagger 2.0 documents are upgraded on load.

  </scalar-step>

  <scalar-step id="step-targets" title="Pick your targets">

Choose one target or a dozen. Generation begins immediately, and each target gets its own configuration, version history, and build log.

<scalar-image
  src="/sdks/sdk-overview.png"
  alt="An SDK in the Scalar dashboard showing build status, targets, and version history"
  size="full">
</scalar-image>

  </scalar-step>

  <scalar-step id="step-sample" title="Read the code before committing to anything">

Every target gets a preview repository, provisioned automatically. Browse the generated code, the `api.md` reference, and the README before you wire up a repository of your own.

  </scalar-step>

  <scalar-step id="step-repo" title="Link your own repository">

Connect the repository where the SDK should live. Scalar authors commits through a GitHub App installation, never a personal token, and every build opens a pull request against the branch you nominate.

<scalar-image
  src="/sdks/github-linked.png"
  alt="Git settings for a target, showing the connected repository, default branch, publish toggle, and synced versions"
  size="full">
</scalar-image>

  </scalar-step>

  <scalar-step id="step-publish" title="Publish from your repository">

release-please cuts version and changelog pull requests. When they merge, the release workflows in your repository publish the package. Your package names, registries, and release history stay yours. See [publishing](publishing/overview.md).

  </scalar-step>

  <scalar-step id="step-autoupdate" title="Let it follow your API">

Point each SDK at an exact version of your API document or at a semver range such as `^1.2.0`. When a matching document changes, Scalar mints a new SDK version and rebuilds, so one commit updates every target.

  </scalar-step>
</scalar-steps>

## Your custom code survives regeneration

Generated SDKs rarely cover every need. You will want a convenience method, a tweaked type, a helper, or a better README, and no generator should make you choose between that and staying up to date.

Edit generated files as you would any other code. Every build performs a three-way merge between the previous generation, the new generation, and the current state of your repository, then opens a pull request combining the two. Untouched files update cleanly, your edits ride along, and files you added yourself are left alone.

For code you want held in place explicitly, mark a region:

```ts
// scalar-sdk-generator:custom-code retry-helper:start
export const withBackoff = async <T>(fn: () => Promise<T>) => {
  // Anything in here is carried forward on every regeneration.
};
// scalar-sdk-generator:custom-code retry-helper:end
```

Conflicts happen only when a regenerated file changes the same lines you edited. When that happens, the build surfaces the conflict as a pull request you resolve on GitHub like any other merge conflict. The whole flow runs on managed branches you can inspect yourself: `scalar-generated` holds pristine output, `scalar-next` holds output merged with your commits, and `scalar-merge-conflict` carries anything that needs a human. Read more in [custom code](custom-code.md).

## Built for coding agents

Agents write a growing share of the code that calls your API, and they are the consumers most likely to invent a method name that does not exist. Every generated SDK ships the context needed to prevent that.

- An **Agent Skill** at `SKILL.md`, plus `.claude/skills/<name>/SKILL.md` for automatic discovery, covering installation, client construction, authentication, and how to look up a call signature.
- A generated **`api.md`** listing every operation with its request and response types, designed to drop straight into an agent's context.
- An **`openapi.augmented.json`** carrying your description alongside generated code samples and installation metadata.

All three are on by default, and all three are readable right now in the [generated Warp SDK](https://github.com/TeamWarp/warp-sdk-typescript/tree/scalar-generated).

## Tested against SDKs that ship

An SDK generator is only worth what its output survives, so most of the engineering here is testing rather than templating.

<div class="feature">
  <div class="feature-container">
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/arrow-up-right"></scalar-icon>
        Parity against shipped SDKs
      </b>
      <p class="leading-6">A harness compares our output to client libraries companies actually publish, on public API shape and on live wire traffic.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-purple">
        <scalar-icon src="phosphor/bold/warning-octagon"></scalar-icon>
        Smoke tests per target
      </b>
      <p class="leading-6">Generated harnesses call every operation against a mock server and report which ones fail.</p>
    </div>
  </div>
</div>

The parity harness is the part we would want to see as a buyer. It clones production SDKs at pinned commits, extracts the public surface from both, and fails on drift in operation coverage, wire shapes, unions, enums, pagination behavior, requiredness, or parameter location. Then it drives both clients through every shared operation against a recording mock and diffs the requests they send.

## Coming from Stainless?

Stainless is winding down its hosted SDK generator. Scalar reads your existing `stainless.yml` directly, so your resources, method names, pagination schemes, and per-language package names carry across and the call sites your users have already written keep working.

Read the [Stainless migration guide](../../migration/stainless.md).

## Plans

SDK generation is billed per target, at $100 per month or $1,000 per year.

| | Free | Pro | Enterprise |
| --- | --- | --- | --- |
| SDKs | 1 | 3 | Unlimited |
| Targets | 1 | Billed per target | Billed per target |
| Every target free during your trial | Included | Included | Included |
| SSO/SAML, RBAC, priority support, and dedicated Slack or Teams support | - | - | Included |

A target becomes billable when you save a version and queue its build. Drafts are never billed. [See the full comparison](../pricing.md) for SDKs and the other Scalar products.

## Questions

<scalar-detail title="Which targets are production ready?">

TypeScript, Python, Go, and the CLI target are generally available. The rest are marked experimental in the dashboard. Java, Kotlin, Ruby, and C# sit in the same continuous integration matrix as the generally available targets and are the closest behind them. PHP, Rust, Swift, Dart, and C++ generate working code, and we would rather talk to you first than have you discover a gap in production.

</scalar-detail>

<scalar-detail title="Do I own the generated code?">

Yes. The SDK lives in your repository, under your package name, published to your registry accounts. Scalar opens pull requests against it and never cuts tags or releases on your behalf.

</scalar-detail>

<scalar-detail title="What happens to code I wrote by hand?">

It is carried forward. Every build three-way merges the new generation with the current state of your repository, so your edits survive. Marked custom-code regions are preserved explicitly, and files you added yourself are never touched. Conflicts arrive as a pull request you resolve on GitHub.

</scalar-detail>

<scalar-detail title="Where can SDKs be published?">

npm, PyPI, Go modules, Maven Central, RubyGems, NuGet, Packagist, crates.io, the Swift Package Manager, pub.dev, and Homebrew for CLI targets. Publishing runs from workflows generated into your repository, with actions pinned by commit SHA and trusted publishing where the registry supports it.

</scalar-detail>

<scalar-detail title="Which authentication schemes are supported?">

API keys in a header, query parameter, or cookie; HTTP Basic; Bearer tokens; and OAuth 2.0 and OIDC schemes declared in your description. Each credential gets an environment variable default, and you can supply an async provider for tokens you fetch or refresh yourself.

</scalar-detail>

<scalar-detail title="Does my OpenAPI document need to be perfect?">

No. Scalar generates a starting configuration from whatever you have, covering naming, pagination, and authentication. You then refine it in the [configuration](configuration.md) editor rather than by rewriting your description.

</scalar-detail>

<scalar-detail title="What keeps my SDKs in sync with the API?">

Each SDK follows its API document by exact version or by a semver range you set. When a matching document changes, Scalar mints a new SDK version, rebuilds every target, and opens the pull requests. One commit to your API updates all of your clients.

</scalar-detail>

## Ready to generate your first SDK?

Follow the [Getting Started guide](getting-started.md) to generate a target from the dashboard, or bring an existing configuration and we will do the migration with you.

<div class="flex flex-wrap gap-2">
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

  .code-switcher {
    margin-top: 40px;
  }

  .target-columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px;
    align-items: start;
  }

  @media screen and (max-width: 1000px) {
    .target-columns {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  }

  /* The tabs component does not accept an icon prop, so the language marks are
     applied as masks on the tab labels. Scoped to the hero switcher only. */
  .code-switcher .custom-tabs-nav .custom-tabs-tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .code-switcher .custom-tabs-tab::before {
    content: '';
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    background-color: currentColor;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-position: center;
    mask-position: center;
    -webkit-mask-size: contain;
    mask-size: contain;
  }

  /* typescript */
  .code-switcher .custom-tabs-tab:nth-child(1)::before {
    -webkit-mask-image: url('data:image/svg+xml,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/></svg>');
    mask-image: url('data:image/svg+xml,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/></svg>');
  }

  /* python */
  .code-switcher .custom-tabs-tab:nth-child(2)::before {
    -webkit-mask-image: url('data:image/svg+xml,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/></svg>');
    mask-image: url('data:image/svg+xml,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/></svg>');
  }

  /* go */
  .code-switcher .custom-tabs-tab:nth-child(3)::before {
    -webkit-mask-image: url('data:image/svg+xml,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M1.811 10.231c-.047 0-.058-.023-.035-.059l.246-.315c.023-.035.081-.058.128-.058h4.172c.046 0 .058.035.035.07l-.199.303c-.023.036-.082.07-.117.07zM.047 11.306c-.047 0-.059-.023-.035-.058l.245-.316c.023-.035.082-.058.129-.058h5.328c.047 0 .07.035.058.07l-.093.28c-.012.047-.058.07-.105.07zm2.828 1.075c-.047 0-.059-.035-.035-.07l.163-.292c.023-.035.07-.07.117-.07h2.337c.047 0 .07.035.07.082l-.023.28c0 .047-.047.082-.082.082zm12.129-2.36c-.736.187-1.239.327-1.963.514-.176.046-.187.058-.34-.117-.174-.199-.303-.327-.548-.444-.737-.362-1.45-.257-2.115.175-.795.514-1.204 1.274-1.192 2.22.011.935.654 1.706 1.577 1.835.795.105 1.46-.175 1.987-.77.105-.13.198-.27.315-.434H10.47c-.245 0-.304-.152-.222-.35.152-.362.432-.97.596-1.274a.315.315 0 01.292-.187h4.253c-.023.316-.023.631-.07.947a4.983 4.983 0 01-.958 2.29c-.841 1.11-1.94 1.8-3.33 1.986-1.145.152-2.209-.07-3.143-.77-.865-.655-1.356-1.52-1.484-2.595-.152-1.274.222-2.419.993-3.424.83-1.086 1.928-1.776 3.272-2.02 1.098-.2 2.15-.07 3.096.571.62.41 1.063.97 1.356 1.648.07.105.023.164-.117.2m3.868 6.461c-1.064-.024-2.034-.328-2.852-1.029a3.665 3.665 0 01-1.262-2.255c-.21-1.32.152-2.489.947-3.529.853-1.122 1.881-1.706 3.272-1.95 1.192-.21 2.314-.095 3.33.595.923.63 1.496 1.484 1.648 2.605.198 1.578-.257 2.863-1.344 3.962-.771.783-1.718 1.273-2.805 1.495-.315.06-.63.07-.934.106zm2.78-4.72c-.011-.153-.011-.27-.034-.387-.21-1.157-1.274-1.81-2.384-1.554-1.087.245-1.788.935-2.045 2.033-.21.912.234 1.835 1.075 2.21.643.28 1.285.244 1.905-.07.923-.48 1.425-1.228 1.484-2.233z"/></svg>');
    mask-image: url('data:image/svg+xml,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M1.811 10.231c-.047 0-.058-.023-.035-.059l.246-.315c.023-.035.081-.058.128-.058h4.172c.046 0 .058.035.035.07l-.199.303c-.023.036-.082.07-.117.07zM.047 11.306c-.047 0-.059-.023-.035-.058l.245-.316c.023-.035.082-.058.129-.058h5.328c.047 0 .07.035.058.07l-.093.28c-.012.047-.058.07-.105.07zm2.828 1.075c-.047 0-.059-.035-.035-.07l.163-.292c.023-.035.07-.07.117-.07h2.337c.047 0 .07.035.07.082l-.023.28c0 .047-.047.082-.082.082zm12.129-2.36c-.736.187-1.239.327-1.963.514-.176.046-.187.058-.34-.117-.174-.199-.303-.327-.548-.444-.737-.362-1.45-.257-2.115.175-.795.514-1.204 1.274-1.192 2.22.011.935.654 1.706 1.577 1.835.795.105 1.46-.175 1.987-.77.105-.13.198-.27.315-.434H10.47c-.245 0-.304-.152-.222-.35.152-.362.432-.97.596-1.274a.315.315 0 01.292-.187h4.253c-.023.316-.023.631-.07.947a4.983 4.983 0 01-.958 2.29c-.841 1.11-1.94 1.8-3.33 1.986-1.145.152-2.209-.07-3.143-.77-.865-.655-1.356-1.52-1.484-2.595-.152-1.274.222-2.419.993-3.424.83-1.086 1.928-1.776 3.272-2.02 1.098-.2 2.15-.07 3.096.571.62.41 1.063.97 1.356 1.648.07.105.023.164-.117.2m3.868 6.461c-1.064-.024-2.034-.328-2.852-1.029a3.665 3.665 0 01-1.262-2.255c-.21-1.32.152-2.489.947-3.529.853-1.122 1.881-1.706 3.272-1.95 1.192-.21 2.314-.095 3.33.595.923.63 1.496 1.484 1.648 2.605.198 1.578-.257 2.863-1.344 3.962-.771.783-1.718 1.273-2.805 1.495-.315.06-.63.07-.934.106zm2.78-4.72c-.011-.153-.011-.27-.034-.387-.21-1.157-1.274-1.81-2.384-1.554-1.087.245-1.788.935-2.045 2.033-.21.912.234 1.835 1.075 2.21.643.28 1.285.244 1.905-.07.923-.48 1.425-1.228 1.484-2.233z"/></svg>');
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
