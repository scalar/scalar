# Getting Started

Reading this guide helps you to get started with Scalar Docs, literally in minutes. You don't need anything to get started, not even an account if you just want to play around.

## Guides

:::scalar-callout{ type=info }
Guides are part of our Scalar Pro plan (read below, or [visit our pricing page for more info](https://scalar.com/#pricing)).
:::

In the top left corner of <https://docs.scalar.com>, you'll see a “Guide” tab. This is where you land by default.

Guides are basically a blank sheet of paper. These pages are where you will publish your non-reference content (API reference pages are [discussed below](#api-references)). You can start writing your documentation, your guidelines, your knowledge base — whatever you want to write — using our editor. You can alternatively manage your guides using a Git repository, covered in the [GitHub Sync](https://guides.scalar.com/scalar/scalar-docs/github-sync) guide.

If you're serious about this, you can [create an account here](https://docs.scalar.com/register) to make sure your changes are saved.

## API References

> This is a free feature. You'll even get a nice `${whatever-you-like}.apidocumentation.com` subdomain.

Every project can have one, or even multiple API references: In the top left corner, you'll see a “Reference” tab. Try to click on it to switch to our OpenAPI editor.

OpenAPI is the most popular standard to describe your API in a machine readable format. No matter which languages, libraries or frameworks you're using to build your API, it's very, very likely there's a tool, plugin or package to generate an OpenAPI document for you. If you don't find something which says “OpenAPI”, look for “Swagger”. It's what it used be called a few years ago, before it was an open standard.

Those OpenAPI documents are what we base all our tools on. So once you've got one, it should be straight-forward to use our tools.

Scalar Docs offers multiple ways to connect your OpenAPI document. Pick whatever fits your workflow:

- Paste your OpenAPI document in the editor
- Upload an OpenAPI document to the editor
- Import an URL (you can even create a “Live Link”, which means it'll fetch updates from the URL vs. just fetching it once)
- [Sync your OpenAPI document from GitHub](https://guides.scalar.com/scalar/scalar-docs/github-sync#advanced-configuration__add-an-openapi-reference)

## Scalar Pro

Most of our stuff is actually freely available. Upgrading to Scalar Pro unlocks a set of additional features, including:

* Custom domains,
* [GitHub sync](https://guides.scalar.com/scalar/scalar-docs/github-sync),
* Guides (and versioning of your guides),
* TypeSense search and
* priority support (including a private Discord channel or a dedicated Slack connect channel if you like).

[Pricing information can be found here](https://scalar.com#pricing).
