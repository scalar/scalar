# CLI

Add `cli` under `targets` to generate a command-line interface for your API.

```json
{
  "targets": {
    "cli": {
      "binaryName": "acme",
      "defaultFormat": "json",
      "defaultErrorFormat": "json",
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-cli"
        }
      },
      "publish": {
        "homebrew": {
          "tapRepo": "acme/homebrew-tap",
          "homepage": "https://acme.com",
          "description": "Acme API command-line tools"
        }
      }
    }
  }
}
```

## Target Options

| Property             | Type     | Description                                                      |
| -------------------- | -------- | ---------------------------------------------------------------- |
| `binaryName`         | `string` | Name of the generated command-line binary.                       |
| `defaultFormat`      | `string` | Default output format for generated commands.                    |
| `defaultErrorFormat` | `string` | Default error output format for generated commands.              |
| `version`            | `string` | Target-specific CLI version override.                            |
| `skip`               | `boolean` | Set to `true` to keep the config without generating this target. |
| `destinations`       | `object` | GitHub destinations for generated output.                        |
| `publish`            | `object` | npm, macOS, and Homebrew publishing configuration.               |

## Method Commands

Use method-level `cli` settings in `resources` to enable, disable, or tune command generation for a specific method.

```json
{
  "resources": {
    "users": {
      "methods": {
        "list": {
          "kind": "http",
          "endpoint": "get /users",
          "verb": "get",
          "path": "/users",
          "defaultRequestOptions": {
            "headers": {}
          },
          "cli": {
            "enabled": true,
            "format": "table"
          }
        }
      }
    }
  }
}
```

| Property  | Description                                             |
| --------- | ------------------------------------------------------- |
| `enabled` | Enables or disables CLI command generation for a method. |
| `filter`  | CLI-specific parameter filter expression.               |
| `format`  | Default CLI output format for this method.              |

## Publishing

The CLI target supports `publish.npm`, `publish.macos`, and `publish.homebrew`. The CLI is a Node package, so npm (installed globally with `npm install -g`) is the primary channel; macOS attaches the tarball to the GitHub Release and Homebrew ships a tap formula. The three are independent and can be combined. See [CLI publishing](publishing/cli.md) for registry setup.

```json
{
  "targets": {
    "cli": {
      "publish": {
        "npm": {
          "authMethod": "oidc"
        },
        "macos": {
          "authMethod": "oidc",
          "releaseEnvironment": "production"
        },
        "homebrew": {
          "tapRepo": "acme/homebrew-tap"
        }
      }
    }
  }
}
```

| Property             | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| `authMethod`         | Registry authentication mechanism, such as `oidc` or `access-token`. |
| `releaseEnvironment` | Release environment name used by generated publishing workflows. |
| `tapRepo`            | Homebrew tap repository for CLI publishing.                   |
| `homepage`           | Package homepage metadata.                                   |
| `description`        | Package description metadata.                                |
