# Scalar API Reference for Java Spring Boot

The Scalar WebJar provides automatic integration with Spring Boot applications. It includes auto-configuration that automatically sets up the API reference endpoint.

## Requirements

- **Spring Boot**: 2.7.0 or higher (3.x recommended)
- **Java**: 11 or higher (17 recommended)
- **Maven**: 3.6+ or **Gradle**: 7.0+

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

# Expose the scalar endpoint
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
| `scalar.enabled`               | `false`                                                               | Enable or disable the Scalar API reference                                                                                                                       |
| `scalar.path`                  | `/scalar`                                                            | Path where the API reference will be available                                                                                                                   |
| `scalar.url`                   | `https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json` | URL of your OpenAPI document                                                                                                                                     |
| `scalar.showSidebar`           | `true`                                                               | Whether the sidebar should be shown                                                                                                                              |
| `scalar.hideModels`            | `false`                                                              | Whether models (components.schemas or definitions) should be hidden from the sidebar, search, and content                                                        |
| `scalar.hideTestRequestButton` | `false`                                                              | Whether to hide the "Test Request" button                                                                                                                        |
| `scalar.darkMode`              | `false`                                                              | Whether dark mode is on or off initially (light mode)                                                                                                            |
| `scalar.hideDarkModeToggle`    | `false`                                                              | Whether to show the dark mode toggle                                                                                                                             |
| `scalar.customCss`             | `null`                                                               | Custom CSS to inject into the API reference                                                                                                                      |
| `scalar.theme`                 | `default`                                                            | The theme to use for the API reference. Can be one of: alternate, default, moon, purple, solarized, bluePlanet, saturn, kepler, mars, deepSpace, laserwave, none |
| `scalar.layout`                | `modern`                                                             | The layout style to use for the API reference. Can be "modern" or "classic"                                                                                      |
| `scalar.hideSearch`            | `false`                                                              | Whether to show the sidebar search bar                                                                                                                           |
| `scalar.documentDownloadType`  | `both`                                                               | Sets the file type of the document to download. Can be "json", "yaml", "both", or "none"                                                                         |
| `scalar.actuatorEnabled`       | `false`                                                              | Whether to expose the Scalar UI as an actuator endpoint at /actuator/scalar                                                                                      |

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

Here's an example showing all available configuration options:

```properties
# Basic configuration
scalar.url=https://my-api-spec.json
scalar.path=/docs
scalar.enabled=true

# UI customization
scalar.showSidebar=true
scalar.hideModels=false
scalar.hideTestRequestButton=false
scalar.hideSearch=false

# Theme and appearance
scalar.darkMode=false
scalar.hideDarkModeToggle=false
scalar.theme=default
scalar.layout=modern

# Document options
scalar.documentDownloadType=both

# Actuator support
scalar.actuatorEnabled=false

# Custom styling
scalar.customCss=body { font-family: 'Arial', sans-serif; }
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
