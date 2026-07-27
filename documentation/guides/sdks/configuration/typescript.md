# TypeScript

Add `typescript` under `targets` to generate a TypeScript SDK package.

```json
{
  "targets": {
    "typescript": {
      "packageName": "@acme/api",
      "packageManager": "pnpm",
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-typescript",
          "branch": "main"
        }
      },
      "publish": {
        "npm": {
          "authMethod": "oidc",
          "releaseEnvironment": "production",
          "homepage": "https://acme.com",
          "description": "Acme API TypeScript SDK"
        }
      }
    }
  }
}
```

## Target Options

| Property         | Type              | Description                                                      |
| ---------------- | ----------------- | ---------------------------------------------------------------- |
| `packageName`    | `string`          | Import and package name for the generated TypeScript package.    |
| `packageManager` | `string`          | Package manager preference for generated package metadata.       |
| `version`        | `string`          | Target-specific SDK version override.                            |
| `skip`           | `boolean`         | Set to `true` to keep the config without generating this target. |
| `destinations`   | `object`          | GitHub destinations for generated output.                        |
| `publish`        | `object`          | npm publishing configuration.                                    |
| `publish.npm`    | `boolean\|object` | npm registry publishing settings.                                |

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

```json
{
  "targets": {
    "typescript": {
      "destinations": {
        "production": {
          "repo": "acme/acme-typescript",
          "branch": "main"
        }
      }
    }
  }
}
```

| Property | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `repo`   | GitHub repository in `owner/name` form.                                     |
| `branch` | Branch to push generated output to. Defaults to the repository default.     |

## Publishing

The TypeScript target publishes to [npm](https://www.npmjs.com/). The published package name is the target's `packageName` (for example `@acme/api`).

Pick one of two ways to authenticate the release: **OIDC trusted publishing** (recommended, no secret to manage) or an **npm access token**.

### Enable publishing

Turn on **Publish to npm on merge** in the target's Git settings, or add a `publish` block:

```json
{
  "targets": {
    "typescript": {
      "packageName": "@acme/api",
      "publish": { "npm": true }
    }
  }
}
```

With `"npm": true`, OIDC is used by default. Once enabled, merging a build publishes the package.

Set the registry key to an object instead of `true` to configure the generated publishing workflow:

| Property             | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `authMethod`         | Registry authentication mechanism, such as `oidc` or `access-token`. |
| `releaseEnvironment` | Release environment name used by generated publishing workflows. |
| `homepage`           | Package homepage metadata.                                  |
| `description`        | Package description metadata.                               |

### Trusted publishing (OIDC)

Recommended. npm mints a short-lived, provenance-signed credential at publish time, so nothing is stored in your repository.

<scalar-steps>
  <scalar-step id="npm-oidc-reserve" title="Make sure the package exists">

Trusted publishing attaches to an existing package. If this is the very first publish, either publish `1.0.0` once by hand, or reserve the name on npm.

  </scalar-step>

  <scalar-step id="npm-oidc-add" title="Add a trusted publisher on npm">

On [npmjs.com](https://www.npmjs.com/), open the package, then **Settings → Trusted Publisher → GitHub Actions** and enter:

- **Organization or user**: the owner of your [linked repository](../publishing/github.md)
- **Repository**: the repository name
- **Workflow filename**: `sdk-release.yml`
- **Environment**: leave blank (unless you set `releaseEnvironment`)

  </scalar-step>

  <scalar-step id="npm-oidc-config" title="Keep the default config">

```json
{ "targets": { "typescript": { "publish": { "npm": true } } } }
```

  </scalar-step>
</scalar-steps>

> [!NOTE]
> Trusted publishing needs npm 11.5.1 or newer. The generated workflow upgrades npm automatically before publishing, so you do not have to.

### Publishing with an npm token

Use a token if you cannot enable trusted publishing.

<scalar-steps>
  <scalar-step id="npm-token-create" title="Create an npm token">

On npmjs.com, go to **Access Tokens → Generate New Token → Granular Access Token** (or a Classic **Automation** token). Give it permission to publish your package.

  </scalar-step>

  <scalar-step id="npm-token-secret" title="Add it to the repository">

Add the token as a repository secret named **`NPM_TOKEN`**. See [Adding repository secrets](../publishing/github.md#adding-repository-secrets).

  </scalar-step>

  <scalar-step id="npm-token-config" title="Switch the target to token auth">

```json
{
  "targets": {
    "typescript": {
      "publish": { "npm": { "authMethod": "access-token" } }
    }
  }
}
```

  </scalar-step>
</scalar-steps>

The workflow reads the token from `NPM_TOKEN` as `NODE_AUTH_TOKEN`.

### Notes

- The publish step is idempotent: if the version is already on npm, it is skipped, so re-merges never fail.
- Scoped packages (`@acme/api`) are published with `--access public`.
