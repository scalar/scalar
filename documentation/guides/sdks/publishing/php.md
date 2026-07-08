# PHP (Packagist)

The PHP target publishes to [Packagist](https://packagist.org/), the Composer registry. The package name is the target's `composerPackageName` (for example `acme/api`). See the [PHP configuration](../configuration/php.md) for options.

Packagist serves packages straight from a Git tag, so there is **no upload step and no secret to add**. You connect the repository to Packagist once, and from then on the `vX.Y.Z` tag and GitHub Release that Scalar creates on merge are the published version.

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

Connect Packagist's GitHub integration (or add its webhook) so new tags are picked up automatically. Without it, Packagist still updates on its own schedule, just less promptly.

  </scalar-step>
</scalar-steps>

## How consumers install it

```bash
composer require acme/api
```

## Notes

- No release workflow is generated for PHP. The `sdk-ci.yml` workflow still validates and tests the package on every pull request.
