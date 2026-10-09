<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand.

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
      "destinations": {
        "production": {
          "repo": "acme/acme-typescript"
        }
      },
      "publish": {
        "npm": {
          "authMethod": "oidc",
          "access": "public",
          "tag": "latest",
          "releaseEnvironment": "production"
        }
      }
    }
  }
}
```

Setting up publishing: [TypeScript publishing guide](../publishing/typescript.md). How releases are cut: [Publishing](../publishing/overview.md).

## packageName

**Type:** `string`

Import/package name for TypeScript packages.

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

npm publishing configuration.

### npm

**Type:** `boolean | object`

Publishes the TypeScript package to npm. `true` publishes with the defaults; an object tunes them. `authMethod` and `releaseEnvironment` decide how the publish authenticates; `access` and `tag` decide what it publishes.

Authenticates with [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC) by default, registered on the package's **Settings → Trusted Publisher** tab (`https://www.npmjs.com/package/<package>/access`). With `authMethod` set to `access-token` it reads a [granular access token](https://docs.npmjs.com/creating-and-viewing-access-tokens) from the `NPM_TOKEN` repository secret instead, which the first release of a new package needs: npm only registers a trusted publisher on a package that already exists.

#### authMethod

**Type:** `"oidc" | "access-token"`

Registry authentication mechanism. See `publish.npm` for the trusted-publisher page to register on and the secret `access-token` mode reads.

#### releaseEnvironment

**Type:** `string`

Release environment name used by generated publishing workflows. It renders as the publish job's `environment:`, so the destination repository's environment protection rules gate the release, and this registry's secrets can come from that environment — one there overrides a repository secret of the same name. Under OIDC it must also match the environment registered on the trusted publisher.

#### access

**Type:** `"public" | "restricted" | string`

Package visibility the release publishes with, as npm's `--access`:

- `public` (the default): installable by anyone. An unscoped package is public anyway, but npm publishes a scoped one as `restricted` unless told otherwise, so without this default a scoped SDK would publish privately the first time and stay that way.
- `restricted`: readable only by the publishing account or organization, and it needs a paid npm plan; on a free account npm rejects the publish. Scoped packages only: npm has no private unscoped packages, so `restricted` on one is an error from npm rather than a setting that takes effect.
- Any other string is passed to `npm publish` as given, as long as it has no whitespace. `--access` takes a single token, so a blank or spaced value is rejected here rather than by `npm publish` on the release runner, after the release tag has already been cut.

Unused by every other registry: `--access` is an npm concept, and the ecosystems that model visibility at all do it on the account rather than per publish.

#### tag

**Type:** `string`

Dist-tag stable releases land on, as npm's `--tag`. Defaults to npm's own default, `latest`, which is the tag a bare `npm install <package>` resolves. Set it to publish releases without moving `latest`: for a package that ships a `next` line, or one whose stable users should stay on a tag you advance deliberately.

Prereleases ignore it and derive their own tag from the version's semver prerelease identifier, so a release train that publishes both keeps them on separate tags:

- `1.0.0-beta.1` publishes under `beta`.
- A prerelease identifier that is not usable as a tag derives `next`.
- A derived tag that would name a stable line is suffixed with `-prerelease` rather than published over it. `latest` counts as one whatever this is set to, so `1.0.0-latest.1` publishes under `latest-prerelease` on any package; with `tag: next`, `1.3.0-RC.1` publishes under `next-prerelease`.

Must be a lowercase run of letters, digits, and hyphens starting with a letter, the same shape a derived prerelease tag is held to, because the value is rendered into the generated publish script as a string literal and passed to `npm publish` as an argument. npm also rejects a tag that parses as a semver version, which is not expressible here and is reported by `npm publish` instead.

**Constraints:** `pattern: ^[a-z][a-z0-9-]*$`

#### homepage

**Type:** `string`

Registry or package homepage metadata.

#### description

**Type:** `string`

Registry or package description metadata.

## packageManager

**Type:** `string`

TypeScript package manager preference. Recorded in the compiled SDK but not currently read by the TypeScript target.

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

### backCompat

**Type:** `object`

Legacy public names an already-published TypeScript SDK keeps declaring so its consumers' imports and annotations keep compiling. Every option here only adds names; nothing is renamed or removed.

#### typeAliases

**Type:** `object[]`

Extra type names declared in generated resource modules, so an import or annotation an already-published TypeScript SDK shipped keeps compiling after the type it named moved or was renamed, e.g. `PartListResponse` for `PartList.Data` in `resources/widgets/parts`. Each entry appends `export type <name> = <to>;` to `module`, and the name is re-exported wherever that module's types are: the resource's own `export declare namespace`, its direct parent's namespace, and the resource barrels beside it. For a root resource module that parent is the client namespace. Deeper ancestors reach a nested module's alias through the nested namespace path (`Client.Widgets.Parts.PartListResponse`), not under their own name. Generation fails when `module` is not a resource module this SDK emits, when `to` is not a type `module` itself declares, when `module` already binds `name`, when another module already exports `name` or a generated class carries it (the shared namespaces and barrels would otherwise rename that type), or when `name` is a global type generated modules may use unqualified, such as `Array`, `Response`, `Blob` or `Date`. A stale entry is therefore caught when it stops resolving, rather than shipping without the name or renaming another type.

##### module

**Type:** `string`

**Required**

Path of the resource module that declares the alias, relative to `src/` and without an extension: `resources/widgets` for `src/resources/widgets.ts`, `resources/widgets/parts` for `src/resources/widgets/parts.ts`. This is the path consumers deep-import from.

**Constraints:** `pattern: ^[A-Za-z0-9_-]+(/[A-Za-z0-9_-]+)*$`

##### name

**Type:** `string`

**Required**

Name the alias is declared under. Must be an identifier TypeScript accepts as a type alias name, so neither a reserved word nor a predefined type such as `string`.

**Constraints:** `pattern: ^(?!(?:any|bigint|boolean|never|number|object|string|symbol|undefined|unknown|void|arguments|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|eval|export|extends|false|finally|for|function|if|implements|import|in|instanceof|interface|let|new|null|package|private|protected|public|return|static|super|switch|this|throw|true|try|typeof|var|while|with|yield)$)[A-Za-z_$][A-Za-z0-9_$]*$`

##### to

**Type:** `string`

**Required**

Type the alias points at, spelled as `module` itself names it: a type the module declares, optionally followed by members of its namespace, e.g. `PartList.Data` or `PartListCursorPage`. Imported types cannot be targeted, so the alias never needs an import.

**Constraints:** `pattern: ^(?!(?:arguments|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|eval|export|extends|false|finally|for|function|if|implements|import|in|instanceof|interface|let|new|null|package|private|protected|public|return|static|super|switch|this|throw|true|try|typeof|var|void|while|with|yield)(?:\.|$))[A-Za-z_$][A-Za-z0-9_$]*(\.(?!(?:arguments|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|eval|export|extends|false|finally|for|function|if|implements|import|in|instanceof|interface|let|new|null|package|private|protected|public|return|static|super|switch|this|throw|true|try|typeof|var|void|while|with|yield)(?:\.|$))[A-Za-z_$][A-Za-z0-9_$]*)*$`

##### deprecationMessage

**Type:** `string`

Rendered as the alias's `@deprecated` JSDoc tag, typically pointing callers at the current name.

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
