# TypeScript SDK generator from OpenAPI

Scalar turns your OpenAPI document into a TypeScript SDK that reads like a hand-written client: one default export named after your API, typed methods grouped by resource, and pagination, retries, and errors handled for you. TypeScript is a generally available target, which means it runs through end-to-end tests that generate, build, and call a live server on every change to the generator.

This page shows what the output looks like, which TypeScript conventions it follows, how it reaches npm, and how it differs from what OpenAPI Generator produces for the same document.

## What the generated code looks like

This is the quickstart from the SDK Scalar generates for Warp's HR API. The package is public on npm as `warp-hr`, and the source is in [TeamWarp/warp-sdk-typescript](https://github.com/TeamWarp/warp-sdk-typescript).

```ts
import WarpAPI from 'warp-hr'

const client = new WarpAPI({
  apiKey: process.env['WARP_API_KEY'], // defaults to the WARP_API_KEY env var
})

// Auto-paginating: the next cursor page is fetched as you iterate.
for await (const assignment of client.timeOff.listAssignments({ limit: 50 })) {
  console.log(assignment.id, assignment.policy.name)
}
```

A few things are doing the work here. The client is the default export, so the import reads like the product rather than like a code generator. The credential falls back to an environment variable, so the happy path needs no secret inline. And the method is `listAssignments` on a `timeOff` resource, not `timeOffListAssignmentsGet` on a `TimeOffApi` class.

## TypeScript idioms the generator follows

**Types that match your schemas.** Every operation gets typed request parameters and a typed response model. `oneOf`, `anyOf`, and `allOf` become real TypeScript union and intersection types, with discriminator support, so narrowing on a `type` field works the way you would expect in an editor.

**Property naming is your choice.** By default the SDK keeps wire names, so `order_by` stays `order_by`. Set `options.propertyCasing` to `sdk` and you get `orderBy` in TypeScript, with a generated remap that keeps request and response bodies correct on the network.

**Promises you can inspect.** Every operation returns an `APIPromise`. Await it for the parsed body, or chain `.withResponse()` to get both the parsed data and the raw `Response` object.

**Retries and timeouts with sensible defaults.** Temporary failures (network errors, 408, 409, 429, and 5xx) are retried twice by default, and `Retry-After` is honoured when the server sends it. The default timeout is 60 seconds. Both can be set on the client or per request, alongside an `AbortSignal` and an idempotency key:

```ts
const client = new WarpAPI({ maxRetries: 3, timeout: 20_000 })

const assignment = await client.timeOff.createAssignment(body, {
  idempotencyKey: crypto.randomUUID(),
  maxRetries: 0,
})
```

**Pagination as async iteration.** A paginated method returns a page you can `for await` over, or walk manually with `page.hasNextPage()`, `page.getNextPage()`, and `page.iterPages()`. Cursor, cursor-id, offset, page-number, and single-response schemes are all supported; see [pagination](/products/sdk-generator/pagination) for how you declare them.

**Errors you can branch on.** Non-success responses throw a generated `APIError` carrying the status, headers, parsed body, and request metadata. The generated README lists the error statuses your API documents for each operation, so handling them is not guesswork.

**Runs where `fetch` runs.** The generated Warp package ships with `"dependencies": {}` and its README targets Node.js 20 or later, modern browsers, and any runtime with `fetch`. You can pass your own `fetch` implementation for instrumentation or testing.

## Configure the target

Add `typescript` under `targets` in your SDK configuration:

```json
{
  "targets": {
    "typescript": {
      "packageName": "@acme/api",
      "packageManager": "pnpm",
      "options": { "propertyCasing": "sdk" },
      "destinations": {
        "production": { "repo": "acme/acme-typescript", "branch": "main" }
      },
      "publish": { "npm": true }
    }
  }
}
```

The TypeScript target also has a `compatibility` option for teams moving from another generator. Set it to `speakeasy` and the generator additionally emits `src/compat/speakeasy.ts`, a module of deprecated wrappers that reproduce Speakeasy's standalone-function surface and forward to the new SDK. Existing call sites keep compiling while your users move over. The full reference is in the [TypeScript configuration](/products/sdk-generator/configuration/typescript) docs.

## Publishing to npm

The SDK lives in your GitHub repository under your package name. Scalar opens a release pull request maintained by release-please; when you merge it, a `publish` job inside `release-please.yml` pushes the package to npm.

The recommended path is **npm trusted publishing (OIDC)**. On npmjs.com you add a trusted publisher for your repository with the workflow file `release-please.yml`, and npm mints a short-lived, provenance-signed credential at publish time. Nothing is stored in your repository. Trusted publishing needs npm 11.5.1 or later; the generated workflow upgrades npm before it publishes. If you cannot use OIDC, add an `NPM_TOKEN` secret and set `"authMethod": "access-token"`.

