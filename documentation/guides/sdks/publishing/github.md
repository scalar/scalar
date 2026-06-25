# GitHub Repositories

Each target can be linked to its own GitHub repository. Once linked, every build syncs to that repository as a pull request, and merging it is what triggers [publishing](overview.md). Linking a repository is the prerequisite for publishing, but it is useful on its own: it gives every generated SDK a home, a review step, and a history.

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

Builds never commit straight to your default branch. Each build opens (or updates) a **pull request** against the **default branch** you configure, so you always review generated changes before they land.

<scalar-image
  src="/sdks/github-linked.png"
  alt="A linked target showing the connected repository, default branch, publish toggle, and synced versions"
  size="full">
</scalar-image>

- **Default branch**: new builds open a pull request against this branch (`main` by default). Merging that pull request is what releases and publishes the version.
- **Synced versions**: the target lists each SDK version next to the pull request and commit that delivered it, so you can trace a published version back to its build.

> [!NOTE]
> Linking only controls where generated code goes. Turn on **Publish to \<registry\> on merge** (or add a `publish` block to the target) to also push the package to its registry. See [Publishing](overview.md).

## Your custom code is preserved

You can edit generated files in your repository. Scalar performs a three-way merge on every regeneration, so your changes are carried forward into the next build's pull request instead of being overwritten. Review the pull request as usual; only genuine conflicts need your attention.

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
| `branch` | `string` | The branch builds open pull requests against. Defaults to `main`. |

## Unlink a repository

To stop syncing, open the target and use **Unlink** under the Danger Zone. Builds stop pushing to GitHub until you reconnect. Code already in the repository, and anything already published, is left untouched.
