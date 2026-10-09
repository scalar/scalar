# Swift SDK generator from OpenAPI

Scalar can generate a Swift package from your OpenAPI document and distribute it through the Swift Package Manager, straight from a Git tag, with no registry account and no secrets. **The Swift target is experimental**, and of all Scalar's targets it is the one with the most visible gaps today: it does not yet generate pagination helpers, and there is no public Swift sample. This page is written to help you decide whether it fits your API now, so it leads with what the target does not do.

## What to know before you choose the Swift target

**Pagination is not generated yet.** On every other target, a paginated method returns a page you can iterate. On Swift, the [pagination guide](/products/sdk-generator/pagination) is explicit that a paginated method returns the response as it is. You get the typed response, including any cursor or `has_more` field, and your code decides when to fetch the next page.

For an API with a handful of list endpoints that is a small amount of code. For an API where most calls are paginated, it is a real cost, and you should weigh it before you ship the Swift SDK to iOS developers.

**Everything else follows the shared generator.** The Swift SDK is generated from the same configuration as your TypeScript, Python, and Go SDKs: the same resources, the same normalised method names (`list`, `retrieve`, `create`), and authentication from your security schemes (API keys, HTTP Basic and Bearer, OAuth 2.0, and OIDC). The SDK Generator's shared feature list also covers retries on temporary failures, `Retry-After` support, a 60-second default timeout, and typed errors carrying status, headers, and body. Because the target is experimental, confirm how each of these surfaces in Swift by reading your preview repository.

## What the generator targets for Swift

<scalar-callout type="warning" icon="phosphor/regular/warning">
  There is no public Swift sample yet, so this page does not show generated Swift code. Add the Swift target to get a preview repository with the real output, README, and `api.md`.
</scalar-callout>

A Swift SDK is judged by a short list of questions, and they are the ones to ask of the preview:

- Do calls use `async`/`await` and `throws`, so they fit structured concurrency without wrapping callbacks?
- Are models value types conforming to `Codable`, with Swift property names mapped from your wire names?
- Are optional fields Swift optionals rather than sentinel values?
- Does the package build for the platforms your users target (iOS, macOS, Linux on the server)?

The generated `sdk-ci.yml` builds and tests the package on every pull request, which gives you a baseline, but those four questions are what your iOS developers will notice first.

## Configure the target

```json
{
  "targets": {
    "swift": {
      "packageName": "AcmeAPI",
      "destinations": {
        "production": { "repo": "acme/acme-swift", "branch": "main" }
      },
      "publish": { "swiftpm": true }
    }
  }
}
```

`packageName` is the Swift package name, so use UpperCamelCase as Swift packages conventionally do. The full option list is short; see the [Swift configuration](/products/sdk-generator/configuration/swift) reference.

## Publishing with Swift Package Manager

Swift Package Manager resolves packages directly from Git tags. There is no central upload, so the Swift target needs no registry account, no token, and no secret, and no `publish` job is generated for it.

When you merge the release pull request Scalar keeps open in your repository, the `vX.Y.Z` tag and GitHub Release are the published version. `publish.swiftpm` also adds a `VERSIONING.md` note and makes sure every release is tagged.

Your users add the dependency in `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/acme/acme-swift.git", from: "1.2.3")
]
```

Or through Xcode's **Add Package Dependencies** dialog with the same URL. The repository has to be reachable by your consumers, either public or accessible to their Swift Package Manager setup. See [Swift publishing](/products/sdk-generator/publishing/swift).

## Scalar compared with OpenAPI Generator for Swift

OpenAPI Generator has several Swift client generators. According to its [generator list](https://openapi-generator.tech/docs/generators), `swift6` is current, `swift5` is marked deprecated, and there is a separate `swift-combine` generator. The [`swift6` generator](https://openapi-generator.tech/docs/generators/swift6) is stable, uses `URLSession` by default with `alamofire` and `vapor` as alternatives, and offers a `responseAs` option to choose how calls return: `AsyncAwait`, `Combine`, `Result`, `RxSwift`, `ObjcBlock`, or `PromiseKit`.

That is a lot of choice, and for Swift today it makes OpenAPI Generator the more mature option. If you need Combine or RxSwift output, Vapor as a transport, or a stable generator you can ship to an App Store audience now, we would point you there.

| | Scalar Swift target (experimental) | OpenAPI Generator `swift6` |
| --- | --- | --- |
| Status | Experimental | Stable (`swift5` deprecated) |
| HTTP client | Generated client | `URLSession` (default), Alamofire, or Vapor |
| Response style | Set by the generator | `AsyncAwait`, `Combine`, `Result`, `RxSwift`, and more |
| `oneOf` / `anyOf` / `allOf` | Lowered into typed unions; check your preview | Marked unsupported in the generator's feature table |
| Pagination | Not yet generated | Not among the generator's documented options |
| Release | Tagged on merge for SwiftPM, no secrets | Your own tagging process |
| Same config drives other languages | Yes | Separate generator run per language |

Where Scalar helps is keeping the Swift client in step with the rest: one API change regenerates every target and opens a pull request in each repository. For a closer look at the open source route, read [OpenAPI Generator alternatives](/alternatives/openapi-generator).

## Frequently asked questions

<scalar-detail title="Is the Swift SDK generator production ready?">

No. Swift is experimental and does not yet generate pagination helpers. Talk to us before you publish a Swift SDK to your users.

</scalar-detail>

<scalar-detail title="Do I need an account on a Swift package registry?">

No. Swift Package Manager resolves packages from Git tags. Scalar tags each release when you merge the release pull request, and there is nothing to upload or authenticate.

</scalar-detail>

<scalar-detail title="Does the Swift SDK handle pagination?">

Not yet. A paginated method returns the response as it is, and your code requests the next page. Every other Scalar target generates page iterators.

</scalar-detail>

<scalar-detail title="Can I use the generated Swift package in an iOS app?">

It is a standard Swift package added through Swift Package Manager or Xcode. Check the supported platforms declared in the generated `Package.swift` in your preview repository before you rely on it.

</scalar-detail>

<scalar-detail title="Can the Swift SDK live in a private repository?">

Yes, as long as your consumers' Swift Package Manager can reach it, for example with Git credentials configured for that host.

</scalar-detail>

<scalar-button
  title="Preview a Swift package from your OpenAPI document"
  href="https://dashboard.scalar.com/register">
</scalar-button>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [OpenAPI Generator alternatives](/alternatives/openapi-generator)
- **Docs:** [Swift configuration](/products/sdk-generator/configuration/swift) · [Publishing with Swift Package Manager](/products/sdk-generator/publishing/swift)
- **Product:** [SDK Generator](/products/sdk-generator) — keep a Swift client in step with your other SDKs from one OpenAPI document

---

*OpenAPI Generator details are taken from [openapi-generator.tech](https://openapi-generator.tech/docs/generators/swift6) and the [OpenAPITools/openapi-generator repository](https://github.com/OpenAPITools/openapi-generator) as of September 2026 (release 7.25.0). If something here is out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will fix it.*
