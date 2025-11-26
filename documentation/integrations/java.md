# Scalar API Reference for Java

The Scalar Java integration provides an easy way to render beautiful API References based on OpenAPI documents in Java applications.

## Module Architecture

The Scalar Java integration consists of **3 separate modules**:

- **`scalar-core`** - Framework-agnostic core module with no dependencies (except Jackson for JSON serialization). Can be used anywhere to display a Scalar API Reference.
- **`scalar-webmvc`** - Spring Boot WebMVC integration module
- **`scalar-webflux`** - Spring Boot WebFlux integration module

:::scalar-callout{ type=warning }
**Breaking Change**: Previously, there was only a single `scalar` module that was compatible with Spring Boot MVC. The integration has been restructured into 3 separate modules to support both WebMVC and WebFlux, and to provide a framework-agnostic core module.

**Migration**: If you were using the old `scalar` module, replace it with `scalar-webmvc` for Spring Boot WebMVC applications. See the [Migration Guide](#migration-guide) below for details.
:::

## Migration Guide

If you were using the previous single `scalar` module, follow these steps to migrate:

### Step 1: Update Dependencies

**Maven:**
```xml
<!-- Remove the old dependency -->
<!-- <dependency>
  <groupId>com.scalar.maven</groupId>
  <artifactId>scalar</artifactId>
  <version>X.X.X</version>
</dependency> -->

<!-- Add the new WebMVC module -->
<dependency>
  <groupId>com.scalar.maven</groupId>
  <artifactId>scalar-webmvc</artifactId>
  <version>X.X.X</version>
</dependency>
```

**Gradle:**
```gradle
// Remove the old dependency
// implementation 'com.scalar.maven:scalar:X.X.X'

// Add the new WebMVC module
implementation 'com.scalar.maven:scalar-webmvc:X.X.X'
```

### Step 2: Configuration

Your existing configuration in `application.properties` or `application.yml` remains the same. The property names and structure are unchanged.

### Step 3: Custom Controllers (if applicable)

If you had custom controller implementations, you'll need to update them to extend `ScalarWebMvcController` instead of the old controller class. See the [Custom Controllers](#custom-controllers) section below.

## Basic Setup

### Spring Boot WebMVC

1. **Add the dependency**

**Maven:**
```xml
<dependency>
  <groupId>com.scalar.maven</groupId>
  <artifactId>scalar-webmvc</artifactId>
  <version>X.X.X</version>
</dependency>
```

**Gradle:**
```gradle
implementation 'com.scalar.maven:scalar-webmvc:X.X.X'
```

2. **Configure your application**

Add the following to your `application.properties`:

```properties
scalar.enabled=true
scalar.url=https://your-api-spec.json
```

Or in `application.yml`:

```yaml
scalar:
  enabled: true
  url: https://your-api-spec.json
```

3. **Access the API Reference**

Navigate to `/scalar` (or your custom path) to view your API Reference.

### Spring Boot WebFlux

1. **Add the dependency**

**Maven:**
```xml
<dependency>
  <groupId>com.scalar.maven</groupId>
  <artifactId>scalar-webflux</artifactId>
  <version>X.X.X</version>
</dependency>
```

**Gradle:**
```gradle
implementation 'com.scalar.maven:scalar-webflux:X.X.X'
```

2. **Configure your application**

Add the following to your `application.properties`:

```properties
scalar.enabled=true
scalar.url=https://your-api-spec.json
```

Or in `application.yml`:

```yaml
scalar:
  enabled: true
  url: https://your-api-spec.json
```

3. **Access the API Reference**

Navigate to `/scalar` (or your custom path) to view your API Reference.

## Configuration Options

The Scalar integration can be configured via Spring Boot properties. All configuration properties use the `scalar` prefix.

### Basic Configuration

```properties
# Enable/disable Scalar (default: true)
scalar.enabled=true

# OpenAPI specification URL
scalar.url=https://api.example.com/openapi.json

# Custom path for the API Reference (default: /scalar)
scalar.path=/docs

# Page title (default: "Scalar API Reference")
scalar.pageTitle=My API Documentation
```

### Multiple OpenAPI Documents

You can configure multiple OpenAPI documents using the `sources` property:

```yaml
scalar:
  enabled: true
  sources:
    - url: https://api.example.com/v1/openapi.json
      title: Production API
      slug: v1
      isDefault: true
    - url: https://api.example.com/v2/openapi.json
      title: Beta API
      slug: v2
```

Or in `application.properties`:

```properties
scalar.sources[0].url=https://api.example.com/v1/openapi.json
scalar.sources[0].title=Production API
scalar.sources[0].slug=v1
scalar.sources[0].isDefault=true

scalar.sources[1].url=https://api.example.com/v2/openapi.json
scalar.sources[1].title=Beta API
scalar.sources[1].slug=v2
```

### UI Customization

```properties
# Theme (default, moon, purple, solarized, bluePlanet, saturn, kepler, mars, deepSpace, laserwave, alternate, none)
scalar.theme=moon

# Layout (modern, classic)
scalar.layout=modern

# Show/hide sidebar (default: true)
scalar.showSidebar=true

# Hide models from sidebar and search (default: false)
scalar.hideModels=false

# Hide test request button (default: false)
scalar.hideTestRequestButton=false

# Dark mode (default: false)
scalar.darkMode=true

# Hide dark mode toggle (default: false)
scalar.hideDarkModeToggle=false

# Hide search bar (default: false)
scalar.hideSearch=false

# Custom CSS
scalar.customCss=body { background: #f0f0f0; }
```

### Server Configuration

Override or add servers for the API Reference:

```yaml
scalar:
  servers:
    - url: https://api.example.com
      description: Production Server
    - url: https://staging-api.example.com
      description: Staging Server
```

### Proxy Configuration

Configure a proxy URL for API requests:

```properties
scalar.proxyUrl=https://api-gateway.company.com
```

### Authentication

Scalar allows you to pre-configure authentication details for your API, making it easier for developers to test your endpoints.

:::scalar-callout{ type=warning }
**Before you start**: Your OpenAPI document must already include authentication security schemes for Scalar to work with them. Scalar can only pre-fill authentication details for schemes that are already defined in your OpenAPI specification.
:::

:::scalar-callout{ type=danger }
**Security Notice**: Pre-filled authentication details are visible in the browser and should **never** be used in production environments. Only use this feature for development and testing.
:::

#### API Key Authentication

```yaml
scalar:
  authentication:
    preferredSecurityScheme: ApiKey
    apiKey:
      ApiKey:
        name: X-API-Key
        value: sk-demo-key-12345
```

#### Bearer Token Authentication

```yaml
scalar:
  authentication:
    preferredSecurityScheme: BearerAuth
    http:
      BearerAuth:
        token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Basic Authentication

```yaml
scalar:
  authentication:
    preferredSecurityScheme: BasicAuth
    http:
      BasicAuth:
        username: demo-user
        password: demo-password
```

#### OAuth2 Authentication

Scalar provides support for all OAuth2 flow types. Configure them in the `flows` section of your OAuth2 security scheme.

##### Authorization Code Flow

```yaml
scalar:
  authentication:
    preferredSecurityScheme: OAuth2
    oauth2:
      OAuth2:
        flows:
          authorizationCode:
            clientId: scalar-demo-client
            clientSecret: scalar-demo-secret
            authorizationUrl: https://auth.example.com/oauth2/authorize
            tokenUrl: https://auth.example.com/oauth2/token
            pkce: sha256
            selectedScopes:
              - read
              - write
              - admin
        defaultScopes:
          - read
          - write
```

##### Client Credentials Flow

```yaml
scalar:
  authentication:
    preferredSecurityScheme: OAuth2
    oauth2:
      OAuth2:
        flows:
          clientCredentials:
            clientId: service-client-12345
            clientSecret: service-secret-67890
            tokenUrl: https://auth.example.com/oauth2/token
            selectedScopes:
              - api.read
              - api.write
```

##### Password Flow

```yaml
scalar:
  authentication:
    preferredSecurityScheme: OAuth2
    oauth2:
      OAuth2:
        flows:
          password:
            clientId: password-client
            clientSecret: password-secret
            tokenUrl: https://auth.example.com/oauth2/token
            username: demo@example.com
            password: demo-password-123
            selectedScopes:
              - profile
              - email
```

##### Implicit Flow

```yaml
scalar:
  authentication:
    preferredSecurityScheme: OAuth2
    oauth2:
      OAuth2:
        flows:
          implicit:
            clientId: spa-client-abc123
            authorizationUrl: https://auth.example.com/oauth2/authorize
            selectedScopes:
              - openid
              - profile
              - email
```

##### Multiple OAuth2 Flows

You can configure multiple flows for the same OAuth2 security scheme:

```yaml
scalar:
  authentication:
    preferredSecurityScheme: OAuth2
    oauth2:
      OAuth2:
        flows:
          authorizationCode:
            clientId: web-client-12345
            authorizationUrl: https://auth.example.com/oauth2/authorize
            tokenUrl: https://auth.example.com/oauth2/token
          clientCredentials:
            clientId: service-client-67890
            clientSecret: service-secret
            tokenUrl: https://auth.example.com/oauth2/token
        defaultScopes:
          - read
          - write
```

### Advanced Configuration

```properties
# Default HTTP client for code samples (default: shell/curl)
scalar.defaultHttpClient.target=shell
scalar.defaultHttpClient.client=curl

# Expand all tags by default (default: false)
scalar.defaultOpenAllTags=true

# Expand all model sections (default: false)
scalar.expandAllModelSections=true

# Expand all response sections (default: false)
scalar.expandAllResponses=true

# Base server URL to prefix relative OpenAPI server URLs
scalar.baseServerUrl=https://api.example.com

# Persist authentication in local storage (default: false)
scalar.persistAuth=true

# Enable telemetry (default: true)
scalar.telemetry=false

# Order required properties first (default: true)
scalar.orderRequiredPropertiesFirst=true

# Show operation ID (default: false)
scalar.showOperationId=true

# Hide client button (default: false)
scalar.hideClientButton=false

# Favicon path
scalar.favicon=favicon.svg

# Use default fonts (Inter and JetBrains Mono from CDN) (default: true)
scalar.withDefaultFonts=true
```

## Custom Controllers

Both `ScalarWebMvcController` and `ScalarWebFluxController` can be extended to customize behavior. The controllers use `@ConditionalOnMissingBean`, so you can provide your own implementation.

### WebMVC Custom Controller

```java
import com.scalar.maven.webmvc.ScalarWebMvcController;
import com.scalar.maven.core.ScalarProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CustomScalarController extends ScalarWebMvcController {
    
    @Override
    protected ScalarProperties configureProperties(
            ScalarProperties properties, 
            HttpServletRequest request) {
        // Customize properties based on request
        if (request.isUserInRole("ADMIN")) {
            properties.setPageTitle("Admin API Documentation");
        }
        
        // Modify other properties as needed
        properties.setDarkMode(true);
        
        return properties;
    }
}
```

### WebFlux Custom Controller

```java
import com.scalar.maven.webflux.ScalarWebFluxController;
import com.scalar.maven.core.ScalarProperties;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CustomScalarController extends ScalarWebFluxController {
    
    @Override
    protected ScalarProperties configureProperties(
            ScalarProperties properties, 
            ServerHttpRequest request) {
        // Customize properties based on request
        String path = request.getPath().value();
        if (path.contains("/admin")) {
            properties.setPageTitle("Admin API Documentation");
        }
        
        // Modify other properties as needed
        properties.setDarkMode(true);
        
        return properties;
    }
}
```

The `configureProperties` method is called before the `ScalarProperties` are serialized to JSON and rendered. This allows you to dynamically modify the configuration based on the incoming request. Each request receives a fresh instance of `ScalarProperties`, so you can safely modify it without affecting other concurrent requests.

## Actuator Support

Scalar can be exposed as a Spring Boot Actuator endpoint. This is useful for production environments where you want to expose the API Reference through the actuator management endpoints.

### Enable Actuator Endpoint

```properties
# Enable actuator endpoint
scalar.actuatorEnabled=true

# Configure actuator exposure (if using Spring Boot Actuator)
management.endpoints.web.exposure.include=scalar,health
```

The Scalar UI will be available at `/actuator/scalar` when actuator is enabled.

## Using scalar-core Standalone

The `scalar-core` module is framework-agnostic and can be used in any Java application, not just Spring Boot. It has no framework dependencies (only Jackson for JSON serialization).

### Maven Dependency

```xml
<dependency>
  <groupId>com.scalar.maven</groupId>
  <artifactId>scalar-core</artifactId>
  <version>X.X.X</version>
</dependency>
```

### Gradle Dependency

```gradle
implementation 'com.scalar.maven:scalar-core:X.X.X'
```

### Usage Example

```java
import com.scalar.maven.core.ScalarProperties;
import com.scalar.maven.core.ScalarHtmlRenderer;

// Create and configure properties
ScalarProperties properties = new ScalarProperties();
properties.setUrl("https://api.example.com/openapi.json");
properties.setPath("/docs");
properties.setPageTitle("My API Documentation");
properties.setTheme(ScalarTheme.MOON);
properties.setLayout(ScalarLayout.MODERN);

// Render HTML
String html = ScalarHtmlRenderer.render(properties);

// Serve the HTML in your application
// (e.g., via a servlet, JAX-RS endpoint, etc.)
```

You can then serve the rendered HTML through any HTTP framework or servlet container of your choice.

## Additional Information

For all available configuration properties and their default values, check out the [`ScalarProperties`](https://github.com/scalar/scalar/blob/main/integrations/java/scalar-core/src/main/java/com/scalar/maven/core/ScalarProperties.java) class.

The Scalar Java integration requires Java 17 or higher and is compatible with Spring Boot 3.x.

