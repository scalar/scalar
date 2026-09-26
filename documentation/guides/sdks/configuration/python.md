<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand — run:
bun run --filter @scalar/sdk-config types:generate

Published at https://scalar.com/docs/guides/sdks/configuration, which is where the links to
pages outside this reference resolve.
-->
# Python

Add `python` under `targets` to generate a Python SDK package.

```json
{
  "targets": {
    "python": {
      "packageName": "acme_api",
      "projectName": "acme-api",
      "destinations": {
        "production": {
          "repo": "acme/acme-python"
        }
      },
      "publish": {
        "pypi": true
      }
    }
  }
}
```

Registry accounts, secrets, and first-release setup: [Python publishing](../publishing/python.md).

## packageName

**Type:** `string`

Python import package name, used in `import` statements (e.g. `my_company_client` for `import my_company_client`).

## projectName

**Type:** `string`

PyPI distribution name, used for `pip install` (e.g. `my-company-client`). Defaults to `packageName` when omitted.

## destinations

**Type:** `object`

Per-target GitHub destinations for pushing generated output.

### production

**Type:** `object`

Primary published-output repository for this target. Configuring it is what gives the target generated GitHub Actions at all: it turns on the CI workflow, the release-please configuration, and the versioning policy. The release workflow that uploads at release time is added on top of those only when `publish` enables a registry that needs one — a tag-served ecosystem publishes from the platform-created tag alone. A target with no production destination is still generated, but emits no workflows, which is what local and preview generation wants.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `repo` | `string` | ✅ | GitHub repository in `owner/name` form that generated output for this target is pushed to. An `owner/name#branch` suffix is tolerated and supplies the default branch when `branch` does not, but prefer setting `branch` on its own: not every target strips the suffix back off when it writes the repository URL into published package metadata. |
| `branch` | `string` |  | Default branch of the destination repository, and the base that release PRs are opened against. Generated output itself is always pushed to the fixed `scalar-generated` branch, which the platform merges with custom code on the integration branch (`integrationBranch`, `scalar-next` by default); the release PR is raised from the integration branch against the branch named here, so merging it is the promotion. The branch is resolved by trying this value, then a `#branch` suffix on `repo`, then `main`, skipping any candidate that is not a safe git ref — the name is interpolated into generated workflow YAML, so an unsafe one is passed over rather than emitted, and an unsafe value here does not mask a usable suffix. |
| `integrationBranch` | `string` |  | The branch where generated output is combined with custom code; defaults to `scalar-next`. Commit customizations here: the platform merges each regeneration from `scalar-generated` into it, raises release PRs from it, and the emitted release workflow syncs each released version back to it. An empty string means the default. Names are case-sensitive, like git. A value is rejected rather than replaced by the default when it is not a safe git ref (it must start with a letter or digit, use only letters, digits, `.`, `_`, `/` and `-`, and be a name git accepts: no `..`, no empty or `.`-leading path component, no `.lock` component suffix, no trailing `.`, and not `HEAD`), when it equals the default branch, `scalar-generated` or `scalar-merge-conflict`, when it and one of those or `scalar-next` are `/`-separated path prefixes of each other (`scalar-next/v2`), when it starts with `scalar-generated--`, `scalar-merge-conflict--`, `scalar-heal--` or `release-please--`, or when it contains `--components--`: the name is interpolated into generated workflow YAML, and those names are reserved for branches the platform and release-please manage. |

## publish

**Type:** `object`

PyPI publishing configuration.

### pypi

**Type:** `boolean | object`

PyPI publishing configuration for Python packages. `true` publishes with the defaults; an object tunes them.

Releases use [PyPI trusted publishing](https://docs.pypi.org/trusted-publishers/) (OIDC) unless `authMethod` says otherwise: `pypa/gh-action-pypi-publish` exchanges the job's GitHub Actions id-token for a short-lived, project-scoped token, so no `PYPI_API_TOKEN` secret is stored. Register the publisher at [pypi.org/manage/account/publishing](https://pypi.org/manage/account/publishing/), which creates a *pending* publisher — it names a project that does not exist on PyPI yet and becomes an ordinary publisher on the first successful upload, so a brand-new SDK never needs a token. For a project that already exists, use its own publishing settings instead (**Manage → Publishing** from [your projects](https://pypi.org/manage/projects/)).

Both forms ask for the destination repository's owner, its name, the **workflow filename** — `release-please.yml`, the workflow the automated release publishes from (add `sdk-release.yml` as a second publisher only if the manual re-publish workflow is used) — and the environment name, which must match `releaseEnvironment` when one is set and stay blank when it is not. The pending form asks for one field the per-project form does not: the PyPI project name it is reserving.

Set `authMethod` to `access-token` to publish with a [PyPI API token](https://pypi.org/manage/account/token/) stored as the `PYPI_API_TOKEN` repository secret instead. Repository secrets live under **Settings → Secrets and variables → Actions** in the destination repository; an environment secret of the same name overrides one there when `releaseEnvironment` is set.

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

## prereleaseType

**Type:** `string`

Prerelease channel this target's releases publish on, as a bare semver prerelease identifier (`next`, `beta`, `rc`). It becomes the released version's prerelease suffix — a channel of `next` releases `1.2.0-next.1` — so the value is held to the shape a semver identifier may take: a letter, then letters, digits and hyphens.

Omit it to release on the stable line. A release train promoting to a conventionally named prerelease branch (`alpha`, `beta`, `canary`, `next`, `preview`, `rc`) adopts that branch's name as its channel, so this only has to be set to name a channel the branch does not, or to put a target on a prerelease line while promoting to a branch named something else.

**Constraints:** `pattern: ^[A-Za-z][0-9A-Za-z-]*$`

## options

**Type:** `object`

Python emitter options.

### backCompat

**Type:** `object`

Legacy naming and response-API behaviors, all off by default. Turn one on only to keep reproducing an already-published Python SDK's public shape, whose consumers import, annotate, or call the symbols it shipped with; each option renames public classes or retypes what a method returns, so flipping one on an SDK that already has consumers is a source-breaking change.

#### resourceClassNames

**Type:** `boolean`

Name generated resource classes after the resource alone (`Accounts`, `AsyncAccounts`, `AccountsWithRawResponse`) instead of the default `Resource`-suffixed form (`AccountsResource`, …). Set this only for an already-published Python SDK whose consumers import or annotate the unsuffixed names, since flipping it renames every public symbol in `<package>.resources`. A resource keeps the `Resource` suffix wherever the unsuffixed name is already bound in a module its classes land in — a model (`DigitalCardArt`) or runtime symbol (`Query`, `Stream`) its own module imports, a name its parent module or `_client.py` binds, or a name another resource reaching the same module already took.

**Default:** `false`

#### responseApi

**Type:** `boolean`

Return the legacy `LegacyAPIResponse` from `client.<resource>.with_raw_response.<method>()` instead of the modern `APIResponse`/`AsyncAPIResponse`. The legacy object exposes `.content`/`.text` as properties rather than methods and keeps `.parse()` synchronous on the async client, so set this only for an already-published Python SDK whose consumers depend on that shape. `with_streaming_response` is unaffected.

**Default:** `false`

#### binaryResponseApi

**Type:** `boolean`

Return the legacy `HttpxBinaryResponseContent` from binary-payload methods instead of the modern `BinaryAPIResponse` family. The legacy object exposes `.content`/`.text`/`.encoding` as properties and offers both sync and async readers on one class. Requires `responseApi`, which owns the `_legacy_response` module both classes live in; the schema rejects it on its own, including alongside an explicit `responseApi: false`.

**Default:** `false`

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
