# .NET Integrations

This folder contains the .NET packages for Scalar API documentation.

## Structure

- **`shared/`** - Contains `Scalar.Shared` project with shared resources
- **`aspnetcore/`** - Contains `Scalar.AspNetCore` package for ASP.NET Core applications
- **`aspire/`** - Contains `Scalar.Aspire` package for .NET Aspire applications

Each project has its own solution file (`.slnx`):
- `Scalar.Shared.slnx` - For working with shared code
- `Scalar.AspNetCore.slnx` - For working with ASP.NET Core package
- `Scalar.Aspire.slnx` - For working with Aspire package

**Use the individual solution files for development**, not the global solution. The global solution is only used for building and testing in CI.

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
