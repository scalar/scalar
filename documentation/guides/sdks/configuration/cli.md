<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand.

Published at https://scalar.com/products/sdk-generator/configuration/cli, which is where the links to
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
        "npm": {
          "authMethod": "oidc",
          "access": "public",
          "tag": "latest",
          "releaseEnvironment": "production"
        },
        "binaries": true,
        "homebrew": {
          "tapRepo": "acme/homebrew-tap",
          "homepage": "https://acme.com",
          "description": "Command-line interface for the Acme API",
          "pullRequest": true,
          "replaceCask": true
        },
        "signing": {
          "macos": "sign-and-notarize"
        }
      }
    }
  }
}
```

Setting up publishing: [CLI publishing guide](../publishing/cli.md). How releases are cut: [Publishing](../publishing/overview.md).

## binaryName

**Type:** `string`

Command name the generated CLI is installed and invoked as, e.g. `acme-hr`. Defaults to the SDK slug. This is not the package name: `targets.cli.packageName` names the published npm package (`@acme/widget`), while this names the command that package installs (`widget`). The same spelling is used for the `package.json` `bin` key, the man pages, the binary Homebrew installs, and the command shown in `--help`, the README, and shell completions, so it is restricted to `A-Za-z0-9._-`, starting with an alphanumeric and not ending in `-` or `.`. Case is preserved (`MyWidget` installs and runs as `MyWidget`); only the Homebrew formula file name is lowercased. A name with a scope, spaces, or shell metacharacters is rejected, since npm and Homebrew would each change it differently.

**Constraints:** `pattern: ^[A-Za-z0-9]([A-Za-z0-9._-]*[A-Za-z0-9_])?$`

## packageName

**Type:** `string`

Name the generated CLI is published under on npm, e.g. `@acme/widget`. Defaults to the kebab-cased SDK name with a `-cli` suffix (`scalar-galaxy-cli`). This is not the command name: `targets.cli.binaryName` names the command this package installs (`widget`). An `@scope/name` value keeps its scope. The value is lowercased and anything outside `a-z0-9._-` becomes `-`, so `@Acme/Widget CLI` publishes as `@acme/widget-cli`. Other npm naming rules, such as the 214-character limit, are checked by `npm publish`.

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

CLI publishing configuration: three independent channels, in any combination. `npm` publishes the package for `npm install -g`, where it stays a normal Node CLI; `binaries` attaches standalone executables to the GitHub Release for direct download; and `homebrew` renders a formula — or, with `cask`, a cask — into a tap that installs those same executables. Each is configured separately, below. `signing` sits beside them but is not a channel: it signs the macOS executables that `binaries` and `homebrew` ship. All of the channels publish from one job, so the first registry entry that names a `releaseEnvironment` decides it for every channel and later ones are ignored.

### npm

**Type:** `boolean | object`

Publishes the generated CLI to npm, installed globally with `npm install -g`. `true` publishes with the defaults; an object tunes them. `authMethod` and `releaseEnvironment` decide how the publish authenticates; `access` and `tag` decide what it publishes.

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

### binaries

**Type:** `boolean | object`

Standalone executable publishing configuration for CLI packages. Attaches cross-compiled Linux, macOS, and Windows binaries to the GitHub Release; each embeds its runtime, so they need no Node install. Replaces the former `macos` key, which is migrated automatically.

There is no registry and no account to set up: the binaries are uploaded to the release in the destination repository itself with the workflow's ambient `GITHUB_TOKEN`, so this needs no secret and `authMethod` is unused.

Each release builds `linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64`, and `windows-x64`, attached as `<binary>-<platform>.tar.gz` (`.zip` on Windows). The asset names carry no version, so `https://github.com/<owner>/<repo>/releases/latest/download/<binary>-<platform>.tar.gz` always points at the newest release; re-running a release replaces the assets.

#### releaseEnvironment

**Type:** `string`

Release environment name used by generated publishing workflows. It renders as the publish job's `environment:`, so the destination repository's [environment protection rules](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments) — required reviewers, wait timers, environment secrets — gate the release. Under OIDC trusted publishing the name must also match the environment registered on the trusted publisher, which is how a registry constrains who in a repository may publish; leave the registry's environment field blank when this is unset, since a publisher that names an environment rejects a run without one. When it is set, the publish job can read that environment's secrets as well as the repository's, and an environment secret takes precedence over a repository secret of the same name.

