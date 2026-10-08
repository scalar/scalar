# Kotlin SDK generator from OpenAPI

Scalar can generate a Kotlin SDK from your OpenAPI document as its own target, separate from Java, built with Gradle and published to Maven Central. **The Kotlin target is generally available.** It runs through the same end-to-end tests as TypeScript, Python, Go, and Java, but we have not yet published a public Kotlin sample. This page is deliberately careful about that: it shows the configuration and the documented behaviour, and it marks clearly where it describes documented behaviour rather than code you can inspect today.

## Kotlin or Java: which target do you need?

Kotlin code can call a Java SDK, so it is fair to ask why a separate target exists. The short answer is that a Java-shaped API feels foreign from Kotlin. Builders stand in for named arguments that Kotlin already has. `Optional` fights with nullable types. A `CompletableFuture` has to be adapted before it composes with coroutines.

A dedicated Kotlin target lets the SDK use the language directly. If your users are mostly Android or Kotlin-first backend developers, generating both targets from the same OpenAPI document costs you one extra target and gives each audience a client written for it. If your users are mostly on the JVM with Java, the [Java SDK generator](/sdk/java) alone is usually enough, and Kotlin developers can still call it.

## What the generator targets for Kotlin

<scalar-callout type="warning" icon="phosphor/regular/warning">
  There is no public Kotlin sample yet, so this section describes the documented behaviour of the target and the conventions it aims for, not copied output. Generate a preview from your own document to read the real code before you commit to anything.
</scalar-callout>

What is documented for the Kotlin target today:

- **The same resource tree as every other target.** Your API's resources and methods (`timeOff.listAssignments`, and so on) come from the same configuration that drives the TypeScript, Python, and Go SDKs, with the same normalised verbs: `list`, `retrieve`, `create`.
- **Pagination through an auto-pager.** The [pagination guide](/products/sdk-generator/pagination) documents `page.autoPager()` for walking every item and `page.hasNextPage()` for stepping through manually, shared with the Java target.
- **The generator's shared feature set.** The SDK Generator's feature list (retries on network errors, 408, 409, 429, and 5xx with two attempts by default, `Retry-After` support, a 60-second default timeout, and typed errors carrying status, headers, and the parsed body) is written for all targets. Confirm how each one surfaces in Kotlin in your preview.
- **Authentication from your security schemes.** API keys, HTTP Basic and Bearer, OAuth 2.0, and OIDC, with an environment variable default for each credential.
- **Docs for humans and agents.** A generated README, an `api.md` of every method, and an Agent Skill in `SKILL.md`.

Beyond that, judge the preview by the things that make a Kotlin client feel native: nullable types for optional fields rather than wrapper objects, named and default arguments where Java would need a builder, and an API that reads naturally from coroutine code. Those are the questions worth asking of any Kotlin SDK, ours included, and the preview repository is where you answer them.

## Configure the target

```json
{
  "targets": {
    "kotlin": {
      "reverseDomain": "com.acme",
      "destinations": {
        "production": { "repo": "acme/acme-kotlin" }
      },
      "publish": {
        "maven": {
          "authMethod": "access-token",
          "sonatypePlatform": "portal",
          "homepage": "https://acme.com",
          "description": "Acme API Kotlin SDK"
        }
      }
    }
  }
}
```

`reverseDomain` is the Kotlin base package and the Maven group id. The artifact id comes from the SDK name. The Java target derives its coordinates the same way, so if you generate both, check the two artifact ids in your previews before the first release. The full option list is in the [Kotlin configuration](/products/sdk-generator/configuration/kotlin) reference.

## Publishing to Maven Central

Kotlin publishes exactly as the Java target does, through the Sonatype Central Portal with Gradle. The setup is one-time:

