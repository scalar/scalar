# Scalar API Reference for Java Spring Boot

The Scalar WebJar provides automatic integration with Spring Boot applications. It includes auto-configuration that automatically sets up the API reference endpoint with comprehensive configuration options, type-safe enums, and authentication support.

## Requirements

- **Spring Boot**: 2.7.0 or higher (3.x recommended)
- **Java**: 11 or higher (17 recommended)
- **Maven**: 3.6+ or **Gradle**: 7.0+

## Migration Guide

### Breaking Changes in Latest Version

The following string-based properties have been replaced with enum-based properties:

- `theme` field and `getTheme()`/`setTheme()` methods
- `layout` field and `getLayout()`/`setLayout()` methods  
- `documentDownloadType` field and `getDocumentDownloadType()`/`setDocumentDownloadType()` methods

The `ScalarSource` class has been moved from a nested class in `ScalarProperties` to a standalone class in the `config` package:

- **Old location**: `com.scalar.maven.webjar.ScalarProperties.ScalarSource`
- **New location**: `com.scalar.maven.webjar.config.ScalarSource`

### Migration Steps

**For Properties File Configuration (No Changes Required):**
If you're using `application.properties` or `application.yml`, no changes are needed. Spring Boot automatically converts string values to enums:

```properties
# This still works exactly the same
scalar.theme=deepSpace
scalar.layout=modern
scalar.documentDownloadType=both
```

**For Programmatic Configuration:**
Replace string-based setters with enum-based setters:

```java
// OLD (will cause compilation errors)
properties.setTheme("deepSpace");
properties.setLayout("modern");
properties.setDocumentDownloadType("both");

// NEW (use enum-based setters)
properties.setTheme(ScalarTheme.DEEP_SPACE);
properties.setLayout(ScalarLayout.MODERN);
properties.setDocumentDownloadType(DocumentDownloadType.BOTH);
```

**For ScalarSource Class Usage:**
Update imports and class references when using ScalarSource programmatically:

```java
// OLD (will cause compilation errors)
import com.scalar.maven.webjar.ScalarProperties.ScalarSource;
ScalarProperties.ScalarSource source = new ScalarProperties.ScalarSource();

// NEW (use the standalone class)
import com.scalar.maven.webjar.config.ScalarSource;
ScalarSource source = new ScalarSource();
```

## Usage

### Maven