### homebrew

**Type:** `object | false`

Publishes the CLI to a Homebrew tap: a formula by default, or a cask with `cask`. This is not a boolean toggle: enabling it requires an object naming the `tapRepo` to push to, and `false` (or omitting the key) disables it.

Each release commits the formula (or cask) to the tap's default branch, or opens a pull request for it with `pullRequest`. The push authenticates with a [fine-grained personal access token](https://github.com/settings/personal-access-tokens) stored as the `HOMEBREW_TAP_TOKEN` repository secret; a `HOMEBREW_TAP_GITHUB_TOKEN` secret is read when that is unset. There is no OIDC path, so `authMethod` is unused. The formula pins the destination repository's release asset URLs, so that repository has to be public.

With `binaries` off, the release still builds the four macOS and Linux archives the formula installs, but no Windows `.zip`.

#### tapRepo

**Type:** `string`

**Required**

Homebrew tap repository (`owner/repo`) the release workflow pushes the generated formula to, e.g. `acme/homebrew-tap`. Required, because a tap is the only thing a Homebrew release has to push to: there is no central registry to fall back on, so a guessed repository either does not exist or belongs to someone else. Must be a single `owner/repo` pair of GitHub name characters.

Create the repository yourself before the first release — nothing in the generated workflow creates it — and set it up so a user can install from it:

- **Name it `homebrew-<tap>`.** Homebrew expands the `brew install <owner>/<tap>/<formula>` shorthand back to `github.com/<owner>/homebrew-<tap>`, so a conventionally named tap installs in one command. Any other name is still a working tap, but users have to `brew tap <owner>/<repo> https://github.com/<owner>/<repo>` first, and that is what the generated README documents instead. Either way the README installs by the fully qualified `<owner>/<tap>/<formula>` name: Homebrew resolves a bare name against its official formulae and casks before any tap, and since Homebrew 6 a tap is untrusted until its user trusts it, so a bare name from it does not load at all. Installing by the full name trusts that one package.
- **Keep it public.** `brew install` fetches the formula anonymously; a private tap only installs for users who have configured their own GitHub credentials for Homebrew.

The owner does not have to match the SDK repository's owner — a tap shared across several CLIs usually does not. Access to it comes from the `HOMEBREW_TAP_TOKEN` secret (or `HOMEBREW_TAP_GITHUB_TOKEN` when that is unset), not from the workflow's own repository permissions; see `publish.homebrew` for how to create and store it.

**Constraints:** `pattern: ^[A-Za-z0-9][A-Za-z0-9._-]*/[A-Za-z0-9][A-Za-z0-9._-]*$`

#### releaseEnvironment

**Type:** `string`

Release environment name used by generated publishing workflows. It renders as the publish job's `environment:`, so the destination repository's environment protection rules apply to the release, and this registry's secrets can come from that environment — one there overrides a repository secret of the same name. The CLI publishes all of its registries from one job, so there the first entry that names an environment decides it for every channel and later ones are ignored.

#### homepage

**Type:** `string`

Homepage rendered into the generated Homebrew formula (or cask, with `cask`). Defaults to `organization.homepage`, then to the target's production repository.

#### description

**Type:** `string`

Description rendered into the generated Homebrew formula (or cask, with `cask`). Defaults to `Command-line interface for <binary>`. `brew audit` rejects one that starts with the package name or a lowercase letter, which a tap scaffolded by `brew tap-new` runs on every pull request.

#### pullRequest

**Type:** `boolean`

Open a pull request against the tap instead of committing the formula straight to its default branch. Use it when the tap's default branch is protected by a branch protection rule or ruleset that requires a pull request, a review, or a status check — the direct push would otherwise fail the release at its final step.

Each release pushes the formula update to a `<formula>-<version>` branch of the tap and opens a pull request from it into the tap's default branch; a re-run force-updates that branch and reuses the pull request already open for it, so it never opens a second one. Nothing merges the pull request for you: `brew install` and `brew upgrade` keep serving the previous version until someone merges it.

The `HOMEBREW_TAP_TOKEN` (or `HOMEBREW_TAP_GITHUB_TOKEN` when that is unset) then needs **Pull requests: Read and write** on the tap as well as **Contents: Read and write** — the push goes to a new branch rather than the protected one, and the pull request is opened with the same token. Defaults to `false`.

