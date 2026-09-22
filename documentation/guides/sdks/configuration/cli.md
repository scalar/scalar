<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand — run:
bun run --filter @scalar/sdk-config types:generate

Published at https://scalar.com/docs/guides/sdks/configuration, which is where the links to
pages outside this reference resolve.
-->
# CLI

Add `cli` under `targets` to generate a command-line client.

```json
{
  "targets": {
    "cli": {
      "binaryName": "acme",
      "packageName": "@acme/cli",
      "destinations": {
        "production": {
          "repo": "acme/acme-cli"
        }
      },
      "publish": {
        "npm": true
      }
    }
  }
}
```

Registry accounts, secrets, and first-release setup: [CLI publishing](../publishing/cli.md).

## binaryName

**Type:** `string`

Command name the generated CLI is installed and invoked as, e.g. `warp-hr`. Defaults to the SDK slug. This is not the package name: `targets.cli.packageName` names the published npm package (`@acme/widget`), while this names the command that package installs (`widget`). One spelling serves the `package.json` `bin` key, the man page file names, the binary Homebrew installs, and the literal command printed in `--help`, the README, and the shell completion scripts, so it is restricted to `A-Za-z0-9._-`, starting with an alphanumeric and not ending in `-` or `.`. Case is preserved — `MyWidget` installs and runs as `MyWidget` — because npm links a `bin` key verbatim; only the Homebrew formula *file* is lowercased, since `brew` resolves it case-sensitively on Linux. A scoped, spaced, or shell-metacharacter name is rejected rather than sanitized because each install channel would sanitize it differently — npm and Homebrew disagree, and neither can install a command containing `/` — leaving the CLI documenting and completing a command name that no install produces.

**Constraints:** `pattern: ^[A-Za-z0-9]([A-Za-z0-9._-]*[A-Za-z0-9_])?$`

## packageName

**Type:** `string`

Name the generated CLI is published under on npm, e.g. `@acme/widget`. Defaults to the kebab-cased SDK name with a `-cli` suffix (`scalar-galaxy-cli`). This is not the command name: `targets.cli.binaryName` names the command this package installs (`widget`), while this names the package `npm install -g` fetches. An `@scope/name` value keeps its scope, unlike `binaryName`, because npm publishes scoped packages but cannot install a command containing `/`. The value is still reduced before it is emitted — lowercased, with anything outside `a-z0-9._-` collapsed to `-` — so `@Acme/Widget CLI` publishes as `@acme/widget-cli`. That reduction is not npm's full name grammar: a leading `_` or `.`, a name over 214 characters, and a name npm blocks are all passed through and rejected by `npm publish` rather than here.

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

CLI publishing configuration.

### npm

**Type:** `boolean | object`

npm publishing configuration for the generated CLI package, installed globally with `npm install -g`. `true` publishes with the defaults; an object tunes them.

Authentication matches the TypeScript target's npm publishing: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC) by default, registered on the package's **Settings → Trusted Publisher** tab (`https://www.npmjs.com/package/<package>/access`) against the destination repository and the workflow file the publish job runs from — `release-please.yml`, the workflow the automated release publishes from (register `sdk-release.yml` as a second publisher only if the manual re-publish workflow is used). npm cannot register a publisher for a package that does not exist yet, so the first version publishes with `authMethod` set to `access-token` and an `NPM_TOKEN` repository secret — a [granular access token](https://docs.npmjs.com/creating-and-viewing-access-tokens) with **Read and write (publish and stage)** and **Bypass 2FA** on, since the *stage only* variant never publishes and 2FA otherwise answers the publish with an OTP prompt no workflow can satisfy. An unscoped package that does not exist yet cannot be picked in that token's package selector, so the first one needs **All packages**; see `targets.typescript.publish.npm`. npm is removing direct publishing with such a token in January 2027, so register the trusted publisher once the package exists and drop the override. Repository secrets live under **Settings → Secrets and variables → Actions** in the destination repository; an environment secret of the same name overrides one there when `releaseEnvironment` is set.

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

### binaries

**Type:** `boolean | object`

Standalone executable publishing configuration for CLI packages. Attaches cross-compiled Linux, macOS, and Windows binaries to the GitHub Release; each embeds its runtime, so they need no Node install. Replaces the former `macos` key, which is migrated automatically.

There is no registry and no account to set up: the binaries are uploaded to the release in the destination repository itself with the workflow's ambient `GITHUB_TOKEN`, so this needs no secret and `authMethod` is unused.

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

### homebrew

**Type:** `object | false`

Homebrew formula publishing configuration for CLI packages. Unlike every other registry this is not a boolean toggle: enabling it requires an object naming the `tapRepo` to push the formula to. `false` (or omitting the key) disables Homebrew publishing.

There is no registry account and no OIDC path here, so `authMethod` is unused. Each release clones the tap over HTTPS as `x-access-token` with the `HOMEBREW_TAP_TOKEN` repository secret, renders the formula into that clone, and commits it straight to the tap's default branch — no pull request, no review. The workflow's ambient `GITHUB_TOKEN` cannot stand in for that secret, because that token is scoped to the repository the workflow runs in and the tap is a different repository.

Setting Homebrew publishing up, once:

1. **Create the tap repository** and name it `homebrew-<tap>` — see `tapRepo` for the naming and visibility it needs.
2. **Mint the token.** A [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) needs **Resource owner** set to the tap's owner (the user or organization, not the SDK repository's owner if they differ), **Repository access** set to *Only select repositories* → the tap, and exactly one repository permission: **Contents: Read and write**. **Metadata: Read-only** is added automatically alongside it; nothing else is required — no Administration, no Workflows, no account permissions. A classic token works too, with the `repo` scope (`public_repo` is enough for a public tap), but it carries that access to every repository its account can reach, which is why the fine-grained token is worth the extra minute.
3. **Check the token can actually push.** A token never exceeds what its own account has, so that account needs write access to the tap, and a fine-grained token owned by an organization member may sit unusable until an organization owner approves it under the organization's personal-access-token policy.
4. **Store it as `HOMEBREW_TAP_TOKEN`** in the *destination* repository — the one holding the generated SDK and its release workflows, not the tap — under **Settings → Secrets and variables → Actions → New repository secret**. It is read by the release job in `release-please.yml`, and by `sdk-release.yml` if the manual re-publish workflow is used, so it has to be visible to both. When `releaseEnvironment` is set, an environment secret of the same name overrides the repository one.
5. **Leave the push a way through.** Because the commit lands on the tap's default branch directly, a branch protection rule or ruleset there that requires a pull request, a review, or a status check blocks the release at its final step. Either leave the tap's default branch unprotected or add a bypass for the token's account.
6. **Track the expiry.** A fine-grained token expires, and an expired one fails the release the moment it tries to reach the tap — on the clone, not the push, since that is where the credential is first used — after the version has already been published to every other registry, so the fix is a re-run rather than a clean retry. Renew it ahead of time, or choose a lifetime you will not be surprised by.

