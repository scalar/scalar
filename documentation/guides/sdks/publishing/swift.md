# Swift

Swift packages are distributed through the Swift Package Manager, which resolves them straight from a Git tag. There is no central registry to upload to. See the [Swift configuration](../configuration/swift.md) for options.

The Swift target needs **no registry account, no token, and no secrets**, and gets no `publish` job or `sdk-release.yml`. The `vX.Y.Z` Git tag and GitHub Release cut when you merge the release pull request are the published version.

## Enable publishing

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

This adds the `VERSIONING.md` note and ensures every release is tagged. The generated `sdk-ci.yml` builds and tests the package on each pull request.

## How consumers install it

In `Package.swift`:

```swift
dependencies: [
  .package(url: "https://github.com/acme/acme-swift.git", from: "1.2.3")
]
```

## Notes

- The repository must be reachable by your consumers (public, or accessible to their Swift Package Manager) for tag resolution to work.