#### replaceCask

**Type:** `boolean`

Retire a Homebrew **cask** of the same name that the tap already ships, so users who installed the CLI as that cask move to this formula instead of staying on the cask's last version or ending up with both. Set it when this CLI takes over a tap whose previous release tooling published a cask, such as GoReleaser's `homebrew_casks`, under the same name.

When the tap holds a cask with this name that installs this CLI's command, the release deletes it and adds a `tap_migrations.json` entry in the same commit, which is Homebrew's own cask-to-formula migration. On the next `brew update`, a machine with the cask installed switches to the formula when the formula or the whole tap is trusted; otherwise, since Homebrew 6, it prints the `brew trust --formula` and `brew install --formula` commands that finish the move. The generated README tells cask users to run `brew uninstall --cask <formula>` first. A same-named cask for anything else, such as a desktop app, is left in place, and the release log says so. Defaults to `false`.

#### cask

**Type:** `boolean`

Publish a Homebrew **cask** (`Casks/<formula>.rb`) instead of a formula (`Formula/<formula>.rb`). Users install it with `brew install --cask <owner>/<tap>/<formula>`, and the generated README says so. Casks are how Homebrew expects prebuilt executables to ship; a formula is meant to build from source.

Requires `signing.macos` to be `sign-and-notarize`, and the config is rejected without it. Homebrew quarantines everything a cask downloads, the way a browser marks a download, so Gatekeeper checks the macOS executable the first time it runs and blocks one Apple has not notarized — a signature alone is not enough. A formula download is not quarantined, which is why the formula needs no notarization.

The cask installs the same macOS and Linux archives the formula would (Homebrew installs casks on Linux too), along with the man pages and, unless `shellCompletions` is off, bash, zsh and fish completions. A cask with completions needs Homebrew 5.1.1 or later; `brew install` updates Homebrew first unless auto-update is turned off.

`replaceCask` cannot be combined with this, since the release would delete the cask it just wrote. To move users of a same-named formula onto the cask, set `replaceFormula`. Defaults to `false`.

#### replaceFormula

**Type:** `boolean`

Retire a Homebrew **formula** of the same name that the tap already ships, so users who installed the CLI as that formula move to the cask this release writes. Otherwise they stay on the formula's last version, and because Homebrew resolves a name to a formula before a cask, new users who omit `--cask` keep getting the stale formula too. Only applies with `cask` on; the config is rejected otherwise. Set it when switching a CLI from a formula to a cask, or when taking over a tap whose earlier release tooling wrote `Formula/<name>.rb`.

When the tap holds a formula with this name that installs this CLI's command, the release deletes it and adds a `tap_migrations.json` entry in the same commit, which is Homebrew's own formula-to-cask migration. On the next `brew update`, a machine with the formula installed switches to the cask when the cask or the whole tap is trusted; otherwise, since Homebrew 6, it prints the `brew trust --cask` and `brew install --cask` commands that finish the move. The generated README tells formula users to run `brew uninstall --formula <formula>` first. A same-named formula for anything else is left in place, and the release log says so. Defaults to `false`.

### signing

**Type:** `object`

Code signing for the compiled CLI executables. It is not a publishing channel: it signs what `binaries` and `homebrew` ship, so set it alongside one of them; on its own it publishes nothing. Unlike the registry entries beside it, an unknown key here fails config loading instead of producing a warning, so a typo cannot silently ship unsigned binaries.

#### macos

**Type:** `"sign" | "sign-and-notarize"`

macOS code signing for the compiled `darwin-*` executables. Omit it to ship them unsigned.

- `sign` re-signs them with your Developer ID certificate. That is what makes them run on Apple Silicon, and it is enough for anything installed without a browser — `brew install` of a formula, a `curl … | tar` download — because Gatekeeper only checks files marked as downloaded. A Homebrew cask is the exception: Homebrew marks what a cask downloads the way a browser does, so `publish.homebrew.cask` requires `sign-and-notarize`. The npm package is unaffected either way: it is a plain Node CLI with no compiled executable in it.
- `sign-and-notarize` also submits them to Apple's notary service, so a release archive downloaded in a browser opens without a Gatekeeper warning. It needs the three `MACOS_NOTARY_*` secrets and adds Apple's review time to every release.

