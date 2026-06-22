# Ruby

> [!NOTE]
> The Ruby target is experimental.

Add `ruby` under `targets` to generate a Ruby SDK gem.

```json
{
  "targets": {
    "ruby": {
      "gemName": "acme_api",
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-ruby"
        }
      },
      "publish": {
        "rubygems": {
          "authMethod": "access-token",
          "releaseEnvironment": "production",
          "homepage": "https://acme.com",
          "description": "Acme API Ruby SDK"
        }
      }
    }
  }
}
```

## Target Options

| Property           | Type              | Description                                                      |
| ------------------ | ----------------- | ---------------------------------------------------------------- |
| `gemName`          | `string`          | Ruby gem name.                                                   |
| `version`          | `string`          | Target-specific SDK version override.                            |
| `skip`             | `boolean`         | Set to `true` to keep the config without generating this target. |
| `destinations`     | `object`          | GitHub destinations for generated output.                        |
| `publish`          | `object`          | RubyGems publishing configuration.                               |
| `publish.rubygems` | `boolean\|object` | RubyGems registry publishing settings.                           |

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

| Property | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `repo`   | GitHub repository in `owner/name` form.                                     |
| `branch` | Branch to push generated output to. Defaults to the repository default.     |

## Publishing

Set `publish.rubygems` to `true` for default RubyGems publishing, `false` to disable it, or an object to configure the generated publishing workflow.

```json
{
  "targets": {
    "ruby": {
      "publish": {
        "rubygems": {
          "authMethod": "access-token",
          "releaseEnvironment": "production"
        }
      }
    }
  }
}
```

| Property             | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `authMethod`         | Registry authentication mechanism, such as `oidc` or `access-token`. |
| `releaseEnvironment` | Release environment name used by generated publishing workflows. |
| `homepage`           | Package homepage metadata.                                  |
| `description`        | Package description metadata.                               |
