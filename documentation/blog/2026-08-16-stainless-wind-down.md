---
date: 2026-08-16
---

# We wrote up the Stainless wind-down

Stainless [announced on 18 May 2026](https://www.stainless.com/blog/stainless-is-joining-anthropic) that it is joining Anthropic and winding down all of its hosted products, including the SDK generator. New signups, projects, and SDKs closed the same day.

Three months on, the thing we keep hearing from teams in that position is not "which generator is best". It is a narrower and more awkward question: *my users have already written code against my SDK — how do I move without breaking them?*

That question has a specific answer, and it is not the one most migration content gives. Your OpenAPI document was never the hard part of leaving Stainless. It is yours and every generator reads it. The hard part is `stainless.yml` — the file that decides which operations become which namespaces, what each method is called, which pagination scheme each list endpoint uses, and what your package is named in every language. None of that is expressible in OpenAPI. Regenerate from the specification alone with any tool and you get a working SDK with a different public surface, which is a breaking change your users absorb.

So we wrote a full account of the situation: [**The Stainless SDK generator wind-down**](../resources/stainless-wind-down.md).

It covers what Stainless actually said and what it did not say, what keeps working and what stops, and an assessment of the realistic options — OpenAPI Generator, Speakeasy, Fern, APIMatic, liblab, `stainful`, `oagen`, and Scalar — with the places each of them beats us stated plainly. Speakeasy generates Terraform providers and we do not. Fern's generators are Apache-2.0 and ours are not. OpenAPI Generator is free and cannot be wound down by anybody. If one of those is your requirement, the page says so.

It also gets specific about the part we do well. Scalar reads `stainless.yml` as an input, so your resource tree, method names, pagination schemes, and per-language package names carry across and your users' call sites keep working. The page includes a key-by-key mapping between the two config formats, including the places where it does not carry — `targets: terraform` and `targets: sql` have no Scalar equivalent, and `openapi.transforms` has to be applied upstream.

There is a section at the end for people who are not choosing Scalar, because most of the migration work is the same whoever you pick, and some of it is worth doing this week regardless. Snapshot your current public API surface while you can still regenerate it. Find your hand-written code before you regenerate anything. Get your docs repository out of the `stainless-sdks` organisation.

If you are migrating and something on that page is wrong, unfair, or out of date — including if you work for one of the companies named on it — [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.

[Read the full piece →](../resources/stainless-wind-down.md)
