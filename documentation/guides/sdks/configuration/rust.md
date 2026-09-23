<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand — run:
bun run --filter @scalar/sdk-config types:generate

Published at https://scalar.com/docs/guides/sdks/configuration, which is where the links to
pages outside this reference resolve.
-->
# Rust

> [!NOTE]
> The Rust target is experimental.

Add `rust` under `targets` to generate a Rust SDK package.

```json
{
  "targets": {
    "rust": {
      "packageName": "acme",
      "destinations": {
        "production": {
          "repo": "acme/acme-rust"
        }
      },
      "publish": {
        "cargo": true
      }
    }
  }
}
```

Registry accounts, secrets, and first-release setup: [Rust publishing](../publishing/rust.md).

## packageName

**Type:** `string`

Rust crate name.

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

crates.io publishing configuration.

### cargo

**Type:** `boolean | object`

crates.io publishing configuration for Rust crates. `true` publishes with the defaults; an object tunes them.

Releases use [crates.io trusted publishing](https://crates.io/docs/trusted-publishing) (OIDC) unless `authMethod` says otherwise: the publish job exchanges its GitHub Actions id-token for a short-lived, crate-scoped token, so no `CARGO_REGISTRY_TOKEN` secret is stored. Register the publisher on the crate's **Settings → Trusted Publishing** tab (`https://crates.io/crates/<crate>/settings`), naming the destination repository's owner and name, the workflow file the publish job runs from — `release-please.yml`, the workflow the automated release publishes from (register `sdk-release.yml` as a second publisher only if the manual re-publish workflow is used) — and the `releaseEnvironment` when one is set.

crates.io has no pending-publisher flow, so the crate must already exist and be owned by you before a publisher can be registered: publish the first version with `authMethod` set to `access-token` and a [crates.io API token](https://crates.io/settings/tokens) stored as the `CARGO_REGISTRY_TOKEN` repository secret, then register the publisher and drop the override. Either way the publishing account needs a verified email address on its [account settings](https://crates.io/settings/profile) — crates.io rejects a publish from an account without one, whichever mechanism authenticates it. Repository secrets live under **Settings → Secrets and variables → Actions** in the destination repository; an environment secret of the same name overrides one there when `releaseEnvironment` is set.

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

## options

**Type:** `object`

Rust emitter options: naming overrides, date-time mapping, TLS backend, retries, and extra Cargo dependencies.

### crate_name

**Type:** `string`

Cargo crate name override (kebab-case). Defaults to the target packageName.

### package_repository

**Type:** `string`

Source repository written to `Cargo.toml`'s `repository` field, which crates.io links from the crate page. Accepts a full URL or an `owner/name` shorthand that is expanded to `https://github.com/owner/name`. Defaults to this target's `destinations.production.repo`, so a config that already declares one needs no override. A value naming no repository is dropped rather than guessed at.

### client_name

**Type:** `string`

Root client struct name override (UpperCamelCase). Defaults to a name derived from the API title.

### environment_enum_name

**Type:** `string`

Name of the generated environment enum (UpperCamelCase). Defaults to `Environment`.

**Default:** `"Environment"`

### date_time_type

**Type:** `"offset" | "utc" | "string"`

Rust type mapping for `date-time` schemas: 'offset' (the default) maps to chrono `DateTime<FixedOffset>`, 'utc' to `DateTime<Utc>`, and 'string' leaves timestamps as `String`.

**Default:** `"offset"`

### http_client

**Type:** `"reqwest"`

Bundled default HTTP backend compiled into the generated crate: 'reqwest' is the only value today. This only selects the batteries-included backend; bringing your own backend is done at runtime by implementing the generated crate's `Transport` trait and passing it to the client builder, not through this option.

**Default:** `"reqwest"`

### reqwest_tls

**Type:** `"rustls" | "native-tls"`

TLS backend feature enabled on the bundled reqwest client: 'rustls' (the default) or the platform 'native-tls'.

**Default:** `"rustls"`

### max_retries

**Type:** `integer`

Default retry attempts baked into the generated client. Defaults to the shared defaultRetries.maxRetries, then 2.

**Constraints:** `minimum: 0`

### extra_dependencies

**Type:** `object`

Extra `[dependencies]` entries rendered verbatim into the generated Cargo.toml, keyed by crate name.

### extra_dev_dependencies

**Type:** `object`

Extra `[dev-dependencies]` entries rendered verbatim into the generated Cargo.toml, keyed by crate name.

## prereleaseType

**Type:** `string`

Prerelease channel this target's releases publish on, as a bare semver prerelease identifier (`next`, `beta`, `rc`). It becomes the released version's prerelease suffix — a channel of `next` releases `1.2.0-next.1` — so the value is held to the shape a semver identifier may take: a letter, then letters, digits and hyphens.

Omit it to release on the stable line. A release train promoting to a conventionally named prerelease branch (`alpha`, `beta`, `canary`, `next`, `preview`, `rc`) adopts that branch's name as its channel, so this only has to be set to name a channel the branch does not, or to put a target on a prerelease line while promoting to a branch named something else.

**Constraints:** `pattern: ^[A-Za-z][0-9A-Za-z-]*$`

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