The release workflow reads fixed repository secrets, the names goreleaser's notarize documentation uses, so a repository already set up for a goreleaser release needs nothing new:

- `MACOS_SIGN_P12` — the `Developer ID Application` certificate and its private key as a base64-encoded `.p12` bundle. A Keychain Access export and one built with `openssl pkcs12 -export` both work.
- `MACOS_SIGN_PASSWORD` — the password that opens it. May be empty for a passwordless bundle.
- `MACOS_NOTARY_ISSUER_ID` — the App Store Connect API key's issuer ID (a UUID).
- `MACOS_NOTARY_KEY_ID` — the API key's ID (the `<ID>` in `AuthKey_<ID>.p8`).
- `MACOS_NOTARY_KEY` — the API key's `.p8` private key, as its PEM contents or base64-encoded.

The three `MACOS_NOTARY_*` secrets are read only for `sign-and-notarize`. Every secret the release reads is checked at the start of the publish job, before the compile and any npm publish.

## defaultFormat

**Type:** `string`

Default `--format` for generated commands: `auto`, `json`, `jsonl`, `pretty`, `raw`, `toon`, or `yaml`. Any other value falls back to `auto`.

## defaultErrorFormat

**Type:** `string`

Default output format for errors from generated commands: `auto`, `json`, `jsonl`, `pretty`, `raw`, `toon`, or `yaml`. Any other value falls back to `auto`.

## shellCompletions

**Type:** `boolean`

Whether the generated CLI ships shell completion scripts and the `completion` subcommand that prints them.

**Default:** `true`

## subresourceSeparator

**Type:** `"colon" | "space"`

How the generated CLI spells a command under a nested resource. `colon` joins the resource chain into one command group (`projects:tasks create`), the shape Heroku-style `oclif` CLIs use. `space` nests each subresource as a subcommand of its parent (`projects tasks create`), the shape `gh`, `kubectl`, and `gcloud` use; `--help`, shell completion, man pages, the README, and the smoke test all follow the nested tree. Under `space` a subresource and a method of its parent resource would be the same command if they shared a name, and so would a root method and a top-level resource that has only subresources. A subresource whose accessor clashes with a method is already renamed for every target (`policies-resource`); a clash that survives that, such as a method whose `publicIdentifier` differs from its name, fails generation naming both commands rather than silently renaming either. Top-level resources and root methods are spelled the same either way.

**Default:** `"colon"`

## credentialStore

**Type:** `object`

Interactive sign-in for the generated CLI: a `login` command that acquires a credential the way the SDK's auth scheme demands — prompting for an API key, or running an OAuth flow — and a `logout` that clears it, so later commands need no flag or environment variable.

Generated only when the SDK has an auth scheme, and suppressed by `enabled: false`. Where the credential is kept is `backend`'s call: by default the operating system's own credential store — the Keychain on macOS, the Secret Service on Linux, Credential Manager on Windows — falling back to a `0600` file inside a `0700` directory in the user's state directory when none is reachable. Either way it is keyed by the base URL the command resolves — `--base-url`, else the environment selected with `--environment` or `<PREFIX>_ENVIRONMENT`, else `<PREFIX>_BASE_URL`, else the default — and `login`, `logout` and every request resolve it the same way, so a credential issued against one environment is never sent to another. An explicit flag or environment variable always wins over a stored one.

### enabled

**Type:** `boolean`

Set `false` to generate no credential store at all: no `login`, no `logout`, no stored-credential read. Defaults to **true**, but only applies to a CLI whose SDK has an auth scheme; without one there is nothing to sign in with, so the commands are left out anyway. Use it when your API has auth but you do not want a credential file on your users' machines.

**Default:** `true`

### backend

**Type:** `"auto" | "keychain" | "file"`

Where a credential is kept once `login` obtains it.

`auto` (the default) uses the operating system's own credential store when one is reachable — the Keychain on macOS, the Secret Service on Linux, Credential Manager on Windows — and falls back to a `0600` file under the user's state directory when it is not. That fallback is what keeps the CLI usable on a headless box or in CI, where no keychain daemon is running.

Each store is reached through a tool the operating system ships, and the credential never appears on that tool's command line, where other processes could read it. On macOS the credential is written through `security -i`, which reads its command from standard input. That command holds at most about 4 KB, so a credential too large for it (a sign-in that returns several long tokens) cannot go into the Keychain: `auto` files it instead, and `keychain` fails the sign-in.

