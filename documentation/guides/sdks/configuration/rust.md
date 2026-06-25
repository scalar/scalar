# Rust

> [!NOTE]
> The Rust target is experimental.

Add `rust` under `targets` to generate a Rust SDK crate.

```json
{
  "targets": {
    "rust": {
      "packageName": "acme",
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-rust"
        }
      },
      "publish": {
        "cargo": {
          "authMethod": "oidc",
          "releaseEnvironment": "production",
          "homepage": "https://acme.com",
          "description": "Acme API Rust SDK"
        }
      }
    }
  }
}
```

## Target Options

| Property        | Type              | Description                                                      |
| --------------- | ----------------- | ---------------------------------------------------------------- |
| `packageName`   | `string`          | Crate name published to crates.io.                              |
| `version`       | `string`          | Target-specific SDK version override.                            |
| `skip`          | `boolean`         | Set to `true` to keep the config without generating this target. |
| `destinations`  | `object`          | GitHub destinations for generated output.                        |
| `publish`       | `object`          | crates.io publishing configuration.                             |
| `publish.cargo` | `boolean\|object` | crates.io registry publishing settings.                        |

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

| Property | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `repo`   | GitHub repository in `owner/name` form.                                     |
| `branch` | Branch to push generated output to. Defaults to the repository default.     |

## Publishing

Set `publish.cargo` to `true` for default crates.io publishing, `false` to disable it, or an object to configure the generated publishing workflow. See [Rust publishing](../publishing/rust.md) for the registry setup.

| Property             | Description                                                          |
| -------------------- | ------------------------------------------------------------------- |
| `authMethod`         | Registry authentication mechanism, such as `oidc` or `access-token`. |
| `releaseEnvironment` | Release environment name used by generated publishing workflows.    |
| `homepage`           | Package homepage metadata.                                          |
| `description`        | Package description metadata.                                       |
