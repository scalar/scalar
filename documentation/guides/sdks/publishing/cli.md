# CLI (npm, Homebrew, macOS)

The CLI target builds a Node-based command-line tool. Because it is a normal npm package (with a `bin`), the most common way to ship it is **npm**, so users can `npm install -g`. The release workflow can also attach the built tarball to the GitHub Release and update a [Homebrew](https://brew.sh/) tap. See the [CLI configuration](../cli.md) for options.

These three registry keys are independent, and you can enable any combination:

| Key | What it does | Auth |
| --- | ------------ | ---- |
| `npm` | Publishes the package to npm for `npm install -g`. | OIDC (default) or token |
| `macos` | Attaches the built tarball to the GitHub Release. | none (uses `GITHUB_TOKEN`) |
| `homebrew` | Regenerates a Homebrew formula in a tap repo (it installs the npm tarball). | `HOMEBREW_TAP_TOKEN` |

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

**Trusted publishing (OIDC), recommended.** On [npmjs.com](https://www.npmjs.com/), open the package and add a **Trusted Publisher → GitHub Actions** pointing at your [linked repository](github.md) and the workflow `sdk-release.yml`. Nothing is stored in your repo.

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

## Homebrew

Homebrew installs the tarball attached to the GitHub Release, so enabling it also attaches the asset.

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

## macOS

Set `macos` to attach the built tarball to the GitHub Release without a Homebrew formula. It uses the built-in `GITHUB_TOKEN`, so no secret is needed.

```json
{ "targets": { "cli": { "publish": { "macos": true } } } }
```

## How consumers install it

```bash
# npm
npm install -g acme

# Homebrew
brew install acme/tap/acme
```

## Notes

- The CLI release workflow is the only one that requests `contents: write`, because it can upload release assets.
- The Homebrew formula is rewritten in full each release, so it works on the first publish and is a no-op when nothing changed. The release upload uses `--clobber`, so re-runs are idempotent.
