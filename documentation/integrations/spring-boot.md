# Scalar API Reference for Java Spring Boot

The Scalar WebJar provides automatic integration with Spring Boot applications. It includes auto-configuration that automatically sets up the API reference endpoint.

## Usage

Add the [WebJar dependency](https://central.sonatype.com/artifact/com.scalar.maven/scalar) to your `pom.xml`:

```xml
<dependency>
    <groupId>com.scalar.maven</groupId>
    <artifactId>scalar</artifactId>
    <version>0.1.0</version>
</dependency>
```

Configure the OpenAPI document URL in your `application.properties`:

```properties
# The URL of your OpenAPI specification
scalar.url=https://example.com/openapi.json

# Optional: Custom path (default: /scalar)
scalar.path=/docs

# Optional: Enable/disable (default: true)
scalar.enabled=true
```

Access your API reference at `http://localhost:8080/scalar` (or your custom path)

### Configuration Properties

| Property                       | Default                                                        | Description                                                                                                                                                      |
| ------------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scalar.enabled`               | `true`                                                         | Enable or disable the Scalar API reference                                                                                                                       |
| `scalar.path`                  | `/scalar`                                                      | Path where the API reference will be available                                                                                                                   |
| `scalar.url`                   | `https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json` | URL of your OpenAPI document                                                                                                                                     |
| `scalar.showSidebar`           | `true`                                                         | Whether the sidebar should be shown                                                                                                                              |
| `scalar.hideModels`            | `false`                                                        | Whether models (components.schemas or definitions) should be hidden from the sidebar, search, and content                                                        |
| `scalar.hideTestRequestButton` | `false`                                                        | Whether to hide the "Test Request" button                                                                                                                        |
| `scalar.darkMode`              | `false`                                                        | Whether dark mode is on or off initially (light mode)                                                                                                            |
| `scalar.hideDarkModeToggle`    | `false`                                                        | Whether to show the dark mode toggle                                                                                                                             |
| `scalar.customCss`             | `null`                                                         | Custom CSS to inject into the API reference                                                                                                                      |
| `scalar.theme`                 | `default`                                                      | The theme to use for the API reference. Can be one of: alternate, default, moon, purple, solarized, bluePlanet, saturn, kepler, mars, deepSpace, laserwave, none |
| `scalar.layout`                | `modern`                                                       | The layout style to use for the API reference. Can be "modern" or "classic"                                                                                      |
| `scalar.hideSearch`            | `false`                                                        | Whether to show the sidebar search bar                                                                                                                           |
| `scalar.documentDownloadType`  | `both`                                                         | Sets the file type of the document to download. Can be "json", "yaml", "both", or "none"                                                                         |

### Example Configuration

Here's a complete example showing all available configuration options:

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

### Available Themes

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

### Layout Options

The `scalar.layout` property supports:

- `modern` - Modern layout style (default)
- `classic` - Classic layout style

### Document Download Types

The `scalar.documentDownloadType` property supports:

- `json` - Show only JSON download button
- `yaml` - Show only YAML download button
- `both` - Show both JSON and YAML download buttons (default)
- `none` - Hide download buttons completely

