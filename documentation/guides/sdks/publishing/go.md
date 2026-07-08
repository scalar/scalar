# Go

Go modules have no central registry. A module is "published" by tagging a version in its repository, and the [Go module proxy](https://proxy.golang.org/) serves it from there. See the [Go configuration](../configuration/go.md) for module path options.

Because of this, the Go target needs **no registry account, no token, and no secrets**. There is no release workflow to set up. The `vX.Y.Z` Git tag and GitHub Release that Scalar creates when you merge a build *are* the published version.

## Enable publishing

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

## How consumers install it

```bash
go get github.com/acme/acme-go@v1.2.3
```

The proxy fetches the version from the Git tag the first time someone requests it.

## Notes

- The repository must be **public** for the public module proxy to serve it. For private modules, consumers set `GOPRIVATE` (or use a private proxy).
- The module path is derived from the repository, so make sure the `repo` matches where consumers will import from.
