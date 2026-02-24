# Scalar Docs Starter Kit

The [Scalar Docs Starter Kit](https://github.com/scalar/starter) is a ready-to-use template for building beautiful documentation with Markdown and OpenAPI. Fork or clone the repository and make it your own — everything in the template is meant to be modified, extended, or replaced to fit your project.

## Project structure

The starter includes a minimal layout: a `docs/` folder (with `api-reference/` for OpenAPI documents and `content/` for free-form content) and a `scalar.config.json` file at the repository root.

## 1. Preview your docs

Run a local development server to see your changes in real-time:

```bash
npx @scalar/cli project preview
```

This starts a live preview at `http://localhost:7971` where every edit you make is instantly visible.

Read more about [Preview deployments](deployment/preview-deployments.md) and the [CLI](deployment/cli.md).

## 2. Include OpenAPI documents

Drop your OpenAPI files into `docs/api-reference/`, and add them to `scalar.config.json` to have them automatically become interactive API references.

The starter kit includes an example OpenAPI document to show you how it works.

Read more about [scalar.config.json](configuration/scalar.config.json.md) and [Getting started](getting-started.md) with Scalar Docs.

## 3. Customize everything

Make it yours with themes, custom CSS, and MDX. Configure your documentation structure, navigation, and styling through [scalar.config.json](configuration/scalar.config.json.md).

For appearance options, see [Themes](configuration/themes.md).

## 4. Publish your docs

First, authenticate with your Scalar account:

```bash
npx @scalar/cli auth login
```

Then publish your documentation:

```bash
npx @scalar/cli project publish
```

Your site will be available at `<your-slug>.apidocumentation.com`.

## Stuck?

Check whether your `scalar.config.json` is valid:

```bash
npx @scalar/cli project check-config
```

For full options, see the [Configuration reference](configuration/scalar.config.json.md).

We are here to help:

- [Email support@scalar.com](mailto:support@scalar.com)
- [Chat with us on Discord](https://discord.gg/scalar)
- [Schedule a call](https://scalar.cal.com/scalar/chat-with-scalar)
