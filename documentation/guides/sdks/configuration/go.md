<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand — run:
bun run --filter @scalar/sdk-config types:generate

Published at https://scalar.com/docs/guides/sdks/configuration, which is where the links to
pages outside this reference resolve.
-->
# Go

Add `go` under `targets` to generate a Go SDK package.

```json
{
  "targets": {
    "go": {
      "packageName": "acmeapi",
      "destinations": {
        "production": {
          "repo": "acme/acme-go"
        }
      },
      "publish": {
        "go": true
      }
    }
  }
}
```

Registry accounts, secrets, and first-release setup: [Go publishing](../publishing/go.md).

## packageName

**Type:** `string`

Go package identifier, and a module-path fallback. It names the `package <name>` clause in every emitted file, normalized to a Go-legal identifier — `Acme` becomes `acme`, `pagination-api` becomes `paginationapi` — which is also how consumers spell every call (`acme.NewClient(...)`), so renaming it on a published SDK breaks their source. It is normally *not* what the module path is built from: `go.mod` and every generated import come from `destinations.production.repo`, or from `goModulePathOverride` when the published module path and the repository have diverged. This is only the module-path fallback for a target that configures neither. Defaults to `clientSettings.defaultClientName`, then the SDK's own name — the client name first because it is the short, deliberate one, and this is spelled at every call site.

## destinations

**Type:** `object`

Per-target GitHub destinations for pushing generated output.

### production

**Type:** `object`

Primary published-output repository for this target. Configuring it is what gives the target generated GitHub Actions at all: it turns on the CI workflow, the release-please configuration, and the versioning policy. The release workflow that uploads at release time is added on top of those only when `publish` enables a registry that needs one — a tag-served ecosystem publishes from the platform-created tag alone. A target with no production destination is still generated, but emits no workflows, which is what local and preview generation wants.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `repo` | `string` | ✅ | GitHub repository in `owner/name` form that generated output for this target is pushed to. An `owner/name#branch` suffix is tolerated and supplies the default branch when `branch` does not, but prefer setting `branch` on its own: not every target strips the suffix back off when it writes the repository URL into published package metadata. |
| `branch` | `string` |  | Default branch of the destination repository, and the base that release PRs are opened against. Generated output itself is always pushed to the fixed `scalar-generated` branch, which the platform merges with custom code on `scalar-next`; the release PR is raised from `scalar-next` against the branch named here, so merging it is the promotion. The branch is resolved by trying this value, then a `#branch` suffix on `repo`, then `main`, skipping any candidate that is not a safe git ref — the name is interpolated into generated workflow YAML, so an unsafe one is passed over rather than emitted, and an unsafe value here does not mask a usable suffix. |

## publish

**Type:** `object`

Go module publishing configuration (git version tags).

### go

**Type:** `boolean | object`

Go module publishing configuration for Go modules. `true` publishes with the defaults; an object tunes them.

