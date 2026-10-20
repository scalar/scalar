<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand.

Published at https://scalar.com/products/sdk-generator/configuration/csharp, which is where the links to
pages outside this reference resolve.
-->
# C#

> [!NOTE]
> The C# target is experimental.

Add `csharp` under `targets` to generate a C# SDK package.

```json
{
  "targets": {
    "csharp": {
      "packageName": "Acme.Api",
      "destinations": {
        "production": {
          "repo": "acme/acme-csharp"
        }
      },
      "publish": {
        "nuget": {
          "authMethod": "oidc",
          "releaseEnvironment": "production"
        }
      }
    }
  }
}
```

Setting up publishing: [C# publishing guide](../publishing/csharp.md). How releases are cut: [Publishing](../publishing/overview.md).

## packageName

**Type:** `string`

.NET package name.

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

NuGet publishing configuration.

### nuget

**Type:** `boolean | object`

Publishes the .NET package to nuget.org. `true` publishes with the defaults; an object tunes them.

Authenticates with [nuget.org trusted publishing](https://learn.microsoft.com/nuget/nuget-org/trusted-publishing) (OIDC) by default, which still reads the nuget.org profile name from the `NUGET_USER` repository secret. With `authMethod` set to `access-token` it pushes with a [nuget.org API key](https://www.nuget.org/account/apikeys) from the `NUGET_API_KEY` repository secret instead.

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

C# generation options.

### strongName

**Type:** `object`

Signs the generated assembly with a strong-name key, so the package can be referenced from a strong-named assembly. Consumers on .NET Framework, or building with warnings as errors, cannot load or reference an unsigned assembly from a signed one. Turning signing on or off changes the assembly's identity, so a consumer bound to the old identity has to rebuild: decide it before the first release. The key is yours, and the generator never creates or writes one: commit the `.snk` file to the destination repository yourself. Without the key file the SDK still builds, unsigned, but packing it for release fails; see the C# publishing guide.

#### keyFile

**Type:** `string`

**Required**

Path of the strong-name key file (`.snk`), relative to the root of the destination repository, for example `Open.snk` or `keys/Sdk.snk`. Directories are separated by `/`, and each segment must start with a letter, digit, `_` or `-` and contain only letters, digits, `.`, `_` and `-`, so the path cannot be absolute, contain `.` or `..`, or pass through a hidden directory.

**Constraints:** `pattern: ^([A-Za-z0-9_-][A-Za-z0-9._-]*/)*[A-Za-z0-9_-][A-Za-z0-9._-]*\.snk$`

#### publicKey

**Type:** `string`

Full public key of `keyFile` in hexadecimal on one line, without spaces: the hex `sn -tp` prints for the key's public half, joined onto one line (not the 16-digit public key token). When set, the generated test project is declared a friend assembly with this key (`InternalsVisibleTo`). When unset, the library declares no friend assembly at all, because a signed assembly can only name a friend by its public key; the generated tests only use the public API, so they still build and run.

**Constraints:** `pattern: ^([0-9A-Fa-f]{2}){96,}$`

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
