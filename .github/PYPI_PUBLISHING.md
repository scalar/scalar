# PyPI trusted publishing

`scalar-fastapi` and `scalar-ninja` publish through GitHub OIDC with signed PyPI
attestations. Their pack jobs build a wheel and source distribution without OIDC
permissions. Separate publish jobs download those artifacts from the same run and
upload them from the `production-pypi` environment.

Publishing stays in `main.yml`: the [PyPA publishing action](https://github.com/pypa/gh-action-pypi-publish#trusted-publishing)
does not support trusted publishing inside reusable workflows. The jobs retain the
existing release, package-change, and successful integration-build gates.

## Before merging

A PyPI project owner must add a GitHub trusted publisher on **both** projects:

- [scalar-fastapi publishing settings](https://pypi.org/manage/project/scalar-fastapi/settings/publishing/)
- [scalar-ninja publishing settings](https://pypi.org/manage/project/scalar-ninja/settings/publishing/)

Use these exact values for each project:

| Field            | Value             |
| ---------------- | ----------------- |
| Owner            | `scalar`          |
| Repository name  | `scalar`          |
| Workflow name    | `main.yml`        |
| Environment name | `production-pypi` |

The workflow name is the filename, without `.github/workflows/`. Keep the
`production-pypi` GitHub environment restricted to the release branch. See
[PyPI's registration guide](https://docs.pypi.org/trusted-publishers/adding-a-publisher/).
The repository change does not create these PyPI registrations; uploads fail if
the settings do not match. There is no API-token fallback.

## After the first release

For each package's next version, confirm that the Main workflow's publish job
succeeded and that PyPI shows provenance for both the wheel and source
distribution, pointing to `scalar/scalar`, `main.yml`, and the release commit.
These attestations apply to new uploads only; they do not add provenance to
previously published versions.

After both packages have published successfully with OIDC, revoke the old PyPI
API token and remove the unused `PYPI_TOKEN` GitHub secret, after confirming it
has no other consumers. No credentials are needed by the new publish steps.
