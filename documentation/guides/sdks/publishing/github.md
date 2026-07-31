# GitHub Repositories

Each target can be linked to its own GitHub repository. Once linked, every build syncs to that repository, and merging the release pull request is what triggers [publishing](overview.md). Linking a repository is the prerequisite for publishing, but it is useful on its own: it gives every generated SDK a home, a review step, and a history.

## Connect a repository

Linking happens per target, so a TypeScript and a Python SDK can live in separate repositories.

<scalar-image
  src="/sdks/github-connect.png"
  alt="The Git settings panel for a target before linking, with organization and repository selectors"
  size="full">
</scalar-image>

<scalar-steps>
  <scalar-step id="gh-install" title="Authorize the Scalar GitHub app">

The first time you connect, GitHub asks you to install the Scalar app and grant it access to the repositories you want to use. Scalar only needs to read and write repository contents and open pull requests.

  </scalar-step>

  <scalar-step id="gh-select" title="Select the organization and repository">

Open the target, then under **Git settings** choose the **Organization** and **Repository** to push the generated SDK to.

  </scalar-step>

  <scalar-step id="gh-connect" title="Connect">

Click **Connect repository**. From now on, every successful build pushes the generated SDK to this repository.

  </scalar-step>
</scalar-steps>

## How syncing works

Builds never commit straight to your default branch. The repository follows a three-branch flow that Scalar manages together with the generated workflows, all of which run on the default `GITHUB_TOKEN` — no extra token to provision.

<scalar-image
  src="/sdks/github-linked.png"
  alt="A linked target showing the connected repository, default branch, publish toggle, and synced versions"
  size="full">
</scalar-image>

- **`scalar-generated`** holds pristine generator output. Scalar pushes here; you never commit to it.
- **`scalar-next`** holds that output merged with your custom code. This is where you commit your own changes, directly or through pull requests, and where Scalar merges each regeneration.
- **The default branch** (`main` unless you configure otherwise) only ever receives released states. Scalar keeps a **release pull request** open from `scalar-next` against it, so the diff you review is the entire pending release. Merging that pull request is what releases and publishes the version.
- **`scalar-merge-conflict`** carries a regeneration that could not be merged cleanly; it arrives as a pull request for you to resolve.

**Synced versions**: the target lists each SDK version next to the pull request and commit that delivered it, so you can trace a published version back to its build.

> [!NOTE]
> Linking only controls where generated code goes. Turn on **Publish to \<registry\> on merge** (or add a `publish` block to the target) to also push the package to its registry. See [Publishing](overview.md).

## Your custom code is preserved

You can edit generated files in your repository on `scalar-next`. Scalar performs a three-way merge on every regeneration, so your changes are carried forward into the next release pull request instead of being overwritten. Review it as usual; only genuine conflicts need your attention. See [Custom Code](../custom-code.md).

## Repository prerequisites

- Branch protection on `scalar-next` and the default branch must allow the Scalar app and the `github-actions` bot to push, or be left unprotected. The default branch only ever advances by merging a release pull request, and `scalar-next` receives each released state back from the release workflow.
- No Actions settings changes are required: the generated workflows declare their own permissions and never create pull requests.

## Configuration equivalent

Linking from the dashboard sets the target's `destinations` in your SDK configuration. You can also set it directly:

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

| Property | Type | Description |
| -------- | ---- | ----------- |
| `repo` | `string` | The `owner/repo` the generated SDK is pushed to. |
| `branch` | `string` | The repository's default branch, which releases are promoted to. Defaults to `main`. Generated output itself always goes to the fixed `scalar-generated` branch. |

## Adding repository secrets

[OIDC trusted publishing](registries.md) needs no secrets. Token-based publishing, and Maven Central's GPG signing, store credentials as secrets on the SDK repository. The generated workflows read them by exact name, so the name has to match.

<scalar-steps>
  <scalar-step id="secret-open" title="Open the repository's Actions secrets">

In the SDK repository on GitHub, go to **Settings → Secrets and variables → Actions**.

  </scalar-step>

  <scalar-step id="secret-new" title="Create a new secret">

Select **New repository secret**.

  </scalar-step>

  <scalar-step id="secret-add" title="Name it exactly and paste the value">

Enter the **Name** the workflow expects (for example `NPM_TOKEN`) and paste the value, then **Add secret**. The per-language pages list the exact name each registry uses.

  </scalar-step>
</scalar-steps>

> [!NOTE]
> Secrets are scoped to the repository. If you publish several targets from one repository, add each registry's secret to that same repository.

## Unlink a repository

To stop syncing, open the target and use **Unlink** under the Danger Zone. Builds stop pushing to GitHub until you reconnect. Code already in the repository, and anything already published, is left untouched.