Go has no registry to upload to and no account to set up: a module version *is* the `vX.Y.Z` git tag the release cuts, so nothing is published and no secret or `authMethod` applies. The generated release workflow only asks [proxy.golang.org](https://proxy.golang.org/) for the freshly tagged version, which caches the module and indexes it on [pkg.go.dev](https://pkg.go.dev/) immediately rather than on the first consumer's fetch. That warm-up is best-effort: it always runs, and a private destination repository — which the public proxy cannot see — leaves a warning annotation on the release run rather than failing it.

#### authMethod

**Type:** `"oidc" | "access-token"`

How the generated release workflow authenticates with the registry.

`oidc` uses the registry's [OIDC trusted publishing](https://docs.github.com/en/actions/concepts/security/openid-connect): the publish job exchanges its GitHub Actions id-token for a short-lived, package-scoped token, so no long-lived credential is stored in the destination repository. It is the default for every registry that supports it — npm, PyPI, crates.io, NuGet, pub.dev, and RubyGems — and requires a trusted publisher registered on the registry naming the destination repository, the workflow file the publish job runs from — `release-please.yml`, the workflow the automated release publishes from (register `sdk-release.yml` as a second publisher only if the manual re-publish workflow is used) — and the `releaseEnvironment` when one is set. pub.dev is the exception: it authorizes a git tag pattern rather than a workflow file, and no generated workflow can satisfy it, so a Dart target has to set `access-token` itself — see the table below and `publish.pub`.

`access-token` publishes with a long-lived token read from a repository secret instead; use it for a registry where no trusted publisher is registered yet, then drop the override once one is — except on `pub`, where it is not a stepping stone but the permanent answer, since pub.dev accepts a publish only from a tag-triggered run and neither generated workflow is one. Each registry's trusted-publisher page and token secret:

| Registry | Trusted publisher (OIDC) | Secret for `access-token` |
| --- | --- | --- |
| `npm` | [npm trusted publishers](https://docs.npmjs.com/trusted-publishers) — the package's **Settings → Trusted Publisher** tab | `NPM_TOKEN` |
| `pypi` | [PyPI publishing settings](https://pypi.org/manage/account/publishing/) | `PYPI_API_TOKEN` |
| `cargo` | [crates.io trusted publishing](https://crates.io/docs/trusted-publishing) — the crate's **Settings** tab | `CARGO_REGISTRY_TOKEN` |
| `nuget` | [nuget.org trusted publishing](https://learn.microsoft.com/nuget/nuget-org/trusted-publishing) — also reads `NUGET_USER` under OIDC | `NUGET_API_KEY` |
| `pub` | [pub.dev automated publishing](https://dart.dev/tools/pub/automated-publishing) — authorizes a tag pattern, not a workflow file, and the generated workflow cannot satisfy it; see `publish.pub` | `PUB_TOKEN` |
| `rubygems` | [RubyGems trusted publishing](https://guides.rubygems.org/trusted-publishing/) | `RUBYGEMS_API_KEY` |
| `maven` | not supported — always token | `MAVEN_CENTRAL_USERNAME`, `MAVEN_CENTRAL_PASSWORD`, `MAVEN_GPG_PRIVATE_KEY`, `MAVEN_GPG_PASSPHRASE` |
| `homebrew` | not supported — pushes to a tap repository | `HOMEBREW_TAP_TOKEN` |
| `binaries` | not applicable — uploads to the GitHub Release | none (ambient `GITHUB_TOKEN`) |
| `go`, `swiftpm`, `packagist` | not applicable — published by git tag | none |

Repository secrets live under **Settings → Secrets and variables → Actions** in the destination repository; an environment secret of the same name overrides one there when `releaseEnvironment` is set. Registries without OIDC support default to `access-token` regardless, and ecosystems published by git tag alone (Go, SwiftPM, Packagist) ignore this.

#### releaseEnvironment

**Type:** `string`

Release environment name used by generated publishing workflows. It renders as the publish job's `environment:`, so the destination repository's [environment protection rules](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments) — required reviewers, wait timers, environment secrets — gate the release. Under OIDC trusted publishing the name must also match the environment registered on the trusted publisher, which is how a registry constrains who in a repository may publish; leave the registry's environment field blank when this is unset, since a publisher that names an environment rejects a run without one. When it is set, the publish job can read that environment's secrets as well as the repository's, and an environment secret takes precedence over a repository secret of the same name.

#### homepage

**Type:** `string`

Registry or package homepage metadata.

#### description

**Type:** `string`

Registry or package description metadata.

## goModulePathOverride

**Type:** `string`

Go module path for `go.mod` and every generated import, when it must differ from the destination repository. The module path is normally derived from `destinations.production.repo` (e.g. `acme/acme-go` becomes `github.com/acme/acme-go`); set this when the published module path and the repository name have diverged, e.g. a repo renamed to `TeamWarp/warp-sdk-go` whose module must stay `github.com/TeamWarp/warp-go-sdk`. Accepts a full module path or an `owner/name` shorthand that is expanded to `github.com/owner/name`. The value is spliced into `go.mod` and every generated import, so it is restricted to Go path characters (`A-Za-z0-9._~+-` per `/`-separated element).

**Constraints:** `pattern: ^[A-Za-z0-9][A-Za-z0-9._~+-]*(/[A-Za-z0-9][A-Za-z0-9._~+-]*)*$`

## pointerServices

**Type:** `boolean`

Currently ignored, under either Go shape. Whether the client surface is pointer- or value-shaped follows the shape `options.codeStyle` selects rather than this key, and the `v1` shape the emitter writes today is always pointer-shaped (`NewClient` returns `*Client`; service fields are `*XService`), whatever this is set to. Kept declared so configs that already carry it stay valid. Honoring it would retype the client surface of every published SDK that leaves it unset, so it is a breaking change on its own rather than something to switch on quietly.

## prereleaseType

**Type:** `string`

Prerelease channel this target's releases publish on, as a bare semver prerelease identifier (`next`, `beta`, `rc`). It becomes the released version's prerelease suffix — a channel of `next` releases `1.2.0-next.1` — so the value is held to the shape a semver identifier may take: a letter, then letters, digits and hyphens.

Omit it to release on the stable line. A release train promoting to a conventionally named prerelease branch (`alpha`, `beta`, `canary`, `next`, `preview`, `rc`) adopts that branch's name as its channel, so this only has to be set to name a channel the branch does not, or to put a target on a prerelease line while promoting to a branch named something else.

**Constraints:** `pattern: ^[A-Za-z][0-9A-Za-z-]*$`

## options

**Type:** `object`

Go emitter options: which generated Go shape (dialect) the SDK is written in, and whether the service option field is exported.

### codeStyle

**Type:** `"v1" | "v2"`

Which generated Go shape the SDK is written in. `v1` (the default) types every parameter as `param.Field[T]`, marshals params through `apijson.MarshalRoot`, carries response metadata in a named sidecar struct of `apijson.Field`, and renders unions as interfaces with `AsUnion()`. `v2` types a plain scalar parameter as `param.Opt[T]` where it is optional or nullable and as its bare Go type otherwise, leaves every enum and composite parameter bare, embeds `paramObj` and marshals through `param.MarshalObject`, inlines response metadata as an anonymous `JSON` struct of `respjson.Field`, and flattens unions into a struct with `As<Variant>()`/`AsAny()` accessors. The two shapes export different root helpers (`F`/`Null`/`Raw`/`FileParam` against `Opt`/`Ptr`/`Time`/`File`), and four names they share return different types, so switching an already-published SDK from `v1` to `v2` is a source-breaking change for every consumer of it — and reverting is a second one. Set it only for a Go SDK with no published consumers, or in a coordinated major release. When the generator synthesizes a config for a document that ships none of its own, a Go target in that config asks for `v2` explicitly, because the run that first writes one is generating an SDK with no consumers yet; a config that omits the key resolves to `v1`, whenever it was written. Two caveats: the synthesized config carries only the targets the run selected, so it names a Go target only when Go was among them; and a run that keeps no config file at all — `--no-config`, or a remote document with no directory to write into — re-synthesizes that choice on every invocation instead of pinning it, so pin the shape in a real config before publishing a Go SDK from one. Every construct now has a `v2` form: a response `oneOf` mixing a scalar or array branch with an object branch, which `v1` renders as a marker interface, becomes one flattened struct there — the scalar branches as inline `Of<Type>` fields beside the object branches' merged properties, each reachable through its own `As<Variant>()`.

**Default:** `"v1"`

### optionsFieldExported

**Type:** `boolean`

Name the per-service request-option field `Options` rather than the unexported `options`, so callers can read or replace a service's default request options. True by default, which is the shape every Go SDK we generate ships today; set it to false only for an SDK whose published services already hide the field, since setting it to false on a live SDK removes a field its consumers can read. It is a separate axis from `codeStyle`: either shape can carry either spelling, and the Go emitter honors it under both.

**Default:** `true`

## generatorVersion

**Type:** `string`

Version of the Scalar SDK Generator used to generate this target's SDK, overriding the top-level generatorVersion.

## skip

**Type:** `boolean`

When true, the target is not generated.

## readmeTitle

**Type:** `string`

Heading of this target's generated README, overriding the SDK-wide `readme.title`. Free-form prose, so it carries no pattern and a renderer has to emit it as escaped text rather than as markdown.

## promotion

**Type:** `"automatic" | "manual"`

When a successful build's generated output reaches this target's production destination. `automatic`, the default, pushes every build, which opens a release pull request. `manual` holds each build at the staging playground until it is promoted explicitly, so reaching production is a deliberate act rather than a consequence of building.

This governs when the push happens, never what is generated: a `manual` target still emits the GitHub Actions, release-please configuration and versioning policy that `destinations.production` turns on, so a promoted build behaves exactly like an automatic one. A target declaring no production destination pushes nowhere either way, and is unaffected.

**Default:** `"automatic"`
