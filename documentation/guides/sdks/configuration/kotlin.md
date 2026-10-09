<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand.

Published at https://scalar.com/docs/guides/sdks/configuration, which is where the links to
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

Primary published-output repository for this target. Configuring it is what gives the target generated GitHub Actions at all: it turns on the CI workflow, the release-please configuration, and the versioning policy. The release workflow that uploads at release time is added on top of those only when `publish` enables a registry that needs one — a tag-served ecosystem publishes from the platform-created tag alone. A target with no production destination is still generated, but emits no workflows, which is what local and preview generation wants.

| Property | Description |
| --- | --- |
| `repo`* | GitHub repository in `owner/name` form that generated output for this target is pushed to. An `owner/name#branch` suffix is tolerated and supplies the default branch when `branch` does not, but prefer setting `branch` on its own: not every target strips the suffix back off when it writes the repository URL into published package metadata. |
| `branch` | Default branch of the destination repository, and the base that release PRs are opened against. Generated output itself is always pushed to the fixed `scalar-generated` branch, which the platform merges with custom code on the integration branch (`integrationBranch`, `scalar-next` by default); the release PR is raised from the integration branch against the branch named here, so merging it is the promotion. The branch is resolved by trying this value, then a `#branch` suffix on `repo`, then `main`, skipping any candidate that is not a safe git ref — the name is interpolated into generated workflow YAML, so an unsafe one is passed over rather than emitted, and an unsafe value here does not mask a usable suffix. |
| `integrationBranch` | The branch where generated output is combined with custom code; defaults to `scalar-next`. Commit customizations here: the platform merges each regeneration from `scalar-generated` into it, raises release PRs from it, and the emitted release workflow syncs each released version back to it. An empty string means the default. Names are case-sensitive, like git. A value is rejected rather than replaced by the default when it is not a safe git ref (it must start with a letter or digit, use only letters, digits, `.`, `_`, `/` and `-`, and be a name git accepts: no `..`, no empty or `.`-leading path component, no `.lock` component suffix, no trailing `.`, and not `HEAD`), when it equals the default branch, `scalar-generated` or `scalar-merge-conflict`, when it and one of those or `scalar-next` are `/`-separated path prefixes of each other (`scalar-next/v2`), when it starts with `scalar-generated--`, `scalar-merge-conflict--`, `scalar-heal--` or `release-please--`, or when it contains `--components--`: the name is interpolated into generated workflow YAML, and those names are reserved for branches the platform and release-please manage. |

## publish

**Type:** `object`

Maven publishing configuration.

### maven

**Type:** `boolean | object`

Publishes the JVM package to Maven Central. `true` publishes with the defaults; an object tunes them. The object also carries `artifactId`, since a Maven coordinate means nothing to the other registries.

There is no OIDC path, so `authMethod` is ignored and every release reads four repository secrets: `MAVEN_CENTRAL_USERNAME` and `MAVEN_CENTRAL_PASSWORD`, a Central Portal user token, and `MAVEN_GPG_PRIVATE_KEY` with `MAVEN_GPG_PASSPHRASE`, which sign the artifacts. Each is also read under a fallback name when it is unset: `SONATYPE_USERNAME`, `SONATYPE_PASSWORD`, `GPG_SIGNING_KEY` and `GPG_SIGNING_PASSWORD`. The publishing namespace is the target's `reverseDomain`, which has to be [verified on the Central Portal](https://central.sonatype.org/register/central-portal/), so set `reverseDomain` on any target that publishes.

#### artifactId

**Type:** `string`

Maven artifact ID the JVM SDK publishes under, e.g. `acme-java`. Defaults to `<sdk slug>-java` / `<sdk slug>-kotlin`, so it is only needed when the published coordinate does not follow that spelling — regenerating such an SDK without it silently renames the artifact its consumers depend on. It also names the emitted Gradle modules (`<artifactId>-core`, `<artifactId>-client-okhttp`) and the directories they live in, so it is restricted to alphanumeric runs joined by single `.`, `_`, or `-` separators: that rejects path separators, `..`, whitespace, and shell metacharacters outright rather than letting a value reach a directory name, a Kotlin string literal, and a `repo1.maven.org` URL path in the generated release workflow. The enumerated names are rejected for a different reason: the umbrella module's directory is named the artifact ID exactly, and each of these is a name the generated project already claims at its own root. Most are files or directories it writes, so the two would land on one path; `build` and `local.properties` are instead entries in the project's own `.gitignore`, so a module named after either would never be committed.

**Constraints:** `pattern: ^[A-Za-z0-9]+([._-][A-Za-z0-9]+)*$`

#### authMethod

**Type:** `"oidc" | "access-token"`

Registry authentication mechanism. Ignored for Maven Central: the JVM emitter renders one set of release steps either way, and they always authenticate with the `MAVEN_CENTRAL_USERNAME`, `MAVEN_CENTRAL_PASSWORD`, `MAVEN_GPG_PRIVATE_KEY`, and `MAVEN_GPG_PASSPHRASE` repository secrets, each falling back to `SONATYPE_USERNAME`, `SONATYPE_PASSWORD`, `GPG_SIGNING_KEY` and `GPG_SIGNING_PASSWORD` respectively when it is unset. See `publish.maven` for the setup.

#### releaseEnvironment

**Type:** `string`

Release environment name used by generated publishing workflows. It renders as the publish job's `environment:`, so the destination repository's environment protection rules gate the release, and this registry's secrets can come from that environment — one there overrides a repository secret of the same name.

#### sonatypePlatform

**Type:** `"portal" | "ossrh" | string`

Maven Central/Sonatype platform variant an imported config named: `portal` for the Central Portal, `ossrh` for the retired OSSRH staging API. Declared on `maven` alone: a `sonatypePlatform` on any other registry is reported as an unknown publish option rather than silently accepted. The generated JVM release always publishes through the Central Portal, since OSSRH's June 2025 retirement leaves that the only path that publishes anything, so the value records where the SDK came from and does not change what is emitted.

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

Java/Kotlin emitter options, read by both JVM targets from their own block. Every option is honored, so setting one changes generated output; most move files or rename public classes, which is a source-breaking change for an SDK that already has consumers.

### elideConst

**Type:** `boolean`

Elide a required constant-valued property, so the generated class pins the value instead of exposing the property. True by default: such a property renders as a pinned raw JSON value with no typed getter, no generated enum, and no typed builder setter — only the raw accessor and a single raw setter documented as the escape hatch for sending a value the document does not describe — and it is not checked on `build()`. A closed union variant whose discriminator is its only property, and which nothing else declares a class for, collapses to raw JSON instead of a class of its own. Set it to false to render the property as an ordinary typed field — typed getter, required builder slot, and a required-field check on `build()` — and to give such a union variant a real class, which is the shape a JVM SDK published before constants were elided exposes. A **string** constant is then typed by a generated single-member enum wrapper, matching how a one-value `enum` is already rendered; a numeric or boolean one keeps its plain scalar type rather than becoming a single-member wrapper, so the field reads the same as with the setting on. A constant that is the whole of a response body keeps its scalar type too. A constant property that is `readOnly` or nullable is not elided under either setting, since the caller must still be able to omit or null it; a discriminated union's tag is pinned on the union's own terms and is not subject to that carve-out.

**Default:** `true`

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
