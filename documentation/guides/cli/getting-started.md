# Scalar CLI

<div class="flex gap-2">
<a href="https://www.npmjs.com/@scalar/cli" aria-label="View @scalar/cli on NPM"><img alt="NPM Version" src="https://img.shields.io/npm/v/@scalar/cli"></a>
<a href="https://www.npmjs.com/@scalar/cli" aria-label="View NPM downloads for @scalar/cli"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@scalar/cli"></a>
<a href="https://discord.gg/scalar" aria-label="Join Scalar community on Discord"><img alt="Discord" src="https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2"></a>
</div>

Scalar CLI brings fast OpenAPI parsing and bundling to your terminal. Validate API descriptions, bundle files, lint with Spectral rules, and preview interactive API documentation with one actively maintained toolkit.

Start with the `scalar document` commands for your local OpenAPI workflow, then use the same CLI to publish documentation and manage APIs on the Scalar platform.

## Quick Start

Run commands without a global installation. Replace `openapi.yaml` with the path to your API description:

```bash
# Check that your API description is valid
npx @scalar/cli document validate openapi.yaml

# Bundle external references into a single file
npx @scalar/cli document bundle openapi.yaml --output openapi.bundled.yaml

# Preview interactive API documentation
npx @scalar/cli document serve openapi.bundled.yaml
```

## Work with OpenAPI Documents

### Bundle files and references

Keep your API description organized across multiple files while sharing a single bundled file with documentation tools and SDK generators. Bundling pulls external `$ref` values into one API description.

```bash
npx @scalar/cli document bundle openapi.yaml --output openapi.bundled.yaml
```

Add `--treeShake` to remove unused components from the output:

```bash
npx @scalar/cli document bundle openapi.yaml --output openapi.bundled.yaml --treeShake
```

The input can also be a URL. See the [bundle options](commands.md#bundle) for controlling concurrent fetches and generating a map of resolved URLs.

### Validate and lint

Validate your API description against the OpenAPI Specification:

```bash
npx @scalar/cli document validate openapi.yaml
```

Use linting to check style and design conventions with Spectral rules:

```bash
npx @scalar/cli document lint openapi.yaml
```

To use your own ruleset, pass its file path or URL with `--rule`:

```bash
npx @scalar/cli document lint openapi.yaml --rule .spectral.yaml
```

### Preview documentation and mock your API

Serve an interactive API Reference and watch your local file for changes:

```bash
npx @scalar/cli document serve openapi.yaml --watch
```

Start a mock server from the same API description to try requests before your API is ready:

```bash
npx @scalar/cli document mock openapi.yaml --watch
```

### More document commands

| Command                                     | Use it to                                                             |
| ------------------------------------------- | --------------------------------------------------------------------- |
| [`document bundle`](commands.md#bundle)     | Combine an API description and its external references into one file. |
| [`document validate`](commands.md#validate) | Check an API description against the OpenAPI Specification.           |
| [`document lint`](commands.md#lint)         | Apply Spectral rules to your API description.                         |
| [`document serve`](commands.md#serve)       | Preview an interactive API Reference.                                 |
| [`document mock`](commands.md#mock)         | Run a mock API server.                                                |
| [`document split`](commands.md#split)       | Break an API description into smaller files.                          |
| [`document join`](commands.md#join)         | Merge multiple API descriptions into one.                             |
| [`document format`](commands.md#format)     | Format an OpenAPI file.                                               |
| [`document convert`](commands.md#convert)   | Convert a Postman collection to an OpenAPI description.               |
| [`document markdown`](commands.md#markdown) | Generate Markdown from an API description.                            |
| [`document upgrade`](commands.md#upgrade-1) | Upgrade an API description to OpenAPI 3.1.                            |
| [`document share`](commands.md#share)       | Share an OpenAPI file.                                                |
| [`document void`](commands.md#void)         | Start a server that mirrors HTTP requests.                            |

Explore all document commands or get help with a specific command:

```bash
npx @scalar/cli document --help
npx @scalar/cli document bundle --help
```

## Installation

For regular use, install the CLI globally:

```bash
npm install --global @scalar/cli
```

You can then use `scalar` in place of `npx @scalar/cli` in the examples above:

```bash
scalar document bundle openapi.yaml --output openapi.bundled.yaml
```

### Conflict: EXIST: file already exists

There's another `scalar` CLI, which is bundled with `git`. If you run into naming conflicts, but never use the other CLI anyway, you can replace it like this:

```bash
npm -g --force install @scalar/cli
```

Or, if you want to keep using the other `scalar` CLI, you can just stick to `npx` (or `pnpm dlx`):

```bash
# Execute without installation (npm)
npx @scalar/cli help

# Execute without installation (pnpm)
pnpm dlx @scalar/cli help
```

## Commands

- [auth](commands.md#auth) Manage authorization on Scalar platform
- [document](commands.md#document) Bundle, validate, lint, and preview API descriptions
- [project](commands.md#project) Manage Scalar docs project
- [registry](commands.md#registry) Manage your Scalar registry
- [team](commands.md#team) Manage user teams

## Authentication

To use the CLI with Scalar services, see the [Authentication](authentication.md) guide.

## GitHub Actions

To validate and bundle your API description on pushes and pull requests, add this workflow:

```yml
# .github/workflows/validate-openapi-file.yml
name: Validate OpenAPI File

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v6
      - name: Use Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24
      - name: Validate OpenAPI File
        # Replace `docs/openapi.yaml` with the path to your API description.
        run: npx --yes @scalar/cli document validate docs/openapi.yaml
      - name: Bundle OpenAPI File
        run: npx --yes @scalar/cli document bundle docs/openapi.yaml --output openapi.bundled.yaml
```
