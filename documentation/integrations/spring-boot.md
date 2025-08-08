# Scalar API Reference for Java Spring Boot

The Scalar WebJar provides automatic integration with Spring Boot applications. It includes auto-configuration that automatically sets up the API reference endpoint.

### Usage

1. Add the WebJar dependency to your `pom.xml`:

```xml
<dependency>
    <groupId>com.scalar.maven</groupId>
    <artifactId>scalar</artifactId>
    <version>0.1.0</version>
</dependency>
```

Maven Central Repository: https://central.sonatype.com/artifact/com.scalar.maven/scalar

1. Configure the API specification URL in your `application.properties`:

```properties
# The URL of your OpenAPI specification
scalar.url=https://my-api-spec.json

# Optional: Custom path (default: /scalar)
scalar.path=/docs

# Optional: Enable/disable (default: true)
scalar.enabled=true
```

3. Access your API reference at `http://localhost:8080/scalar` (or your custom path)

### Configuration Properties

| Property         | Default                                                        | Description                                    |
| ---------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| `scalar.enabled` | `true`                                                         | Enable or disable the Scalar API reference     |
| `scalar.path`    | `/scalar`                                                      | Path where the API reference will be available |
| `scalar.url`     | `https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json` | URL of your OpenAPI document                   |

