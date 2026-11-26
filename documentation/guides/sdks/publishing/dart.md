# Dart (pub.dev)

The Dart target publishes to [pub.dev](https://pub.dev/). The package name is the target's `packageName`. See the [Dart configuration](../configuration/dart.md#publish) for options.

Authenticate the release with **OIDC automated publishing** (the default, recommended) or a **pub.dev token**.

## Enable publishing

```json
{
  "targets": {
    "dart": {
      "packageName": "acme",
      "publish": { "pub": true }
    }
  }
}
```

## Automated publishing (OIDC)

Recommended. `dart pub publish` exchanges the workflow's identity token for a short-lived pub.dev credential, so no secret is stored.

pub.dev authorizes a repository and a tag pattern, not a workflow file, and accepts a publish only from a run whose ref is the release tag. The `release-please.yml` run that cuts the tag runs at your release branch, so its `publish` job does not publish itself. Instead it dispatches `sdk-release.yml` at the tag it just cut, and that run publishes. The dispatched run shows up separately in the repository's **Actions** tab. The `publish` job waits for it and fails if it fails, because GitHub sends no failure notification for a run the release workflow started. It waits up to 30 minutes for the publish to finish. When `publish.pub.releaseEnvironment` requires a reviewer, the job does not wait for the approval: it ends with a notice linking the held run, which publishes once approved. GitHub notifies no one if that run then fails, so follow it for the result. An environment wait timer has no reviewer to watch the run, so the job waits it out, and it counts against the 30 minutes.

<scalar-steps>
  <scalar-step id="pub-oidc-first" title="Publish the first version by hand">

pub.dev only enables automated publishing on a package that already exists. Publish the first version from a checkout of the SDK repository with `dart pub publish`.

  </scalar-step>

  <scalar-step id="pub-oidc-admin" title="Enable publishing from GitHub Actions">

On the package's **Admin** tab (`https://pub.dev/packages/<package>/admin`), under **Automated publishing**, click **Enable publishing from GitHub Actions** and set:

- **Repository**: your [linked repository](github.md), as `owner/name`
- **Tag pattern**: `v{{version}}`
- **Enable publishing from `workflow_dispatch` events**: on. It is off by default, and every release publishes from a dispatched run.
- **Enable publishing from `push` events**: not used by the generated workflows, so you can leave it off.
- **Require GitHub Actions environment**: when `publish.pub.releaseEnvironment` is set, require that environment. The publish runs at the release tag, so that environment's **Deployment branches and tags** setting has to admit `v*` tags: **Protected branches only** never admits a tag, so choose **Selected branches and tags** and add a `v*` tag rule.

  </scalar-step>

  <scalar-step id="pub-oidc-config" title="Keep the default config">

```json
{ "targets": { "dart": { "publish": { "pub": true } } } }
```

  </scalar-step>
</scalar-steps>

GitHub dispatches only workflows present on the repository's default branch, so when releases are cut on another branch, `sdk-release.yml` has to be on the default branch as well. To re-run a failed publish, run **`sdk-release.yml`** from the **Actions** tab and pick the release tag under **Use workflow from**. The workflow stops straight away when it is run from a branch.

## Publishing with a pub.dev token

A token publish needs no tag ref, so it runs inline in `release-please.yml`.

You need uploader rights on the package on pub.dev.

<scalar-steps>
  <scalar-step id="pub-token-secret" title="Add the credential to the repository">

Add a pub.dev credential as a repository secret named **`PUB_TOKEN`**. See [Adding repository secrets](github.md#adding-repository-secrets). When `publish.pub.releaseEnvironment` is set, an environment secret of the same name overrides the repository one.

The workflow registers it with `dart pub token add https://pub.dev --env-var PUB_TOKEN` before running `dart pub publish`.

  </scalar-step>

  <scalar-step id="pub-token-config" title="Switch the target to token auth">

```json
{
  "targets": {
    "dart": {
      "publish": { "pub": { "authMethod": "access-token" } }
    }
  }
}
```

  </scalar-step>
</scalar-steps>

> [!NOTE]
> pub.dev's documented credentials for publishing from CI are short-lived: a Google Cloud identity token, for example, expires within an hour. Make sure the `PUB_TOKEN` secret is valid before each release.

## Notes

- The workflow checks the pub.dev API for the version and skips publishing if it already exists, so re-merges are safe.
