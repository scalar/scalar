# CLI (Homebrew and macOS)

The CLI target builds a Node-based command-line tool. There is no single registry for CLIs, so its release workflow attaches the built tarball to the GitHub Release and, optionally, updates a [Homebrew](https://brew.sh/) tap so users can `brew install` it. See the [CLI configuration](../cli.md) for options.

Two registry keys control this:

- **`macos`**: attaches the release tarball to the GitHub Release. Uses the built-in `GITHUB_TOKEN`, so **no secret is needed**.
- **`homebrew`**: also regenerates the formula in a tap repository. Needs a token with write access to that tap.

## Enable publishing

```json
{
  "targets": {
    "cli": {
      "binaryName": "acme",
      "publish": {
        "macos": true,
        "homebrew": { "tapRepo": "acme/homebrew-tap" }
      }
    }
  }
}
```

## Set up the Homebrew tap

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

## How consumers install it

```bash
brew tap acme/tap
brew install acme
```

## Notes

- The CLI release workflow is the only one that requests `contents: write`, because it uploads release assets to the GitHub Release.
- The formula is rewritten in full each release, so it works on the first publish and is a no-op when nothing changed. The release upload uses `--clobber`, so re-runs are idempotent.
- Use `macos` alone if you only want the tarball attached to the GitHub Release without a Homebrew formula.
