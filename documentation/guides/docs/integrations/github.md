# GitHub

Docs connects to GitHub to read your files, open pull requests, and publish when you merge. Here's what that connection can and can't do.

## Setup

1. **Install the Scalar GitHub App.** You pick which repositories it can access. Change the selection any time.
2. **Link your GitHub user.** This attributes commits and pull requests to you.

Access is always limited to the repositories you pick. Nothing else.

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
