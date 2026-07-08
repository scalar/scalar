# Python (PyPI)

The Python target publishes to [PyPI](https://pypi.org/). The distribution name is the target's `projectName` (or `packageName`). See the [Python configuration](../configuration/python.md) for naming options.

Authenticate the release with **OIDC trusted publishing** (recommended) or a **PyPI API token**.

## Enable publishing

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

## Trusted publishing (OIDC)

Recommended. PyPI exchanges the workflow's identity token for a short-lived upload token, so no secret is stored.

<scalar-steps>
  <scalar-step id="pypi-oidc-add" title="Add a trusted publisher on PyPI">

On [pypi.org](https://pypi.org/), open your project's **Publishing** tab (for a brand-new project, use **Your account → Publishing → Add a pending publisher**) and add a **GitHub** publisher:

- **Owner**: the owner of your [linked repository](github.md)
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

## Publishing with a PyPI token

<scalar-steps>
  <scalar-step id="pypi-token-create" title="Create a PyPI API token">

On pypi.org, go to **Account settings → API tokens → Add API token**. Scope it to your project once the project exists.

  </scalar-step>

  <scalar-step id="pypi-token-secret" title="Add it to the repository">

Add the token as a repository secret named **`PYPI_API_TOKEN`**. See [Adding repository secrets](github.md#adding-repository-secrets).

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

## Notes

- `skip-existing` is enabled, so re-running a release for a version already on PyPI is a no-op.
