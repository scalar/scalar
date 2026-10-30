<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand.

Published at https://scalar.com/products/sdk-generator/configuration/typescript, which is where the links to
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

Primary repository this target's generated output is published to. Setting it turns on the generated GitHub Actions: the CI workflow, the release-please configuration, and the versioning policy. A release workflow is added too when `publish` enables a registry that needs one; a registry served from git tags publishes from the release tag alone. Without a production destination the target is still generated, but with no workflows.

| Property | Description |
| --- | --- |
| `repo`* | GitHub repository in `owner/name` form that generated output for this target is pushed to. An `owner/name#branch` suffix is tolerated and supplies the default branch when `branch` does not, but prefer setting `branch` on its own: not every target strips the suffix back off when it writes the repository URL into published package metadata. |
| `branch` | Default branch of the destination repository, which release pull requests target. Generated output is pushed to the `scalar-generated` branch and merged with your custom code on the integration branch (`integrationBranch`, `scalar-next` by default); the release pull request is opened from there against this branch. Defaults to a `#branch` suffix on `repo`, then `main`. A value that is not a safe git branch name is skipped in favor of the next one. |
| `integrationBranch` | Branch where generated output is combined with your custom code; defaults to `scalar-next`. Commit customizations here: each regeneration is merged into it, release pull requests are opened from it, and each released version is synced back to it. An empty string means the default. The name must be a safe git branch name, and it cannot be the default branch or collide with the branches Scalar and release-please manage, such as `scalar-generated`. |

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

Release environment name used by generated publishing workflows. It renders as the publish job's `environment:`, so the destination repository's environment protection rules apply to the release, and this registry's secrets can come from that environment — one there overrides a repository secret of the same name. Under OIDC it must also match the environment registered on the trusted publisher.

#### access

**Type:** `"public" | "restricted" | string`

Package visibility the release publishes with, as npm's `--access`:

- `public` (the default): installable by anyone. npm publishes a scoped package as `restricted` unless told otherwise, so without this default a scoped SDK would publish privately.
- `restricted`: readable only by the publishing account or organization. It needs a paid npm plan and a scoped package; npm rejects it otherwise.
- Any other string is passed to `npm publish` as given. A blank value, or one with whitespace, is rejected before a release tag is cut.

#### tag

**Type:** `string`

Dist-tag stable releases land on, as npm's `--tag`. Defaults to `latest`, the tag a bare `npm install <package>` resolves. Set it to publish releases without moving `latest`, for example for a package that ships a `next` line.

Prereleases ignore it and take their tag from the version's prerelease identifier:

- `1.0.0-beta.1` publishes under `beta`.
- A prerelease identifier that is not usable as a tag publishes under `next`.
- A derived tag that would name a stable line gets a `-prerelease` suffix instead. `latest` always counts as one, so `1.0.0-latest.1` publishes under `latest-prerelease`; with `tag: next`, `1.3.0-RC.1` publishes under `next-prerelease`.

Must be lowercase letters, digits, and hyphens, starting with a letter. npm also rejects a tag that looks like a semver version, which `npm publish` reports.

**Constraints:** `pattern: ^[a-z][a-z0-9-]*$`

## prereleaseType

**Type:** `string`

Prerelease channel this target's releases publish on, as a bare semver prerelease identifier (`next`, `beta`, `rc`). It becomes the released version's prerelease suffix — a channel of `next` releases `1.2.0-next.1` — so the value is held to the shape a semver identifier may take: a letter, then letters, digits and hyphens.

Omit it to release on the stable line. A release train promoting to a conventionally named prerelease branch (`alpha`, `beta`, `canary`, `next`, `preview`, `rc`) adopts that branch's name as its channel, so this only has to be set to name a channel the branch does not, or to put a target on a prerelease line while promoting to a branch named something else.

**Constraints:** `pattern: ^[A-Za-z][0-9A-Za-z-]*$`

## options

**Type:** `object`

TypeScript generation options.

### propertyCasing

**Type:** `"wire" | "sdk"`

Naming style for generated properties and parameters. `wire` (the default) keeps the OpenAPI names, such as `order_by` and `event_name`. `sdk` uses camelCase, such as `orderBy` and `eventName`, and the generated SDK maps them back to the wire names in requests and responses.

**Default:** `"wire"`

### dateTimeType

**Type:** `"string" | "Date"`

