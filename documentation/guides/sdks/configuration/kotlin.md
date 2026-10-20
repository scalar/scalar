<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand.

Published at https://scalar.com/products/sdk-generator/configuration/kotlin, which is where the links to
pages outside this reference resolve.
-->

# Kotlin

Add `kotlin` under `targets` to generate a Kotlin SDK package.

```json
{
  "targets": {
    "kotlin": {
      "reverseDomain": "com.acme",
      "destinations": {
        "production": {
          "repo": "acme/acme-kotlin"
        }
      },
      "publish": {
        "maven": {
          "releaseEnvironment": "production"
        }
      }
    }
  }
}
```

Setting up publishing: [Java and Kotlin publishing guide](../publishing/java.md). How releases are cut: [Publishing](../publishing/overview.md).

## reverseDomain

**Type:** `string`

Java/Kotlin base package, e.g. `org.example`.

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

Maven publishing configuration.

### maven

**Type:** `boolean | object`

Publishes the JVM package to Maven Central. `true` publishes with the defaults; an object tunes them. The object also carries `artifactId`, since a Maven coordinate means nothing to the other registries.

There is no OIDC path, so `authMethod` is ignored and every release reads four repository secrets: `MAVEN_CENTRAL_USERNAME` and `MAVEN_CENTRAL_PASSWORD`, a Central Portal user token, and `MAVEN_GPG_PRIVATE_KEY` with `MAVEN_GPG_PASSPHRASE`, which sign the artifacts. Each is also read under a fallback name when it is unset: `SONATYPE_USERNAME`, `SONATYPE_PASSWORD`, `GPG_SIGNING_KEY` and `GPG_SIGNING_PASSWORD`. The publishing namespace is the target's `reverseDomain`, which has to be [verified on the Central Portal](https://central.sonatype.org/register/central-portal/), so set `reverseDomain` on any target that publishes.

#### artifactId

**Type:** `string`

Maven artifact ID the JVM SDK publishes under, e.g. `acme-java`. Defaults to `<sdk slug>-java` or `<sdk slug>-kotlin`, so set it only when the published coordinate is spelled differently: regenerating such an SDK without it renames the artifact its users depend on. It also names the generated Gradle modules (`<artifactId>-core`, `<artifactId>-client-okhttp`) and their directories, so it must be alphanumeric runs joined by single `.`, `_`, or `-` separators. It cannot be a name the generated project already uses at its root: `LICENSE`, `README.md`, `SECURITY.md`, `SKILL.md`, `VERSIONING.md`, `api.md`, `build`, `build.gradle.kts`, `buildSrc`, `gradle`, `gradle.properties`, `gradlew`, `gradlew.bat`, `local.properties`, `release-please-config.json`, `scalar-sdk.manifest.json`, `settings.gradle.kts`, or `tests`.

**Constraints:** `pattern: ^[A-Za-z0-9]+([._-][A-Za-z0-9]+)*$`

#### releaseEnvironment

**Type:** `string`

Release environment name used by generated publishing workflows. It renders as the publish job's `environment:`, so the destination repository's environment protection rules apply to the release, and this registry's secrets can come from that environment — one there overrides a repository secret of the same name.

## prereleaseType

**Type:** `string`

Prerelease channel this target's releases publish on, as a bare semver prerelease identifier (`next`, `beta`, `rc`). It becomes the released version's prerelease suffix — a channel of `next` releases `1.2.0-next.1` — so the value is held to the shape a semver identifier may take: a letter, then letters, digits and hyphens.

Omit it to release on the stable line. A release train promoting to a conventionally named prerelease branch (`alpha`, `beta`, `canary`, `next`, `preview`, `rc`) adopts that branch's name as its channel, so this only has to be set to name a channel the branch does not, or to put a target on a prerelease line while promoting to a branch named something else.

**Constraints:** `pattern: ^[A-Za-z][0-9A-Za-z-]*$`

## options

**Type:** `object`

Kotlin generation options. Each one changes generated class names, class shapes, or file layout, so changing one on an SDK that already has users is a breaking change.

### backCompat

**Type:** `object`

Legacy model layout and naming behaviors, all off by default. Turn one on only to keep reproducing an already-published JVM SDK's layout, whose consumers compile against the packages and class names it shipped with; each option moves files or renames public classes, so flipping one on an SDK that already has consumers is a source-breaking change.

#### flatModelPackages

**Type:** `boolean`

Generate every model into one flat `models` package instead of a package per resource, and name each operation's params, page, async page, page response, and implied response class after its full chain of resources: `models/ProjectTaskCommentCreateParams` instead of `models/projects/tasks/comments/CommentCreateParams`. `unnamespacedImplicitResponses` exempts implied responses from the prefix. Models named after a component schema keep their names, operations on a resource with `useNamespaceInTypeNames` disabled drop the ancestor prefix, and services stay nested. Off by default.

**Default:** `false`

#### refNameNestedModels

**Type:** `boolean`

Name a nested class after the component schema backing it rather than after the property or union variant that uses it: a `latestRejection` property whose schema is a `DecisionRejected` component renders `DecisionRejected` instead of `LatestRejection`, and a request body backed by a component renders that component's name instead of `Body`. This renames nested classes only — it promotes nothing to a top-level model, and union member accessors keep their tag-derived names. Off by default.

**Default:** `false`

#### unnamespacedImplicitResponses

**Type:** `boolean`

Name the response model an operation implies — one with no component schema of its own to be named after — from the leaf resource alone, never from the chain of resource ancestors that `flatModelPackages` prefixes onto that operation's params: `store.order.create` yields `OrderCreateResponse` alongside `StoreOrderCreateParams`. A top-level client method's implied response drops the prefix altogether, so `client.retrieveRateLimits` yields `RetrieveRateLimitsResponse` rather than `ClientRetrieveRateLimitsResponse`. A page response is named from the params side and keeps its prefix either way. Off by default.

**Default:** `false`

### elideConst

**Type:** `boolean`

Leave required constant-valued properties out of the typed API and pin their values instead. True by default: such a property has no typed getter, enum, or builder setter, only a raw accessor and a raw setter for sending a value the API description does not describe, and `build()` does not check it. A closed union variant whose only property is its discriminator becomes raw JSON instead of a class. Set it to false to generate the property as an ordinary typed field (typed getter, required builder slot, checked on `build()`) and to give such a variant its own class. A string constant is then typed as a single-member enum; numeric and boolean constants keep their scalar types. A `readOnly` or nullable constant is never elided.

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
