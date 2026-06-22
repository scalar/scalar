# C#

> [!NOTE]
> The C# target is experimental.

Add `csharp` under `targets` to generate a .NET SDK package.

```json
{
  "targets": {
    "csharp": {
      "packageName": "Acme.Api",
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-csharp"
        }
      },
      "publish": {
        "nuget": {
          "authMethod": "oidc",
          "releaseEnvironment": "production",
          "homepage": "https://acme.com",
          "description": "Acme API .NET SDK"
        }
      }
    }
  }
}
```

## Target Options

| Property        | Type              | Description                                                      |
| --------------- | ----------------- | ---------------------------------------------------------------- |
| `packageName`   | `string`          | .NET package name.                                               |
| `version`       | `string`          | Target-specific SDK version override.                            |
| `skip`          | `boolean`         | Set to `true` to keep the config without generating this target. |
| `destinations`  | `object`          | GitHub destinations for generated output.                        |
| `publish`       | `object`          | NuGet publishing configuration.                                  |
| `publish.nuget` | `boolean\|object` | NuGet registry publishing settings.                              |

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

| Property | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `repo`   | GitHub repository in `owner/name` form.                                     |
| `branch` | Branch to push generated output to. Defaults to the repository default.     |

## Publishing

Set `publish.nuget` to `true` for default NuGet publishing, `false` to disable it, or an object to configure the generated publishing workflow.

```json
{
  "targets": {
    "csharp": {
      "publish": {
        "nuget": {
          "authMethod": "access-token",
          "releaseEnvironment": "production"
        }
      }
    }
  }
}
```

| Property             | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `authMethod`         | Registry authentication mechanism, such as `oidc` or `access-token`. |
| `releaseEnvironment` | Release environment name used by generated publishing workflows. |
| `homepage`           | Package homepage metadata.                                  |
| `description`        | Package description metadata.                               |
