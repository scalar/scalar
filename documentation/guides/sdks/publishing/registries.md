# Package Registries

Each target publishes to the package registry for its language. This page covers the one-time setup each registry needs. For how publishing works end to end, see [Publishing](overview.md).

Wherever a registry supports it, Scalar defaults to **OIDC trusted publishing**: the `sdk-release.yml` workflow proves its identity to the registry with a short-lived GitHub token, so there is no long-lived secret to store. You authorize the repository once on the registry and you are done. Registries without OIDC, and Maven Central (which also signs artifacts), use repository secrets instead.

## Quick reference

| Target | Registry | Default auth | One-time setup |
| ------ | -------- | ------------ | -------------- |
| TypeScript | npm | OIDC | Add a trusted publisher on npmjs.com |
| Python | PyPI | OIDC | Add a trusted publisher on pypi.org |
| Rust | crates.io | OIDC | Add a trusted publisher on crates.io |
| C# | NuGet | OIDC | Add a trusted publisher + `NUGET_USER` secret |
| Dart | pub.dev | OIDC | Enable automated publishing on pub.dev |
| Ruby | RubyGems | API key | Add `RUBYGEMS_API_KEY` secret |
| Java / Kotlin | Maven Central | Token + GPG | Add Central + GPG secrets |
| CLI | Homebrew / macOS | Token | Add `HOMEBREW_TAP_TOKEN` (Homebrew only) |
| Go | Go modules | Git tag | None |
| Swift | Swift Package Manager | Git tag | None |
| PHP | Packagist | Git tag | Connect the repo on packagist.org |
| C++ | — | — | None (built in CI, no registry) |

## Trusted publishing (OIDC)

npm, PyPI, crates.io, NuGet, and pub.dev all support OIDC. The setup is the same shape on each: tell the registry to trust releases from your repository's `sdk-release.yml` workflow.

<scalar-steps>
  <scalar-step id="oidc-publish" title="Reserve the package name">

Publish once manually, or reserve the name, so the package exists on the registry. Trusted publishing attaches to an existing package.

  </scalar-step>

  <scalar-step id="oidc-add" title="Add a trusted publisher">

In the package settings on the registry, add a GitHub Actions trusted publisher pointing at:

- **Owner / repository**: the [repository you linked](github.md) (for example `acme/acme-typescript`)
- **Workflow**: `sdk-release.yml`
- **Environment**: leave blank, unless you set a `releaseEnvironment` (see below)

  </scalar-step>

  <scalar-step id="oidc-merge" title="Merge a build">

That is it. No token is created or stored. The next merged build publishes through the trusted publisher.

  </scalar-step>
</scalar-steps>

> [!NOTE]
> **NuGet** is the one exception: its OIDC login still needs a `NUGET_USER` repository secret (your NuGet username). The API key itself is still minted at publish time, so no key is stored.

### Optional: a GitHub environment

To gate releases behind a GitHub Actions [deployment environment](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment) (for required reviewers or protection rules), set `releaseEnvironment`. The workflow then runs in that environment, and you list the same environment name on the registry's trusted publisher.

```json
{
  "targets": {
    "python": {
      "publish": {
        "pypi": { "authMethod": "oidc", "releaseEnvironment": "production" }
      }
    }
  }
}
```

## Maven Central (Java and Kotlin)

Maven Central does not support OIDC and requires GPG-signed artifacts, so it uses repository secrets. Publishing goes through the [Sonatype Central Portal](https://central.sonatype.com/).

Add these secrets to the linked repository under **Settings → Secrets and variables → Actions**:

| Secret | Value |
| ------ | ----- |
| `MAVEN_CENTRAL_USERNAME` | Central Portal user token username |
| `MAVEN_CENTRAL_PASSWORD` | Central Portal user token password |
| `MAVEN_GPG_PRIVATE_KEY` | ASCII-armored GPG private key used to sign artifacts |
| `MAVEN_GPG_PASSPHRASE` | Passphrase for that GPG key |

```json
{
  "targets": {
    "java": {
      "reverseDomain": "com.acme",
      "publish": { "maven": true }
    }
  }
}
```

The release workflow skips the upload when the version already exists on Maven Central, so re-merges are safe.

## RubyGems

RubyGems publishing uses an API key. Create a key with **push** permission on [rubygems.org](https://rubygems.org/profile/api_keys) and add it as a secret named `RUBYGEMS_API_KEY`. The workflow checks for the version first and skips `gem push` if it is already published.

```json
{
  "targets": {
    "ruby": {
      "gemName": "acme",
      "publish": { "rubygems": true }
    }
  }
}
```

## CLI (Homebrew and macOS)

The CLI target ships a Node-based command-line tool. Its release workflow attaches the built tarball to the GitHub Release, and (optionally) updates a Homebrew tap so users can `brew install` it.

- **`macos`**: attaches the tarball to the GitHub Release. This uses the automatic `GITHUB_TOKEN`, so no secret is needed.
- **`homebrew`**: also regenerates the formula in your tap repository. Add a `HOMEBREW_TAP_TOKEN` secret (a token with write access to the tap repo) and point `tapRepo` at it.

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

> [!NOTE]
> The CLI release workflow is the only one that requests `contents: write`, because it uploads release assets. If `tapRepo` is omitted, Scalar uses the conventional `<your-repo>-homebrew` sibling.

## Tag-served ecosystems (Go, Swift, PHP)

Go modules, Swift Package Manager, and Packagist publish straight from a Git tag, so there is no upload step and no release workflow to set up. The `vX.Y.Z` tag and GitHub Release that Scalar creates on merge *are* the published version.

- **Go**: the module proxy serves the new version from the tag. Make sure the repository is public (or your consumers set `GOPRIVATE`).
- **Swift**: consumers resolve the package from the Git tag with Swift Package Manager. No registry account is needed.
- **PHP**: connect the repository to [packagist.org](https://packagist.org/) once. Packagist watches the repository and picks up new tags automatically (enable its GitHub webhook so updates are instant).

```json
{
  "targets": {
    "go": { "publish": { "go": true } },
    "swift": { "publish": { "swiftpm": true } },
    "php": { "publish": { "packagist": true } }
  }
}
```

## C++

C++ has no universal package registry. The C++ target generates a CI workflow that configures and builds with CMake, but no release workflow. Distribute the build artifacts from the GitHub Release however suits your users.

## Using a token instead of OIDC

If you cannot use trusted publishing, set `authMethod` to `access-token` and add the registry's token as a repository secret. The release workflow reads the token from a secret instead of minting one.

```json
{
  "targets": {
    "typescript": {
      "publish": {
        "npm": { "authMethod": "access-token" }
      }
    }
  }
}
```

## Secret reference

These are the default secret names per registry. They are only needed for token or signing based publishing; OIDC needs none of them (except NuGet's `NUGET_USER`).

| Registry | Secret(s) |
| -------- | --------- |
| npm | `NPM_TOKEN` |
| PyPI | `PYPI_API_TOKEN` |
| crates.io | `CARGO_REGISTRY_TOKEN` |
| NuGet | `NUGET_API_KEY` (token mode), `NUGET_USER` (OIDC mode) |
| pub.dev | `PUB_TOKEN` |
| RubyGems | `RUBYGEMS_API_KEY` |
| Maven Central | `MAVEN_CENTRAL_USERNAME`, `MAVEN_CENTRAL_PASSWORD`, `MAVEN_GPG_PRIVATE_KEY`, `MAVEN_GPG_PASSPHRASE` |
| Homebrew | `HOMEBREW_TAP_TOKEN` |
