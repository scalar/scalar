# .NET Integrations

This folder contains the .NET packages for Scalar API documentation.

## SDK prerequisites

All projects under `integrations/dotnet`, including Aspire, Azure Functions, and Swashbuckle, require the .NET SDK **11.0.100-rc.1.26425.128** selected by `global.json`. Installing only the .NET 10 SDK is insufficient: SDK roll-forward does not select an older major version. Install this RC SDK alongside the .NET 8, 9, and 10 runtimes needed by the test targets. Confirm the selected SDK by running `dotnet --version` from this directory.

The ASP.NET Core playground Docker build also intentionally uses the .NET 11 RC1 SDK; its runtime image remains .NET 10. See the [.NET 11 preview release notes](./aspnetcore/docs/dotnet-11.md) for the impact on NuGet updates.

## Structure

- **`shared/`** - Contains `Scalar.Shared` project with shared resources
- **`aspnetcore/`** - Contains `Scalar.AspNetCore` package for ASP.NET Core applications
- **`aspire/`** - Contains `Scalar.Aspire` package for Aspire applications
- **`azure-functions/`** - Contains `Scalar.Azure.Functions` package for Azure Functions applications
- **`aws-lambda/`** - Contains `Scalar.Aws.Lambda` package for AWS Lambda functions fronted by Amazon API Gateway

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

This ensures version consistency across all .NET packages!
