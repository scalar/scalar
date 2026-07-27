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

The Python target publishes to [PyPI](https://pypi.org/). The distribution name is the target's `projectName` (or `packageName`).

Authenticate the release with **OIDC trusted publishing** (recommended) or a **PyPI API token**.

### Enable publishing

Turn on **Publish to PyPI on merge**, or add a `publish` block:

```json
{
  "targets": {
    "python": {
      "packageName": "acme",
      "projectName": "acme-api",
      "publish": { "pypi": true }
    }
  }
}
```

Set the registry key to an object instead of `true` to configure the generated publishing workflow:

| Property             | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `authMethod`         | Registry authentication mechanism, such as `oidc` or `access-token`. |
| `releaseEnvironment` | Release environment name used by generated publishing workflows. |
| `homepage`           | Package homepage metadata.                                  |
| `description`        | Package description metadata.                               |

### Trusted publishing (OIDC)

Recommended. PyPI exchanges the workflow's identity token for a short-lived upload token, so no secret is stored.

<scalar-steps>
  <scalar-step id="pypi-oidc-add" title="Add a trusted publisher on PyPI">

On [pypi.org](https://pypi.org/), open your project's **Publishing** tab (for a brand-new project, use **Your account → Publishing → Add a pending publisher**) and add a **GitHub** publisher:

- **Owner**: the owner of your [linked repository](../publishing/github.md)
- **Repository name**: the repository name
- **Workflow name**: `sdk-release.yml`
- **Environment**: leave blank (unless you set `releaseEnvironment`)

  </scalar-step>

  <scalar-step id="pypi-oidc-config" title="Keep the default config">

```json
{ "targets": { "python": { "publish": { "pypi": true } } } }
```

  </scalar-step>
</scalar-steps>

### Publishing with a PyPI token

<scalar-steps>
  <scalar-step id="pypi-token-create" title="Create a PyPI API token">

On pypi.org, go to **Account settings → API tokens → Add API token**. Scope it to your project once the project exists.

  </scalar-step>

  <scalar-step id="pypi-token-secret" title="Add it to the repository">

Add the token as a repository secret named **`PYPI_API_TOKEN`**. See [Adding repository secrets](../publishing/github.md#adding-repository-secrets).

  </scalar-step>

  <scalar-step id="pypi-token-config" title="Switch the target to token auth">

```json
{
  "targets": {
    "python": {
      "publish": { "pypi": { "authMethod": "access-token" } }
    }
  }
}
```

  </scalar-step>
</scalar-steps>

The workflow uses `pypa/gh-action-pypi-publish` and passes `PYPI_API_TOKEN` as the upload password.

### Notes

- `skip-existing` is enabled, so re-running a release for a version already on PyPI is a no-op.
