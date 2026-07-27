# Dart

> [!NOTE]
> The Dart target is experimental.

Add `dart` under `targets` to generate a Dart SDK package.

```json
{
  "targets": {
    "dart": {
      "packageName": "acme",
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-dart"
        }
      },
      "publish": {
        "pub": {
          "authMethod": "oidc",
          "releaseEnvironment": "production",
          "homepage": "https://acme.com",
          "description": "Acme API Dart SDK"
        }
      }
    }
  }
}
```

## Target Options

| Property       | Type              | Description                                                      |
| -------------- | ----------------- | ---------------------------------------------------------------- |
| `packageName`  | `string`          | Dart package name published to pub.dev.                          |
| `version`      | `string`          | Target-specific SDK version override.                            |
| `skip`         | `boolean`         | Set to `true` to keep the config without generating this target. |
| `destinations` | `object`          | GitHub destinations for generated output.                        |
| `publish`      | `object`          | pub.dev publishing configuration.                               |
| `publish.pub`  | `boolean\|object` | pub.dev registry publishing settings.                           |

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

| Property | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `repo`   | GitHub repository in `owner/name` form.                                     |
| `branch` | Branch to push generated output to. Defaults to the repository default.     |

## Publishing

The Dart target publishes to [pub.dev](https://pub.dev/). The package name is the target's `packageName`.

Authenticate the release with **OIDC trusted publishing** (recommended) or a **pub.dev token**.

### Enable publishing

```json
{
  "targets": {
    "dart": {
      "packageName": "acme",
      "publish": { "pub": true }
    }
  }
}
```

Set the registry key to an object instead of `true` to configure the generated publishing workflow:

| Property             | Description                                                          |
| -------------------- | ------------------------------------------------------------------- |
| `authMethod`         | Registry authentication mechanism, such as `oidc` or `access-token`. |
| `releaseEnvironment` | Release environment name used by generated publishing workflows.    |
| `homepage`           | Package homepage metadata.                                          |
| `description`        | Package description metadata.                                       |

### Trusted publishing (OIDC)

Recommended. pub.dev supports automated publishing from GitHub Actions using the workflow's identity token, so no secret is stored.

<scalar-steps>
  <scalar-step id="pub-oidc-enable" title="Enable automated publishing on pub.dev">

On [pub.dev](https://pub.dev/), open the package's **Admin** tab and enable **Automated publishing → Publishing from GitHub Actions**. Set:

- **Repository**: your [linked repository](../publishing/github.md) (`owner/repo`)
- **Tag pattern**: `v{{version}}` (the tag Scalar creates)
- **Environment**: leave blank (unless you set `releaseEnvironment`)

  </scalar-step>

  <scalar-step id="pub-oidc-config" title="Keep the default config">

```json
{ "targets": { "dart": { "publish": { "pub": true } } } }
```

  </scalar-step>
</scalar-steps>

### Publishing with a token

<scalar-steps>
  <scalar-step id="pub-token-create" title="Get a pub.dev token">

Obtain an OAuth/refresh token for your pub.dev account (for example with `dart pub token add https://pub.dev` locally and copying the stored credential).

  </scalar-step>

  <scalar-step id="pub-token-secret" title="Add it to the repository">

Add the token as a repository secret named **`PUB_TOKEN`**. See [Adding repository secrets](../publishing/github.md#adding-repository-secrets).

  </scalar-step>

  <scalar-step id="pub-token-config" title="Switch the target to token auth">

```json
{
  "targets": {
    "dart": {
      "publish": { "pub": { "authMethod": "access-token" } }
    }
  }
}
```

  </scalar-step>
</scalar-steps>

The workflow registers `PUB_TOKEN` with `dart pub token add` before publishing.

### Notes

- The workflow checks the pub.dev API for the version and skips publishing if it already exists.
- Trusted publishing is strongly preferred; tokens for pub.dev are longer-lived and harder to scope.
