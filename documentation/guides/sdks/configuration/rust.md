<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand.

Published at https://scalar.com/products/sdk-generator/configuration/rust, which is where the links to
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
        "cargo": {
          "authMethod": "oidc",
          "releaseEnvironment": "production"
        }
      }
    }
  }
}
```

Setting up publishing: [Rust publishing guide](../publishing/rust.md). How releases are cut: [Publishing](../publishing/overview.md).

## packageName

**Type:** `string`

Rust crate name.

## destinations

**Type:** `object`

Per-target GitHub destinations for pushing generated output.

### production

**Type:** `object`

Primary repository this target's generated output is published to. Setting it turns on the generated GitHub Actions: the CI workflow, the release-please configuration, and the versioning policy. A release workflow is added too when `publish` enables a registry that needs one; a registry served from git tags publishes from the release tag alone. Without a production destination the target is still generated, but with no workflows.

| Property | Description |
| --- | --- |
| `repo`* | GitHub repository in `owner/name` form that generated output for this target is pushed to. An `owner/name#branch` suffix is tolerated and supplies the default branch when `branch` does not, but prefer setting `branch` on its own: not every target strips the suffix back off when it writes the repository URL into published package metadata. |
| `branch` | Default branch of the destination repository, which release pull requests target. Generated output is pushed to the `scalar-generated` branch and merged with your custom code on the integration branch (`integrationBranch`, `scalar-next` by default); the release pull request is opened from there against this branch. Defaults to a `#branch` suffix on `repo`, then `main`. A value that is not a safe git branch name is skipped in favor of the next one. |
| `integrationBranch` | Branch where generated output is combined with your custom code; defaults to `scalar-next`. Commit customizations here: each regeneration is merged into it, release pull requests are opened from it, and each released version is synced back to it. An empty string means the default. The name must be a safe git branch name, and it cannot be the default branch or collide with the branches Scalar and release-please manage, such as `scalar-generated`. |

## publish

**Type:** `object`

crates.io publishing configuration.

### cargo

**Type:** `boolean | object`

Publishes the Rust crate to crates.io. `true` publishes with the defaults; an object tunes them.

Authenticates with [crates.io trusted publishing](https://crates.io/docs/trusted-publishing) (OIDC) by default, registered on the crate's settings (`https://crates.io/crates/<crate>/settings`). crates.io only registers a trusted publisher on a crate that already exists, so the first release sets `authMethod` to `access-token`, which reads a [crates.io API token](https://crates.io/settings/tokens) from the `CARGO_REGISTRY_TOKEN` repository secret.

#### authMethod

**Type:** `"oidc" | "access-token"`

How the generated release workflow authenticates with the registry.

`oidc` uses the registry's [OIDC trusted publishing](https://docs.github.com/en/actions/concepts/security/openid-connect): the publish job exchanges its GitHub Actions id-token for a short-lived, package-scoped token, so no long-lived credential is stored in the destination repository. It is the default wherever the registry supports it, and requires a trusted publisher registered on the registry naming the destination repository, the workflow file the publish job runs from — `release-please.yml`, the workflow the automated release publishes from (register `sdk-release.yml` as a second publisher only if the manual re-publish workflow is used) — and the `releaseEnvironment` when one is set.

`access-token` publishes with a long-lived token read from a repository secret instead; use it while no trusted publisher is registered yet, then drop the override once one is, unless the registry's own entry says to keep it. Repository secrets live under **Settings → Secrets and variables → Actions** in the destination repository; an environment secret of the same name overrides one there when `releaseEnvironment` is set.

This registry's own `publish.<registry>` entry names the page to register a trusted publisher on, the secret `access-token` reads, any exception to these defaults, and whether `authMethod` applies at all.

#### releaseEnvironment

**Type:** `string`

Release environment name used by generated publishing workflows. It renders as the publish job's `environment:`, so the destination repository's [environment protection rules](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments) — required reviewers, wait timers, environment secrets — gate the release. Under OIDC trusted publishing the name must also match the environment registered on the trusted publisher, which is how a registry constrains who in a repository may publish; leave the registry's environment field blank when this is unset, since a publisher that names an environment rejects a run without one. When it is set, the publish job can read that environment's secrets as well as the repository's, and an environment secret takes precedence over a repository secret of the same name.

## options

**Type:** `object`

Rust generation options: naming overrides, date-time mapping, TLS backend, retries, and extra Cargo dependencies.

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

## skip

**Type:** `boolean`

When true, the target is not generated.

## readmeTitle

**Type:** `string`

Heading of this target's generated README, overriding the SDK-wide `readme.title`. Plain text: markdown in it is shown as written, not rendered.

## promotion

**Type:** `"automatic" | "manual"`

When a successful build's generated output reaches this target's production destination. `automatic`, the default, pushes every build, which opens a release pull request. `manual` holds each build at the staging playground until you promote it.

This changes when the push happens, never what is generated: a `manual` target still gets the GitHub Actions, release-please configuration, and versioning policy that `destinations.production` turns on. A target with no production destination is never pushed, whatever this is set to.

**Default:** `"automatic"`