Add the [WebJar dependency](https://central.sonatype.com/artifact/com.scalar.maven/scalar) to your `pom.xml`:

```xml
<dependency>
    <groupId>com.scalar.maven</groupId>
    <artifactId>scalar</artifactId>
    <version>0.1.0</version>
</dependency>
```

### Gradle

Add the dependency to your `build.gradle`:

```gradle
dependencies {
    implementation 'com.scalar.maven:scalar:0.1.0'
}
```

Or if using Kotlin DSL (`build.gradle.kts`):

```kotlin
dependencies {
    implementation("com.scalar.maven:scalar:0.1.0")
}
```

### Spring Boot Parent POM

If you're using Spring Boot's parent POM, the dependency management will be handled automatically. If not, you may need to specify the version explicitly.

## Configuration

Configure the OpenAPI document URL in your `application.properties`:

```properties
# Enable/disable the Scalar API reference (default: false)
scalar.enabled=true

# The URL of your OpenAPI document
scalar.url=https://example.com/openapi.json

# Optional: Custom path (default: /scalar)
scalar.path=/docs
```

Or in `application.yml`:

```yaml
scalar:
  url: https://example.com/openapi.json
  path: /docs
  enabled: true
```

Access your API reference at `http://localhost:8080/scalar` (or your custom path)

## Actuator Support

The Scalar integration supports exposing the API reference interface through Spring Boot Actuator endpoints. This is useful when you want to integrate the Scalar UI with your application's monitoring and management infrastructure.

### Enabling Actuator Support

To enable actuator support, add the following configuration:

```properties
# Enable actuator support
scalar.actuatorEnabled=true

# Expose the Scalar endpoint
management.endpoints.web.exposure.include=scalar
```

Or in `application.yml`:

```yaml
scalar:
  actuatorEnabled: true

management:
  endpoints:
    web:
      exposure:
        include: scalar
```

### Accessing the Actuator Endpoint

Once enabled, the Scalar UI will be available at:

```
http://localhost:8080/actuator/scalar
```

### Actuator Security

When using actuator endpoints, it's recommended to secure them, especially in production:

```properties
# Enable actuator security
management.security.enabled=true

# Or with Spring Security
management.endpoints.web.base-path=/actuator
```

With Spring Security:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/actuator/scalar").authenticated()
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().permitAll()
            )
            .formLogin(form -> form.permitAll());
        return http.build();
    }
}
```

## Auto-Configuration

The Scalar integration automatically configures:

- **ScalarController**: Serves the API reference interface
- **ScalarProperties**: Configuration properties binding
- **Static Resources**: JavaScript bundles and HTML templates

### Conditional Configuration

The auto-configuration is conditional on:

- `scalar.enabled=true`
- Spring Boot web starter being present
- No existing `ScalarController` bean

### Excluding Auto-Configuration

To exclude the auto-configuration:

```java
@SpringBootApplication(exclude = ScalarAutoConfiguration.class)
public class MyApplication {
    // ...
}
```

Or in `application.properties`:

```properties
spring.autoconfigure.exclude=com.scalar.maven.webjar.ScalarAutoConfiguration
```

## Configuration Properties

| Property                       | Default                                                              | Description                                                                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scalar.enabled`               | `false`                                                              | Enable or disable the Scalar API reference                                                                                                                       |
| `scalar.path`                  | `/scalar`                                                            | Path where the API reference will be available                                                                                                                   |
| `scalar.url`                   | `https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json` | URL of your OpenAPI document                                                                                                                                     |
| `scalar.actuatorEnabled`       | `false`                                                              | Whether to expose the Scalar UI as an actuator endpoint at /actuator/scalar                                                                                      |
| `scalar.showSidebar`           | `true`                                                               | Whether the sidebar should be shown                                                                                                                              |
| `scalar.hideModels`            | `false`                                                              | Whether models (components.schemas or definitions) should be hidden from the sidebar, search, and content                                                        |
| `scalar.hideTestRequestButton` | `false`                                                              | Whether to hide the "Test Request" button                                                                                                                        |
| `scalar.hideSearch`            | `false`                                                              | Whether to show the sidebar search bar                                                                                                                           |
| `scalar.customCss`             | `null`                                                               | Custom CSS to inject into the API reference                                                                                                                      |
| `scalar.theme`                 | `default`                                                            | The theme to use for the API reference. Can be one of: alternate, default, moon, purple, solarized, bluePlanet, saturn, kepler, mars, deepSpace, laserwave, none |
| `scalar.layout`                | `modern`                                                             | The layout style to use for the API reference. Can be "modern" or "classic"                                                                                      |
| `scalar.darkMode`              | `false`                                                              | Whether dark mode is on or off initially (light mode)                                                                                                            |
| `scalar.hideDarkModeToggle`    | `false`                                                              | Whether to show the dark mode toggle                                                                                                                             |
| `scalar.forceThemeMode`        | `null`                                                               | Force a specific theme mode. Can be "light" or "dark"                                                                                                            |
| `scalar.operationTitleSource`  | `null`                                                               | Source for operation titles. Can be "path" or "summary"                                                                                                          |
| `scalar.tagSorter`             | `null`                                                               | How to sort tags. Can be "alpha" or "order"                                                                                                                     |
| `scalar.operationSorter`       | `null`                                                               | How to sort operations. Can be "alpha" or "method"                                                                                                               |
| `scalar.schemaPropertyOrder`   | `null`                                                               | How to order schema properties. Can be "alpha" or "order"                                                                                                       |
| `scalar.documentDownloadType`  | `both`                                                               | Sets the file type of the document to download. Can be "json", "yaml", "both", or "none"                                                                         |
| `scalar.searchHotKey`          | `null`                                                               | Hotkey for search functionality (e.g., "ctrl+k")                                                                                                                 |
| `scalar.servers`               | `null`                                                               | List of server configurations                                                                                                                                     |
| `scalar.defaultHttpClient`     | `null`                                                               | Default HTTP client configuration                                                                                                                                |

## Authentication Configuration

