# Scalar API Reference Playground (WebMVC)

This is a simple example Spring Boot application demonstrating how to use the Scalar API Reference integration with Spring WebMVC.

## Prerequisites

Before running the playground, you need to install the required modules to your local Maven repository:

```bash
cd ../..
mvn clean install -DskipTests -Dgpg.skip=true
```

## Running the Application

From the playground directory:

```bash
mvn spring-boot:run
```

Or from the parent directory:

```bash
cd scalar-playground-webmvc
mvn spring-boot:run
```

Then visit [http://localhost:8080/scalar](http://localhost:8080/scalar) to see the API Reference.

## Configuration

The application is configured via `src/main/resources/application.properties`:

```properties
scalar.enabled=true
scalar.url=https://registry.scalar.com/@scalar/apis/galaxy?format=json
scalar.path=/scalar
```

You can customize the configuration by modifying these properties or using `application.yml`.

