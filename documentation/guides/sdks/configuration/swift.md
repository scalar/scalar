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
| `version`        | `string`  | Target-specific SDK version override.                            |
| `skip`           | `boolean` | Set to `true` to keep the config without generating this target. |
| `destinations`   | `object`  | GitHub destinations for generated output.                        |
| `publish`        | `object`  | Swift package publishing configuration.                          |
| `publish.swiftpm` | `boolean` | Tag-based Swift package publishing settings.                    |

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

## Publishing

Swift packages are distributed through the Swift Package Manager, which resolves them straight from a Git tag. There is no central registry to upload to.

Like Go, the Swift target needs **no registry account, no token, and no secrets**, and gets no release workflow. The `vX.Y.Z` Git tag and GitHub Release that Scalar creates on merge are the published version.

### Enable publishing

```json
{
  "targets": {
    "swift": {
      "packageName": "AcmeAPI",
      "publish": { "swiftpm": true }
    }
  }
}
```

This adds the `VERSIONING.md` note and ensures every merged build is tagged. The generated `sdk-ci.yml` builds and tests the package on each pull request.

### How consumers install it

In `Package.swift`:

```swift
dependencies: [
  .package(url: "https://github.com/acme/acme-swift.git", from: "1.2.3")
]
```

### Notes

- The repository must be reachable by your consumers (public, or accessible to their Swift Package Manager) for tag resolution to work.
