# Go SDK generator from OpenAPI

Scalar generates a Go module from your OpenAPI document that looks like the Go your team already writes: `context.Context` first on every call, functional options for configuration, typed errors you unwrap with `errors.As`, and an auto-paging iterator in the `Next()` / `Current()` / `Err()` style of `bufio.Scanner`. Go is a generally available target, tested end to end against a live server on every generator change.

## What the generated code looks like

This is the quickstart from the Go module Scalar generates for Warp's HR API, published at [TeamWarp/warp-sdk-go](https://github.com/TeamWarp/warp-sdk-go):

```go
package main

import (
	"context"
	"fmt"
	"os"

	sdk "github.com/TeamWarp/warp-go-sdk"
	"github.com/TeamWarp/warp-go-sdk/option"
)

func main() {
	client := sdk.NewClient(option.WithAPIKey(os.Getenv("WARP_API_KEY")))

	iter := client.TimeOff.ListAssignmentsAutoPaging(context.Background(),
		sdk.TimeOffListAssignmentsParams{Limit: sdk.Int(50)})

	for iter.Next() {
		assignment := iter.Current()
		fmt.Println(assignment.ID, assignment.Policy.Name)
	}

	if err := iter.Err(); err != nil {
		panic(err)
	}
}
```

Notice what is missing. There is no `Configuration` struct to build, no `Execute()` at the end of a request builder, and no third return value carrying the raw HTTP response on every call. Initialisms follow Go conventions (`ID`, not `Id`), and optional parameters use small helpers such as `sdk.Int(50)` rather than pointers you have to take the address of yourself.

## Go idioms the generator follows

**Context first, always.** Every method takes a `context.Context` as its first argument, so cancellation, deadlines, and tracing propagate the way they do in the rest of your service.

**Functional options.** Client-wide settings and per-request overrides use the same `option.RequestOption` type:

```go
client := sdk.NewClient(
	option.WithMaxRetries(3),
	option.WithRequestTimeout(20*time.Second),
)

var raw *http.Response
assignment, err := client.TimeOff.RetrieveAssignment(ctx, id,
	option.WithHeader("X-Request-Source", "payroll-sync"),
	option.WithResponseInto(&raw),
)
```

Other options include `option.WithBaseURL`, `option.WithHTTPClient` for your own transport, and `option.WithMiddleware` for logging or tracing.

**Errors as values.** A non-success response returns a `*sdk.Error` that you can pull out of the error chain:

```go
var apiErr *sdk.Error
if errors.As(err, &apiErr) {
	fmt.Println(apiErr.StatusCode, apiErr.RawJSON())
}
```

**Retries you do not have to write.** Temporary failures (network errors, 408, 409, 429, and 5xx) are retried twice by default, and `Retry-After` is honoured. A timeout set with `option.WithRequestTimeout` applies to each attempt.

**Two ways to paginate.** `ListXAutoPaging` returns an iterator that fetches the next page as you call `Next()`. If you need page boundaries (to checkpoint a sync job, say), call the plain `ListX` method and use `page.GetNextPage()`.

**Optional values without pointer gymnastics.** The generated package exposes `String`, `Int`, `Bool`, `Float`, `Time`, `Opt`, and `Ptr` helpers for setting optional parameters. The Warp module targets Go 1.22 or newer.

## Configure the target

```json
{
  "targets": {
    "go": {
      "packageName": "acmeapi",
      "destinations": {
        "production": { "repo": "acme/acme-go" }
      },
      "publish": { "go": true }
    }
  }
}
```

Two Go-specific options are worth knowing about:

- **`goModulePathOverride`** sets the module path written to `go.mod` and every import. By default it is derived from the repository (`acme/acme-go` becomes `github.com/acme/acme-go`). Set it for a vanity import path such as `go.acme.com/api`.
- **`pointerServices`** switches to a pointer-shaped surface: `NewClient` returns `*Client` and service fields are `*XService`. The default is value-shaped.

See the [Go configuration](/products/sdk-generator/configuration/go) reference for the rest.

## Publishing a Go module

Go has no registry upload, so publishing Go is mostly about tags. When you merge the release pull request Scalar keeps open in your repository, the `vX.Y.Z` tag and GitHub Release are the published version. There is no registry account, token, or secret to configure.

