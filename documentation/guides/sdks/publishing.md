# Publishing Your SDK to npm

This guide walks you through publishing a **TypeScript SDK** to the npm registry. After you generate and download your SDK from Scalar, you can publish it so others can install it with `npm install your-package-name`.

## Prerequisites

- A TypeScript SDK generated from Scalar (see [Getting Started](getting-started.md))
- An [npm account](https://www.npmjs.com/signup)
- A GitHub repository containing your SDK

## One-time setup

### 1. Configure your package for publishing

In your SDK project, ensure `package.json` is set up for publishing:

- **name**: Must be unique on npm. Use a scoped name (e.g. `@your-org/your-api-client`) if you want to keep it under your org.
- **version**: Follow [semver](https://semver.org/). Bump this before each publish.
- **access**: For scoped packages (`@scope/name`), add `"publishConfig": { "access": "public" }` if the package should be public.

Example:

```json
{
  "name": "@your-org/your-api-client",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public"
  }
}
```

### 2. Add a prepublish script (optional)

If your SDK needs a build step before publishing (e.g. compile TypeScript, generate files), add a `prepublishOnly` script in `package.json`:

```json
{
  "scripts": {
    "prepublishOnly": "npm run build"
  }
}
```

`prepublishOnly` runs automatically when you run `npm publish`, so the package that gets published is built and up to date.

### 3. Create an npm token

1. Log in to [npmjs.com](https://www.npmjs.com/) and open **Account Settings** → **Access Tokens**.
2. Generate a new **Automation** or **Classic** token with “Publish” permissions.
3. Copy the token; you will use it in GitHub as a secret.

### 4. Add the token to GitHub

1. In your GitHub repo, go to **Settings** → **Secrets and variables** → **Actions**.
2. Create a new repository secret named `NPM_TOKEN` and paste your npm token.

## Publish with GitHub Actions

To publish automatically when you push to `main` (or trigger manually), add this workflow.

Create `.github/workflows/publish-package.yml`:

```yaml
name: Publish Package to npmjs

on:
  push:
    branches:
      - main
  workflow_dispatch: null

jobs:
  build:
    runs-on: ubuntu-latest
    concurrency:
      group: npm-publish
      cancel-in-progress: false
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      # Setup .npmrc file to publish to npm
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'

      - run: npm install
      - run: npm run prepublishOnly
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Notes:

- **Trigger**: Runs on every push to `main`, or when you run the workflow manually from the **Actions** tab (`workflow_dispatch`).
- **Concurrency**: `npm-publish` ensures only one publish runs at a time for this repo.
- **prepublishOnly**: Runs your build (or other steps) before `npm publish`. Remove this step if you do not use `prepublishOnly`.
- **--access public**: Required for scoped packages (`@scope/name`) that should be public. Omit for unscoped packages or if you want the default (private for scoped).

### Publishing only on version bumps

To avoid publishing on every push to `main`, run publish only when `package.json` version changes. For example, use a separate “release” workflow that runs when you push a version tag:

```yaml
on:
  push:
    tags:
      - 'v*'
```

Then run `npm version patch` (or `minor` / `major`) and push the tag: `git push origin v1.0.1`. Your workflow would check out the repo, run `npm install`, `npm run prepublishOnly`, and `npm publish`.

## Manual publish

From your SDK directory:

```bash
npm login
npm run prepublishOnly   # if you have a build step
npm publish --access public
```

Use `--access public` for scoped packages that should be public.

## Summary

1. Configure `package.json` (name, version, `publishConfig`, and optionally `prepublishOnly`).
2. Create an npm token and add it as `NPM_TOKEN` in GitHub Actions secrets.
3. Add the GitHub Actions workflow to publish on push to `main` (or on tags).
4. Bump the version in `package.json` before each release and push (or push a version tag) to trigger the workflow.

For more on the TypeScript SDK layout and options, see [TypeScript configuration](configuration/typescript.md).
