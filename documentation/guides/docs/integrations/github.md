# GitHub

Docs connects to GitHub to read your files, open pull requests, and publish when you merge. Here's what that connection can and can't do.

## Setup

1. **Install the Scalar GitHub App.** You pick which repositories it can access. Change the selection any time.
2. **Link your GitHub user.** This attributes commits and pull requests to you.

Access is always limited to the repositories you pick. Nothing else.

## Switch repositories

For a project already connected to GitHub or Bitbucket, you can switch to another repository on either provider without disconnecting first.

The destination repository must already contain your documentation. Switching does not copy files or open a pull request to move them, so move your documentation to the destination yourself before switching.

1. Open your documentation project in the [Scalar Dashboard](https://dashboard.scalar.com) and go to **Settings → Git Sync**.
2. Click **Switch repository** beside the connected repository.
3. Choose GitHub or Bitbucket, authorize access if prompted, and select the repository containing your docs. For GitHub, make sure the Scalar GitHub App has access to that repository.
4. Review the confirmation, which names the repository you are leaving and the destination, then click **Switch**.

The editor reloads the destination repository, replacing the contents of the docs project. Future edits are committed to the new repository. Files in the previous repository stay as they are, and your live site keeps serving its current build until the next publish.

Scalar uses the destination repository's default branch and looks for a `scalar.config.*` file in the current configuration directory, the repository root, and `scalar-docs/`, in that order. If none is found, it keeps the project's current configuration path. Check the configuration and **Tracked branch** in Git Sync before publishing.

## What we can access

Only in the repositories you select:

- **Contents** — read your files and write changes through commits and pull requests.
- **Pull requests** — open and update pull requests.
- **Metadata** — basic repository info (required for every GitHub App).

## What we can't access

- Repositories you didn't select.
- Your other code across your account or organization.
- Repository settings, collaborators, or branch protection.

## "Act on your behalf"

GitHub shows this line for any app that can write to a repository, because your commits and pull requests are attributed to you. It's about attribution, not broad access. See GitHub's own [explanation](https://docs.github.com/en/apps/using-github-apps/authorizing-github-apps#about-github-apps-acting-on-your-behalf).

## Manage access

Change repositories or revoke access from GitHub under **Settings → Applications → Installed GitHub Apps**, or from the [Scalar Dashboard](https://dashboard.scalar.com). Removing a repository cuts off access to it right away.
