# Private Registries

Scalar publishes to the public registry for each language out of the box. To publish somewhere else as well — JFrog Artifactory, AWS CodeArtifact, Sonatype Nexus, GitLab, Azure Artifacts, or any host that speaks the ecosystem's protocol — add a workflow your repository owns.

This is a supported path rather than a workaround. [Custom code](../custom-code.md) is carried forward on every build, so a workflow file you add is never overwritten or removed, and it keeps working as your SDK regenerates.

## Before you start

- A target with a [linked GitHub repository](github.md). Without one no workflows are generated at all, and there is no `scalar-next` branch to commit to.
- The URL of your registry for the ecosystem you are publishing.
- A credential for that registry, added as a [repository secret](github.md#adding-repository-secrets).

## The one rule

Add a **new** file under `.github/workflows/`. Do not edit the workflows Scalar generates.

| Path | Owner |
| ---- | ----- |
| `.github/workflows/sdk-ci.yml` | Scalar, rewritten every build |
| `.github/workflows/release-please.yml` | Scalar, rewritten every build |
| `.github/workflows/release-title-edit.yml` | Scalar, rewritten every build |
| `.github/workflows/sdk-release.yml` | Scalar, rewritten every build |
| **anything else under `.github/workflows/`** | **you** |

Commit it to **`scalar-next`**, the integration branch, directly or through a pull request against it. Never commit to `scalar-generated`, which holds pristine generator output and is replaced on every build.

Editing a generated workflow is not forbidden, but it costs you: when a later build changes the same lines you did, the merge conflicts and has to be [resolved by hand](../custom-code.md#resolving-conflicts) — every time. A separate file never conflicts.

## Choose a trigger that fires

> [!IMPORTANT]
> `on: release` and `on: push: tags:` do **not** work here. The release and the `vX.Y.Z` tag are both created by `release-please.yml` using the workflow's built-in `GITHUB_TOKEN`, and GitHub does not start workflow runs from events created by that token. A workflow on either trigger stays silent on release day with nothing in the Actions tab to explain why.

Two triggers do work.

**The release commit** — the release pull request is merged by a person, so that push starts workflows normally. The release commit is the only thing that ever rewrites `.release-please-manifest.json`, which makes this precise:

```yaml
on:
  push:
    branches: [main]
    paths: ['.release-please-manifest.json']
```

**The release workflow finishing** — `workflow_run` fires on run completion whatever token drove the run:

```yaml
on:
  workflow_run:
    workflows: ['Release Please']
    types: [completed]
```

The examples below use the first. It is simpler, and the commit it runs on is the released state, so the version and the source are both right there with nothing to resolve.

## Publish an npm package to Artifactory

Save as `.github/workflows/publish-private-registry.yml` on `scalar-next`, change the two marked values, and commit.

```yaml
name: Publish to private registry

on:
  # Runs when a release pull request is merged. The release commit is the only
  # commit that rewrites the manifest, so this never fires on anything else.
  push:
    branches: [main]
    paths: ['.release-please-manifest.json']
  # Lets you run it by hand from the Actions tab, which is how to test it first.
  workflow_dispatch:

permissions:
  contents: read

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          # CHANGE ME. Your Artifactory npm repository. Keep the trailing slash.
          registry-url: 'https://example.jfrog.io/artifactory/api/npm/npm-local/'

      - run: npm install
      - run: npm run build

      - name: Publish
        run: npm publish
        env:
          # CHANGE ME if you named the secret something else.
          NODE_AUTH_TOKEN: ${{ secrets.ARTIFACTORY_NPM_TOKEN }}
```

That is the whole thing. The generated SDK sets no `publishConfig` and ships no `.npmrc`, so `registry-url` alone decides where the package goes.

If your package name is scoped, add the scope so npm routes it correctly:

```yaml
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          registry-url: 'https://example.jfrog.io/artifactory/api/npm/npm-local/'
          scope: '@your-org'
```

## Publish a Python package to Artifactory

```yaml
name: Publish to private registry

on:
  push:
    branches: [main]
    paths: ['.release-please-manifest.json']
  workflow_dispatch:

permissions:
  contents: read

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - run: python -m pip install --upgrade build twine
      - run: python -m build

      - name: Publish
        # CHANGE ME. Your Artifactory PyPI repository.
        run: twine upload --repository-url https://example.jfrog.io/artifactory/api/pypi/pypi-local dist/*
        env:
          TWINE_USERNAME: ${{ secrets.ARTIFACTORY_USERNAME }}
          TWINE_PASSWORD: ${{ secrets.ARTIFACTORY_TOKEN }}
```

## Publish to AWS CodeArtifact

CodeArtifact does not take a long-lived token. Assume an AWS role with GitHub's OIDC identity, mint a short-lived token, and publish with that — so there is still no credential stored in the repository.

```yaml
name: Publish to CodeArtifact

on:
  push:
    branches: [main]
    paths: ['.release-please-manifest.json']
  workflow_dispatch:

permissions:
  contents: read
  # Required to exchange a GitHub identity token for AWS credentials.
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          # CHANGE ME. The IAM role your GitHub OIDC provider is allowed to assume.
          role-to-assume: arn:aws:iam::111122223333:role/github-publish
          aws-region: us-east-1

      - name: Get a CodeArtifact token
        run: |
          # CHANGE ME. Your domain and its owning account.
          TOKEN=$(aws codeartifact get-authorization-token \
            --domain my-domain \
            --domain-owner 111122223333 \
            --region us-east-1 \
            --query authorizationToken \
            --output text)
          # Keep the token out of the logs, including any step that echoes its environment.
          echo "::add-mask::$TOKEN"
          echo "NODE_AUTH_TOKEN=$TOKEN" >> "$GITHUB_ENV"

      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          # CHANGE ME. Shown under "View connection instructions" in the CodeArtifact console.
          registry-url: 'https://my-domain-111122223333.d.codeartifact.us-east-1.amazonaws.com/npm/my-repo/'

      - run: npm install
      - run: npm run build
      - run: npm publish
```

`NODE_AUTH_TOKEN` is written to the job environment, so the publish step picks it up without an `env:` block of its own.

For Python, swap the last four steps for the `build` and `twine` steps from the section above, and point `--repository-url` at your CodeArtifact PyPI endpoint with `TWINE_USERNAME: aws` and `TWINE_PASSWORD` set to the minted token.

## Any other registry

Every example above is the same five steps. To target Nexus, GitLab, Azure Artifacts, or anything else, keep the shape and change the destination:

1. Check out the repository.
2. Set up the language toolchain, pointing it at your registry.
3. Install dependencies and build, exactly as `sdk-ci.yml` does for your target.
4. Authenticate, from a repository secret or a minted token.
5. Publish with the ecosystem's normal command.

The build commands for your language are the ones already in your repository's `.github/workflows/sdk-ci.yml`. Copying them from there keeps your workflow in step with the SDK.

## Test it before you rely on it

Both example workflows include `workflow_dispatch`, so you do not have to wait for a release to find out whether the credential works.

1. Commit the workflow to `scalar-next` and let it reach your default branch through the next release pull request.
2. Open **Actions**, pick the workflow, and choose **Run workflow**.
3. Fix whatever it reports, then merge a real release.

Running it by hand publishes whatever version is currently committed, so if that version is already on your registry the publish step fails. That is the expected result of a second run and not a sign the workflow is wrong.

## Make re-runs safe

To make the job skip a version it has already published rather than fail, guard the publish step:

```yaml
      - name: Publish if the version is new
        run: |
          VERSION=$(node -p "require('./package.json').version")
          if npm view "$(node -p "require('./package.json').name")@$VERSION" version >/dev/null 2>&1; then
            echo "$VERSION is already published, skipping."
          else
            npm publish
          fi
        env:
          NODE_AUTH_TOKEN: ${{ secrets.ARTIFACTORY_NPM_TOKEN }}
```

This is the same behavior Scalar's own publish job has for the public registries.

## Publishing to a private registry and a public one

The two are independent. A workflow you add runs alongside Scalar's publishing rather than replacing it:

- **Private only** — leave `publish` out of the target's configuration. Scalar still generates the SDK, the release pull request, tags, and the changelog; nothing is uploaded to a public registry, and your workflow does the publishing.
- **Both** — [enable publishing](overview.md#enable-publishing) for the public registry as normal. Your workflow runs on the same release commit and publishes to your internal registry too.

## Troubleshooting

| What you see | Why |
| ------------ | --- |
| Nothing runs when a release merges | The workflow is on `on: release` or `on: push: tags:`. Use one of the [triggers that fire](#choose-a-trigger-that-fires). |
| Nothing runs, and the trigger looks right | The workflow has not reached your default branch yet. A `push` trigger runs the copy on the branch receiving the push, so the file has to land there through a release pull request first. |
| The workflow disappeared after a build | It was committed to `scalar-generated`, which is replaced on every build. Commit to `scalar-next`. |
| `401` or `403` from the registry | The secret is missing, misnamed, or lacks publish rights. Check it under **Settings → Secrets and variables → Actions**. |
| The package went to the public registry | `registry-url` is missing or misspelled, or a scoped package needs `scope` on `setup-node`. |
| Conflicts on every regeneration | You edited a generated workflow instead of adding your own. Move your changes to a separate file. |

## Next steps

<scalar-steps>
  <scalar-step id="private-next-custom-code" title="Understand how custom code is preserved" interactivity="none">

Your workflow is ordinary custom code. See [Custom Code](../custom-code.md) for how edits are carried forward and how conflicts are resolved.

  </scalar-step>
  <scalar-step id="private-next-registries" title="Add a public registry too" interactivity="none">

Publishing to a private registry does not rule out the public one. See [Package Registries](registries.md).

  </scalar-step>
</scalar-steps>
