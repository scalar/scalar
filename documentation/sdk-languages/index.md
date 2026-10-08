# SDK generators by language

Scalar generates client libraries in ten programming languages from one OpenAPI document, and each language has its own page explaining what the output looks like, which idioms it follows, and how it gets to that language's package registry.

The pages exist because "an SDK generator" is not one thing. A good Go client takes a `context.Context` first and returns errors as values. A good Python client offers sync and async twins. A good PHP package installs from a Git tag through Packagist, while a Java artifact has to be GPG-signed before Maven Central will accept it. Those differences decide whether developers enjoy using your API, so each page covers them for its language, next to an honest comparison with what OpenAPI Generator produces for the same language.

## Generally available and experimental

TypeScript, Python, Go, Java, and Kotlin are **generally available**, together with the CLI target. They run through end-to-end tests that generate, build, and call a live server on every change to the generator, and they are in production at [Warp](/customers/warp), [Profound](/customers), Dedalus Labs and others. The TypeScript, Python, and Go pages show real code from the public [Warp SDKs](https://github.com/TeamWarp).

C#, PHP, Rust, Swift, Dart, and C++ are **experimental**. They generate working code, and C# sits in the same test matrix as the GA targets, but we would rather talk with you before you ship one of them to customers. The C#, PHP, Rust, and Swift pages say so up front and only show code we can source; where no public sample exists yet, they show configuration and documented behaviour instead.

| Language | Status | Registry | Page |
| --- | --- | --- | --- |
| TypeScript | Generally available | npm | [TypeScript SDK generator](/sdk/typescript) |
| Python | Generally available | PyPI | [Python SDK generator](/sdk/python) |
| Go | Generally available | Go modules | [Go SDK generator](/sdk/go) |
| Java | Generally available | Maven Central | [Java SDK generator](/sdk/java) |
| Kotlin | Generally available | Maven Central | [Kotlin SDK generator](/sdk/kotlin) |
| Ruby | Generally available | RubyGems | [Ruby SDK generator](/sdk/ruby) |
| C# | Experimental | NuGet | [C# SDK generator](/sdk/csharp) |
| PHP | Experimental | Packagist | [PHP SDK generator](/sdk/php) |
| Rust | Experimental | crates.io | [Rust SDK generator](/sdk/rust) |
| Swift | Experimental | Swift Package Manager | [Swift SDK generator](/sdk/swift) |

Dart and C++ are also available as experimental targets; they are covered in the [SDK Generator configuration docs](/products/sdk-generator/configuration/overview) rather than here.

## One document, every language

Every target is driven by the same SDK configuration, so a change to your API regenerates each SDK and opens a pull request in each repository. Resource and method names stay consistent across languages, which keeps your docs and support answers portable. You own the repositories, the package names, and the release history.

## Frequently asked questions

<scalar-detail title="Which SDK languages does Scalar support?">

TypeScript, Python, Go, Java, Kotlin, and Ruby are generally available, along with a CLI target. C#, PHP, Rust, Swift, Dart, and C++ are experimental.

</scalar-detail>

<scalar-detail title="Can I generate SDKs in several languages from one OpenAPI document?">

Yes. Add as many targets as you need to one SDK configuration. Each target gets its own repository, configuration, version history, and build log.

</scalar-detail>

<scalar-detail title="What does experimental mean for an SDK target?">

The target generates working code, but it has not reached the level of end-to-end testing the GA targets have. Talk to us before you ship an experimental SDK to customers.

</scalar-detail>

<scalar-detail title="Can I generate a Terraform provider?">

No. Terraform is not a supported target today.

</scalar-detail>

<scalar-button
  title="Generate an SDK from your OpenAPI document"
  href="https://dashboard.scalar.com/register">
</scalar-button>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [OpenAPI Generator alternatives](/alternatives/openapi-generator)
- **Docs:** [SDK Generator getting started](/products/sdk-generator/getting-started) · [Publishing overview](/products/sdk-generator/publishing/overview)
- **Product:** [SDK Generator](/products/sdk-generator) — idiomatic SDKs in every language your users write, from one OpenAPI document
