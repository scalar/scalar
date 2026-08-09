# Swift

> [!NOTE]
> The Swift target is experimental.

Add `swift` under `targets` to generate a Swift SDK package.

```json
{
  "targets": {
    "swift": {
      "packageName": "AcmeAPI",
      "destinations": {
        "production": {
          "repo": "acme/acme-swift",
          "branch": "main"
        }
      },
      "publish": {
        "swiftpm": true
      }
    }
  }
}
```

## Target Options

| Property       | Type      | Description                                                      |
| -------------- | --------- | ---------------------------------------------------------------- |
| `packageName`  | `string`  | Swift package name.                                              |
| `skip`         | `boolean` | Set to `true` to keep the config without generating this target. |
| `destinations` | `object`  | GitHub destinations for generated output.                        |
| `publish`      | `object`  | Swift Package Manager publishing configuration.                  |

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
| `branch` | Default branch of the destination repository that releases are promoted to. Defaults to `main`. Generated output itself always goes to the fixed `scalar-generated` branch. |

## Publishing

Set `publish.swiftpm` to `true` to tag each release for Swift Package Manager. There is no registry upload and no secret to add — see [Swift publishing](../publishing/swift.md).

```json
{
  "targets": {
    "swift": {
      "publish": {
        "swiftpm": true
      }
    }
  }
}
```

| Property             | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| `swiftpm`            | Set to `true` to tag each release for Swift Package Manager.  |

Swift Package Manager resolves packages straight from the Git tag, so no publish job is generated for this target. The shared `authMethod` and `releaseEnvironment` publish options have nothing to act on here and are ignored.
