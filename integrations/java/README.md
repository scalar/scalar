### Example

See the `spring-boot/` directory for a complete example Spring Boot application.

## Building

To build the WebJar:

```bash
cd integrations/java/webjar
pnpm local:install
```

To test the Spring Boot integration:

```bash
cd integrations/java/springboot
mvn clean spring-boot:run
```

Then visit `http://localhost:8080/scalar` to see the API reference.