The generated `publish` job still does one useful thing: it asks the public [Go module proxy](https://proxy.golang.org/) for the new version so it is cached, and listed on pkg.go.dev, right away rather than on the first user's `go get`. That warm-up is best effort and never fails a release.

Consumers install with:

```bash
go get github.com/acme/acme-go@v1.2.3
```

The repository must be public for the public proxy to serve it. For a private module, consumers set `GOPRIVATE` or use a private proxy. A generated `sdk-ci.yml` builds and vets the module on every pull request. See [Go publishing](/products/sdk-generator/publishing/go).

## Scalar compared with OpenAPI Generator for Go

OpenAPI Generator's [`go` generator](https://openapi-generator.tech/docs/generators/go) is stable and widely used. Its feature table marks `oneOf`, `anyOf`, and `allOf` as supported, it can generate interfaces for its API services (`generateInterfaces`) for easier mocking, and it writes a `go.mod` by default. For a lot of internal clients that is plenty.

Its call sites follow a request-builder pattern. From the generator's [petstore sample](https://github.com/OpenAPITools/openapi-generator/blob/master/samples/client/petstore/go/go-petstore/docs/PetAPI.md):

```go
configuration := openapiclient.NewConfiguration()
apiClient := openapiclient.NewAPIClient(configuration)
resp, r, err := apiClient.PetAPI.GetPetById(context.Background(), petId).Execute()
```

| | Scalar Go target | OpenAPI Generator `go` |
| --- | --- | --- |
| Construction | `sdk.NewClient(option.With...)` | `NewConfiguration()` then `NewAPIClient(cfg)` |
| Call shape | `client.Pet.Retrieve(ctx, id)` returning `(*Pet, error)` | `GetPetById(ctx, id).Execute()` returning `(resp, *http.Response, error)` |
| Auth | Options, with an environment variable default | Values placed on the `context` |
| Pagination | `AutoPaging` iterators | Not among the generator's documented options |
| Retries | Built in, honours `Retry-After` | Not among the generator's documented options |
| Module path | Derived from the repository, or `goModulePathOverride` | `packageName`, default `openapi`, with `isGoSubmodule` for nested modules |
| Release | Tagging and proxy warm-up generated into your repo | Your own tagging process |

If you are weighing open source generators more broadly, see [OpenAPI Generator alternatives](/alternatives/openapi-generator).

## Frequently asked questions

<scalar-detail title="Is the Go SDK generator generally available?">

Yes. Go is generally available along with TypeScript, Python, Java, Kotlin, Ruby, and the CLI, and runs through the same end-to-end tests on every generator change.

</scalar-detail>

<scalar-detail title="Do I need a registry account to publish a Go SDK?">

No. A Go module is published by tagging a version in its repository. Scalar cuts the tag when you merge the release pull request and then warms the public module proxy so the version is available immediately.

</scalar-detail>

<scalar-detail title="Can I use a vanity import path like go.acme.com/api?">

Yes. Set `goModulePathOverride` on the Go target. It is written to `go.mod` and every generated import.

</scalar-detail>

<scalar-detail title="How do I mock the generated Go client in tests?">

Pass your own transport with `option.WithHTTPClient`, or point `option.WithBaseURL` at a test server. Scalar also generates smoke tests that call every operation against a mock server; the [mock server](/tools/mock-server/getting-started) is open source if you want the same setup locally.

</scalar-detail>

<scalar-detail title="Can I build my SDK against a private Go module?">

Yes. The repository just needs to be reachable by your consumers. They set `GOPRIVATE` (or use a private proxy) so `go get` fetches it directly instead of through the public proxy.

</scalar-detail>

<scalar-detail title="How does the Go SDK stay in sync with my API?">

Point the SDK at an exact version of your OpenAPI document or at a semver range such as `^1.2.0`. When a matching document changes, Scalar mints a new SDK version, rebuilds every target, and opens a release pull request in each repository.

</scalar-detail>

<scalar-button
  title="Generate a Go SDK from your OpenAPI document"
  href="https://dashboard.scalar.com/register">
</scalar-button>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [OpenAPI Generator alternatives](/alternatives/openapi-generator)
- **Docs:** [Go configuration](/products/sdk-generator/configuration/go) · [Publishing Go modules](/products/sdk-generator/publishing/go)
- **Product:** [SDK Generator](/products/sdk-generator) — Go, TypeScript, Python, and CLI clients kept in sync with your API

---

*OpenAPI Generator details are taken from [openapi-generator.tech](https://openapi-generator.tech/docs/generators/go) and the [OpenAPITools/openapi-generator repository](https://github.com/OpenAPITools/openapi-generator) as of September 2026 (release 7.25.0). If something here is out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will fix it.*
