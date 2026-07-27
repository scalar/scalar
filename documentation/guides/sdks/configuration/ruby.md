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

The Ruby target publishes to [RubyGems](https://rubygems.org/). The gem name is the target's `gemName`.

RubyGems publishing uses an **API key**. The release workflow pushes the gem with that key.

### Enable publishing

```json
{
  "targets": {
    "ruby": {
      "gemName": "acme",
      "publish": { "rubygems": true }
    }
  }
}
```

Set the registry key to an object instead of `true` to configure the generated publishing workflow:

| Property             | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `authMethod`         | Registry authentication mechanism, such as `oidc` or `access-token`. |
| `releaseEnvironment` | Release environment name used by generated publishing workflows. |
| `homepage`           | Package homepage metadata.                                  |
| `description`        | Package description metadata.                               |

### Set up the API key

<scalar-steps>
  <scalar-step id="gem-key-create" title="Create a RubyGems API key">

On [rubygems.org](https://rubygems.org/profile/api_keys), create an API key with the **Push rubygem** scope. Scope it to your gem once it exists.

  </scalar-step>

  <scalar-step id="gem-key-secret" title="Add it to the repository">

Add the key as a repository secret named **`RUBYGEMS_API_KEY`**. See [Adding repository secrets](../publishing/github.md#adding-repository-secrets).

  </scalar-step>
</scalar-steps>

The workflow reads it as `GEM_HOST_API_KEY` when running `gem push`.

### Notes

- The workflow checks the RubyGems API for the version first and skips `gem push` if it is already published, so re-merges are safe.
