# C#

> [!NOTE]
> The C# target is experimental.

Add `csharp` under `targets` to generate a .NET SDK package.

```json
{
  "targets": {
    "csharp": {
      "packageName": "Acme.Api",
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-csharp"
        }
      },
      "publish": {
        "nuget": {
          "authMethod": "oidc",
          "releaseEnvironment": "production",
          "homepage": "https://acme.com",
          "description": "Acme API .NET SDK"
        }
      }
    }
  }
}
```

## Target Options

| Property        | Type              | Description                                                      |
| --------------- | ----------------- | ---------------------------------------------------------------- |
| `packageName`   | `string`          | .NET package name.                                               |
| `version`       | `string`          | Target-specific SDK version override.                            |
| `skip`          | `boolean`         | Set to `true` to keep the config without generating this target. |
| `destinations`  | `object`          | GitHub destinations for generated output.                        |
| `publish`       | `object`          | NuGet publishing configuration.                                  |
| `publish.nuget` | `boolean\|object` | NuGet registry publishing settings.                              |

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

| Property | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `repo`   | GitHub repository in `owner/name` form.                                     |
| `branch` | Branch to push generated output to. Defaults to the repository default.     |

## Publishing

The C# target publishes to [NuGet](https://www.nuget.org/). The package id is the target's `packageName`.

Authenticate the release with **OIDC trusted publishing** (recommended) or a **NuGet API key**.

### Enable publishing

```json
{
  "targets": {
    "csharp": {
      "packageName": "Acme.Api",
      "publish": { "nuget": true }
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

### Trusted publishing (OIDC)

Recommended. The release workflow uses the `NuGet/login` action to mint a short-lived API key from the workflow's identity token, so no long-lived key is stored. NuGet's OIDC login still needs your account username as one secret.

<scalar-steps>
  <scalar-step id="nuget-oidc-policy" title="Add a trusted publishing policy on NuGet">

On [nuget.org](https://www.nuget.org/), open **Account → Trusted Publishing** and add a policy for:

- **Repository owner and name**: your [linked repository](../publishing/github.md)
- **Workflow file**: `sdk-release.yml`
- **Environment**: leave blank (unless you set `releaseEnvironment`)

  </scalar-step>

  <scalar-step id="nuget-oidc-user" title="Add your NuGet username as a secret">

Add a repository secret named **`NUGET_USER`** set to your nuget.org username. See [Adding repository secrets](../publishing/github.md#adding-repository-secrets). This is the only secret OIDC needs; the API key itself is minted at publish time.

  </scalar-step>

  <scalar-step id="nuget-oidc-config" title="Keep the default config">

```json
{ "targets": { "csharp": { "publish": { "nuget": true } } } }
```

  </scalar-step>
</scalar-steps>

### Publishing with a NuGet API key

<scalar-steps>
  <scalar-step id="nuget-token-create" title="Create a NuGet API key">

On nuget.org, go to **Account → API Keys → Create**, scope it to push your package, and copy the key.

  </scalar-step>

  <scalar-step id="nuget-token-secret" title="Add it to the repository">

Add the key as a repository secret named **`NUGET_API_KEY`**. See [Adding repository secrets](../publishing/github.md#adding-repository-secrets).

  </scalar-step>

  <scalar-step id="nuget-token-config" title="Switch the target to token auth">

```json
{
  "targets": {
    "csharp": {
      "publish": { "nuget": { "authMethod": "access-token" } }
    }
  }
}
```

  </scalar-step>
</scalar-steps>

### Notes

- The workflow pushes with `--skip-duplicate`, so re-publishing an existing version is a no-op.
