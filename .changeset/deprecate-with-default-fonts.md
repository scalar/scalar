---
"@scalar/types": patch
"@scalar/schemas": patch
"@scalar/dotnet-shared": patch
"@scalar/aspnetcore": patch
"@scalar/aspire": patch
"@scalar/aws-lambda": patch
"@scalar/azure-functions": patch
"@scalar/java-integration": patch
"scalar-fastapi": patch
"scalar-ninja": patch
---

Deprecate the `withDefaultFonts` configuration option. Scalar no longer loads web fonts, so the option has no effect. It is still accepted, so existing configurations keep working.
