<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand — run:
bun run --filter @scalar/sdk-config types:generate

Published at https://scalar.com/docs/guides/sdks/configuration, which is where the links to
pages outside this reference resolve.
-->
# TypeScript

Add `typescript` under `targets` to generate a TypeScript SDK package.

```json
{
  "targets": {
    "typescript": {
      "packageName": "@acme/api",
      "packageManager": "pnpm",
      "destinations": {
        "production": {
          "repo": "acme/acme-typescript"
        }
      },
      "publish": {
        "npm": true
      }
    }
  }
}
```

Registry accounts, secrets, and first-release setup: [TypeScript publishing](../publishing/typescript.md).

## packageName

**Type:** `string`

Import/package name for TypeScript packages.

## packageManager

**Type:** `string`

TypeScript package manager preference for generated package metadata.

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

npm publishing configuration.

### npm

**Type:** `boolean | object`

npm registry publishing configuration for TypeScript packages. `true` publishes with the defaults; an object tunes them.

Releases use [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC) unless `authMethod` says otherwise: the publish job exchanges its GitHub Actions id-token for a short-lived, package-scoped npm token, so no `NPM_TOKEN` secret is stored. Register the publisher on the package's **Settings → Trusted Publisher** tab (`https://www.npmjs.com/package/<package>/access`), naming the destination repository's owner and name, the workflow file the publish job runs from — `release-please.yml`, the workflow the automated release publishes from (register `sdk-release.yml` as a second publisher only if the manual re-publish workflow is used) — and the `releaseEnvironment` when one is set.

