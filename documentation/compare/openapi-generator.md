# Scalar vs OpenAPI Generator

*Last updated: September 2026*

OpenAPI Generator is the open-source default for turning an OpenAPI document into client libraries, server stubs, and documentation. It is free, Apache-2.0 licensed, and covers more languages than any commercial generator, Scalar included. If you are deciding how to produce SDKs for your API, you should look at it seriously.

This page is written by Scalar, so read it with that in mind. Every claim we make about OpenAPI Generator links to its own repository, documentation, or published samples. If we have something wrong, tell us and we will fix it.

The short version: OpenAPI Generator is a toolkit. It hands you a large set of Mustache templates, a CLI, and a community, and you own everything that happens after `generate`. Scalar is a managed product. It produces fewer languages, but the output is opinionated, tested against production SDKs, published for you, and generated in the same run as your API reference. Which one fits depends mostly on how much SDK engineering you want to do yourself.

## At a glance

| | Scalar | OpenAPI Generator |
| --- | --- | --- |
| Licence | Generator is closed source; API reference and API client are MIT | [Apache-2.0](https://github.com/OpenAPITools/openapi-generator) |
| Price | One SDK included on every plan, including Free; more from $150/month | [Free](https://github.com/OpenAPITools/openapi-generator) |
| Client generators | 7 generally available (TypeScript, Python, Go, Java, Kotlin, Ruby, CLI), 6 experimental | [80 client generators](https://openapi-generator.tech/docs/generators), several marked beta or experimental |
| Server stubs | No | [72 server generators](https://openapi-generator.tech/docs/generators) |
| How you customise output | Edit generated code in Git; changes are merged forward | [Mustache templates](https://openapi-generator.tech/docs/templating) you override with `-t` |
| Retries, pagination helpers | Built in | Not in the [typescript-fetch runtime](https://github.com/OpenAPITools/openapi-generator/blob/master/samples/client/petstore/typescript-fetch/builds/default/runtime.ts) |
| Publishing to npm, PyPI, and others | Managed, with GitHub workflows | You build it |
| Runtime | Hosted, runs from the dashboard | [Java 11 JAR, with npm and pip wrappers](https://github.com/OpenAPITools/openapi-generator) |
| API reference from the same run | Yes | Separate tooling |

## Where OpenAPI Generator is stronger

We would rather you read this here than discover it after a migration.

**Language breadth is not close.** The [generators list](https://openapi-generator.tech/docs/generators) shows 80 client generators and 72 server generators as of September 2026, covering languages Scalar does not touch at all: Elixir, Haskell, OCaml, Clojure, Erlang, Julia, R, Lua, Ada, PowerShell, and more. TypeScript alone has ten flavours, including Angular, Axios, Fetch, Node, RxJS, and Redux Query. If you need a client in a language that is not on our list, OpenAPI Generator is very likely the answer.

**Server stubs.** OpenAPI Generator produces server skeletons for Spring, ASP.NET Core, Go, Rust, Python, Kotlin, and many more. Scalar does not generate server code. If your workflow is design-first and you want the server interface generated from the same document, that is squarely their territory.

**It costs nothing and runs anywhere.** Apache-2.0, no account, no network call, no usage limit. You can run it in an air-gapped CI job with a pinned JAR and nobody will ever send you an invoice. For some organisations that property outweighs everything else on this page.

**The community is large and active.** The repository has around 26,800 stars and ships frequently; [release 7.25.0](https://github.com/OpenAPITools/openapi-generator/releases) landed in August 2026. The project was forked from Swagger Codegen 2.4.0-SNAPSHOT specifically to get [a weekly patch and monthly minor release cadence](https://openapi-generator.tech/docs/fork-qna) with a community-owned roadmap, and it has kept to that spirit.

**Total control.** Because you own the templates, you can make the output look exactly like you want. There is no vendor opinion you have to accept.

## OpenAPI Generator vs Scalar

The difference is not really "free versus paid". It is who does the work between running the generator and a developer installing your package.

With OpenAPI Generator, the output is a starting point. Teams that ship polished SDKs on top of it typically maintain a fork of the templates for each language, write their own retry and pagination layer, set up versioning and changelogs, wire publishing to each package registry, and keep all of that current as new generator releases change templates underneath them.

With Scalar, those pieces are the product. You upload an OpenAPI document, pick targets, and get SDKs with retries, pagination helpers, typed errors, and publishing. The trade-off is fewer languages and less freedom to reshape the output wholesale.

### Generated code, side by side

The clearest way to compare generators is to read what they emit. Both samples below are real, public generated code.

OpenAPI Generator's output is from its own [typescript-fetch Petstore sample](https://github.com/OpenAPITools/openapi-generator/blob/master/samples/client/petstore/typescript-fetch/builds/default/apis/PetApi.ts), which the project regenerates in CI. Scalar's is from the [Warp TypeScript SDK](https://github.com/TeamWarp/warp-sdk-typescript/tree/scalar-generated), generated by Scalar.

**Instantiating a client**

```ts
// OpenAPI Generator (typescript-fetch)
import { Configuration, PetApi } from './generated'

const api = new PetApi(
  new Configuration({
    basePath: 'https://petstore.example.com/v2',
    apiKey: process.env.API_KEY,
  }),
)

const pet = await api.getPetById({ petId: 1 })
```

```ts
// Scalar
import WarpAPI from 'warp-hr'

const client = new WarpAPI({
  apiKey: process.env['API_KEY'], // defaults to the API_KEY env var
})
```

OpenAPI Generator creates one class per tag (`PetApi`, `StoreApi`, `UserApi`), each constructed with a shared `Configuration`. Scalar creates one client named after your API, with resources hanging off it. Neither is wrong. The single-client shape tends to be easier to discover in an editor, because everything is one dot away from `client`.

**Method naming**

On the same Petstore input:

| `operationId` | OpenAPI Generator (typescript-fetch) | Scalar |
| --- | --- | --- |
| `findPetsByStatus` | `petApi.findPetsByStatus({ status })` | `client.pet.list()` |
| `getPetById` | `petApi.getPetById({ petId })` | `client.pet.retrieve()` |
| `addPet` | `petApi.addPet({ pet })` | `client.pet.create()` |

OpenAPI Generator carries the `operationId` through verbatim. That is predictable, and if your operation IDs are already clean it works well. Scalar normalises verbs across resources, so a developer who has learned `list` and `retrieve` on one resource can guess them on the next.

**Every method, twice**

The typescript-fetch generator emits each operation as a pair: `getPetById()` returns the parsed model, and `getPetByIdRaw()` returns a `runtime.ApiResponse<Pet>` wrapper with the underlying `Response`. Scalar exposes a single method per operation and gives you raw response access per call instead, which keeps the surface area half the size.

**Errors**

OpenAPI Generator's typescript-fetch runtime defines three error classes: `ResponseError`, `FetchError`, and `RequiredError` (for missing required parameters). Any non-2xx response becomes a `ResponseError` that wraps the `Response`, and you inspect the status yourself.

```ts
// Scalar
import { APIError, NotFoundError, RateLimitError } from 'warp-hr'

try {
  await client.customWorkerFields.list()
} catch (err) {
  if (err instanceof RateLimitError) {
    // 429, with typed access to status, name, and headers
  }
  if (err instanceof APIError) {
    console.log(err.status, err.name, err.headers)
  }
  throw err
}
```

Scalar generates a class per status family (`BadRequestError`, `AuthenticationError`, `NotFoundError`, `RateLimitError`, and so on), so `instanceof` does the branching for you.

**Retries and pagination**

The typescript-fetch [runtime](https://github.com/OpenAPITools/openapi-generator/blob/master/samples/client/petstore/typescript-fetch/builds/default/runtime.ts) has a middleware hook for requests and responses, but no built-in retry logic and no pagination helper. You can write both as middleware, and many teams do. Scalar SDKs retry temporary failures by default (two attempts, covering network errors, 408, 409, 429, and 5xx), honour `Retry-After`, and generate auto-paginating iterators for cursor, offset, page-number, and next-URL pagination. The full list is on the [SDK generator page](/products/sdk-generator).

**Dependencies**

Both generate TypeScript that runs on `fetch` without a heavy runtime. The Warp package ships `"dependencies": {}`. The typescript-fetch output is similarly light. Other OpenAPI Generator TypeScript flavours do take dependencies (the Axios generator depends on Axios, the Angular one on Angular), which is a feature if you want them.

## Customisation: templates versus merged edits

This is the part of the comparison that matters most over a multi-year horizon.

**OpenAPI Generator customises by template.** Each generator is a set of Mustache templates. You extract them with `openapi-generator author template -g typescript-fetch`, edit what you need, and point the CLI at your copy with `-t`/`--template-dir`, as described in the [templating guide](https://openapi-generator.tech/docs/templating). For bigger changes you can scaffold an entire custom generator with the [`meta` command](https://openapi-generator.tech/docs/customization). Handlebars is also available, but the docs describe it as experimental.

This is powerful and it has a known cost. A template fork is a fork: when upstream changes the template you copied, you merge by hand. The more you customise, the more expensive each generator upgrade becomes, and teams often end up pinned to an old version because the upgrade diff is too large to review.

**Scalar customises by editing the output.** You change generated code in your SDK repository like any other code. Each build does a three-way merge between the previous generated code, the new generated code, and your repository, and lands the result on a `scalar-next` branch with a release pull request. Real conflicts are parked on their own branch for you to resolve. The details are in [Custom code](/products/sdk-generator/custom-code).

The practical difference is where your changes live. With templates, they live in the generator and affect every file it emits. With Scalar, they live in the SDK next to the code they change, which makes one-off tweaks cheap and wholesale restyling harder. If you want to change the shape of every method in every language, templates are the stronger tool.

## Maintenance: who owns what

It is worth writing out the work explicitly, because the licence price hides it.

| Task | With OpenAPI Generator | With Scalar |
| --- | --- | --- |
| Run generation on every API change | Your CI job | A build per document update, from the dashboard or registry |
| Keep templates current with upstream | You | Not applicable |
| Retries, pagination, typed errors | You write them | Generated |
| Versioning and changelog | You | Release pull requests managed by release-please |
| Publish to npm, PyPI, Go modules | You script it | [Managed publishing](/products/sdk-generator/publishing/overview) |
| README and usage examples | README generated from templates | README with auth and option tables, plus `api.md` and `x-codeSamples` in your reference |
| Keep docs and SDKs in sync | Separate tools | Same run, same compiled document |

None of those rows are hard for a strong platform team. They add up, though, and they recur every time the API or the generator changes.

## Language coverage, honestly

Scalar's generally available targets are **TypeScript, Python, Go, Java, Kotlin, Ruby, and CLI**. C#, PHP, Rust, Swift, Dart, and C++ are **experimental**: they generate working code and run in our CI, but the label is there for a reason and we recommend talking to us before shipping one to customers.

If you need production SDKs in C# or PHP today, OpenAPI Generator has mature, widely used generators for both, and that is a real reason to choose it or to run both. Plenty of teams use Scalar for TypeScript and Python and OpenAPI Generator for a long-tail language nobody on the team wants to hand-write.

## Pricing

| | Scalar | OpenAPI Generator |
| --- | --- | --- |
| Licence cost | Free plan: 1 SDK up to 25 endpoints | [$0, Apache-2.0](https://github.com/OpenAPITools/openapi-generator) |
| Paid plans | [Pro $150/month](/pricing) (1 SDK up to 100 endpoints, 5 editor seats); [Business $600/month](/pricing) (SDKs up to 250 endpoints, SSO) | None |
| Additional SDKs | $150/month each up to 100 endpoints, $600/month each for 101–250 | $0 |
| Engineering time | Mostly configuration | Templates, runtime helpers, publishing, upgrades |
| Enterprise | Custom | Community support; no vendor |

Yearly billing on Scalar is $125/month for Pro and $500/month for Business. An SDK on Scalar means one language target for one API, so a TypeScript and a Python client for the same API count as two.

The honest maths: if your API is small, your language is well served by an existing generator, and someone on the team enjoys owning SDK infrastructure, OpenAPI Generator is cheaper. If an engineer would otherwise spend a meaningful part of each quarter maintaining templates and publishing pipelines, Scalar's price is usually lower than that time.

## Migration path

Moving from OpenAPI Generator to Scalar does not require changing your OpenAPI document.

<scalar-steps>
  <scalar-step id="og-upload" title="Upload the document you already generate from">

Create a free account and [upload your OpenAPI document](/products/sdk-generator/getting-started) to the registry, or connect the Git repository it lives in.

  </scalar-step>

  <scalar-step id="og-generate" title="Generate one target and diff the surface">

Pick the language you care most about and read the output next to your current SDK. Method names will differ where your `operationId` values are verbose, as shown above. Decide whether to ship a new major version or map names with [configuration](/products/sdk-generator/configuration/overview).

  </scalar-step>

  <scalar-step id="og-custom" title="Move template changes into code">

List what your custom templates do. Anything expressed as a helper, wrapper, or README change becomes a normal commit on `scalar-next`, and the [three-way merge](/products/sdk-generator/custom-code) carries it forward.

  </scalar-step>

  <scalar-step id="og-publish" title="Hand over publishing">

Link the GitHub repository and configure [registry publishing](/products/sdk-generator/publishing/overview). Keep OpenAPI Generator for any languages we do not cover yet.

  </scalar-step>
</scalar-steps>

If you want a second pair of eyes on the surface diff before you commit to a breaking change, [book a migration call](https://scalar.cal.com/).

## Which should you choose?

**Choose OpenAPI Generator if** you need a language or server framework Scalar does not generate, you need everything to run offline with no vendor, or you have a team that wants full control over every template and is happy to own the pipeline around it.

**Choose Scalar if** you want production SDKs in TypeScript, Python, or Go without maintaining templates, you want retries, pagination, typed errors, and publishing handled, or you want your SDKs and your API reference generated from the same run so they cannot drift.

**Use both if** you want a managed experience for your main languages and still need a long-tail client. They read the same OpenAPI document.

[Start free](https://dashboard.scalar.com/register) or [talk to us](https://scalar.cal.com/).

## Frequently asked questions

<scalar-detail title="Is OpenAPI Generator free for commercial use?">
Yes. OpenAPI Generator is licensed under [Apache-2.0](https://github.com/OpenAPITools/openapi-generator), which permits commercial use. The code it generates is yours. The cost is engineering time rather than a licence fee.
</scalar-detail>

<scalar-detail title="How many languages does OpenAPI Generator support?">
As of September 2026 its [generators page](https://openapi-generator.tech/docs/generators) lists 80 client generators and 72 server generators, plus documentation, schema, and config generators. Some are marked beta, experimental, or deprecated, so check the status of the one you plan to use.
</scalar-detail>

<scalar-detail title="What is the difference between OpenAPI Generator and Swagger Codegen?">
OpenAPI Generator is a community fork of Swagger Codegen 2.4.0-SNAPSHOT. The founders [forked it](https://openapi-generator.tech/docs/fork-qna) because Swagger Codegen 3.0.0 diverged from the 2.x philosophy and they wanted a faster release cycle and a community-owned roadmap.
</scalar-detail>

<scalar-detail title="Can I customise OpenAPI Generator output without forking templates?">
Partly. Many generators expose options through a config file, and since version 5.0.0 you can add [user-defined templates](https://openapi-generator.tech/docs/customization) alongside the built-in ones. Changing how existing files look still means overriding the Mustache templates with `-t`.
</scalar-detail>

<scalar-detail title="Does Scalar generate server stubs?">
No. Scalar generates client SDKs and CLIs, an API reference, and hosted [MCP servers](/products/agent/mcp). For server skeletons, OpenAPI Generator is a good choice and works alongside Scalar.
</scalar-detail>

<scalar-detail title="Will my existing SDK users have to change their code if I switch?">
Probably, because method names and client shape differ. Treat the switch as a new major version, or talk to us about mapping names. If you are moving from Stainless rather than OpenAPI Generator, Scalar reads `stainless.yml` and keeps method names stable.
</scalar-detail>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [Build vs buy an SDK](/learn/sdk/build-vs-buy-sdk)
- **Docs:** [SDK generator getting started](/products/sdk-generator/getting-started) · [Custom code](/products/sdk-generator/custom-code) · [OpenAPI Generator alternatives](/alternatives/openapi-generator)
- **Product:** [SDK Generator](/products/sdk-generator) — managed SDKs with publishing, generated in the same run as your docs

---

*This comparison is based on OpenAPI Generator's public repository, documentation, and generated samples as of September 2026, and on Scalar's own source and generated output. Generator counts and sample code change between releases. We have made a genuine effort to be accurate and to state where OpenAPI Generator is better. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
