# Package Registries

Each target publishes to the registry for its language. This page is the at-a-glance map; follow the link in the table for step-by-step setup, including both authentication options and the exact secrets to add.

For how publishing works end to end, see [Publishing](overview.md).

## Quick reference

| Target | `publish` key | Registry | Default auth | Secrets to add |
| ------ | ------------- | -------- | ------------ | -------------- |
| [TypeScript](../configuration/typescript.md#publish) | `npm` | npm | OIDC | none (OIDC) or `NPM_TOKEN` |
| [Python](../configuration/python.md#publish) | `pypi` | PyPI | OIDC | none (OIDC) or `PYPI_API_TOKEN` |
| [Go](../configuration/go.md#publish) | `go` | Go modules | Git tag | none |
| [Rust](../configuration/rust.md#publish) | `cargo` | crates.io | OIDC | none (OIDC) or `CARGO_REGISTRY_TOKEN` |
| [Java and Kotlin](../configuration/java.md#publish) | `maven` | Maven Central | Token + GPG | `MAVEN_CENTRAL_USERNAME`, `MAVEN_CENTRAL_PASSWORD`, `MAVEN_GPG_PRIVATE_KEY`, `MAVEN_GPG_PASSPHRASE` |
| [C#](../configuration/csharp.md#publish) | `nuget` | NuGet | OIDC | `NUGET_USER` (OIDC) or `NUGET_API_KEY` |
| [Ruby](../configuration/ruby.md#publish) | `rubygems` | RubyGems | API key | `RUBYGEMS_API_KEY` |
| [PHP](../configuration/php.md#publish) | `packagist` | Packagist | Git tag | none |
| [Swift](../configuration/swift.md#publish) | `swiftpm` | Swift Package Manager | Git tag | none |
| [Dart](../configuration/dart.md#publish) | `pub` | pub.dev | OIDC | none (OIDC) or `PUB_TOKEN` |
| [CLI](../configuration/cli.md#publish) | `npm`, `binaries`, `homebrew` | npm / GitHub Release / Homebrew | OIDC or token | none (npm OIDC) or `NPM_TOKEN`, plus `HOMEBREW_TAP_TOKEN` for Homebrew |
| C++ | — | — | — | none (built in CI, no registry) |

> [!NOTE]
> Publishing to an internal registry instead — Artifactory, AWS CodeArtifact, Nexus, GitLab, Azure Artifacts — is not in this table, because it does not need a `publish` key. Add a workflow your repository owns; see [Private Registries](private-registries.md) for copy-paste examples.

## Two ways to authenticate

Registries that support OIDC (`npm`, `pypi`, `cargo`, `nuget`, `pub`) default to it. Pick one option per target.

- **OIDC trusted publishing** (the default where available): the `publish` job proves its identity to the registry with a short-lived GitHub token, so there is **nothing to store or rotate**. You register the repository and workflow as a trusted publisher on the registry once. This is what `"<registry>": true` gives you.
- **API token / key**: you create a token on the registry and add it as a [repository secret](github.md#adding-repository-secrets). Switch a target to this with `authMethod: "access-token"`. Maven Central and RubyGems only support this style; Maven Central also requires a GPG key for signing.

```json
{
  "targets": {
    "typescript": {
      "publish": { "npm": { "authMethod": "access-token" } }
    }
  }
}
```

> [!IMPORTANT]
> When you register a trusted publisher, the workflow filename is **`release-please.yml`** — the workflow whose inline `publish` job does the automated publish. `sdk-release.yml` is the manual re-publish path; add it as a second trusted publisher only if you dispatch it.

> [!NOTE]
> Tag-served ecosystems (Swift Package Manager, Packagist) have no upload step and no secrets. The `vX.Y.Z` Git tag and GitHub Release cut when a release pull request merges are the published version. Go is served from its tag too, but still gets a release workflow that warms the public module proxy.

## C++

C++ has no universal package registry. The C++ target generates a CI workflow that builds with CMake but no release workflow. Distribute the build artifacts from the GitHub Release however suits your users.
