# PHP (Packagist)

> [!NOTE]
> The PHP target is experimental.

The PHP target publishes to [Packagist](https://packagist.org/), the Composer registry. The package name is the target's `composerPackageName` (for example `acme/api`). See the [PHP configuration](../configuration/php.md#publish) for options.

Packagist serves packages straight from a Git tag, so there is **no upload step**. You connect the repository to Packagist once, and from then on the `vX.Y.Z` tag and GitHub Release that the release workflow cuts when the release pull request merges are the published version. `authMethod` is unused.

After each release, a `publish` job validates `composer.json` with `composer validate --strict` and then asks Packagist to read the new tag through its [update-package API](https://packagist.org/apidoc#update-package). With Packagist credentials added as secrets, that call checks that Packagist knows the package and accepted the update: the job fails when Packagist cannot find the package or your account does not maintain it. Packagist then reads the tag on its own queue, so a problem on its side, such as a crawl that fails, shows on the package's Packagist page rather than in the job. The secrets are optional — without either, the call is skipped with a notice and Packagist's GitHub hook picks up the tag on its own. Setting only one of them fails the release, since Packagist needs both.

## Enable publishing

```json
{
  "targets": {
    "php": {
      "composerPackageName": "acme/api",
      "publish": { "packagist": true }
    }
  }
}
```

## Connect the repository to Packagist

<scalar-steps>
  <scalar-step id="packagist-submit" title="Submit the repository">

On [packagist.org](https://packagist.org/packages/submit), submit your [linked repository's](github.md) URL. Packagist reads `composer.json` and registers the package.

  </scalar-step>

  <scalar-step id="packagist-secrets" title="Add the Packagist secrets (recommended)">

Add two [repository secrets](github.md#adding-repository-secrets):

| Secret | Value |
| ------ | ----- |
| `PACKAGIST_USERNAME` | Your Packagist username. The account must maintain the package. |
| `PACKAGIST_API_TOKEN` | An API token from your [Packagist profile](https://packagist.org/profile/). The safe token is enough. An existing `PACKAGIST_SAFE_KEY` secret works too. |

When `publish.packagist.releaseEnvironment` is set, the secrets can live in that environment instead.

  </scalar-step>

  <scalar-step id="packagist-hook" title="Or rely on Packagist's GitHub hook">

Without the secrets, let Packagist install its GitHub hook, or enable the [GitHub integration](https://packagist.org/profile/) on your Packagist account, so every new tag is picked up automatically. Nothing checks that the hook is installed: without one, Packagist still updates on its own schedule, just less promptly, crawling a package with no hook about once a week.

  </scalar-step>
</scalar-steps>

## How consumers install it

```bash
composer require acme/api
```

## Notes

- `"packagist": true` adds the `publish` job to `release-please.yml` and a manual `sdk-release.yml`. Both run with `contents: read` only. Dispatch `sdk-release.yml` at a release tag to re-run a failed Packagist update.
- The `sdk-ci.yml` workflow still validates and tests the package on every pull request. With `packagist` enabled it runs the same `composer validate --strict` as the release, so a `composer.json` that Composer's publish checks reject — a `license` that is not an SPDX identifier, an uppercase package name — fails the pull request rather than the release.
