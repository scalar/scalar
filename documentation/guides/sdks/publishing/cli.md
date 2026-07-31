# CLI (npm, binaries, Homebrew)

The CLI target ships in two forms from one source tree. The **npm** package stays a normal Node CLI (with a `bin`), so users can `npm install -g`. The release workflow can also cross-compile **standalone executables** and attach them to the GitHub Release, and update a [Homebrew](https://brew.sh/) tap that installs them. See the [CLI configuration](../cli.md) for options.

These three registry keys are independent, and you can enable any combination:

| Key | What it does | Auth |
| --- | ------------ | ---- |
| `npm` | Publishes the package to npm for `npm install -g`. | OIDC (default) or token |
| `binaries` | Cross-compiles standalone executables and attaches them to the GitHub Release. | none (uses `GITHUB_TOKEN`) |
| `homebrew` | Regenerates a Homebrew formula in a tap repo (it installs those executables). | `HOMEBREW_TAP_TOKEN` |

> [!NOTE]
> `binaries` replaces the older `macos` key. Configs that still set `macos` keep working — it is migrated to `binaries` automatically.

## Enable publishing

```json
{
  "targets": {
    "cli": {
      "binaryName": "acme",
      "publish": {
        "npm": true,
        "homebrew": { "tapRepo": "acme/homebrew-tap" }
      }
    }
  }
}
```

## Publish to npm

The generated CLI is published to [npm](https://www.npmjs.com/) the same way as the [TypeScript SDK](typescript.md): OIDC trusted publishing by default, with an npm token as the fallback. Authenticate one of two ways.

**Trusted publishing (OIDC), recommended.** On [npmjs.com](https://www.npmjs.com/), open the package and add a **Trusted Publisher → GitHub Actions** pointing at your [linked repository](github.md) and the workflow **`release-please.yml`** — the workflow whose inline `publish` job does the automated publish. Nothing is stored in your repo. Add `sdk-release.yml` as a second trusted publisher only if you dispatch it to re-publish a tag by hand.

```json
{ "targets": { "cli": { "publish": { "npm": true } } } }
```

**npm token.** Create a Granular Access or Automation token on npmjs.com, add it as a repository secret named **`NPM_TOKEN`** (see [Adding repository secrets](github.md#adding-repository-secrets)), and switch the target to token auth:

```json
{
  "targets": {
    "cli": {
      "publish": { "npm": { "authMethod": "access-token" } }
    }
  }
}
```

The npm publish step is idempotent (skips a version already on the registry) and publishes scoped packages with `--access public`.

## Standalone binaries

Set `binaries` to attach cross-compiled executables to the GitHub Release. They are built with `bun build --compile`, which embeds the Bun runtime and every dependency, so they run on a machine with no Node and no `node_modules`.

```json
{ "targets": { "cli": { "publish": { "binaries": true } } } }
```

Five platforms are built from a single runner: `linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64`, and `windows-x64`. Unix targets ship as `<binary>-<platform>.tar.gz`, Windows as a `.zip`. Asset names carry no version — the release tag in the download path already does — so `releases/latest/download/<name>` keeps resolving without rewriting your install instructions each release.

The upload uses the built-in `GITHUB_TOKEN`, so no secret is needed, and runs with `--clobber`, so re-runs are idempotent.

## Homebrew

Homebrew installs the executables attached to the GitHub Release, so enabling it also builds and attaches them (the four Unix targets; Windows is only published when you enable `binaries` as well). Because each executable is self-contained, the formula declares no `depends_on` — `brew install` does not pull in Node.

<scalar-steps>
  <scalar-step id="brew-tap" title="Create a tap repository">

Create a repository named `homebrew-<name>` under your org (for example `acme/homebrew-tap`). Point `tapRepo` at it. If you omit `tapRepo`, Scalar uses the conventional `<your-repo>-homebrew` sibling.

  </scalar-step>

  <scalar-step id="brew-token" title="Create a token for the tap">

Create a GitHub token with write access to the tap repository: a fine-grained token scoped to the tap with **Contents: read and write**, or a classic token with the `repo` scope.

  </scalar-step>

  <scalar-step id="brew-secret" title="Add it to the SDK repository">

Add the token as a repository secret named **`HOMEBREW_TAP_TOKEN`** on the **SDK** repository (not the tap). See [Adding repository secrets](github.md#adding-repository-secrets).

  </scalar-step>
</scalar-steps>

You can override the formula's metadata from the `homebrew` entry:

```json
{
  "targets": {
    "cli": {
      "publish": {
        "homebrew": {
          "tapRepo": "acme/homebrew-tap",
          "homepage": "https://acme.com/cli",
          "description": "The Acme command-line interface"
        }
      }
    }
  }
}
```

## How consumers install it

```bash
# npm
npm install -g acme

# Homebrew
brew install acme/tap/acme
```

Or download the executable for their platform straight from the GitHub Release.

## Notes

- The CLI is the only target whose publish job can request `contents: write`, and only when `binaries` or `homebrew` is enabled, because it uploads release assets. An npm-only CLI release stays at the read-only floor.
- The Homebrew formula is rewritten in full each release, so it works on the first publish and is a no-op when nothing changed.
