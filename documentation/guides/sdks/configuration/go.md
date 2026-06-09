# Go

> [!NOTE]
> The Go target is experimental.

Add `go` under `targets` to generate a Go SDK package.

```json
{
  "targets": {
    "go": {
      "packageName": "github.com/acme/acme-go",
      "repo": "github.com/acme/acme-go",
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-go"
        }
      }
    }
  }
}
```

## Target Options

| Property       | Type      | Description                                                      |
| -------------- | --------- | ---------------------------------------------------------------- |
| `packageName`  | `string`  | Go module or package name.                                       |
| `repo`         | `string`  | Repository where the generated target is intended to be published. |
| `version`      | `string`  | Target-specific SDK version override.                            |
| `skip`         | `boolean` | Set to `true` to keep the config without generating this target. |
| `destinations` | `object`  | GitHub destinations for generated output.                        |

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
| `branch` | Branch to push generated output to. Defaults to the repository default.     |
