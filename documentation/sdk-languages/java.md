# Java SDK generator from OpenAPI

Scalar generates a Java SDK from your OpenAPI document with builder-based clients and params, a resource tree that mirrors your API, and an `autoPager()` that walks every page of a list endpoint. **The Java target is generally available.** It runs through the same end-to-end tests as TypeScript, Python, and Go, generating, building, and calling a live server on every change to the generator.

This page covers what the output looks like, the Java conventions it aims for, how it gets to Maven Central, and how it compares with OpenAPI Generator's `java` generator.

## What the generated code looks like

This is the Java quickstart shown for Warp's HR API in the [SDK Generator demo](/products/sdk-generator):

```java
import dev.warp.client.WarpClient;
import dev.warp.models.timeoff.TimeOffListAssignmentsParams;

WarpClient client = WarpClient.builder()
    .apiKey(System.getenv("WARP_API_KEY"))
    .build();

client.timeOff()
    .listAssignments(TimeOffListAssignmentsParams.builder().limit(50).build())
    .autoPager()
    .forEach(assignment ->
        System.out.println(assignment.id() + " " + assignment.policy().name()));
```

The artifact is `dev.warp:warp-java`, added in Gradle with `implementation("dev.warp:warp-java:1.5.0")`. Params are immutable objects built with a builder, accessors read like record components (`assignment.id()`), and the client reads `WARP_API_KEY` from the environment when you do not set `apiKey` yourself.

## Java idioms the generator targets

**Builders for anything with optional fields.** Java has no named arguments, so every client and every params type uses a builder. That keeps call sites readable when an operation has ten optional parameters and you only need two, and it lets new optional fields appear without breaking existing code.

**A resource tree, not a class per tag.** `client.timeOff().listAssignments(...)` follows your API's structure. The generator normalises verbs across resources, so `list`, `retrieve`, and `create` mean the same thing everywhere.

**Sync and async clients.** Alongside the blocking client, the generated SDK includes an async client with the same resource tree that returns `CompletableFuture`, for code that already composes futures.

**Pagination through `autoPager()`.** A list method returns a page type (here `TimeOffListAssignmentsPage`). Call `autoPager()` to stream items across pages, or check `page.hasNextPage()` to step through manually.

**The generator's shared feature set.** The SDK Generator's feature list covers retries on temporary failures (two by default, covering network errors, 408, 409, 429, and 5xx), `Retry-After` support, a 60-second default timeout, and typed errors that expose status, headers, and the parsed body. Check the generated README in your preview repository for the exact class and method names before you document them for users.

## Configure the target

```json
{
  "targets": {
    "java": {
      "reverseDomain": "com.acme",
      "destinations": {
        "production": { "repo": "acme/acme-java" }
      },
      "publish": {
        "maven": { "authMethod": "access-token", "sonatypePlatform": "portal" }
      }
    }
  }
}
```

`reverseDomain` sets both the base Java package and the Maven group id. The artifact id comes from the SDK name. The generated project builds with Gradle (`build.gradle.kts`). See the [Java configuration](/products/sdk-generator/configuration/java) reference.

## Publishing to Maven Central

Maven Central is the most involved registry Scalar publishes to, because it asks for proof of namespace ownership and signed artifacts. The one-time setup:

