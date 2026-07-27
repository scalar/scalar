# PHP

> [!NOTE]
> The PHP target is experimental.

Add `php` under `targets` to generate a PHP SDK package.

```json
{
  "targets": {
    "php": {
      "packageName": "Acme\\Api",
      "composerPackageName": "acme/api",
      "composerRepositoryUrl": "https://repo.packagist.org",
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-php"
        }
      }
    }
  }
}
```

## Target Options

| Property                | Type      | Description                                                      |
| ----------------------- | --------- | ---------------------------------------------------------------- |
| `packageName`           | `string`  | PHP package namespace or name.                                   |
| `composerPackageName`   | `string`  | Composer and Packagist package name, such as `acme/api`.         |
| `composerRepositoryUrl` | `string`  | Composer repository URL for PHP package publishing.              |
| `version`               | `string`  | Target-specific SDK version override.                            |
| `skip`                  | `boolean` | Set to `true` to keep the config without generating this target. |
| `destinations`          | `object`  | GitHub destinations for generated output.                        |
| `publish`               | `object`  | Packagist publishing configuration.                              |
| `publish.packagist`     | `boolean` | Tag-based Packagist publishing settings.                         |

## Composer Package Names

Use `packageName` for the generated PHP package namespace and `composerPackageName` for the package users install through Composer.

```json
{
  "targets": {
    "php": {
      "packageName": "Acme\\Api",
      "composerPackageName": "acme/api"
    }
  }
}
```

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

| Property | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `repo`   | GitHub repository in `owner/name` form.                                     |
| `branch` | Branch to push generated output to. Defaults to the repository default.     |

## Publishing

The PHP target publishes to [Packagist](https://packagist.org/), the Composer registry. The package name is the target's `composerPackageName` (for example `acme/api`).

Packagist serves packages straight from a Git tag, so there is **no upload step and no secret to add**. You connect the repository to Packagist once, and from then on the `vX.Y.Z` tag and GitHub Release that Scalar creates on merge are the published version.

### Enable publishing

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

### Connect the repository to Packagist

<scalar-steps>
  <scalar-step id="packagist-submit" title="Submit the repository">

On [packagist.org](https://packagist.org/packages/submit), submit your [linked repository's](../publishing/github.md) URL. Packagist reads `composer.json` and registers the package.

  </scalar-step>

  <scalar-step id="packagist-hook" title="Enable auto-updates">

Connect Packagist's GitHub integration (or add its webhook) so new tags are picked up automatically. Without it, Packagist still updates on its own schedule, just less promptly.

  </scalar-step>
</scalar-steps>

### How consumers install it

```bash
composer require acme/api
```

### Notes

- No release workflow is generated for PHP. The `sdk-ci.yml` workflow still validates and tests the package on every pull request.
