# PHP (Packagist)

The PHP target publishes to [Packagist](https://packagist.org/), the Composer registry. The package name is the target's `composerPackageName` (for example `acme/api`). See the [PHP configuration](../configuration/php.md#publish) for options.

Packagist serves packages straight from a Git tag, so there is **no upload step and no secret to add**. You connect the repository to Packagist once, and from then on the `vX.Y.Z` tag and GitHub Release that the release workflow cuts when the release pull request merges are the published version. `authMethod` is unused.

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

  <scalar-step id="packagist-hook" title="Enable auto-updates">

Let Packagist install its GitHub hook, or enable the [GitHub integration](https://packagist.org/profile/) on your Packagist account, so every new tag is picked up automatically.

  </scalar-step>
</scalar-steps>

## How consumers install it

```bash
composer require acme/api
```

## Notes

- PHP gets no `publish` job or `sdk-release.yml`, so `"packagist": true` adds no workflow: linking the repository is what produces the tag. The `sdk-ci.yml` workflow still validates and tests the package on every pull request.