1. Register and verify your namespace (matching `reverseDomain`) on the [Central Portal](https://central.sonatype.com/).
2. Generate a Central Portal user token.
3. Create a GPG signing key, send the public key to a keyserver, and export the private key.
4. Add `MAVEN_CENTRAL_USERNAME`, `MAVEN_CENTRAL_PASSWORD`, `MAVEN_GPG_PRIVATE_KEY`, and `MAVEN_GPG_PASSPHRASE` as repository secrets.

Maven Central does not support OIDC and requires signed artifacts, which is why secrets are unavoidable here. On merge, the release workflow runs `./gradlew publishToMavenCentral`. Because Central coordinates are immutable, the workflow checks for an existing POM first and skips versions that are already published. Read [Java and Kotlin publishing](/products/sdk-generator/publishing/java) for the details.

Consumers then add the dependency the usual way in `build.gradle.kts`:

```kotlin
dependencies {
    implementation("com.acme:<artifact-id>:1.0.0") // artifact id is derived from your SDK name
}
```

## Scalar compared with OpenAPI Generator for Kotlin

OpenAPI Generator's [`kotlin` generator](https://openapi-generator.tech/docs/generators/kotlin) is stable and very flexible. Its `library` option covers `jvm-okhttp4` (the default), `jvm-ktor`, `jvm-retrofit2`, `jvm-spring-webclient`, `jvm-spring-restclient`, `jvm-volley`, `jvm-vertx`, and `multiplatform`. It serialises with Moshi by default and also supports Gson, Jackson, and `kotlinx_serialization`. The `useCoroutines` option applies to the Retrofit library. If you need Kotlin Multiplatform output or a Ktor client today, OpenAPI Generator is the better choice, and we would say so.

| | Scalar Kotlin target | OpenAPI Generator `kotlin` |
| --- | --- | --- |
| Status | Generally available | Stable |
| HTTP stack | One generated client | Eight library options, including Ktor and Multiplatform |
| Serialisation | Chosen by the generator | Moshi (default), Gson, Jackson, or kotlinx.serialization |
| `oneOf` / `anyOf` / `allOf` | Lowered into typed unions; check your preview | Marked unsupported in the generator's feature table |
| Pagination | `autoPager()` | Not among the generator's documented options |
| Maven Central release | Signed Gradle publish generated into your repo | Build files generated; release process is yours |
| Same config drives other languages | Yes | Separate generator run per language |

The deciding question is usually whether you want one tool keeping several SDKs in step, or maximum control over one Kotlin client. For more on the trade-off, see [OpenAPI Generator alternatives](/alternatives/openapi-generator).

## Frequently asked questions

<scalar-detail title="Is Scalar's Kotlin SDK generator production ready?">

Yes. Kotlin is generally available, alongside TypeScript, Python, Go, Java, Ruby, and the CLI. It is covered by end-to-end tests that generate, build, and run the SDK against a live server on every generator change. There is no public Kotlin sample yet, so generate a preview from your own document to read the real code.

</scalar-detail>

<scalar-detail title="Is the Kotlin SDK just a wrapper around the Java SDK?">

No. Kotlin is a separate target with its own output, even though both build with Gradle and publish to Maven Central under the same group id.

</scalar-detail>

<scalar-detail title="Does the Kotlin target support Kotlin Multiplatform?">

Multiplatform is not a documented option of the Kotlin target today. If you need a Multiplatform client now, OpenAPI Generator's `multiplatform` library is the option to look at.

</scalar-detail>

<scalar-detail title="Can I see generated Kotlin code before paying?">

Yes. Every target gets a preview repository as soon as you add it, and every target is free during your trial. Generate one from your own OpenAPI document and read the code.

</scalar-detail>

<scalar-detail title="Can I publish both a Java and a Kotlin SDK?">

Yes. Add both targets to the same SDK configuration. They share the namespace and signing setup on Maven Central, so the one-time work is done once.

</scalar-detail>

<scalar-button
  title="Preview a Kotlin SDK from your OpenAPI document"
  href="https://dashboard.scalar.com/register">
</scalar-button>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [OpenAPI Generator alternatives](/alternatives/openapi-generator)
- **Docs:** [Kotlin configuration](/products/sdk-generator/configuration/kotlin) · [Publishing to Maven Central](/products/sdk-generator/publishing/java)
- **Product:** [SDK Generator](/products/sdk-generator) — generate Kotlin next to your Java, TypeScript, and Python SDKs from one document

---

*OpenAPI Generator details are taken from [openapi-generator.tech](https://openapi-generator.tech/docs/generators/kotlin) and the [OpenAPITools/openapi-generator repository](https://github.com/OpenAPITools/openapi-generator) as of September 2026 (release 7.25.0). If something here is out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will fix it.*
