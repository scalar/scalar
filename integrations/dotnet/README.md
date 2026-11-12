# .NET Integrations

This folder contains the .NET packages for Scalar API documentation.

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

## Target Frameworks

All packages target `net10.0` and `net11.0`. Building requires the .NET 11 SDK (see `global.json`). We support the .NET versions that Microsoft still supports, and drop a version once it reaches end of support (.NET 8 and .NET 9 both ended on November 10, 2026).

The target framework lists are defined once in the root `Directory.Build.props`, and every multi-targeted project uses them:

| Property                                 | Value             | Used by                                     |
| ---------------------------------------- | ----------------- | ------------------------------------------- |
| `ScalarTargetFrameworks`                 | `net10.0;net11.0` | All packages and their tests                |
| `ScalarMicrosoftOpenApiTargetFrameworks` | `net10.0;net11.0` | `Scalar.AspNetCore.Microsoft` and its tests |

To add a new .NET version:

1. Add the TFM to both properties in `Directory.Build.props`.
2. Add a `Condition="'$(TargetFramework)' == 'netX.0'"` group with the framework-aligned packages (`Microsoft.AspNetCore.Mvc.Testing`, `Microsoft.AspNetCore.OpenApi`) to `Directory.Packages.props`.
3. Bump the SDK in `global.json`, and update `sdk-version` / `aspnetcore-version` in `.github/workflows/integration-builds.yml` and `publish-integrations.yml`. Tests on older TFMs need their ASP.NET Core runtimes installed.

To drop an end-of-support .NET version, remove it from both target framework properties in `Directory.Build.props`, from the framework-aligned package groups in `Directory.Packages.props` and from the CI `aspnetcore-version` list, then delete any `#if`/`#elif` branches that only applied to it.

Version-specific code uses `#if NETX_0_OR_GREATER` (not `#if NETX_0`), so new TFMs pick up the newest code path automatically.

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
