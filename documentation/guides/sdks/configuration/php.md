<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand.

Published at https://scalar.com/products/sdk-generator/configuration/php, which is where the links to
pages outside this reference resolve.
-->
# PHP

> [!NOTE]
> The PHP target is experimental.

Add `php` under `targets` to generate a PHP SDK package.

```json
{
  "targets": {
    "php": {
      "packageName": "Acme\\Api",
      "composerPackageName": "acme/api",
      "destinations": {
        "production": {
          "repo": "acme/acme-php"
        }
      },
      "publish": {
        "packagist": true
      }
    }
  }
}
```

Setting up publishing: [PHP publishing guide](../publishing/php.md). How releases are cut: [Publishing](../publishing/overview.md).

## packageName

**Type:** `string`

PHP package namespace/name.

## composerPackageName

**Type:** `string`

PHP Composer and Packagist package name.

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

Packagist publishing configuration.

### packagist

**Type:** `boolean | object`

Publishes the PHP package on Packagist. `true` publishes with the defaults; an object tunes them.

Packagist reads versions from the repository's git tags, so a release is the `vX.Y.Z` tag: there is no upload step, no secret, and `authMethod` is unused. The destination repository has to be [submitted to Packagist](https://packagist.org/packages/submit) once.

#### releaseEnvironment

**Type:** `string`

Release environment name used by generated publishing workflows. It renders as the publish job's `environment:`, so the destination repository's [environment protection rules](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments) — required reviewers, wait timers, environment secrets — gate the release. Under OIDC trusted publishing the name must also match the environment registered on the trusted publisher, which is how a registry constrains who in a repository may publish; leave the registry's environment field blank when this is unset, since a publisher that names an environment rejects a run without one. When it is set, the publish job can read that environment's secrets as well as the repository's, and an environment secret takes precedence over a repository secret of the same name.

## composerRepositoryUrl

**Type:** `string`

Composer repository URL for PHP package publishing.

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
