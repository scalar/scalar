# Go

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
| `publish`      | `object`  | Go module publishing configuration.                              |
| `publish.go`   | `boolean` | Tag-based Go module publishing settings.                         |

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

## Publishing

Go modules have no central registry. A module is "published" by tagging a version in its repository, and the [Go module proxy](https://proxy.golang.org/) serves it from there.

Because of this, the Go target needs **no registry account, no token, and no secrets**. There is no release workflow to set up. The `vX.Y.Z` Git tag and GitHub Release that Scalar creates when you merge a build *are* the published version.

### Enable publishing

```json
{
  "targets": {
    "go": {
      "repo": "acme/acme-go",
      "publish": { "go": true }
    }
  }
}
```

This adds the `VERSIONING.md` note and ensures every merged build is tagged. The generated `sdk-ci.yml` still builds and vets the module on each pull request.

### How consumers install it

```bash
go get github.com/acme/acme-go@v1.2.3
```

The proxy fetches the version from the Git tag the first time someone requests it.

### Notes

- The repository must be **public** for the public module proxy to serve it. For private modules, consumers set `GOPRIVATE` (or use a private proxy).
- The module path is derived from the repository, so make sure the `repo` matches where consumers will import from.