1. Register and verify your namespace (for example `com.acme`) on the [Sonatype Central Portal](https://central.sonatype.com/). It has to match `reverseDomain`.
2. Generate a Central Portal user token.
3. Create a GPG key, publish the public half to a keyserver, and export the private half.
4. Add four repository secrets: `MAVEN_CENTRAL_USERNAME`, `MAVEN_CENTRAL_PASSWORD`, `MAVEN_GPG_PRIVATE_KEY`, and `MAVEN_GPG_PASSPHRASE`.

Maven Central does not support OIDC trusted publishing, which is why this target uses secrets while npm, PyPI, NuGet, and crates.io do not have to. After that, merging the release pull request runs `./gradlew publishToMavenCentral`, which uploads and releases the deployment. Central coordinates are immutable, so the workflow checks whether the version's POM already exists and skips publishing if it does. Full steps are in [Java and Kotlin publishing](/products/sdk-generator/publishing/java).

## Scalar compared with OpenAPI Generator for Java

OpenAPI Generator's [`java` generator](https://openapi-generator.tech/docs/generators/java) is stable, free, and the most configurable Java client generator around. Its `library` option picks the HTTP stack: `okhttp-gson` by default, plus `native`, `feign`, `retrofit2`, `resttemplate`, `webclient`, `restclient`, `jersey2`, `jersey3`, `vertx`, `apache-httpclient`, and more. It can serialise with Jackson, Gson, or JSON-B. If your organisation standardises on Spring's `WebClient` or OpenFeign, that flexibility is hard to beat, and we would point you there.

The default output follows a configuration-and-API-class pattern. From its [okhttp-gson petstore sample](https://github.com/OpenAPITools/openapi-generator/blob/master/samples/client/petstore/java/okhttp-gson/README.md):

```java
ApiClient defaultClient = Configuration.getDefaultApiClient();
defaultClient.setBasePath("http://petstore.swagger.io:80/v2");

PetApi apiInstance = new PetApi(defaultClient);
// errors surface as ApiException with getCode()
```

| | Scalar Java target | OpenAPI Generator `java` |
| --- | --- | --- |
| Status | Generally available | Stable |
| HTTP stack | One generated client | Choose from more than a dozen libraries |
| Client shape | `WarpClient.builder()`, resource tree | `ApiClient` + `Configuration` + one `*Api` class per tag |
| Params | Immutable builder objects | Method arguments |
| `oneOf` / `anyOf` / `allOf` | Lowered into typed unions; check your schemas in the preview repository | Marked unsupported in the generator's [feature table](https://openapi-generator.tech/docs/generators/java) |
| Pagination | `autoPager()` | Not among the generator's documented options |
| Maven Central release | Signed Gradle publish generated into your repo | Build files generated; release process is yours |

Feature tables can lag the templates, so try your own schemas in both. For the wider decision, read [OpenAPI Generator alternatives](/alternatives/openapi-generator).

## Frequently asked questions

<scalar-detail title="Is the Java SDK generator production ready?">

Yes. Java is generally available, alongside TypeScript, Python, Go, Kotlin, Ruby, and the CLI. It is covered by end-to-end tests that generate, build, and run the SDK against a live server on every generator change.

</scalar-detail>

<scalar-detail title="Does the Java SDK use Maven or Gradle?">

The generated project builds with Gradle. Consumers can depend on the published artifact from either Maven or Gradle, since it is a standard Maven Central artifact.

</scalar-detail>

<scalar-detail title="Why does Maven Central publishing need secrets when npm does not?">

Maven Central does not offer OIDC trusted publishing and requires every artifact to be GPG-signed. The workflow therefore needs a Central Portal token and a signing key stored as repository secrets.

</scalar-detail>

<scalar-detail title="Is there a separate Kotlin SDK?">

Yes, Kotlin is its own generally available target that also publishes to Maven Central. See the [Kotlin SDK generator](/sdk/kotlin) page.

</scalar-detail>

<scalar-detail title="Can I keep hand-written code in the Java SDK?">

Yes. Every rebuild three-way merges the new output with your repository, so edits and added files survive. See [custom code](/products/sdk-generator/custom-code).

</scalar-detail>

<scalar-button
  title="Try the Java target with your OpenAPI document"
  href="https://dashboard.scalar.com/register">
</scalar-button>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [OpenAPI Generator alternatives](/alternatives/openapi-generator)
- **Docs:** [Java configuration](/products/sdk-generator/configuration/java) · [Publishing to Maven Central](/products/sdk-generator/publishing/java)
- **Product:** [SDK Generator](/products/sdk-generator) — preview the Java output from your own OpenAPI document before committing

---

*OpenAPI Generator details are taken from [openapi-generator.tech](https://openapi-generator.tech/docs/generators/java) and the [OpenAPITools/openapi-generator repository](https://github.com/OpenAPITools/openapi-generator) as of September 2026 (release 7.25.0). If something here is out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will fix it.*
