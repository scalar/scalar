# Dart (pub.dev)

The Dart target publishes to [pub.dev](https://pub.dev/). The package name is the target's `packageName`. See the [Dart configuration](../configuration/dart.md#publish) for options.

> [!WARNING]
> pub.dev's [automated publishing](https://dart.dev/tools/pub/automated-publishing) (OIDC) only accepts a publish from a GitHub Actions run that a matching **tag push** triggered. The generated release workflows are not: `release-please.yml` runs on the push to your release branch, and `sdk-release.yml` is dispatched by hand. So although `pub` defaults to `oidc`, a Dart target has to set `authMethod` to `access-token`.

## Enable publishing

```json
{
  "targets": {
    "dart": {
      "packageName": "acme",
      "publish": { "pub": { "authMethod": "access-token" } }
    }
  }
}
```

## Set up the token

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
