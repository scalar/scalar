# .NET Integrations

This folder contains the .NET packages for Scalar API documentation.

## Structure

- **`shared/`** - Contains `Scalar.Shared` project with shared resources
- **`aspnetcore/`** - Contains `Scalar.AspNetCore` package for ASP.NET Core applications
- **`aspire/`** - Contains `Scalar.Aspire` package for .NET Aspire applications

## Shared Code Architecture

The `Scalar.Shared` project is not a standalone package (`IsPackable>false`). Instead, its code is compiled directly into both `Scalar.Aspire` and `Scalar.AspNetCore` assemblies using MSBuild `<Compile Include>` directives:

This approach ensures that changes to shared functionality are automatically included in both packages without requiring separate NuGet package dependencies.

## Changeset Guidelines

When making changes that affect shared code, update all 3 packages in your changeset:

```markdown
---
'@scalar/aspnetcore': minor
'@scalar/aspire': minor
'@scalar/dotnet-shared': minor
---

feat: description of changes
```

This ensures version consistency across all .NET packages.
