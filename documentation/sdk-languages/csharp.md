# C# SDK generator from OpenAPI

Scalar can generate a .NET SDK in C# from your OpenAPI document and publish it to NuGet through a workflow in your own repository. **The C# target is experimental.** It generates working code and is in the same continuous integration matrix as the generally available targets, but it has not reached GA, and there is no public C# sample yet. So this page shows configuration, publishing, and the behaviour our docs commit to, and it labels anything else as what the generator targets rather than output you can already read.

## Why .NET teams end up here

Many ASP.NET Core teams already meet Scalar through their API reference. Microsoft Learn's page on [using OpenAPI documents in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents) has a section on using Scalar for interactive API documentation, with the `Scalar.AspNetCore` package and a single call:

```csharp
app.MapOpenApi();
app.MapScalarApiReference();
```

The same OpenAPI document your app serves at `/openapi/v1.json` is the input for SDK generation. Put it in the [Scalar Registry](/products/registry), add a C# target, and your API reference and your client library come from one description. The [ASP.NET Core integration guide](/products/api-references/integrations/aspnetcore/integration) covers the documentation half.

## What the generator targets for C#

<scalar-callout type="warning" icon="phosphor/regular/warning">
  There is no public C# sample yet. The call shapes below come from the documented pagination behaviour of the C# target; everything else in this section describes shared generator behaviour. Generate a preview from your own document to see real output.
</scalar-callout>

**Async all the way down.** The [pagination guide](/products/sdk-generator/pagination) documents how a C# list method is consumed. Walking every item across pages is an `await foreach` over an async stream:

```csharp
await foreach (var item in page.Paginate())
{
    Console.WriteLine(item.Id);
}
```

To step through one page at a time, the page exposes `page.HasNext()` and `page.Next()`. For cursor-id schemes, where the next request uses an identifier from the last item, the C# target reads `itemCursor`, which several other experimental targets do not.

**Resource tree and naming.** Resources and methods come from the same configuration as every other target, with normalised verbs (`List`, `Retrieve`, `Create`) cased for C#.

**The generator's shared feature set.** The SDK Generator's feature list covers retries on temporary failures (twice by default, for network errors, 408, 409, 429, and 5xx), `Retry-After` support, a 60-second default timeout, idempotency keys, and typed errors exposing status, headers, and the parsed body. On an experimental target, confirm how each surfaces in C# by reading your preview.

**Authentication.** API keys in a header, query, or cookie; HTTP Basic and Bearer; OAuth 2.0 and OIDC, each with an environment variable default.

**One pagination limitation to plan around.** If your API returns a full URL for the next page (a `cursorUrl` scheme), the C# target currently renders only the last page it can reach rather than following the URL. Prefer a `cursor` token scheme if your API supports both.

## Configure the target

```json
{
  "targets": {
    "csharp": {
      "packageName": "Acme.Api",
      "destinations": {
        "production": { "repo": "acme/acme-csharp" }
      },
      "publish": {
        "nuget": {
          "authMethod": "oidc",
          "homepage": "https://acme.com",
          "description": "Acme API .NET SDK"
        }
      }
    }
  }
}
```

