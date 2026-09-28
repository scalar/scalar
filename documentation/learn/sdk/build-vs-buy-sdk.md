# Build vs buy an SDK: a cost model

*Last updated: September 2026*

Building an SDK means your engineers write and maintain a client library per language, by hand or around an open-source generator; buying means paying a vendor to generate, update, and help publish those libraries from your OpenAPI document. For most HTTP APIs, buying costs less once you count maintenance, but building is still the right call in specific situations, and the answer depends heavily on how many languages you need and how often your API changes.

This page gives you a cost model you can run with your own numbers. We are an SDK vendor, so treat our conclusions with the appropriate suspicion. That is why every assumption is written down and every number is a range you can replace. Nothing here is an industry benchmark; it is a planning model.

## The three options

**1. Hand-write every SDK.** Engineers design and write the client library for each language, including runtime, types, tests, docs, and release pipeline.

**2. Build around an open-source generator.** You run a template-based generator such as [OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator) or [Kiota](https://learn.microsoft.com/en-us/openapi/kiota/overview), customize templates where the output falls short, and own the CI, publishing, and custom-code strategy. No licence fee; your team owns the upkeep.

**3. Buy a managed generator.** A vendor such as [Scalar](/products/sdk-generator) generates the SDKs, regenerates on API changes, merges your custom code, and writes the release workflows. You pay a subscription and review pull requests.

The line between 2 and 3 is blurring. Speakeasy [open-sourced its generator under AGPL-3.0 on 2026-09-17](https://www.speakeasy.com/blog/partnering-with-google), and Fern's repository is [Apache 2.0](https://github.com/fern-api/fern). Running those yourself is a "build around a generator" choice with better output than templates; buying their platform is a "buy" choice.

## What an SDK actually costs

The first version is the visible cost. The ongoing work is where budgets go wrong. A production-quality API SDK needs all of the following, whichever way you get it:

- A runtime: HTTP transport, authentication, timeouts, retries with backoff, `Retry-After`, idempotency keys.
- Types and models for every operation, including unions, enums, nullable fields, and file uploads.
- Pagination helpers and, if your API streams, server-sent event or JSON-lines handling.
- Typed errors that expose status, headers, and body.
- Tests, including against a mock of the API.
- A README, a method reference, examples, and a changelog.
- A package manifest, versioning policy, and a publish pipeline per registry.
- Updates every time the API adds, changes, or deprecates an operation, in every language.
- Upkeep that has nothing to do with your API: runtime version bumps, dependency updates, security advisories, issues and pull requests from users.

## The cost model

### Assumptions

State these out loud in your own planning document, and change any that do not match your situation.

- **API size:** about 60 operations, with auth by API key, cursor pagination on list endpoints, and no streaming.
- **Languages:** three (for example TypeScript, Python, and Go).
- **Change rate:** a handful of operations added or changed per month.
- **Engineer:** someone who knows the target language well but has not built this particular SDK before.
- **Engineer-week:** 40 hours. **Loaded cost:** we use $4,000 per engineer-week as an illustrative figure (roughly a $200,000 fully loaded annual cost over 50 working weeks). Replace it with your own.
- **Quality bar:** the same feature list for every option (retries, pagination, typed errors, docs, publishing). Skipping features makes any option cheaper and every option worse.

### Effort per language, first release

These are our planning estimates, based on the work breakdown above, not measured industry data.

| Work item | Hand-written | Open-source generator | Managed generator |
| --- | --- | --- | --- |
| Runtime (transport, auth, retries, errors, serialization) | 2–4 weeks | 0.5–1.5 weeks (template fixes) | Included |
| Resources and models for ~60 operations | 1.5–3 weeks | Generated; 0.5–1 week of fixes | Generated |
| Pagination helpers | 0.5–1 week | 0.5–1 week (often custom) | Configuration, hours |
| Tests | 1–2 weeks | 0.5–1 week | Review of generated tests |
| README, reference, examples | 1 week | 0.5–1 week | Generated; review |
| Packaging, CI, and publishing | 0.5–1 week | 0.5–1 week | Generated workflows; registry setup, hours |
| **Total per language** | **6.5–12 weeks** | **3–6.5 weeks** | **1–3 days** |

For the managed option, the first language takes longest because you are also cleaning up the OpenAPI document. That cleanup benefits every option, and teams choosing to hand-write often skip it and pay for it later.

### Ongoing maintenance per language, per year

| Work item | Hand-written | Open-source generator | Managed generator |
| --- | --- | --- | --- |
| Keeping up with API changes | 1–2 days per month | Regenerate and review; 0.5–1 day per month | Review release pull request; 1–2 hours per month |
| Runtime, dependency, and security upkeep | 1–2 days per month | Generator upgrades and template breakage; 0.5–1 day per month | Vendor |
| Issues and user pull requests | 0.5–1 day per month | 0.5–1 day per month | 0.5 day per month (mostly routed to the vendor) |
| **Total per language** | **~6–12 weeks per year** | **~3.5–7 weeks per year** | **~1.5–2 weeks per year** |

### Worked example: three languages, about 60 endpoints

Multiplying the tables by three languages and $4,000 per engineer-week (5 working days per week). Year one is the first release plus one year of maintenance:

| | Hand-written | Open-source generator | Managed (Scalar Pro) |
| --- | --- | --- | --- |
| First release, engineering | 19.5–36 weeks ($78,000–$144,000) | 9–19.5 weeks ($36,000–$78,000) | ~1–2 weeks ($4,000–$8,000) |
| Each year after, engineering | 18–36 weeks ($72,000–$144,000) | 10.5–21 weeks ($42,000–$84,000) | 4.5–6 weeks ($18,000–$24,000) |
| Licence per year | $0 | $0 | $5,400 |
| **Year one total** | **~$150,000–$288,000** | **~$78,000–$162,000** | **~$27,000–$37,000** |

The Scalar licence line uses published pricing as of September 2026: the [Pro plan](/pricing) is $150 per month and includes one SDK (one language target for one API) for APIs up to 100 endpoints; each additional SDK in that size band is $150 per month. Three languages is therefore $150 + 2 × $150 = $450 per month, or $5,400 a year on monthly billing. An API with 101 to 250 endpoints moves to the Business band, where additional SDKs are $600 per month each; rerun the numbers if that is you. Other vendors mostly price SDKs through sales, so get a written quote for your endpoint count and language list before comparing.

### How to read this

- **The ranges are wide on purpose.** A team that has shipped SDKs before lands at the low end; a first attempt lands at the top or beyond it.
- **Maintenance dominates.** For the build options, the yearly cost is about the same as the first release. Budgets that only cover the first release are the most common failure.
- **Languages multiply everything.** Going from one language to five roughly quintuples hand-written cost. For a managed generator, the cost is mostly the per-target licence.
- **Engineering time is not the only cost.** The weeks spent on SDKs are weeks not spent on the API itself. That opportunity cost is usually larger than the salary line.

## When building makes sense

Buying is not always right. Build, or at least build part of it, when:

- **The SDK is the product.** If the library carries substantial client-side logic, such as offline sync, local encryption, on-device inference, or a realtime protocol, no generator will write it for you. Generate the HTTP layer and hand-write the rest.
- **Your API is not well described by OpenAPI.** Heavily dynamic payloads, bespoke binary protocols, or RPC styles that do not map to operations will fight any generator.
- **You need a language no vendor supports well.** OpenAPI Generator covers [far more languages](https://openapi-generator.tech/docs/generators) than any commercial tool. For a niche target, it may be the only practical starting point. [OpenAPI Generator alternatives](/alternatives/openapi-generator) covers where it fits and where it does not.
- **You have strict supply-chain rules.** Some organizations cannot send API descriptions to a third party, or must build every artifact in-house. Running an open-source generator inside your own CI satisfies that.
- **You already have excellent SDKs and a team to maintain them.** If it works and the cost is understood, there is no prize for migrating.

## When buying makes sense

- **You need more than one language.** The per-language multiplier is where hand-written budgets break.
- **Your API changes often.** Automated regeneration turns each API change into a pull request instead of a sprint.
- **SDK quality is a sales or adoption lever**, but SDKs are not your core engineering competency.
- **You want docs, SDKs, and code samples to agree.** Generating them from the same OpenAPI document removes a whole class of drift. Scalar, for example, injects generated SDK samples into the [API reference](/products/api-references).
- **Your team is small.** One engineer part-time cannot hand-maintain three SDKs well.

## Hidden costs and risks on both sides

**Build: the key-person problem.** Hand-written SDKs often depend on one or two people. When they leave, the SDK stalls.

**Build: drift.** Without generation, the SDK and the API diverge a little with each release, and users notice before you do.

**Buy: vendor risk.** Vendors change direction. When [Stainless joined Anthropic in May 2026](https://www.stainless.com/blog/stainless-is-joining-anthropic/), its hosted generator stopped taking new signups, and customers had to plan a move. The customers least affected were those whose generated code already lived in their own repositories under their own package names. Ask every vendor where the code lives, who owns the package names, and what you keep if you leave. With Scalar, the SDK lives in your GitHub repository, publishes to your registry accounts, and Scalar never cuts releases on your behalf. Scalar also reads existing `stainless.yml` configurations, which is the kind of exit path worth checking for any vendor, including us. See [migrating from Stainless](/resources/migration/stainless) and the [wind-down write-up](/resources/stainless-wind-down).

**Buy: output you do not like.** If the generated method names or structure do not suit your API, you depend on the vendor's configuration options. Evaluate by generating from your own document, not a demo. [The best SDK generators in 2026](/library/best-sdk-generators-2026) lists the options worth trialling.

**Both: the OpenAPI document.** Every option gets better with a complete, validated OpenAPI document, and a managed generator makes gaps visible immediately. Scalar's [diagnostics](/products/sdk-generator/diagnostics) report on every build what generation had to skip or guess.

## The hybrid most teams end up with

In practice, the choice is rarely pure. The common pattern is:

1. **Generate** the HTTP layer, types, and runtime for every language from the OpenAPI document.
2. **Hand-write** the few helpers that make your API pleasant, like a webhook verifier, a higher-level workflow method, or a file-upload convenience, in the same repository.
3. **Keep those edits across regenerations**, using the generator's custom-code mechanism. Scalar does this with a three-way merge on a managed branch; see [custom code](/products/sdk-generator/custom-code).

That gives you most of the savings of buying and most of the control of building.

## A decision checklist

Answer these before you pick:

- How many languages do we need this year, and next year?
- How many operations does the API have, and how many change per month?
- Who will own the SDKs in eighteen months?
- Is any of our SDK value in client-side logic a generator cannot produce?
- Can our OpenAPI document be sent to a third party?
- If the vendor disappeared tomorrow, what would we still have?
- What is our loaded cost per engineer-week, and what else would those weeks build?

If the answers are "several languages", "changes often", "nobody specific", "no", "yes", "our own repositories", and "a lot", buy. If most answers point the other way, build, starting from a generator rather than a blank file.

## Frequently asked questions

<scalar-detail title="How much does it cost to build an SDK?">

Under the assumptions on this page (about 60 operations, an experienced engineer, the full feature set), a hand-written SDK takes roughly 6.5 to 12 engineer-weeks for the first release per language, and 6 to 12 engineer-weeks a year to maintain. Multiply by your loaded cost and your number of languages. These are planning estimates, not benchmarks; your numbers will differ.

</scalar-detail>

<scalar-detail title="Is an open-source SDK generator free?">

The licence is free. The engineering is not: someone customizes templates, builds release pipelines, handles generator upgrades, and decides how custom code survives regeneration. In our model that is roughly half the effort of hand-writing, both for the first release and for yearly upkeep.

</scalar-detail>

<scalar-detail title="How much does Scalar's SDK generator cost?">

Every plan includes one SDK, meaning one language target for one API. The Free plan covers an API with up to 25 endpoints. Pro is $150 per month and covers SDKs up to 100 endpoints; additional SDKs are $150 per month each up to 100 endpoints, or $600 per month each for 101 to 250 endpoints on Business. See [pricing](/pricing) for the current details.

</scalar-detail>

<scalar-detail title="Can we start with a generator and switch to hand-written later?">

Yes, and it is a sensible path. Generated code in your own repository is just code. If you later need to take it over by hand, you keep the history, the package names, and the users.

</scalar-detail>

<scalar-detail title="What if our OpenAPI document is incomplete?">

Fix it first, whichever route you choose. A hand-written SDK built against an incomplete description inherits the same gaps, just less visibly. [How to generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) lists what to fix before generating.

</scalar-detail>

## Related

- **Learn:** [What is an SDK?](/learn/sdk/what-is-an-sdk) · [SDK vs API](/learn/sdk/sdk-vs-api) · [How to generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi)
- **Docs:** [SDK Generator getting started](/products/sdk-generator/getting-started) · [Publishing](/products/sdk-generator/configuration/overview#targets)
- **Product:** [Scalar SDK Generator](/products/sdk-generator) — published per-target pricing, code in your own repositories, and custom code that survives regeneration.

---

*Pricing and vendor details on this page are from each vendor's own site as of September 26, 2026. The effort estimates are Scalar's planning assumptions, not measured industry data; replace them with your own. If something here is out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
