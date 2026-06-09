# Python

Add `python` under `targets` to generate a Python SDK package.

```json
{
  "targets": {
    "python": {
      "packageName": "acme_api",
      "projectName": "acme-api",
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-python"
        }
      },
      "publish": {
        "pypi": {
          "authMethod": "oidc",
          "releaseEnvironment": "production",
          "homepage": "https://acme.com",
          "description": "Acme API Python SDK"
        }
      }
    }
  }
}
```

## Target Options

| Property      | Type              | Description                                                      |
| ------------- | ----------------- | ---------------------------------------------------------------- |
| `packageName` | `string`          | Python import package name, such as `acme_api`.                  |
| `projectName` | `string`          | PyPI distribution name, such as `acme-api`. Defaults to `packageName`. |
| `version`     | `string`          | Target-specific SDK version override.                            |
| `skip`        | `boolean`         | Set to `true` to keep the config without generating this target. |
| `destinations` | `object`          | GitHub destinations for generated output.                        |
| `publish`     | `object`          | PyPI publishing configuration.                                   |
| `publish.pypi` | `boolean\|object` | PyPI registry publishing settings.                               |

## Package Names

Use `packageName` for the module users import and `projectName` for the package users install.

```json
{
  "targets": {
    "python": {
      "packageName": "acme_api",
      "projectName": "acme-api"
    }
  }
}
```

Users install the package with `pip install acme-api` and import it with `import acme_api`.

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

| Property | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `repo`   | GitHub repository in `owner/name` form.                                     |
| `branch` | Branch to push generated output to. Defaults to the repository default.     |

## Publishing

Set `publish.pypi` to `true` for default PyPI publishing, `false` to disable it, or an object to configure the generated publishing workflow.

```json
{
  "targets": {
    "python": {
      "publish": {
        "pypi": {
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
