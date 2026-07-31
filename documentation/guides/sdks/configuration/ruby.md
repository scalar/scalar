# Ruby

> [!NOTE]
> The Ruby target is experimental.

Add `ruby` under `targets` to generate a Ruby SDK gem.

```json
{
  "targets": {
    "ruby": {
      "gemName": "acme_api",
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
| `skip`             | `boolean`         | Set to `true` to keep the config without generating this target. |
| `destinations`     | `object`          | GitHub destinations for generated output.                        |
| `publish`          | `object`          | RubyGems publishing configuration.                               |
| `publish.rubygems` | `boolean\|object` | RubyGems registry publishing settings.                           |

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

| Property | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `repo`   | GitHub repository in `owner/name` form.                                     |
| `branch` | Default branch of the destination repository that releases are promoted to. Defaults to `main`. Generated output itself always goes to the fixed `scalar-generated` branch. |

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
