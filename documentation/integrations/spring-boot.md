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
# The URL of your OpenAPI document
scalar.url=https://example.com/openapi.json

# Optional: Custom path (default: /scalar)
scalar.path=/docs

# Optional: Enable/disable (default: true)
scalar.enabled=true
```

Or in `application.yml`:

```yaml
scalar:
  url: https://example.com/openapi.json
  path: /docs
  enabled: true
```

Access your API reference at `http://localhost:8080/scalar` (or your custom path)

## Auto-Configuration

The Scalar integration automatically configures:

- **ScalarController**: Serves the API reference interface
- **ScalarProperties**: Configuration properties binding
- **Static Resources**: JavaScript bundles and HTML templates

### Conditional Configuration

The auto-configuration is conditional on:

- `scalar.enabled=true` (default)
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
| `scalar.enabled`               | `true`                                                               | Enable or disable the Scalar API reference                                                                                                                       |
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

# Custom styling
scalar.customCss=body { font-family: 'Arial', sans-serif; }
```

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
