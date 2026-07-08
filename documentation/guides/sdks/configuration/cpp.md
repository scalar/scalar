# C++

> [!NOTE]
> The C++ target is experimental.

Add `cpp` under `targets` to generate a C++ SDK. C++ has no universal package registry, so the target generates the library and a CMake-based CI workflow but no publishing workflow. Distribute the build artifacts from your GitHub Release.

```json
{
  "targets": {
    "cpp": {
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-cpp"
        }
      }
    }
  }
}
```

## Target Options

| Property       | Type      | Description                                                      |
| -------------- | --------- | ---------------------------------------------------------------- |
| `version`      | `string`  | Target-specific SDK version override.                            |
| `skip`         | `boolean` | Set to `true` to keep the config without generating this target. |
| `destinations` | `object`  | GitHub destinations for generated output.                        |

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

| Property | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `repo`   | GitHub repository in `owner/name` form.                                     |
| `branch` | Branch to push generated output to. Defaults to the repository default.     |
