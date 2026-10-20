# Python (PyPI)

The Python target publishes to [PyPI](https://pypi.org/). The distribution name is the target's `projectName` (or `packageName`). See the [Python configuration](../configuration/python.md) for naming options.

Authenticate the release with **OIDC trusted publishing** (the default, recommended) or a **PyPI API token**. PyPI accepts a *pending* trusted publisher for a project that does not exist yet, so even a brand-new SDK can publish its first version without a token.

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

On [pypi.org](https://pypi.org/), add a **GitHub** publisher:

- For a project that does not exist yet, add a *pending* publisher at [pypi.org/manage/account/publishing](https://pypi.org/manage/account/publishing/). It also asks for the **PyPI project name** to reserve (the target's `projectName`), and becomes an ordinary publisher on the first successful upload.
- For an existing project, open it from [your projects](https://pypi.org/manage/projects/) and go to **Manage → Publishing**.

Both forms ask for:

- **Owner**: the owner of your [linked repository](github.md)
- **Repository name**: the repository name
- **Workflow name**: `release-please.yml`
- **Environment**: `publish.pypi.releaseEnvironment`, or blank when none is set

The automated publish runs as the `publish` job inside `release-please.yml`, so that is the workflow PyPI sees. If you also dispatch `sdk-release.yml` to re-publish a tag by hand, add it as a second publisher.

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

Add the token as a repository secret named **`PYPI_API_TOKEN`**. See [Adding repository secrets](github.md#adding-repository-secrets). An existing `PYPI_TOKEN` secret is read when `PYPI_API_TOKEN` is unset. When `publish.pypi.releaseEnvironment` is set, an environment secret of the same name overrides the repository one.

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

The workflow uses `pypa/gh-action-pypi-publish` and passes the token as the upload password.

## Notes

- `skip-existing` is enabled, so re-running a release for a version already on PyPI is a no-op.