How `format: date-time` values are typed. `string` (the default) types them as ISO 8601 strings and passes them through unchanged. `Date` types them as JavaScript `Date` objects: responses are parsed into `Date`, and request inputs accept `Date | string` and are sent as ISO strings. Date-only (`format: date`) values stay strings. Some positions keep strings even with `Date`: headers, path segments, `multipart/form-data` parts, and the responses of streaming, paginated, websocket, gRPC/Connect, and unwrapped methods. Known gaps: a shared model reached only through a union or intersection, or only through one of those methods, is typed `Date` but holds the ISO string, and a header, path, or multipart parameter that references a date-time model keeps that model's `Date` type.

**Default:** `"string"`

### int64Type

**Type:** `"number" | "bigint"`

How `integer` values declared `format: int64` (or the unregistered `format: uint64`) are typed. 'number' (the default) declares them as a JavaScript `number` and parses responses with the platform JSON parser, which is what every generated TypeScript SDK does today: a value past 2^53 - 1, such as `9007199254740993`, silently arrives rounded to the nearest representable `number`. 'bigint' declares them as a JavaScript `bigint` and keeps them exact: response bodies are parsed without loss, and every int64 value on a path the response remap reaches is handed back as a `bigint` built from the digits the server sent. An inline int64 request input accepts `bigint | number`, and the runtime writes a `bigint` as a plain JSON number in a request body (where `JSON.stringify` alone would throw) and as its decimal digits in a query string, a path segment, a header or a `multipart/form-data` part. Where the response remap cannot run — streaming, paginated, websocket, gRPC/Connect and unwrapped responses — and under a union or intersection arm, whose taken arm the schema cannot decide, an inline int64 stays a `number` so the type never promises a `bigint` the runtime does not deliver. The gaps `dateTimeType: 'Date'` documents carry over unchanged, because a shared model is declared once under the SDK-wide setting rather than per use site: a model reached only through a union or intersection arm, through one of those non-remapping methods or through a webhook payload `unwrap` parses declares `bigint` over fields that hold the parsed `number`, and a request that references a model takes that model's plain `bigint`, not `bigint | number`, for its int64 fields. A proto `int64` is unaffected and stays the `string` proto3-JSON writes it as. There is no 'string' value: a request would then need a per-field rule to tell an int64 string from any other string and write it as a JSON number, where a `bigint` is told apart by its `typeof`.

**Default:** `"number"`

### backCompat

**Type:** `object`

Legacy public names an already-published TypeScript SDK keeps declaring so its consumers' imports and annotations keep compiling. Every option here only adds names; nothing is renamed or removed.

#### typeAliases

**Type:** `object[]`

Extra type names declared in generated resource modules, so an import or annotation an already-published TypeScript SDK shipped keeps compiling after the type it named moved or was renamed, e.g. `PartListResponse` for `PartList.Data` in `resources/widgets/parts`. Each entry appends `export type <name> = <to>;` to `module`, and the name is re-exported wherever that module's types are: the resource's own `export declare namespace`, its direct parent's namespace, and the resource barrels beside it. For a root resource module that parent is the client namespace. Deeper ancestors reach a nested module's alias through the nested namespace path (`Client.Widgets.Parts.PartListResponse`), not under their own name. Generation fails when `module` is not a resource module this SDK generates, when `to` is not a type `module` itself declares, when `module` already binds `name`, when another module already exports `name` or a generated class carries it (the shared namespaces and barrels would otherwise rename that type), or when `name` is a global type generated modules may use unqualified, such as `Array`, `Response`, `Blob` or `Date`. A stale entry is therefore caught when it stops resolving, rather than shipping without the name or renaming another type.

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

## compatibility

**Type:** `"speakeasy"`

Experimental: may change in a later release. Not yet complete: generates an extra module of deprecated wrapper functions that mirror a Speakeasy SDK's public surface and forward to the generated SDK, so code written against a Speakeasy SDK keeps compiling. The wrapper module does not yet reproduce every part of a Speakeasy SDK's surface. `speakeasy` generates standalone functions returning a functional `Result` in `src/compat/speakeasy.ts`, plus subpath modules laid out like a Speakeasy SDK (`src/funcs/`, `src/sdk/`, `src/models/`, `src/lib/`, `src/types/` and `src/core.ts`). Omit to generate nothing extra.

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
