# Getting Started
<div class="flex gap-2">
<a><img src="https://img.shields.io/npm/v/%40scalar/cli"></a>
<a><img src="https://img.shields.io/npm/dm/%40scalar/cli"></a>
<a><img src="https://img.shields.io/npm/l/%40scalar%2Fapi-reference"></a>
<a><img src="https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2"></a>
</div>

Reading this guide helps you to get started with our CLI. We have dozens of commands around API Docs rendering (Markdown + MDX), OpenAPI bundling & linting, pushing to our cloud for governance+hosting & much more!

## Quick Start
```
npx @scalar/cli help
```

## Installation

If you really want to become friends you should install the CLI:

```bash
npm -g install @scalar/cli
```

Otherwise just prefix all commands with `npx @scalar/cli` instead of `scalar`. That's fine, too.

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

- [scalar](https://guides.scalar.com/scalar/scalar-cli/commands#scalar) CLI to work with OpenAPI files, Markdown/MDX, Scalar Platform
- [auth](https://guides.scalar.com/scalar/scalar-cli/commands#auth) Manage authorization on Scalar platform
- [document](https://guides.scalar.com/scalar/scalar-cli/commands#document) Manage local openapi files
- [project](https://guides.scalar.com/scalar/scalar-cli/commands#project) Manage Scalar docs project
- [registry](https://guides.scalar.com/scalar/scalar-cli/commands#registry) Manage your Scalar registry
- [team](https://guides.scalar.com/scalar/scalar-cli/commands#team) Manage user teams
- [help](https://guides.scalar.com/scalar/scalar-cli/commands#help) Display help for command

## Authentication
To authenticate with the Scalar platform you can do the following:

### Web Login
This opens a web portal which will authenticate, typical for local dev machine workflows

```bash
scalar auth login
```

Now you can interact with all the wonderful authorization endpoints

### Token/Machine Based

Typical if you want to use in CI workflows or programatically you need to:
1. Visit https://dashboard.scalar.com 
2. Create an account or Login
3. Navigate to User -> API Keys https://dashboard.scalar.com/user/api-keys
4. Generate an API Key
5. Store the token in a safe place!

```bash
scalar auth login --token 1234secrettoken5678
```

Now you can interact with all the wonderful authorization endpoints with just a token! Perfect for GitHub actions or scripts.



## GitHub Actions

To validate your OpenAPI file in GitHub Actions, add this workflow:

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
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Validate OpenAPI File
        # Replace `./my-openapi-file.yaml` with the correct path and filename for your project.
        # Or: run `npx @scalar/cli init` and add the config file to your repository.
        run: npx @scalar/cli document validate docs/openapi.yaml
```