One requirement no token covers: the **destination** repository's release assets have to be fetchable anonymously. The Homebrew step re-downloads with a plain `curl` the executables the asset step uploaded moments earlier — that upload is authenticated, this download is not — and pins those same URLs into the formula. A private destination repository therefore fails the release on that download, and would publish a formula no `brew install` could fetch even if it did not.

#### tapRepo

**Type:** `string`

**Required**

Homebrew tap repository (`owner/repo`) the release workflow pushes the generated formula to, e.g. `acme/homebrew-tap`. Required, because a tap is the only thing a Homebrew release has to push to: there is no central registry to fall back on, so a guessed repository either does not exist or belongs to someone else. Restricted to a single `owner/repo` pair of GitHub name characters because the value is spliced into the `git clone` URL of the generated release workflow.

Create the repository yourself before the first release — nothing in the generated workflow creates it — and set it up so a user can install from it:

- **Name it `homebrew-<tap>`.** Homebrew expands the `brew install <owner>/<tap>/<formula>` shorthand back to `github.com/<owner>/homebrew-<tap>`, so a conventionally named tap installs in one command. Any other name is still a working tap, but users have to `brew tap <owner>/<repo> https://github.com/<owner>/<repo>` first, and that is what the generated README documents instead.
- **Keep it public.** `brew install` fetches the formula anonymously; a private tap only installs for users who have configured their own GitHub credentials for Homebrew.

The owner does not have to match the SDK repository's owner — a tap shared across several CLIs usually does not. Access to it comes from the `HOMEBREW_TAP_TOKEN` secret, not from the workflow's own repository permissions; see `publish.homebrew` for how to mint and store it.

**Constraints:** `pattern: ^[A-Za-z0-9][A-Za-z0-9._-]*/[A-Za-z0-9][A-Za-z0-9._-]*$`

#### authMethod

**Type:** `"oidc" | "access-token"`

Registry authentication mechanism. Unused for Homebrew: a formula is pushed to the `tapRepo` with the `HOMEBREW_TAP_TOKEN` repository secret, and there is no registry to trust a publisher with. See `publish.homebrew` for the setup.

#### releaseEnvironment

**Type:** `string`

Release environment name used by generated publishing workflows. It renders as the publish job's `environment:`, so the destination repository's environment protection rules gate the release, and this registry's secrets can come from that environment — one there overrides a repository secret of the same name.

#### homepage

**Type:** `string`

Homepage rendered into the generated Homebrew formula. Defaults to the target's production repository.

#### description

**Type:** `string`

Description rendered into the generated Homebrew formula. Defaults to `<binary> command-line interface`.

## defaultFormat

**Type:** `string`

Default output format for CLI target generation.

## defaultErrorFormat

**Type:** `string`

Default error output format for CLI target generation.

## shellCompletions

**Type:** `boolean`

Whether the generated CLI ships shell completion scripts and the `completion` subcommand that prints them. Defaults to true.

**Default:** `true`

## credentialStore

**Type:** `object`

Interactive sign-in for the generated CLI: a `login` command that acquires a credential the way the SDK's auth scheme demands — prompting for an API key, or running an OAuth flow — and a `logout` that clears it, so later commands need no flag or environment variable.

