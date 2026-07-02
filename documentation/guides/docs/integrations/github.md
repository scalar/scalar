# GitHub

Docs connects to GitHub so it can read your Markdown, MDX, and OpenAPI files, open pull requests for edits, and publish when you merge. This page explains exactly what that connection grants and, just as importantly, what it does not.

## How the connection works

Connecting Scalar to GitHub is a two-part flow, and both parts are deliberately narrow:

1. **Install the Scalar GitHub App.** GitHub asks you to choose which repositories the app can access. You can pick a single repository, a handful, or all of them, and you can change that selection at any time.
2. **Link your GitHub user.** So we can attribute commits and pull requests to the right person, we link your GitHub account to your Scalar account.

Because we use the modern GitHub App flow, access is always scoped to the repositories you explicitly select. There is no step that hands Scalar blanket access to every repository you can reach.

## What we can access

The Scalar GitHub App only requests the permissions it needs to keep your documentation in sync:

- **Contents** — read your documentation and OpenAPI files, and write changes back through commits and pull requests.
- **Pull requests** — open and update pull requests so you can review edits before they go live.
- **Metadata** — read basic repository information (this is required by every GitHub App).

Every one of these permissions applies only to the repositories you selected during installation.

## What we cannot access

Just as important as what we request is what we leave alone:

- **Repositories you did not select.** The app can only see the repositories you picked. Everything else in your account or organization stays invisible to us.
- **Your private code at large.** We do not request organization-wide or account-wide read access to your source code.
- **Administration and settings.** We cannot change repository settings, manage collaborators, or alter branch protection rules.
- **Your identity beyond attribution.** Linking your GitHub user lets us attribute commits and pull requests to you. It does not grant us standing access to act across your account.

## Why the consent screen mentions acting on your behalf

When you link your GitHub user, GitHub shows a line about the app being able to "act on your behalf." This wording appears for any GitHub App that can write to a repository, because commits and pull requests are attributed to your account. It reflects attribution, not broad access: the app is still limited to the repositories you selected and the permissions listed above.

You can review GitHub's own explanation in their guide on [GitHub Apps acting on your behalf](https://docs.github.com/en/apps/using-github-apps/authorizing-github-apps#about-github-apps-acting-on-your-behalf).

## Managing and revoking access

You stay in control of the connection at all times:

- Change which repositories the app can access from your GitHub settings under **Applications → Installed GitHub Apps**.
- Revoke the connection entirely from the same screen, or from your project settings in the [Scalar Dashboard](https://dashboard.scalar.com).

Removing a repository or uninstalling the app immediately cuts off Scalar's access to it.
