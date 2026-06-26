# Package Registries

Each target publishes to the registry for its language. This page is the at-a-glance map; follow the link in the table for step-by-step setup, including both authentication options and the exact secrets to add.

For how publishing works end to end, see [Publishing](overview.md).

## Quick reference

| Target | Registry | Default auth | Secrets to add |
| ------ | -------- | ------------ | -------------- |
| [TypeScript](typescript.md) | npm | OIDC | none (OIDC) or `NPM_TOKEN` |
| [Python](python.md) | PyPI | OIDC | none (OIDC) or `PYPI_API_TOKEN` |
| [Go](go.md) | Go modules | Git tag | none |
| [Rust](rust.md) | crates.io | OIDC | none (OIDC) or `CARGO_REGISTRY_TOKEN` |
| [Java and Kotlin](java.md) | Maven Central | Token + GPG | `MAVEN_CENTRAL_USERNAME`, `MAVEN_CENTRAL_PASSWORD`, `MAVEN_GPG_PRIVATE_KEY`, `MAVEN_GPG_PASSPHRASE` |
| [C#](csharp.md) | NuGet | OIDC | `NUGET_USER` (OIDC) or `NUGET_API_KEY` |
| [Ruby](ruby.md) | RubyGems | API key | `RUBYGEMS_API_KEY` |
| [PHP](php.md) | Packagist | Git tag | none |
| [Swift](swift.md) | Swift Package Manager | Git tag | none |
| [Dart](dart.md) | pub.dev | OIDC | none (OIDC) or `PUB_TOKEN` |
| [CLI](cli.md) | npm / Homebrew / macOS | OIDC or token | none (npm OIDC) or `NPM_TOKEN`, plus `HOMEBREW_TAP_TOKEN` for Homebrew |
| C++ | — | — | none (built in CI, no registry) |

## Two ways to authenticate

Most registries support both options. Pick one per target.

- **OIDC trusted publishing** (recommended where available): the `sdk-release.yml` workflow proves its identity to the registry with a short-lived GitHub token, so there is **nothing to store or rotate**. You register the repository and workflow as a trusted publisher on the registry once. This is the default when you set `"<registry>": true`.
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

> [!NOTE]
> Tag-served ecosystems (Go, Swift, Packagist) have no upload step and no secrets. The `vX.Y.Z` Git tag and GitHub Release that Scalar creates on merge are the published version.

## C++

C++ has no universal package registry. The C++ target generates a CI workflow that builds with CMake but no release workflow. Distribute the build artifacts from the GitHub Release however suits your users.