The Scalar integration supports pre-filling authentication details for API testing and documentation. You can configure API keys, OAuth2 flows, and HTTP authentication schemes to make it easier for developers to test your endpoints.

:::scalar-callout{ type=warning }
**Before you start**: Your OpenAPI document must already include authentication security schemes for Scalar to work with them. Scalar can only pre-fill authentication details for schemes that are already defined in your OpenAPI specification.

**Important**: The security scheme names in your Scalar configuration must exactly match the security scheme names defined in your OpenAPI document. For example, if your OpenAPI document defines a security scheme named `my-oauth-scheme`, your Scalar configuration must use the same name.

The security schemes are added by your OpenAPI generator (SpringDoc OpenAPI, Swagger, or similar). If you don't see authentication options in Scalar, check your OpenAPI generator's documentation to learn how to properly define security schemes.
:::

:::scalar-callout{ type=danger }
**Security Notice**: Pre-filled authentication details are visible in the browser and should **never** be used in production environments. Only use this feature for development and testing.
:::

### API Key Authentication

Configure API key authentication:

```properties
# API Key authentication (security scheme name must match OpenAPI document)
scalar.authentication.apiKey.my-api-key.name=X-API-Key
scalar.authentication.apiKey.my-api-key.value=my-api-key-value

# Preferred security schemes (single scheme - simplified syntax)
scalar.authentication.preferredSecurityScheme=my-api-key

# Or multiple security schemes (list syntax)
# scalar.authentication.preferredSecuritySchemes[0]=my-oauth-scheme
# scalar.authentication.preferredSecuritySchemes[1]=my-api-key
```

### OAuth2 Authentication

Configure OAuth2 with authorization code flow:

```properties
# OAuth2 security scheme (security scheme name must match OpenAPI document)
scalar.authentication.oauth2.my-oauth-scheme.flows.authorizationCode.clientId=my-client-id
scalar.authentication.oauth2.my-oauth-scheme.flows.authorizationCode.clientSecret=my-client-secret
scalar.authentication.oauth2.my-oauth-scheme.flows.authorizationCode.pkce=SHA-256
scalar.authentication.oauth2.my-oauth-scheme.flows.authorizationCode.credentialsLocation=body
scalar.authentication.oauth2.my-oauth-scheme.flows.authorizationCode.redirectUri=http://localhost:8080/callback

# Default OAuth scopes (preselected scopes for this scheme)
scalar.authentication.oauth2.my-oauth-scheme.defaultScopes[0]=read
scalar.authentication.oauth2.my-oauth-scheme.defaultScopes[1]=write

# Preferred security schemes (single scheme - simplified syntax)
scalar.authentication.preferredSecurityScheme=my-oauth-scheme

# Or multiple security schemes (list syntax)
# scalar.authentication.preferredSecuritySchemes[0]=my-oauth-scheme
# scalar.authentication.preferredSecuritySchemes[1]=my-api-key
```

### HTTP Authentication

Configure HTTP Basic or Bearer authentication:

```properties
# HTTP Basic authentication (security scheme name must match OpenAPI document)
scalar.authentication.http.my-basic-auth.username=my-username
scalar.authentication.http.my-basic-auth.password=my-password

# HTTP Bearer authentication (security scheme name must match OpenAPI document)
scalar.authentication.http.my-bearer-auth.token=my-bearer-token
```

### YAML Configuration Example

```yaml
scalar:
  authentication:
    # Security scheme names must match those defined in your OpenAPI document
    # Single security scheme (simplified syntax)
    preferredSecurityScheme: my-oauth-scheme
    
    # Or multiple security schemes (list syntax)
    # preferredSecuritySchemes:
    #   - my-oauth-scheme
    #   - my-api-key
    
    # API Key security schemes
    apiKey:
      my-api-key:
        name: X-API-Key
        value: my-api-key-value
    
    # HTTP security schemes (Basic and Bearer)
    http:
      my-basic-auth:
        username: my-username
        password: my-password
      my-bearer-auth:
        token: my-bearer-token
    
    # OAuth2 security schemes
    oauth2:
      my-oauth-scheme:
        defaultScopes:
          - read
          - write
        flows:
          authorizationCode:
            clientId: my-client-id
            clientSecret: my-client-secret
            pkce: SHA-256
            credentialsLocation: body
            redirectUri: http://localhost:8080/callback
```

