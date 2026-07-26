# How to migrate from Stainless to Scalar

On 15 May 2026, Stainless [announced they are joining Anthropic](https://www.stainless.com/blog/stainless-is-joining-anthropic) and winding down their hosted products:

> "As we focus on Claude Platform capabilities and connecting agents to APIs, we'll be winding down all hosted Stainless products, including our SDK generator. Starting today, new signups, projects, and SDKs will not be available."

If you are a Stainless customer, your existing SDKs keep working — Stainless is clear that you own the code you have generated. What stops is regeneration. The next time your API changes, nothing updates.

Scalar is the closest thing to a drop-in replacement, and we have built the migration around one idea: **you should not have to re-author anything.** Give us your OpenAPI document and your `stainless.yml`, and we generate from the configuration you already have.

## The short version

1. Export your OpenAPI document.
2. Take the `stainless.yml` already in your repository.
3. Import both into Scalar.
4. Review the generated SDK, then publish from your own repository as before.

There is no intermediate format, no config rewrite, and no re-mapping of your API surface by hand.

## Why the config matters more than the spec

Your OpenAPI document was never the hard part of leaving Stainless. It is yours, it is portable, and every generator reads it.

The hard part is `stainless.yml`. Its `resources` block is where the real design decisions live — which operations become which SDK namespaces, what each method is called, which pagination scheme each list endpoint uses, what your package is named in every language. None of that is expressible in OpenAPI. Regenerate from the specification alone and you get a *different SDK*: new namespaces, new method names, and a breaking change for everyone who installed your package.

So Scalar reads `stainless.yml` directly. Resources, methods, sub-resources, models, pagination schemes, and per-language package names all carry across, which means the call sites your users have already written keep working.

In the dashboard, choose **Import config** when creating a new SDK and upload your `stainless.yml`. The CLI accepts it too.

## Step 1: Export your OpenAPI document

You already have this. One thing to check first: if you used Stainless's `openapi.transforms`, the document in your repository may not be the document Stainless actually generated from. Take the transformed output so the two generators see the same input.

Also look for `x-stainless-*` extensions. Scalar ignores the ones it does not recognise, so they are harmless to leave in place.

## Step 2: Take your `stainless.yml`

It is version-controlled in your repository. Copy it as-is. You do not need to convert it, strip anything out, or translate it into a Scalar format first.

## Step 3: Import into Scalar

Create a new SDK, choose **Import config**, and upload the OpenAPI document and `stainless.yml` together. Scalar reads the config, maps it onto its own generator, and produces SDKs for your configured targets.

## Step 4: Verify before you publish

Do this properly — it is the step that protects your users.

Compare the generated `api.md` against your current SDK's `api.md`. Both list every method grouped by resource, so a diff tells you immediately whether your public surface is intact. Check in particular:

- Method names on nested sub-resources
- Pagination on list endpoints, especially anything using a custom cursor
- The client class name and the environment variable your users pass credentials through

If something does not line up, tell us and we will fix the mapping. It is faster than working around it.

## Step 5: Publish from your own repository

Your production repository is already yours, and so are your npm, PyPI, Maven, and RubyGems packages. Migration does not change package names or registries, so your users keep installing exactly what they install today.

What does change is what pushes to that repository. You will want to:

- Uninstall the Stainless GitHub App
- Take ownership of the release workflows in `.github/workflows`
- Re-point registry tokens at Scalar's publishing flow

Scalar publishes through pull requests against your repository, so releases stay reviewable.

## Custom code

If you edited generated files, those edits are ordinary commits in your repository — Stainless applied them through a semantic three-way merge, so they are interleaved with generated code rather than held as a separate patch set.

Before you regenerate, identify which files carry hand-written changes. Scalar supports custom code, and the migration is far smoother when you know up front which files to preserve.

## What Scalar generates

Here is real generated TypeScript, from the public [Warp SDK](https://github.com/TeamWarp/warp-sdk-typescript/tree/candidate):

```ts
import WarpAPI from "warp-hr";

const client = new WarpAPI({
  apiKey: process.env["API_KEY"], // defaults to the API_KEY env var
});

const list = await client.customWorkerFields.list();
```

Errors are typed, with the status set generated from your specification:

```ts
import { APIError } from "warp-hr";

try {
  const list = await client.customWorkerFields.list();
} catch (err) {
  if (err instanceof APIError) {
    console.log(err.status, err.name, err.headers);
  }
  throw err;
}
```

The output should feel familiar if you are coming from Stainless: resource-namespaced methods, typed errors, auto-pagination, retries with `Retry-After` support, and zero runtime dependencies unless you enable something that needs one. The Warp package ships `"dependencies": {}`.

## Your docs, if you used the Docs Platform

Stainless's docs platform is an Astro project, and the repository lives in the `stainless-sdks` GitHub organisation rather than yours. Their [own guidance](https://www.stainless.com/docs/docs-platform/hosting-and-deploys/) is to fork it out and take on the CI, deployment, domain, and operational work yourself.

If you would rather not run that, Scalar Docs renders your API reference from the same OpenAPI document, alongside Markdown and MDX guides, with a `scalar.config.json` for navigation and theming. scalar.com itself is built and hosted this way.

## What you keep either way

Stainless is explicit that the SDKs you have generated are yours:

> "As always, you own the SDKs you've generated to date, and have full rights to modify and extend them however you wish."

So there is no deadline that breaks anything already published. The question is only what happens the next time your API changes.

## Get help

We will do the migration with you, including the config import and the API surface diff. [Talk to us](https://scalar.cal.com/) or [start free](https://dashboard.scalar.com/register).

---

*This guide describes Stainless as documented on their own site as of July 2026. Stainless announced their wind-down on 15 May 2026 and their documentation may change or be withdrawn. If you find something here that is out of date, please [open an issue](https://github.com/scalar/scalar/issues).*
