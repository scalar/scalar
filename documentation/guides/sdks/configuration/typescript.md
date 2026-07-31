# TypeScript

Add `typescript` under `targets` to generate a TypeScript SDK package.

```json
{
  "targets": {
    "typescript": {
      "packageName": "@acme/api",
      "packageManager": "pnpm",
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
| `skip`           | `boolean`         | Set to `true` to keep the config without generating this target. |
| `destinations`   | `object`          | GitHub destinations for generated output.                        |
| `publish`        | `object`          | npm publishing configuration.                                    |
| `publish.npm`    | `boolean\|object` | npm registry publishing settings.                                |
| `options`        | `object`          | TypeScript emitter options.                                      |
| `compatibility`  | `string`          | Emit a compatibility module reproducing another generator's public surface. |

## Emitter Options

`options.propertyCasing` controls how generated properties and parameters are named.

```json
{
  "targets": {
    "typescript": {
      "options": {
        "propertyCasing": "sdk"
      }
    }
  }
}
```

| Value  | Description                                                                 |
| ------ | --------------------------------------------------------------------------- |
| `wire` | Default. Preserves the OpenAPI wire names, so `order_by` stays `order_by`.  |
| `sdk`  | Emits the idiomatic name for the language — camelCase in TypeScript, so `orderBy` — and generates a wire↔SDK remap so request and response bodies stay correct on the network. |

## Migrating From Another Generator

Set `compatibility` to also emit a module of deprecated wrapper functions that reproduce another generator's public surface and forward to the generated SDK, so existing call sites keep compiling while you migrate. Omit it to emit nothing extra.

```json
{
  "targets": {
    "typescript": {
      "compatibility": "speakeasy"
    }
  }
}
```

| Value       | Description                                                            |
| ----------- | ---------------------------------------------------------------------- |
| `speakeasy` | Emits `src/compat/speakeasy.ts` with Speakeasy-style standalone functions returning a functional `Result`, matching Speakeasy's tree-shakable `funcs/` surface. |

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
| `branch` | Default branch of the destination repository that releases are promoted to. Defaults to `main`. Generated output itself always goes to the fixed `scalar-generated` branch. |

## Publishing

Set `publish.npm` to `true` for default npm publishing, `false` to disable it, or an object to configure the generated publishing workflow.

```json
{
  "targets": {
    "typescript": {
      "publish": {
        "npm": {
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
