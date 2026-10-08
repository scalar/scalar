# Spring Boot API documentation

Serve the OpenAPI document that springdoc-openapi generates from your controllers as an interactive API reference, with Scalar's official Spring Boot starter and two lines in `application.properties`.

Spring Boot teams usually get OpenAPI from [springdoc-openapi](https://springdoc.org/), which inspects your `@RestController` classes and serves the document at `/v3/api-docs`. springdoc bundles Swagger UI as its default viewer. Scalar replaces that viewer, not the generator: you keep springdoc for the document and add `com.scalar.maven:scalar-webmvc` (or `scalar-webflux`) for the reference. Both Scalar modules are maintained by Scalar and published to Maven Central.

## Set it up in three steps

<scalar-steps>
<scalar-step title="Generate the OpenAPI document with springdoc">

Use springdoc's API-only starter, which serves the document without bundling Swagger UI:

```xml
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webmvc-api</artifactId>
  <!-- 2.x for Spring Boot 3; check springdoc.org for your Boot version -->
  <version>2.9.1</version>
</dependency>
```

Start the app and the document is at `http://localhost:8080/v3/api-docs` (and `/v3/api-docs.yaml`).

</scalar-step>
<scalar-step title="Add the Scalar starter">

<scalar-tabs>
<scalar-tab title="Maven">

```xml
<dependency>
  <groupId>com.scalar.maven</groupId>
  <artifactId>scalar-webmvc</artifactId>
  <version>0.6.74</version>
</dependency>
```

</scalar-tab>
<scalar-tab title="Gradle">

```gradle
implementation 'com.scalar.maven:scalar-webmvc:0.6.74'
```

</scalar-tab>
</scalar-tabs>

On a reactive stack, use `scalar-webflux` with springdoc's `springdoc-openapi-starter-webflux-api` instead. The Scalar integration requires Java 17 or later and targets Spring Boot 3.x.

</scalar-step>
<scalar-step title="Point Scalar at springdoc">

```properties
# application.properties
scalar.enabled=true
scalar.url=/v3/api-docs
```

Restart and open `http://localhost:8080/scalar`. Set `scalar.path=/docs` to serve it somewhere else, and `scalar.pageTitle` to name the page.

</scalar-step>
</scalar-steps>

## See it live

The Scalar Galaxy demo runs the same renderer on an example API with authentication, schemas, and webhooks. Try search, the code samples, and the "Test Request" button.

<scalar-button
  title="Open the live demo"
  href="https://galaxy.scalar.com/"
  icon="phosphor/regular/rocket-launch">
</scalar-button>

## What you get

**Configuration in Spring's own style.** Everything is a `scalar.*` property in `application.properties` or `application.yml`: `scalar.theme`, `scalar.layout`, `scalar.showSidebar`, `scalar.hideModels`, `scalar.documentDownloadType`, and more. Several OpenAPI documents (for example grouped APIs or v1 and v2) go under `scalar.sources`, with a document switcher in the UI:

```yaml
scalar:
  enabled: true
  sources:
    - url: /v3/api-docs/v1
      title: API v1
      slug: v1
      isDefault: true
    - url: /v3/api-docs/v2
      title: API v2
      slug: v2
```

**Spring Security and Actuator.** The reference is served at a normal path, so a `requestMatchers("/scalar/**").authenticated()` rule protects it. Set `scalar.actuatorEnabled=true` and expose `scalar` to serve it at `/actuator/scalar` next to your other management endpoints. For per-request changes, extend `ScalarWebMvcController` and override `configureProperties`.

**An API client with auth prefilled.** Each operation has a "Test Request" button that opens the [Scalar API client](/products/api-client). For local testing, `scalar.authentication.*` properties can prefill API keys, bearer tokens, or OAuth2 flows for the security schemes springdoc emits. Do not use prefilled secrets in production, because they are visible in the browser.

**SDKs.** The [Scalar SDK generator](/products/sdk-generator) reads the document at `/v3/api-docs`. TypeScript, Python, Go, Java, Kotlin, and CLI targets are generally available, so a Java or Kotlin client for your Spring Boot API is a supported path. Ruby, C#, PHP, Rust, Swift, Dart, and C++ are experimental. Every plan includes one SDK.

**A hosted MCP server.** Scalar can host an [MCP server](/products/agent/mcp) generated from the same OpenAPI document, with OAuth, so AI agents can call the endpoints you expose. Scalar runs it; there is nothing extra to deploy next to your Spring service. Hosted MCP servers are included from the Pro plan.

The Java integration and the renderer are MIT licensed. Hosted docs, SDKs, and MCP servers are on the [pricing page](/pricing).

## Common gotchas

**The page loads but shows no operations.** The browser fetches the document from `scalar.url`, so that path has to be reachable by the same user. If Spring Security protects everything, permit `/v3/api-docs/**` alongside `/scalar/**`, or the reference will get a login redirect instead of JSON.

**The app runs under a context path.** With `server.servlet.context-path=/api`, the document lives at `/api/v3/api-docs`. Set `scalar.url` to the full path.

**Requests from "Test Request" go to the wrong host.** springdoc infers the `servers` entry from the incoming request, which can be wrong behind a proxy. Use `scalar.servers` to list the real base URLs, or fix the forwarded headers so springdoc sees the public host.

**You split the API into groups.** springdoc serves each `GroupedOpenApi` bean at `/v3/api-docs/{group}`. List each one under `scalar.sources`, as in the YAML example above, rather than pointing `scalar.url` at a single group.

## Migrating from Swagger UI or Redoc

springdoc's `springdoc-openapi-starter-webmvc-ui` artifact is the API starter plus Swagger UI. Switching is a dependency swap:

1. Replace `springdoc-openapi-starter-webmvc-ui` with `springdoc-openapi-starter-webmvc-api`. Your `@Operation`, `@Schema`, and `@Tag` annotations and your `springdoc.*` properties are unaffected.
2. Add `scalar-webmvc` and set `scalar.url=/v3/api-docs`.
3. If people bookmarked the old Swagger UI page, keep the `-ui` starter for a release and turn it off later with `springdoc.swagger-ui.enabled=false`, or set `scalar.path` to a path your team already knows.

If you customized the document path with `springdoc.api-docs.path`, use the same value for `scalar.url`. Redoc setups migrate the same way, since Redoc also reads the springdoc document. The [Swagger UI migration guide](/resources/migration/swagger-ui) covers the general steps.

## Frequently asked questions

<scalar-detail title="Does Scalar replace springdoc-openapi?">
No. springdoc generates the OpenAPI document from your controllers. Scalar renders it. You can drop springdoc's Swagger UI by using the `-api` starter instead of the `-ui` starter.
</scalar-detail>

<scalar-detail title="Which Spring Boot and Java versions are supported?">
The current Scalar Java integration requires Java 17 or later and is built for Spring Boot 3.x, with separate modules for WebMVC (`scalar-webmvc`) and WebFlux (`scalar-webflux`).
</scalar-detail>

<scalar-detail title="I use the old com.scalar.maven:scalar artifact. What changed?">
The single `scalar` module was split into `scalar-core`, `scalar-webmvc`, and `scalar-webflux`. Replace `scalar` with `scalar-webmvc` for Spring MVC apps. Your `scalar.*` properties stay the same. Custom controllers now extend `ScalarWebMvcController`.
</scalar-detail>

<scalar-detail title="Can I use Scalar without Spring Boot?">
Yes. `scalar-core` has no framework dependencies apart from Jackson. Build a `ScalarProperties` object, call `ScalarHtmlRenderer.render(properties)`, and serve the HTML from any servlet, JAX-RS resource, or HTTP framework.
</scalar-detail>

<scalar-detail title="How do I secure the API reference?">
Add a Spring Security rule such as `.requestMatchers("/scalar/**").authenticated()`. If you expose it through Actuator, secure `/actuator/scalar` like any other management endpoint.
</scalar-detail>

<scalar-detail title="What does it cost?">
The integration and renderer are free and MIT licensed. Hosted Scalar docs start free; Pro is $150 per month and Business is $600 per month.
</scalar-detail>

## Get started

```gradle
implementation 'com.scalar.maven:scalar-webmvc:0.6.74'
```

Or [create a free Scalar account](https://dashboard.scalar.com/register) to host the reference on its own domain.

## Related

- **Learn:** [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [OpenAPI security schemes](/learn/openapi/openapi-security-schemes)
- **Docs:** [Java and Spring Boot integration reference](/products/api-references/integrations/java)
- **Product:** [Scalar API References](/products/api-references) — the open-source renderer behind the Spring Boot starter