Two details save a bad afternoon. Trusted publishing attaches to a package that already exists, so publish `1.0.0` once by hand or reserve the name first. And scoped packages such as `@acme/api` are published with `--access public`. The publish step skips versions already on npm, so re-running a release never fails. See [npm publishing](/products/sdk-generator/publishing/typescript).

## Scalar compared with OpenAPI Generator for TypeScript

[OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator) is the open source default, Apache 2.0 licensed, and free. For TypeScript it offers [eleven client generators](https://openapi-generator.tech/docs/generators), one per HTTP library or framework: `typescript-fetch`, `typescript-axios`, `typescript-angular`, `typescript-node`, `typescript-rxjs`, and others, plus an experimental `typescript` generator. That breadth is a real strength when you need an Angular service or an Axios instance specifically.

The trade-off shows in the call site. A template-based generator maps each operation to a method mechanically:

```ts
const api = new TimeOffApi(new Configuration({ apiKey: process.env.WARP_API_KEY }))
const response = await api.timeOffListAssignmentsGet(undefined, undefined, undefined)
```

| | Scalar TypeScript target | OpenAPI Generator `typescript-fetch` / `typescript-axios` |
| --- | --- | --- |
| Client shape | One default export, resources as properties | One class per tag (`PetApi`, `StoreApi`) |
| Method names | Normalised: `client.pet.list()`, `client.pet.retrieve()` | Derived from `operationId`: `listPets()`, `getPetById()` |
| `oneOf` / `anyOf` / `allOf` | Union and intersection types | [Marked unsupported](https://openapi-generator.tech/docs/generators/typescript-fetch) in both generators' feature tables |
| Pagination | Generated async iterators | Not among the generators' documented options; you write the loop |
| Retries and timeouts | Built in, configurable | Not among the documented options; configure your HTTP client |
| Publishing | Workflows and release PRs generated into your repo | Generates `package.json` when `npmName` is set; release process is yours |
| Cost | One target on the free plan; more from $150/month | Free |

OpenAPI Generator's feature tables can lag its templates, so test your own schemas before deciding either way. If you want a deeper look at when the open source route is the right call, read [OpenAPI Generator alternatives](/alternatives/openapi-generator).

## Frequently asked questions

<scalar-detail title="Is the TypeScript SDK generator production ready?">

Yes. TypeScript is one of the four generally available targets, together with Python, Go, and the CLI. It sits in an end-to-end test matrix that generates, builds, and runs the SDK against a live server on every change.

</scalar-detail>

<scalar-detail title="Does the generated SDK work in the browser and in Node.js?">

The generated package uses `fetch`, so it runs in Node.js 20 and later, modern browsers, and other runtimes that provide `fetch`. You can also inject your own `fetch` implementation.

</scalar-detail>

<scalar-detail title="Can I edit the generated TypeScript code?">

Yes. Edit files in your repository as usual. Every rebuild does a three-way merge between the previous generation, the new generation, and your repository, so your changes carry forward. You can also mark regions with `scalar-sdk-generator:custom-code` comments. See [custom code](/products/sdk-generator/custom-code).

</scalar-detail>

<scalar-detail title="Can I migrate from Speakeasy or Stainless without breaking my users?">

For Speakeasy, set `"compatibility": "speakeasy"` on the TypeScript target to emit wrappers that keep existing call sites compiling. For Stainless, Scalar reads your `stainless.yml` directly, so resource and method names carry across. The [Stainless migration guide](/resources/migration/stainless) has the steps.

</scalar-detail>

<scalar-detail title="How do I publish the TypeScript SDK to npm without storing a token?">

Enable npm trusted publishing for your repository with the workflow file `release-please.yml`. npm then issues a short-lived credential at publish time, and no secret lives in GitHub.

</scalar-detail>

<scalar-detail title="Is Scalar's TypeScript SDK generator free?">

The free plan includes one SDK target for APIs up to 25 endpoints. Additional targets are priced by SDK size. See [pricing](/pricing) for the current plans.

</scalar-detail>

<scalar-button
  title="Generate a TypeScript SDK from your OpenAPI document"
  href="https://dashboard.scalar.com/register">
</scalar-button>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [OpenAPI Generator alternatives](/alternatives/openapi-generator)
- **Docs:** [TypeScript configuration](/products/sdk-generator/configuration/typescript) · [Publishing to npm](/products/sdk-generator/publishing/typescript)
- **Product:** [SDK Generator](/products/sdk-generator) — generate TypeScript, Python, Go, and CLI clients from one OpenAPI document

---

*OpenAPI Generator details are taken from [openapi-generator.tech](https://openapi-generator.tech/docs/generators) and the [OpenAPITools/openapi-generator repository](https://github.com/OpenAPITools/openapi-generator) as of September 2026 (release 7.25.0). If something here is out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will fix it.*
