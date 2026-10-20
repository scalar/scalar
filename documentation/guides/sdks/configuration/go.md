<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand.

Published at https://scalar.com/products/sdk-generator/configuration/go, which is where the links to
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

Setting up publishing: [Go publishing guide](../publishing/go.md). How releases are cut: [Publishing](../publishing/overview.md).

## packageName

**Type:** `string`

Go package name, and a module-path fallback. It names the `package <name>` clause in every generated file, normalized to a Go identifier (`Acme` becomes `acme`, `pagination-api` becomes `paginationapi`), and it is how users spell every call (`acme.NewClient(...)`), so renaming it on a published SDK breaks their code. The module path normally comes from `destinations.production.repo`, or from `goModulePathOverride`; this is only the fallback for a target that sets neither. Defaults to `clientSettings.defaultClientName`, then the SDK name.

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

Go module publishing configuration (git version tags).

### go

**Type:** `boolean | object`

Publishes the Go module. `true` publishes with the defaults; an object tunes them.

A Go module version is the `vX.Y.Z` git tag the release cuts, so nothing is uploaded and no secret or `authMethod` applies. The release workflow only asks [proxy.golang.org](https://proxy.golang.org/) for the new version so it is indexed straight away. Consumers install it with `go get <module path>@v1.2.3`, where the module path is `github.com/<owner>/<repo>` unless `goModulePathOverride` sets another.

#### releaseEnvironment

**Type:** `string`

Release environment name used by generated publishing workflows. It renders as the publish job's `environment:`, so the destination repository's [environment protection rules](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments) — required reviewers, wait timers, environment secrets — gate the release. Under OIDC trusted publishing the name must also match the environment registered on the trusted publisher, which is how a registry constrains who in a repository may publish; leave the registry's environment field blank when this is unset, since a publisher that names an environment rejects a run without one. When it is set, the publish job can read that environment's secrets as well as the repository's, and an environment secret takes precedence over a repository secret of the same name.

## goModulePathOverride

**Type:** `string`

Go module path for `go.mod` and every generated import, when it must differ from the destination repository. The module path is normally derived from `destinations.production.repo` (e.g. `acme/acme-go` becomes `github.com/acme/acme-go`); set this when the published module path and the repository name have diverged, e.g. a repo renamed to `acme/widget-sdk-go` whose module must stay `github.com/acme/widget-go-sdk`. Accepts a full module path or an `owner/name` shorthand that is expanded to `github.com/owner/name`. Restricted to Go module path characters (`A-Za-z0-9._~+-` per `/`-separated element).

**Constraints:** `pattern: ^[A-Za-z0-9][A-Za-z0-9._~+-]*(/[A-Za-z0-9][A-Za-z0-9._~+-]*)*$`

## prereleaseType

**Type:** `string`

Prerelease channel this target's releases publish on, as a bare semver prerelease identifier (`next`, `beta`, `rc`). It becomes the released version's prerelease suffix — a channel of `next` releases `1.2.0-next.1` — so the value is held to the shape a semver identifier may take: a letter, then letters, digits and hyphens.

Omit it to release on the stable line. A release train promoting to a conventionally named prerelease branch (`alpha`, `beta`, `canary`, `next`, `preview`, `rc`) adopts that branch's name as its channel, so this only has to be set to name a channel the branch does not, or to put a target on a prerelease line while promoting to a branch named something else.

**Constraints:** `pattern: ^[A-Za-z][0-9A-Za-z-]*$`

## options

**Type:** `object`

Go generation options: which Go code style the SDK uses, and whether the per-service options field is exported.

### codeStyle

**Type:** `"v1" | "v2"`

Which Go code style the SDK is generated in. `v1` (the default) types every parameter as `param.Field[T]`, keeps response metadata in a separate struct of `apijson.Field`, and represents unions as interfaces with `AsUnion()`. `v2` types an optional or nullable scalar parameter as `param.Opt[T]` and other parameters as plain Go types, inlines response metadata as a `JSON` struct of `respjson.Field`, and represents unions as structs with `As<Variant>()` and `AsAny()` accessors. The two styles export different root helpers (`F`, `Null`, `Raw` and `FileParam` against `Opt`, `Ptr`, `Time` and `File`), so switching a published SDK in either direction is a breaking change for its users. Set `v2` only for a Go SDK with no published users, or in a major release. A config generated for you leaves this unset, so new projects start on `v1`.

**Default:** `"v1"`

### optionsFieldExported

**Type:** `boolean`

Name the per-service request-options field `Options` rather than the unexported `options`, so callers can read or replace a service's default request options. Defaults to true. Set it to false only for an SDK whose published services already hide the field: on a live SDK, false removes a field its users can read. Works with either `codeStyle`.

**Default:** `true`

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
