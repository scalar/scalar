# C#

> [!NOTE]
> The C# target is experimental.

Add `csharp` under `targets` to generate a .NET SDK package.

```json
{
  "targets": {
    "csharp": {
      "packageName": "Acme.Api",
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
| `skip`          | `boolean`         | Set to `true` to keep the config without generating this target. |
| `destinations`  | `object`          | GitHub destinations for generated output.                        |
| `publish`       | `object`          | NuGet publishing configuration.                                  |
| `publish.nuget` | `boolean\|object` | NuGet registry publishing settings.                              |

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

| Property | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `repo`   | GitHub repository in `owner/name` form.                                     |
| `branch` | Default branch of the destination repository that releases are promoted to. Defaults to `main`. Generated output itself always goes to the fixed `scalar-generated` branch. |

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