Emitted only when the SDK has an auth scheme, and suppressed by `enabled: false`. Where the credential is kept is `backend`'s call: by default the operating system's own credential store — the Secret Service on Linux, Credential Manager on Windows — falling back to a `0600` file inside a `0700` directory in the user's state directory when none is reachable, which is also what macOS always gets. Either way it is keyed by the resolved base URL, so a credential issued against one environment is never sent to another, and an explicit flag or environment variable always wins over a stored one.

### enabled

**Type:** `boolean`

Set `false` to emit no credential store at all: no `login`, no `logout`, no stored-credential read. Defaults to **true**, but only ever reaches a CLI whose SDK has an auth scheme — an API with no configured credential has nothing to sign in with, so the commands are skipped there without any config saying so. This is the off switch for an API owner who has auth but does not want a credential file on their users' machines.

**Default:** `true`

### backend

**Type:** `"auto" | "keychain" | "file"`

Where a credential is kept once `login` obtains it.

`auto` (the default) uses the operating system's own credential store when one is reachable — the Secret Service on Linux, Credential Manager on Windows — and falls back to a `0600` file under the user's state directory when it is not. That fallback is what keeps the CLI usable on a headless box or in CI, where no keychain daemon is running.

macOS always uses the file. Its `security` tool accepts a password only as a command-line argument, and a process's command line is readable by other processes, so there is no way to drive it without exposing the credential — which is the same reason the widely used CLIs that ship no native helper binary keep theirs in a file too.

`keychain` refuses the fallback: if the OS store cannot be reached the command fails rather than writing a credential to disk. Choose it when an organisation forbids secrets at rest in a file — but read it together with the paragraph above: macOS has no helper this can drive, so `keychain` makes `login` fail on every Mac rather than fall back, and a CLI with Mac users needs `auto`.

`file` never consults the OS store. Choose it when a keychain prompt would break an automated environment.

Even under `keychain`, a small index of *which base URLs are signed in* is written to the state directory. It holds no secret — only the OS store does — and it is what lets `logout --all` find every profile, since a keychain offers no portable way to enumerate them.

**Default:** `"auto"`

### oauth

**Type:** `object`

Identifies this CLI to an OAuth provider, for the browser-redirect flows. Required for `authorizationCode`: the OpenAPI flow object carries the authorization and token URLs but never a `client_id`, because that identifies the *application* rather than the API, so no document can supply it. Without this block those flows are unavailable and `login` falls back to the next usable flow, or to reading a token the user supplies.

#### clientId

**Type:** `string`

**Required**

Public OAuth client id registered for this CLI. Not a secret — a CLI is a public client, which is why the browser flow uses PKCE rather than a client secret — so it is baked into the generated source. A confidential secret must never be configured here; it would ship inside a published npm package.

Deliberately not a `clientSettings.opts` entry carrying a `defaultValue`: an auth client option refuses defaults outright (see `ClientAuthField.defaultLiteral`) precisely so credentials cannot reach generated source, and routing a public identifier through that door would weaken the rule for every real credential.

**Constraints:** `minLength: 1`

#### redirectPort

**Type:** `integer`

Port the loopback redirect listens on, which has to match a redirect URI registered with the provider (`http://127.0.0.1:<port>/callback`). Defaults to `0`, letting the OS pick a free port — correct only where the provider accepts any loopback port, which RFC 8252 recommends for native apps but not every provider implements. Pin it when yours registers one exact URI.

**Default:** `0`

**Constraints:** `minimum: 0`, `maximum: 65535`

#### scopes

**Type:** `string[]`

Scopes to request, overriding the ones the OpenAPI flow declares. A document tends to list every scope the API defines, which is more than a CLI needs; requesting all of them makes the consent screen alarming and the resulting token broader than it should be.

**Constraints:** `minItems: 1`

## prereleaseType

**Type:** `string`

Prerelease channel this target's releases publish on, as a bare semver prerelease identifier (`next`, `beta`, `rc`). It becomes the released version's prerelease suffix — a channel of `next` releases `1.2.0-next.1` — so the value is held to the shape a semver identifier may take: a letter, then letters, digits and hyphens.

Omit it to release on the stable line. A release train promoting to a conventionally named prerelease branch (`alpha`, `beta`, `canary`, `next`, `preview`, `rc`) adopts that branch's name as its channel, so this only has to be set to name a channel the branch does not, or to put a target on a prerelease line while promoting to a branch named something else.

**Constraints:** `pattern: ^[A-Za-z][0-9A-Za-z-]*$`

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

## Method commands

**Type:** `object`

Set `cli` on a method in `resources` to enable, disable, or tune the command generated for it.

```json
{
  "resources": {
    "users": {
      "methods": {
        "list": {
          "kind": "http",
          "endpoint": "get /users",
          "cli": {
            "enabled": true,
            "format": "table"
          }
        }
      }
    }
  }
}
```

| Property | Type | Description |
| --- | --- | --- |
| `enabled` | `boolean` | Enables or disables CLI command generation for this method. |
| `filter` | `string` | CLI-specific parameter filter expression. |
| `format` | `string` | Default CLI output format for this method. |