## Security Configuration

### Basic Security

By default, the Scalar endpoint is publicly accessible. To secure it with Spring Security:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/scalar/**").authenticated()
                .anyRequest().permitAll()
            )
            .formLogin(form -> form.permitAll());
        return http.build();
    }
}
```

## Example Configuration

Here's an example showing common configuration options:

```properties
# Basic configuration
scalar.url=https://my-api-spec.json
scalar.path=/docs
scalar.enabled=true

# UI customization
scalar.theme=deepSpace
scalar.layout=modern
scalar.darkMode=false
scalar.hideSearch=false
scalar.customCss=body { font-family: 'Arial', sans-serif; }

# Content organization
scalar.operationTitleSource=path
scalar.tagSorter=alpha
scalar.operationSorter=method
scalar.documentDownloadType=both

# Search and navigation
scalar.searchHotKey=ctrl+k
```

Or in `application.yml`:

```yaml
scalar:
  url: https://my-api-spec.json
  path: /docs
  enabled: true
  theme: deepSpace
  layout: modern
  darkMode: false
  hideSearch: false
  customCss: "body { font-family: 'Arial', sans-serif; }"
  operationTitleSource: path
  tagSorter: alpha
  operationSorter: method
  documentDownloadType: both
  searchHotKey: ctrl+k
```

## Multiple OpenAPI Documents (Sources)

You can configure multiple OpenAPI documents using the `sources` configuration. This allows you to display multiple APIs in a single interface with a document switcher.

### Using Sources in application.properties

```properties
# Multiple OpenAPI documents
scalar.sources[0].url=https://api.example.com/v1/openapi.json
scalar.sources[0].title=API v1
scalar.sources[0].slug=api-v1
scalar.sources[0].default=true

scalar.sources[1].url=https://api.example.com/v2/openapi.json
scalar.sources[1].title=API v2
scalar.sources[1].slug=api-v2

scalar.sources[2].url=https://internal.example.com/openapi.json
scalar.sources[2].title=Internal API
scalar.sources[2].slug=internal-api
```

### Using Sources in application.yml

```yaml
scalar:
  sources:
    - url: https://api.example.com/v1/openapi.json
      title: API v1
      slug: api-v1
      default: true
    - url: https://api.example.com/v2/openapi.json
      title: API v2
      slug: api-v2
    - url: https://internal.example.com/openapi.json
      title: Internal API
      slug: internal-api
```

### Source Configuration Options

Each source in the `sources` array supports the following properties:

| Property  | Required | Description                                                                    |
| --------- | -------- | ------------------------------------------------------------------------------ |
| `url`     | Yes      | The URL of the OpenAPI specification                                           |
| `title`   | No       | Display title for the API (defaults to auto-generated)                         |
| `slug`    | No       | URL slug for the API (auto-generated from title if not provided)               |
| `default` | No       | Whether this is the default source (first source is default if none specified) |

When using sources, the `scalar.url` property is ignored. Users can switch between different APIs using the document selector in the interface.

## Type-Safe Configuration

The Scalar integration supports type-safe configuration for better IDE support and compile-time validation.

Spring Boot automatically converts string values to enum types, so you can use string values in `application.properties` or `application.yml` files.

## Available Themes

The `scalar.theme` property supports the following values:

- `alternate` - Alternative color scheme
- `default` - Default theme
- `moon` - Moon-inspired theme
- `purple` - Purple color scheme
- `solarized` - Solarized color scheme
- `bluePlanet` - Blue planet theme
- `saturn` - Saturn-inspired theme
- `kepler` - Kepler space theme
- `mars` - Mars-inspired theme
- `deepSpace` - Deep space theme
- `laserwave` - Laserwave theme
- `none` - No theme (custom styling only)

## Layout Options

The `scalar.layout` property supports:

- `modern` - Modern layout style (default)
- `classic` - Classic layout style

## Document Download Types

The `scalar.documentDownloadType` property supports:

- `both` - Show both JSON and YAML download buttons (default)
- `json` - Show only JSON download button
- `yaml` - Show only YAML download button
- `none` - Hide download buttons completely
