---
"@scalar/aspnetcore": patch
"@scalar/aspire": patch
"@scalar/aws-lambda": patch
"@scalar/azure-functions": patch
"@scalar/java-integration": patch
---

Update .NET and Java dependencies while retaining .NET 10/11 and Java 17 support. Keep OpenAPI and Swashbuckle versions aligned with each .NET target, use the current Aspire and native test tooling, and verify both Spring Boot 3 and 4 integrations. Run the Spring Boot 4-built WebMVC and WebFlux release JARs on Spring Boot 3 before publishing.

The published .NET packages now require these minimum dependency versions:

- Scalar.Aspire: Aspire.Hosting 17.0.0 and MessagePack 3.1.12. Consumers using Aspire 13 must upgrade to Aspire 17.
- Scalar.Aws.Lambda: Microsoft.Extensions.DependencyInjection.Abstractions 11.0.0 and Microsoft.Extensions.Options 11.0.0 on both .NET 10 and .NET 11.
- Scalar.AspNetCore.Swashbuckle: Swashbuckle.AspNetCore.SwaggerGen 11.0.1 and Microsoft.OpenApi 3.11.1 on .NET 11; .NET 10 uses Swashbuckle.AspNetCore.SwaggerGen 10.3.1 and Microsoft.OpenApi 2.13.1.
