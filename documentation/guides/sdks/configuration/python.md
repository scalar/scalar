<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand.

Published at https://scalar.com/products/sdk-generator/configuration/python, which is where the links to
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
        "pypi": {
          "authMethod": "oidc",
          "releaseEnvironment": "production"
        }
      }
    }
  }
}
```

Setting up publishing: [Python publishing guide](../publishing/python.md). How releases are cut: [Publishing](../publishing/overview.md).

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

Primary repository this target's generated output is published to. Setting it turns on the generated GitHub Actions: the CI workflow, the release-please configuration, and the versioning policy. A release workflow is added too when `publish` enables a registry that needs one; a registry served from git tags publishes from the release tag alone. Without a production destination the target is still generated, but with no workflows.

| Property            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repo`\*            | GitHub repository in `owner/name` form that generated output for this target is pushed to. An `owner/name#branch` suffix is tolerated and supplies the default branch when `branch` does not, but prefer setting `branch` on its own: not every target strips the suffix back off when it writes the repository URL into published package metadata.                                                                                                                |
| `branch`            | Default branch of the destination repository, which release pull requests target. Generated output is pushed to the `scalar-generated` branch and merged with your custom code on the integration branch (`integrationBranch`, `scalar-next` by default); the release pull request is opened from there against this branch. Defaults to a `#branch` suffix on `repo`, then `main`. A value that is not a safe git branch name is skipped in favor of the next one. |
| `integrationBranch` | Branch where generated output is combined with your custom code; defaults to `scalar-next`. Commit customizations here: each regeneration is merged into it, release pull requests are opened from it, and each released version is synced back to it. An empty string means the default. The name must be a safe git branch name, and it cannot be the default branch or collide with the branches Scalar and release-please manage, such as `scalar-generated`.   |

## publish

**Type:** `object`

PyPI publishing configuration.

### pypi

**Type:** `boolean | object`

Publishes the Python package to PyPI. `true` publishes with the defaults; an object tunes them.