`packageName` is the NuGet package id, so follow .NET conventions (`Company.Product`). See the [C# configuration](/products/sdk-generator/configuration/csharp) reference.

## Publishing to NuGet

NuGet supports trusted publishing, and that is the recommended path. The generated workflow uses the `NuGet/login` action to exchange the GitHub workflow's identity token for a short-lived API key at publish time.

1. On nuget.org, open **Account → Trusted Publishing** and add a policy for your repository with the workflow file `release-please.yml`.
2. Add one repository secret, `NUGET_USER`, set to your nuget.org username. NuGet's OIDC login needs it; the key itself is minted on the fly.
3. Merge the release pull request Scalar keeps open in your repository.

If you would rather use a long-lived key, create one scoped to push your package, store it as `NUGET_API_KEY`, and set `"authMethod": "access-token"`. Either way the push uses `--skip-duplicate`, so re-running a release is harmless. See [NuGet publishing](/products/sdk-generator/publishing/csharp).

## Scalar compared with OpenAPI Generator for C#

OpenAPI Generator's [`csharp` generator](https://openapi-generator.tech/docs/generators/csharp) is stable, free, and has kept up with .NET. Its default `library` is `generichost`, which uses `HttpClient`, integrates with the .NET Generic Host for dependency injection, and serialises with `System.Text.Json`. Other options are `httpclient` (with Newtonsoft.Json), `restsharp`, and `unityWebRequest` for Unity games. The default `targetFramework` is `net10.0`, and the project publishes samples for .NET Framework 4.7 and 4.8, .NET Standard 2.0, and recent .NET versions. Nullable reference types are off by default and can be enabled.

If you need a Unity client, .NET Framework support, or tight Generic Host integration out of the box, OpenAPI Generator covers those today, and we would point you to it.

| | Scalar C# target (experimental) | OpenAPI Generator `csharp` |
| --- | --- | --- |
| Status | Experimental | Stable |
| HTTP and DI | One generated client | `generichost` (default), `httpclient`, `restsharp`, `unityWebRequest` |
| Target frameworks | Set by the generator | Configurable; default `net10.0` |
| `oneOf` / `anyOf` / `allOf` | Lowered into typed unions; check your preview | Marked unsupported in the generator's feature table |
| Pagination | `await foreach` over `Paginate()` | Not among the generator's documented options |
| NuGet release | OIDC trusted publishing workflow generated into your repo | Project files generated; release process is yours |
| Same config drives other languages | Yes | Separate generator run per language |

For a broader look at when OpenAPI Generator is the right tool, read [OpenAPI Generator alternatives](/alternatives/openapi-generator).

## Frequently asked questions

<scalar-detail title="Is the C# SDK generator production ready?">

Not yet. C# is experimental. It generates working code and sits in the same continuous integration matrix as the GA targets, alongside Java, Kotlin, and Ruby. Talk to us before you ship it to customers.

</scalar-detail>

<scalar-detail title="Can I publish to NuGet without storing an API key?">

Yes. Add a trusted publishing policy on nuget.org for your repository and `release-please.yml`. The workflow mints a short-lived key at publish time. NuGet's OIDC login still needs your username as the `NUGET_USER` secret.

</scalar-detail>

<scalar-detail title="Can I generate a C# SDK from an ASP.NET Core app's OpenAPI document?">

Yes. The document produced by `Microsoft.AspNetCore.OpenApi` (or Swashbuckle, or NSwag) is a normal OpenAPI document. Import it into the Scalar Registry and add a C# target.

</scalar-detail>

<scalar-detail title="Does the generated C# SDK support async and await?">

Yes. Pagination is documented as an `await foreach` over `page.Paginate()`. Confirm the rest of the async surface in your preview.

</scalar-detail>

<scalar-detail title="How do I try the C# output?">

Add the C# target in the dashboard. It gets a preview repository with the generated code, README, and `api.md`, and every target is free during your trial.

</scalar-detail>

<scalar-button
  title="Preview a C# SDK from your OpenAPI document"
  href="https://dashboard.scalar.com/register">
</scalar-button>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [OpenAPI Generator alternatives](/alternatives/openapi-generator)
- **Docs:** [C# configuration](/products/sdk-generator/configuration/csharp) · [Publishing to NuGet](/products/sdk-generator/publishing/csharp)
- **Product:** [SDK Generator](/products/sdk-generator) — one OpenAPI document for your API reference and your .NET client

---

*OpenAPI Generator details are taken from [openapi-generator.tech](https://openapi-generator.tech/docs/generators/csharp) and the [OpenAPITools/openapi-generator repository](https://github.com/OpenAPITools/openapi-generator/tree/master/samples/client/petstore/csharp/generichost) as of September 2026 (release 7.25.0). If something here is out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will fix it.*
