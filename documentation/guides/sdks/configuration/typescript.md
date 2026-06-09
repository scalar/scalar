# TypeScript

Add `typescript` under `targets` to generate a TypeScript SDK package.

```json
{
  "targets": {
    "typescript": {
      "packageName": "@acme/api",
      "packageManager": "pnpm",
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-typescript",
          "branch": "main"
        }
      },
      "publish": {
        "npm": {
          "authMethod": "oidc",
          "releaseEnvironment": "production",
          "homepage": "https://acme.com",
          "description": "Acme API TypeScript SDK"
        }
      }
    }
  }
}
```

## Target Options

| Property         | Type              | Description                                                      |
| ---------------- | ----------------- | ---------------------------------------------------------------- |
| `packageName`    | `string`          | Import and package name for the generated TypeScript package.    |
| `packageManager` | `string`          | Package manager preference for generated package metadata.       |
| `version`        | `string`          | Target-specific SDK version override.                            |
| `skip`           | `boolean`         | Set to `true` to keep the config without generating this target. |
| `destinations`   | `object`          | GitHub destinations for generated output.                        |
| `publish`        | `object`          | npm publishing configuration.                                    |
| `publish.npm`    | `boolean\|object` | npm registry publishing settings.                                |

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

```json
{
  "targets": {
    "typescript": {
      "destinations": {
        "production": {
          "repo": "acme/acme-typescript",
          "branch": "main"
        }
      }
    }
  }
}
```

| Property | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `repo`   | GitHub repository in `owner/name` form.                                     |
| `branch` | Branch to push generated output to. Defaults to the repository default.     |

## Publishing

Set `publish.npm` to `true` for default npm publishing, `false` to disable it, or an object to configure the generated publishing workflow.

```json
{
  "targets": {
    "typescript": {
      "publish": {
        "npm": {
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
