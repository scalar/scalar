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
| `skip`                  | `boolean` | Set to `true` to keep the config without generating this target. |
| `destinations`          | `object`  | GitHub destinations for generated output.                        |
| `publish`               | `object`  | Packagist publishing configuration.                              |

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
| `branch` | Default branch of the destination repository that releases are promoted to. Defaults to `main`. Generated output itself always goes to the fixed `scalar-generated` branch. |

## Publishing

Set `publish.packagist` to `true` to tag each release for Packagist. Packagist serves the package from the Git tag, so there is no upload step and no secret to add — see [PHP publishing](../publishing/php.md).

```json
{
  "targets": {
    "php": {
      "publish": {
        "packagist": true
      }
    }
  }
}
```

| Property             | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| `packagist`          | Set to `true` to tag each release for Packagist.              |

Packagist serves the package from the Git tag, so no publish job is generated for this target. The shared `authMethod` and `releaseEnvironment` publish options have nothing to act on here and are ignored.
