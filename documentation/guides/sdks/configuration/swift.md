# Swift

> [!NOTE]
> The Swift target is experimental.

Add `swift` under `targets` to generate a Swift SDK package.

```json
{
  "targets": {
    "swift": {
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-swift",
          "branch": "main"
        }
      }
    }
  }
}
```

## Target Options

Swift currently uses the shared target options from the SDK Generator config.

| Property       | Type      | Description                                                      |
| -------------- | --------- | ---------------------------------------------------------------- |
| `version`      | `string`  | Target-specific SDK version override.                            |
| `skip`         | `boolean` | Set to `true` to keep the config without generating this target. |
| `destinations` | `object`  | GitHub destinations for generated output.                        |

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

```json
{
  "targets": {
    "swift": {
      "destinations": {
        "production": {
          "repo": "acme/acme-swift",
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
