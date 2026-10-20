# Go

Go modules have no central registry. A module is "published" by tagging a version in its repository, and the [Go module proxy](https://proxy.golang.org/) serves it from there. See the [Go configuration](../configuration/go.md#publish) for module path options.

Because of this, the Go target needs **no registry account, no token, and no secrets**, and `authMethod` does not apply. The `vX.Y.Z` Git tag and GitHub Release cut when you merge the release pull request *are* the published version.

## Enable publishing

```json
{
  "targets": {
    "go": {
      "destinations": { "production": { "repo": "acme/acme-go" } },
      "publish": { "go": true }
    }
  }
}
```

Linking the repository already gives you CI (`sdk-ci.yml` builds and vets the module on each pull request), release-please tags, and `VERSIONING.md`. Enabling `publish.go` adds a `publish` job to `release-please.yml`, plus `sdk-release.yml` for manual re-runs.

That job uploads nothing: Go versions are tags, but unlike Swift and PHP, Go still gets a release workflow. After the tag is cut, the `publish` job asks the public Go module proxy for the new version so it is cached (and indexed on pkg.go.dev) immediately, instead of on the first consumer's `go get`. It reads the module path out of `go.mod` at run time and is best-effort: a private repository is invisible to the public proxy, and a failed warm-up leaves a warning on the run instead of failing the release.

## How consumers install it

```bash
go get github.com/acme/acme-go@v1.2.3
```

The proxy fetches the version from the Git tag the first time someone requests it.

## Notes

- The repository must be **public** for the public module proxy to serve it. For private modules, consumers set `GOPRIVATE` (or use a private proxy).
- The module path is `github.com/<owner>/<repo>`, from `destinations.production.repo`, unless `goModulePathOverride` sets another. Make sure it matches where consumers will import from.
