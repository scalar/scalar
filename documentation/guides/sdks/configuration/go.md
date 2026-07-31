# Go

Add `go` under `targets` to generate a Go SDK package.

```json
{
  "targets": {
    "go": {
      "packageName": "acmeapi",
      "destinations": {
        "production": {
          "repo": "acme/acme-go"
        }
      },
      "publish": {
        "go": true
      }
    }
  }
}
```

## Target Options

| Property               | Type      | Description                                                      |
| ---------------------- | --------- | ---------------------------------------------------------------- |
| `packageName`          | `string`  | Go module or package name.                                       |
| `goModulePathOverride` | `string`  | Module path written to `go.mod` and every generated import, when it must differ from the one derived from the destination repository. |
| `pointerServices`      | `boolean` | Generate a pointer-shaped client surface. Defaults to `false`.   |
| `skip`                 | `boolean` | Set to `true` to keep the config without generating this target. |
| `destinations`         | `object`  | GitHub destinations for generated output.                        |
| `publish`              | `object`  | Go module publishing configuration.                              |

## Module Path

The module path is normally derived from `destinations.production.repo`: `acme/acme-go` becomes `github.com/acme/acme-go`. Set `goModulePathOverride` when the path consumers import differs from the repository the code is pushed to — a vanity import domain, or a module served from a subdirectory.

```json
{
  "targets": {
    "go": {
      "goModulePathOverride": "go.acme.com/api"
    }
  }
}
```

## Client Shape

By default the generated client is value-shaped: `NewClient` returns a `Client` and service fields are plain values. Set `pointerServices` to `true` for the pointer-shaped surface instead — `NewClient` returns `*Client` and service fields are `*XService`.

```json
{
  "targets": {
    "go": {
      "pointerServices": true
    }
  }
}
```

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

```json
{
  "targets": {
    "go": {
      "destinations": {
        "production": {
          "repo": "acme/acme-go",
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

Set `publish.go` to `true` to tag each release so the Go module proxy can serve it. Go has no registry upload and needs no secrets — see [Go publishing](../publishing/go.md).

```json
{
  "targets": {
    "go": {
      "publish": {
        "go": true
      }
    }
  }
}
```

| Property             | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| `authMethod`         | Registry authentication mechanism, such as `oidc` or `access-token`. |
| `releaseEnvironment` | Release environment name used by generated publishing workflows. |