Authenticates with [PyPI trusted publishing](https://docs.pypi.org/trusted-publishers/) (OIDC) by default, registered at [pypi.org/manage/account/publishing](https://pypi.org/manage/account/publishing/); a _pending_ publisher covers a project that does not exist yet, so a new SDK needs no token. With `authMethod` set to `access-token` it reads a [PyPI API token](https://pypi.org/manage/account/token/) from the `PYPI_API_TOKEN` repository secret instead; a `PYPI_TOKEN` secret is read when that is unset.

#### authMethod

**Type:** `"oidc" | "access-token"`

How the generated release workflow authenticates with the registry.

`oidc` uses the registry's [OIDC trusted publishing](https://docs.github.com/en/actions/concepts/security/openid-connect): the publish job exchanges its GitHub Actions id-token for a short-lived, package-scoped token, so no long-lived credential is stored in the destination repository. It is the default wherever the registry supports it, and requires a trusted publisher registered on the registry naming the destination repository, the workflow file the publish job runs from — `release-please.yml`, the workflow the automated release publishes from (register `sdk-release.yml` as a second publisher only if the manual re-publish workflow is used) — and the `releaseEnvironment` when one is set.

`access-token` publishes with a long-lived token read from a repository secret instead; use it while no trusted publisher is registered yet, then drop the override once one is, unless the registry's own entry says to keep it. Repository secrets live under **Settings → Secrets and variables → Actions** in the destination repository; an environment secret of the same name overrides one there when `releaseEnvironment` is set.

This registry's own `publish.<registry>` entry names the page to register a trusted publisher on, the secret `access-token` reads, any exception to these defaults, and whether `authMethod` applies at all.

#### releaseEnvironment

**Type:** `string`

Release environment name used by generated publishing workflows. It renders as the publish job's `environment:`, so the destination repository's [environment protection rules](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments) — required reviewers, wait timers, environment secrets — gate the release. Under OIDC trusted publishing the name must also match the environment registered on the trusted publisher, which is how a registry constrains who in a repository may publish; leave the registry's environment field blank when this is unset, since a publisher that names an environment rejects a run without one. When it is set, the publish job can read that environment's secrets as well as the repository's, and an environment secret takes precedence over a repository secret of the same name.

## prereleaseType

**Type:** `string`

Prerelease channel this target's releases publish on, as a bare semver prerelease identifier (`next`, `beta`, `rc`). It becomes the released version's prerelease suffix — a channel of `next` releases `1.2.0-next.1` — so the value is held to the shape a semver identifier may take: a letter, then letters, digits and hyphens.

Omit it to release on the stable line. A release train promoting to a conventionally named prerelease branch (`alpha`, `beta`, `canary`, `next`, `preview`, `rc`) adopts that branch's name as its channel, so this only has to be set to name a channel the branch does not, or to put a target on a prerelease line while promoting to a branch named something else.

**Constraints:** `pattern: ^[A-Za-z][0-9A-Za-z-]*$`

## options

**Type:** `object`

Python generation options.

### backCompat

**Type:** `object`

Legacy naming, response-API, and import-path behaviors, all off by default. Turn one on only to keep reproducing an already-published Python SDK's public shape, whose consumers import, annotate, or call the symbols it shipped with. Each boolean option renames public classes or retypes what a method returns, so flipping one on an SDK that already has consumers is a source-breaking change; `typeAliases` only adds names.

#### resourceClassNames

**Type:** `boolean`

Name generated resource classes after the resource alone (`Accounts`, `AsyncAccounts`, `AccountsWithRawResponse`) instead of the default `Resource`-suffixed form (`AccountsResource`, …). Set this only for an already-published Python SDK whose consumers import or annotate the unsuffixed names, since flipping it renames every public symbol in `<package>.resources`. A resource keeps the `Resource` suffix wherever the unsuffixed name is already bound in a module its classes land in — a model (`Widget`) or runtime symbol (`Query`, `Stream`) its own module imports, a name its parent module or `_client.py` binds, or a name another resource reaching the same module already took.

**Default:** `false`

#### responseApi

**Type:** `boolean`

Return the legacy `LegacyAPIResponse` from `client.<resource>.with_raw_response.<method>()` instead of the modern `APIResponse`/`AsyncAPIResponse`. The legacy object exposes `.content`/`.text` as properties rather than methods and keeps `.parse()` synchronous on the async client, so set this only for an already-published Python SDK whose consumers depend on that shape. `with_streaming_response` is unaffected.

**Default:** `false`

#### binaryResponseApi

**Type:** `boolean`

Return the legacy `HttpxBinaryResponseContent` from binary-payload methods instead of the modern `BinaryAPIResponse` family. The legacy object exposes `.content`/`.text`/`.encoding` as properties and offers both sync and async readers on one class. Requires `responseApi`, which owns the `_legacy_response` module both classes live in; the schema rejects it on its own, including alongside an explicit `responseApi: false`.

**Default:** `false`

#### typeAliases

**Type:** `object[]`

Extra names bound in generated modules so import paths an already-published Python SDK shipped keep resolving after a type moved, e.g. `PartListResponse = Data` in `<package>.types.widgets`. Each entry appends `<name> = <target>` to `module`, importing the target when it lives elsewhere. Generation fails on an entry that does not resolve, would shadow a name, or would make an import circular.

##### module

**Type:** `string`

**Required**

Dotted path, relative to the package root, of the module that binds the alias: `types.widgets` for `<package>/types/widgets/__init__.py` or `<package>/types/widgets.py`.

**Constraints:** `pattern: ^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$`

##### name

**Type:** `string`

**Required**

Name the alias is bound to in `module`; a Python identifier that is not a keyword.

**Constraints:** `pattern: ^(?!(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)$)[A-Za-z_][A-Za-z0-9_]*$`

##### to

**Type:** `string`

**Required**

Dotted path, relative to the package root, of the defining module followed by the name the alias points at, e.g. `types.widgets.part_list.Data`. When that module is not `module`, the target is imported as `from <module> import <name> as <name>`, so it is importable from `module` too.

**Constraints:** `pattern: ^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)+$`

##### deprecationMessage

**Type:** `string`

Docstring written under the alias, typically pointing callers at the current name.

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
