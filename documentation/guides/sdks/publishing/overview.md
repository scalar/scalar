# Publishing

Scalar publishes your generated SDKs to their package registries for you. Instead of running `npm publish` by hand, Scalar writes GitHub Actions workflows into your SDK repository and drives them from your SDK configuration. When you merge a release, the package goes out.

Publishing is **opt-in** and **off by default**. Nothing is published until you turn it on for a target.

<scalar-image
  src="/sdks/sdk-overview.png"
  alt="The SDK overview page in the Scalar dashboard showing a target with a linked GitHub repository"
  size="full">
</scalar-image>

## How it works

Publishing rides on top of the generation and GitHub sync you already use. There is no separate pipeline to maintain.

<scalar-steps>
  <scalar-step id="step-configure" title="Enable publishing for a target">

Turn on publishing for a target, either from the dashboard or in your [SDK configuration](#enable-publishing). This is the single switch that wires everything up.

  </scalar-step>

  <scalar-step id="step-build" title="Build the SDK">

Each build generates the SDK, pushes it to the `scalar-generated` branch of your [linked repository](github.md), and merges it with your custom code on `scalar-next`. The generated `.github/workflows` land in the repository too, so the publishing logic lives in your repo, not in a black box.

  </scalar-step>

  <scalar-step id="step-release-pr" title="Review the release pull request">

Scalar keeps a **release pull request** open from `scalar-next` against your default branch, titled `release: X.Y.Z`. Its diff is the full pending release: generated changes, your custom code, the changelog, and the version bump.

  </scalar-step>

  <scalar-step id="step-merge" title="Merge the release pull request">

Merging runs `release-please.yml` on the default branch, which cuts the `vX.Y.Z` tag, updates `CHANGELOG.md`, and creates the GitHub Release.

  </scalar-step>

  <scalar-step id="step-publish" title="The publish job publishes">

In the same workflow run, the release is synced back to `scalar-next`, and the inline `publish` job then checks out the tag that was just cut and publishes the package to its registry. The publish step is idempotent: if that version is already on the registry, it is skipped, so re-runs never fail or double-publish.

  </scalar-step>
</scalar-steps>

## What gets generated

Every target with a linked repository gets its release machinery committed alongside the SDK. They are normal, readable files you can inspect (and edit) in your repo.

| File | Trigger | What it does |
| ---- | ------- | ------------ |
| `.github/workflows/sdk-ci.yml` | `push`, `pull_request` | Installs dependencies and builds the SDK so every change is checked. |
| `.github/workflows/release-please.yml` | `push` to the default branch | Cuts the tag, changelog, and GitHub Release when a release pull request merges, publishes from its inline `publish` job, and syncs the release back to `scalar-next`. |
| `.github/workflows/release-title-edit.yml` | `pull_request` | Runs the `Release PR version` check and turns an edited release-pull-request title into the `Release-As` commit Scalar re-renders the pull request from. |
| `.github/workflows/sdk-release.yml` | `workflow_dispatch` | Manually re-publishes an existing tag. Only generated when the target publishes at release time. |
| `release-please-config.json`, `.release-please-manifest.json` | — | release-please's configuration and version state. The manifest is seeded once and then owned by your repository. |
| `VERSIONING.md` | — | Documents the branch model, how to pick an exact version, and the repository prerequisites. |

> [!NOTE]
> Tag-served ecosystems (Swift Package Manager, Packagist) have nothing to upload, so they get no `publish` job and no `sdk-release.yml`. For those, the `vX.Y.Z` tag and GitHub Release *are* the publish. Go is tag-served too, but still gets a release workflow, which warms the public module proxy after the tag. See [Package Registries](registries.md).

## Enable publishing

You can enable publishing two ways. Both set the same thing.

**From the dashboard**, open a target and toggle **Publish to \<registry\> on merge** under Git settings.

**In your configuration**, add a `publish` block to the target:

```json
{
  "targets": {
    "typescript": {
      "packageName": "demo-api",
      "publish": {
        "npm": true
      }
    }
  }
}
```

<scalar-image
  src="/sdks/publish-config.png"
  alt="The SDK configuration editor with a publish block enabling npm"
  size="full">
</scalar-image>

The registry key depends on the target (`npm`, `pypi`, `cargo`, `maven`, and so on). For the full list and per-registry options, see [Package Registries](registries.md). Each target documents its `publish` options on its [configuration page](../configuration.md).

Publishing requires a [linked repository](github.md): a target with no `destinations.production` gets no workflows at all.

## Package name availability

When you enable publishing, the dialog checks the target's package name against its registry and tells you whether it looks available or already taken — so you catch a name conflict up front, not after a release merges and the publish step fails.

A taken name is a **warning, never a block**: the registry cannot tell whether a name is already yours, and republishing under your own name is normal. The check runs for **npm** and **PyPI** today; other registries show nothing.

## Authentication

By default Scalar uses **OIDC trusted publishing** wherever the registry supports it. The publish job exchanges a short-lived GitHub identity token for a registry credential at publish time, so there is **no token to create, store, or rotate**. You register your repository and workflow as a trusted publisher on the registry once.

> [!IMPORTANT]
> Register **`release-please.yml`** as the trusted publisher's workflow, not `sdk-release.yml`. The automated publish runs as a job inside `release-please.yml`, so that is the file the OIDC claims name. `sdk-release.yml` exists for manual re-publishes; register it as an *additional* trusted publisher only if you use it.

Registries that do not support OIDC (RubyGems, and Maven Central, which also requires GPG signing) use repository secrets instead. Setup for each registry is covered in [Package Registries](registries.md).

## Versioning and releases

Versions are computed by release-please **from your commit history**, following [Conventional Commits](https://www.conventionalcommits.org). Scalar writes conventional commit messages describing what actually changed in the SDK surface, and your own commits on `scalar-next` count too. Pre-1.0, breaking changes bump the minor version instead of jumping to `1.0.0`.

To ship an exact version instead, **edit the release pull request title**:

```text
release: 1.0.0
```

The `Release PR version` check goes red while the title and the committed version disagree, Scalar re-renders the pull request at your version, and the check goes green. Wait for green before merging. The git-native equivalent is an empty commit on `scalar-next` with a `Release-As: 1.0.0` footer.

Every release gets a `vX.Y.Z` tag, a GitHub Release, and an entry in the repository's `CHANGELOG.md`, so your release history lives in your repo next to the code. The generated `VERSIONING.md` documents all of this for your maintainers.

## Permissions

The generated workflows request only the permissions they need. `release-please.yml` needs to write the tag, changelog, and Release:

```yaml
permissions:
  contents: write
  pull-requests: write
```

Its `publish` job then narrows that down to the publishing floor:

```yaml
permissions:
  contents: read
  id-token: write
  packages: write
```

`id-token: write` is what enables OIDC trusted publishing. The CLI target keeps `contents: write` on the publish job when it attaches binaries or updates a Homebrew tap, because it uploads assets to the GitHub Release. Scalar never asks for organization-wide access to publish.

## Next steps

<scalar-steps>
  <scalar-step id="next-github" title="Link a GitHub repository" interactivity="none">

Connect each target to a repository so builds sync to it. See [GitHub Repositories](github.md).

  </scalar-step>
  <scalar-step id="next-registries" title="Set up the registry" interactivity="none">

Register a trusted publisher or add the required secrets for your registry. See [Package Registries](registries.md).

  </scalar-step>
</scalar-steps>