`keychain` refuses the fallback: if the OS store cannot be reached the command fails rather than writing a credential to disk. Choose it when an organisation forbids secrets at rest in a file.

`file` never consults the OS store. Choose it when a keychain prompt would break an automated environment.

Even under `keychain`, a small index of *which base URLs are signed in* is written to the state directory. It holds no secret — only the OS store does — and it is what lets `logout --all` find every profile, since a keychain offers no portable way to enumerate them.

**Default:** `"auto"`

### oauth

**Type:** `object`

Identifies this CLI to an OAuth provider, for the browser-redirect flows. Required for `authorizationCode`: the OpenAPI flow object carries the authorization and token URLs but never a `client_id`, because that identifies the *application* rather than the API, so no document can supply it. Without this block those flows are unavailable and `login` falls back to the next usable flow, or to reading a token the user supplies.

#### clientId

**Type:** `string`

**Required**

Public OAuth client id registered for this CLI. It is not a secret (a CLI is a public client, so the browser flow uses PKCE rather than a client secret), and it is written into the generated source. Never configure a confidential secret here: it would ship inside a published npm package.

Set it here, not as a `clientSettings.opts` default: options that carry credentials do not accept defaults.

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

#### revocationUrl

**Type:** `string`

Token revocation endpoint (RFC 7009) that `logout` calls after deleting the local credential. It takes precedence over a `revocation_endpoint` the provider publishes in its metadata: an `openIdConnect` scheme's discovery document, or the RFC 8414 document an `oauth2` scheme's `oauth2MetadataUrl` names.

A relative URL is resolved against the API base URL, the same way the flow's `tokenUrl` is. The endpoint must be HTTPS (a loopback host may use plain HTTP) and must have the same origin as the token endpoint that issued the token, so a token is never sent to another provider; when nothing qualifies, `login` prints a warning and `logout` only deletes the local copy. An authorization server on another host therefore needs an absolute URL, and generation reports a relative one that can never be used as `Config/UnusedRevocationUrl`. The URL chosen at sign-in is saved with the credential and used by later `logout` calls.

`logout` revokes the refresh token, then the access token, sending the stored `client_id` but never a client secret. Revocation is best effort: if it fails, the local credential is still deleted, `logout` still succeeds, and the failure is printed as a warning.

**Constraints:** `minLength: 1`

#### issuer

**Type:** `string`

Issuer identifier of the authorization server, e.g. `https://auth.example.com`, as its metadata publishes it in `issuer`. An `https` URL with no query, fragment, or credentials; plain `http` is accepted only for `localhost`, `127.0.0.1`, and `[::1]`.

When set, a browser sign-in requires the redirect back to the CLI to carry this value as its `iss` parameter ([RFC 9207](https://www.rfc-editor.org/rfc/rfc9207)), and stops without storing anything when it is missing or different. This defends against mix-up attacks. Set it only when your provider sends `iss` on its redirects, or every sign-in fails. It applies to every browser sign-in the CLI offers, OAuth and OpenID Connect alike. An `openIdConnect` scheme whose discovery URL names a different issuer could never sign in, so the CLI leaves that flow out and generation reports `Config/OidcIssuerMismatch`. A device sign-in that reads a scheme's `oauth2MetadataUrl` also checks that document's `issuer` against this value.

OpenID Connect sign-ins verify the issuer from the discovery document even without this setting, and check that an ID token names it, is issued to this `clientId`, is unexpired, and echoes the sign-in's `nonce`. The ID token's signature is not checked, since it comes straight from the token endpoint over TLS, which OpenID Connect Core section 3.1.3.7 allows.

**Constraints:** `pattern: ^(https://[^\s/?#@]+|http://(localhost|127\.0\.0\.1|\[::1\])(:[0-9]+)?)(/[^\s?#]*)?$`

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

## Method commands

**Type:** `object`

Set `cli` on a method in `resources` to include or exclude the command generated for it.

```json
{
  "resources": {
    "users": {
      "methods": {
        "list": {
          "kind": "http",
          "endpoint": "get /users",
          "cli": {
            "enabled": false
          }
        }
      }
    }
  }
}
```

| Property | Description |
| --- | --- |
| `enabled` | Enables or disables CLI command generation for this method. |
