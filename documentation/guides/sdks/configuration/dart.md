# Dart

> [!NOTE]
> The Dart target is experimental.

Add `dart` under `targets` to generate a Dart SDK package.

```json
{
  "targets": {
    "dart": {
      "packageName": "acme",
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-dart"
        }
      },
      "publish": {
        "pub": {
          "authMethod": "oidc",
          "releaseEnvironment": "production",
          "homepage": "https://acme.com",
          "description": "Acme API Dart SDK"
        }
      }
    }
  }
}
```

## Target Options

| Property       | Type              | Description                                                      |
| -------------- | ----------------- | ---------------------------------------------------------------- |
| `packageName`  | `string`          | Dart package name published to pub.dev.                          |
| `version`      | `string`          | Target-specific SDK version override.                            |
| `skip`         | `boolean`         | Set to `true` to keep the config without generating this target. |
| `destinations` | `object`          | GitHub destinations for generated output.                        |
| `publish`      | `object`          | pub.dev publishing configuration.                               |
| `publish.pub`  | `boolean\|object` | pub.dev registry publishing settings.                           |

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

| Property | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `repo`   | GitHub repository in `owner/name` form.                                     |
| `branch` | Branch to push generated output to. Defaults to the repository default.     |

## Publishing

Set `publish.pub` to `true` for default pub.dev publishing, `false` to disable it, or an object to configure the generated publishing workflow. See [Dart publishing](../publishing/dart.md) for the registry setup.

| Property             | Description                                                          |
| -------------------- | ------------------------------------------------------------------- |
| `authMethod`         | Registry authentication mechanism, such as `oidc` or `access-token`. |
| `releaseEnvironment` | Release environment name used by generated publishing workflows.    |
| `homepage`           | Package homepage metadata.                                          |
| `description`        | Package description metadata.                                       |
