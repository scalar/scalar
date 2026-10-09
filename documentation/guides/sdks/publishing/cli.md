# CLI (npm, binaries, Homebrew)

The CLI target ships in two forms from one source tree. The **npm** package stays a normal Node CLI (with a `bin`), so users can `npm install -g`. The release workflow can also cross-compile **standalone executables** and attach them to the GitHub Release, and update a [Homebrew](https://brew.sh/) tap that installs them. See the [CLI configuration](../configuration/cli.md#publish) for every option.

These three channels are independent, and you can enable any combination:

| Key | What it does | Auth |
| --- | ------------ | ---- |
| `npm` | Publishes the package to npm for `npm install -g`. | OIDC (default) or `NPM_TOKEN` |
| `binaries` | Cross-compiles standalone executables and attaches them to the GitHub Release. | none (uses `GITHUB_TOKEN`) |
| `homebrew` | Writes a Homebrew formula (or cask) for those executables into a tap repository. | `HOMEBREW_TAP_TOKEN` |

`signing` sits beside them but is not a channel: it signs the macOS executables that `binaries` and `homebrew` ship. See [macOS signing](#macos-signing).

> [!NOTE]
> `binaries` replaces the older `macos` key. Configs that still set `macos` keep working: it is migrated to `binaries` automatically, unless `binaries` is also set, in which case `macos` is ignored.

## Enable publishing

```json
{
  "targets": {
    "cli": {
      "binaryName": "acme",
      "packageName": "@acme/cli",
      "publish": {
        "npm": true,
        "binaries": true,
        "homebrew": { "tapRepo": "acme/homebrew-tap" }
      }
    }
  }
}
```

## Publish to npm

The CLI publishes to [npm](https://www.npmjs.com/) exactly like the TypeScript SDK, so follow the [TypeScript publishing guide](typescript.md) with `cli` in place of `typescript`:

- **First release:** npm can only register a trusted publisher on a package that already exists, so a new package publishes its first version with a granular access token stored as **`NPM_TOKEN`** and `authMethod` set to `access-token`.
- **After that:** add a trusted publisher on npm for `release-please.yml` (and `sdk-release.yml` if you re-publish tags by hand), then remove the override so releases use OIDC.

```json
{
  "targets": {
    "cli": {
      "publish": { "npm": { "authMethod": "access-token" } }
    }
  }
}
```

`access` and `tag` work as they do for TypeScript: the package is published with `--access public` unless you set `access`, and stable releases land on `latest` unless you set `tag`. The npm step skips a version that is already on the registry.

## Standalone binaries

Set `binaries` to attach cross-compiled executables to the GitHub Release. They are built with `bun build --compile`, which embeds the Bun runtime and every dependency, so they run on a machine with no Node and no `node_modules`.

```json
{ "targets": { "cli": { "publish": { "binaries": true } } } }
```

Five platforms are built from a single runner: `linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64`, and `windows-x64`. Unix targets ship as `<binary>-<platform>.tar.gz`, Windows as a `.zip`. Asset names carry no version (the release tag in the download path already does), so `releases/latest/download/<binary>-<platform>.tar.gz` keeps resolving without rewriting your install instructions each release.

The upload uses the built-in `GITHUB_TOKEN`, so no secret is needed, and runs with `--clobber`, so re-runs replace the assets.

## Homebrew

Homebrew installs the executables attached to the GitHub Release, so enabling it also builds and attaches them: the four macOS and Linux archives, plus the Windows `.zip` only when `binaries` is on too. Because each executable is self-contained, the formula declares no `depends_on`, and `brew install` does not pull in Node.

The tap is required: `homebrew` is enabled by an object naming its `tapRepo`, and there is no default. Set it up once:

<scalar-steps>
  <scalar-step id="brew-tap" title="Create the tap repository">

Create a **public** repository named `homebrew-<tap>` (for example `acme/homebrew-tap`) and point `tapRepo` at it. Nothing in the generated workflow creates it.

- With the `homebrew-` prefix, users install with `brew install <owner>/<tap>/<formula>`. Any other name still works, but users have to run `brew tap <owner>/<repo> https://github.com/<owner>/<repo>` first, and the generated README says so.
- It has to be public: `brew install` fetches the formula anonymously.
- Its owner does not have to match the SDK repository's owner. A tap shared by several CLIs usually doesn't.

  </scalar-step>

  <scalar-step id="brew-token" title="Create a token for the tap">

Create a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) with:

- **Resource owner:** the tap's owner (the user or organization), not the SDK repository's owner if they differ.
- **Repository access:** *Only select repositories* → the tap.
- **Permissions:** **Contents: Read and write**, plus **Pull requests: Read and write** if you set `pullRequest`. **Metadata: Read-only** is added automatically; nothing else is needed.

A classic token with the `repo` scope also works (`public_repo` is enough for a public tap), but it can reach every repository its account can.

The token never exceeds its own account's access, so that account needs write access to the tap. A fine-grained token owned by an organization member may need an organization owner's approval before it works.

  </scalar-step>

  <scalar-step id="brew-secret" title="Add it to the SDK repository">

Add the token as a secret named **`HOMEBREW_TAP_TOKEN`** on the **SDK** repository (the one with the release workflows), not the tap. See [Adding repository secrets](github.md#adding-repository-secrets). An existing `HOMEBREW_TAP_GITHUB_TOKEN` secret is read when `HOMEBREW_TAP_TOKEN` is unset. If the publish job runs in a GitHub environment (see [One release environment](#one-release-environment)), an environment secret of the same name overrides the repository one.

  </scalar-step>

  <scalar-step id="brew-protection" title="Leave the push a way through">

By default each release commits straight to the tap's default branch. If that branch is protected by a rule that requires a pull request, a review, or a status check, either add a bypass for the token's account or set `pullRequest`, so the release opens a pull request instead. Nothing merges that pull request for you: `brew install` keeps serving the previous version until someone does.

  </scalar-step>
</scalar-steps>

> [!WARNING]
> A fine-grained token expires. An expired one fails the release when it clones the tap, after the version has already been published to every other channel, so the fix is a re-run. Renew it ahead of time.

The SDK repository's own release assets also have to be downloadable anonymously: the Homebrew step downloads the executables it just uploaded with a plain `curl` and pins those URLs into the formula. A private SDK repository fails the release at that step.

### Formula options

```json
{
  "targets": {
    "cli": {
      "publish": {
        "homebrew": {
          "tapRepo": "acme/homebrew-tap",
          "homepage": "https://acme.com/cli",
          "description": "Command-line interface for the Acme API",
          "pullRequest": true
        }
      }
    }
  }
}
```

- **`homepage`** defaults to the SDK repository. **`description`** defaults to `Command-line interface for <binary>`. `brew audit` rejects a description that starts with the package name, an article, or a lowercase letter.
- **`pullRequest`** opens a pull request against the tap instead of committing to its default branch.
- **`cask`** publishes a cask (`Casks/<formula>.rb`) instead of a formula, installed with `brew install --cask`. It requires `signing.macos` set to `sign-and-notarize`, because Homebrew quarantines what a cask downloads.
- **`replaceCask`** retires a same-named cask the tap already ships, moving its users to this formula. **`replaceFormula`** does the reverse when `cask` is on.

The formula (or cask) is rewritten in full each release, so the first release needs nothing in the tap beforehand. A release that changes nothing skips the commit.

## macOS signing

Set `signing.macos` to sign the `darwin-*` executables. Without it they ship unsigned.

```json
{ "targets": { "cli": { "publish": { "binaries": true, "signing": { "macos": "sign-and-notarize" } } } } }
```

- **`sign`** signs them with your Developer ID certificate. That is enough for anything installed without a browser, such as a Homebrew formula or a `curl` download.
- **`sign-and-notarize`** also submits them to Apple's notary service, so an archive downloaded in a browser opens without a Gatekeeper warning. A Homebrew cask requires it.

The release reads these repository secrets:

| Secret | Value |
| ------ | ----- |
| `MACOS_SIGN_P12` | The `Developer ID Application` certificate and private key as a base64-encoded `.p12` bundle |
| `MACOS_SIGN_PASSWORD` | The bundle's password (may be empty) |
| `MACOS_NOTARY_ISSUER_ID` | App Store Connect API key issuer ID (`sign-and-notarize` only) |
| `MACOS_NOTARY_KEY_ID` | The API key's ID, the `<ID>` in `AuthKey_<ID>.p8` (`sign-and-notarize` only) |
| `MACOS_NOTARY_KEY` | The API key's `.p8` private key, as PEM or base64 (`sign-and-notarize` only) |

The signing secrets are checked at the start of the publish job, before anything is compiled or published. Other channels' credentials, such as `NPM_TOKEN` and `HOMEBREW_TAP_TOKEN`, are first used at the step that needs them. The npm package is unaffected: it contains no compiled executable.

## One release environment

All three channels publish from one job, and it runs in a single GitHub environment: the first `releaseEnvironment` any `publish` entry sets, in the order the entries appear (a legacy `macos` entry counts as a `binaries` entry placed last, and is ignored when `binaries` is also set). That environment is the one to register on npm's trusted publisher, and its secrets override repository secrets of the same name for every channel, `HOMEBREW_TAP_TOKEN` and the signing secrets included. Set `releaseEnvironment` once, on the first entry, rather than a different one per channel.

## How consumers install it

```bash
# npm
npm install -g @acme/cli

# Homebrew
brew install acme/tap/acme
```

Or download the executable for their platform straight from the GitHub Release.

## Notes

- The CLI is the only target whose publish job can request `contents: write`, and only when `binaries` or `homebrew` is enabled, because it uploads release assets. An npm-only CLI release stays read-only.