npm has no pending-publisher flow, so the package must already exist before a publisher can be registered: publish the first version with `authMethod` set to `access-token` and a [granular access token](https://docs.npmjs.com/creating-and-viewing-access-tokens) stored as the `NPM_TOKEN` repository secret, then register the publisher and drop the override. Give that token **Read and write (publish and stage)** — the *stage only* variant parks the version awaiting an interactive approval instead of publishing it — and turn **Bypass 2FA** on, since account-level or package-level 2FA otherwise answers the publish with an OTP prompt no workflow can satisfy. Its package selector lists packages and scopes that already exist, so a first release has nothing to point it at: select the npm scope for a scoped name, creating that scope or organization first, and fall back to **All packages** for an unscoped one, then narrow or revoke the token once the trusted publisher is registered. Treat the override as a bootstrap and nothing more: npm is removing direct publishing with a granular token in January 2027, so register the trusted publisher as soon as the first version exists. Repository secrets live under **Settings → Secrets and variables → Actions** in the destination repository; an environment secret of the same name overrides one there when `releaseEnvironment` is set.

`authMethod` and `releaseEnvironment` decide how the publish authenticates; `access` and `tag` decide what it publishes — the package's visibility and the dist-tag stable releases land on.

#### authMethod

**Type:** `"oidc" | "access-token"`

Registry authentication mechanism. See `publish.npm` for the trusted-publisher page to register on and the secret `access-token` mode reads.

#### releaseEnvironment

**Type:** `string`

Release environment name used by generated publishing workflows. It renders as the publish job's `environment:`, so the destination repository's environment protection rules gate the release, and this registry's secrets can come from that environment — one there overrides a repository secret of the same name. Under OIDC it must also match the environment registered on the trusted publisher.

#### access

**Type:** `"public" | "restricted" | string`

Package visibility the release publishes with, as npm's `--access`. Defaults to `public`, which is what an unscoped package gets anyway and what a scoped one needs in order to be installable by anyone — npm publishes a scoped package as `restricted` unless told otherwise, so a generated SDK that omitted this would publish privately the first time and stay that way.

`restricted` keeps the package readable only by the publishing account or organization, and requires a paid npm plan; on a free account the publish is rejected. It applies to scoped packages only: npm has no private unscoped packages, so `restricted` on one is an error from npm rather than a setting that takes effect.

Any other string is accepted for forward compatibility and passed to `npm publish` as given, so long as it carries no whitespace — `--access` takes a single token, and a blank or spaced value is rejected here rather than by `npm publish` on the release runner, after the release tag has already been cut. Unused by every other registry: `--access` is an npm concept, and the ecosystems that model visibility at all do it on the account rather than per publish.

#### tag

**Type:** `string`

Dist-tag stable releases land on, as npm's `--tag`. Defaults to npm's own default, `latest`, which is the tag a bare `npm install <package>` resolves.

Only stable releases read this. A prerelease derives its own tag from the version's semver prerelease identifier instead — `1.0.0-beta.1` publishes under `beta` — so a release train that publishes both keeps them on separate tags. Where a derived tag would name a stable line it is suffixed with `-prerelease` rather than published over: a prerelease identifier that is not usable as a tag derives `next`, so on a package configured with `tag: next` a `1.3.0-RC.1` would otherwise land on the stable line. `latest` counts as one whatever this is set to, since it stays the tag a bare `npm install` resolves — a `1.0.0-latest.1` publishes under `latest-prerelease` on any package.

Set it to publish releases without moving `latest`: a package that ships a `next` line, or one whose stable users should stay on a tag you advance deliberately. Restricted to a lowercase run of letters, digits, and hyphens starting with a letter — the same shape a derived prerelease tag is held to — because the value is rendered into the generated publish script as a string literal and passed to `npm publish` as an argument. npm additionally rejects a tag that parses as a semver version, which is not expressible here and is reported by `npm publish` instead.

**Constraints:** `pattern: ^[a-z][a-z0-9-]*$`

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

TypeScript emitter options.

### propertyCasing

**Type:** `"wire" | "sdk"`

Naming style for generated properties and parameters. 'wire' (the default) preserves the OpenAPI wire names, e.g. `order_by` and `event_name`. 'sdk' emits the target's idiomatic SDK name — camelCase for TypeScript, so `orderBy` and `eventName` — and generates a wire<->sdk remap so request query/body keys and response bodies stay correct on the network. The value is named 'sdk' (rather than 'camelCase') to match the shared naming used across language targets, where the idiomatic style differs by language; for TypeScript specifically 'sdk' means camelCase.

**Default:** `"wire"`

### dateTimeType

**Type:** `"string" | "Date"`

How `format: date-time` values are typed. 'string' (the default) declares them as ISO 8601 strings and passes them through untouched, which is what every generated TypeScript SDK does today. 'Date' declares them as a JavaScript `Date`: response values are parsed from their ISO string on the paths the response remap reaches, and a `Date` handed to a request is written as ISO by the runtime that already serializes it — the query serializer, or `JSON.stringify` for a body. Request-side inputs accept `Date | string`, so a caller that already holds an ISO string need not round-trip it. A header, a path segment and a `multipart/form-data` part are excluded, because none of those serializers handles a `Date`: an inline date-time there stays a string. A `format: date` (date-only) value is unaffected and stays a string — putting a date-only value in a `Date` gives it a spurious local midnight and timezone. Where the response remap cannot run — streaming, paginated, websocket, gRPC/Connect and unwrapped responses — a method's own inline response type stays 'string' so it never promises a `Date` the runtime does not deliver. Three gaps remain, all because a shared model is declared once under the SDK-wide setting rather than per use site, so a reference to it renders its declared name wherever it appears. A model reached only through a union or intersection arm, and a model reached through one of those non-remapping methods, both carry `Date` over fields the remap never visits, and those fields hold the ISO string the server sent. And a parameter whose schema references a declared date-time model keeps that model's `Date` even in the excluded request positions above, since the reference renders the name rather than a date-time this option could withhold.

**Default:** `"string"`

## compatibility

**Type:** `"speakeasy"`

Emit an extra module of deprecated wrapper functions reproducing another SDK generator's public surface (function names, argument shape, return type) that forward to the generated SDK, so consumers migrating off that generator keep their existing call sites compiling. Omit to emit nothing extra. 'speakeasy' emits `src/compat/speakeasy.ts` with Speakeasy-style standalone functions returning a functional `Result`, matching Speakeasy's tree-shakable `funcs/` surface.

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
