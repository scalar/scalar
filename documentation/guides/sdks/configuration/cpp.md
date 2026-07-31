# C++

> [!NOTE]
> The C++ target is experimental.

Add `cpp` under `targets` to generate a C++ SDK. C++ has no universal package registry, so the target generates the library and a CMake-based CI workflow but no publishing workflow. Distribute the build artifacts from your GitHub Release.

```json
{
  "targets": {
    "cpp": {
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
| `skip`         | `boolean` | Set to `true` to keep the config without generating this target. |
| `destinations` | `object`  | GitHub destinations for generated output.                        |

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

| Property | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `repo`   | GitHub repository in `owner/name` form.                                     |
| `branch` | Default branch of the destination repository that releases are promoted to. Defaults to `main`. Generated output itself always goes to the fixed `scalar-generated` branch. |
