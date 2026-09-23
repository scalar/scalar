# Scalar CLI

<div class="flex gap-2">
<a href="https://www.npmjs.com/@scalar/cli" aria-label="View @scalar/cli on NPM"><img alt="NPM Version" src="https://img.shields.io/npm/v/@scalar/cli"></a>
<a href="https://www.npmjs.com/@scalar/cli" aria-label="View NPM downloads for @scalar/cli"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@scalar/cli"></a>
<a href="https://discord.gg/scalar" aria-label="Join Scalar community on Discord"><img alt="Discord" src="https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2"></a>
</div>

Reading this guide helps you to get started with our CLI. We have dozens of commands around API Docs rendering (Markdown + MDX), OpenAPI bundling & linting, pushing to our cloud for governance+hosting & much more!

## Quick Start

```
npx @scalar/cli help
```

## Installation

### Install script (no Node.js required)

Install the latest stable CLI without Node.js, npm, Bun, or administrator access. The installer selects the download for your platform and verifies its SHA-256 checksum before installing it.

#### macOS and Linux

Run in Bash:

```bash
curl -fsSL https://cdn.scalar.com/cli/install.sh | bash
```

Supports macOS (Apple Silicon and Intel) and Linux (ARM64 and x64, with glibc). Requires `curl`, `tar`, and either `sha256sum` or `shasum`.

The installer stores releases in `~/.local/share/scalar/releases` and links the executable to `~/.local/bin/scalar`. Follow the printed instructions to add `~/.local/bin` to your `PATH` if needed.

#### Windows

Run in PowerShell:

```powershell
irm https://cdn.scalar.com/cli/install.ps1 | iex
```

Supports Windows x64 and requires `tar.exe`, included in Windows 10 version 1803 and later. The installer installs to `%LOCALAPPDATA%\Scalar\current` and adds it to your user and current-session `PATH`. Open a new terminal for other sessions to pick up the change.

#### Verify and update

After installation, run:

```bash
scalar --help
```

Git also includes a command named `scalar`. If your shell selects Git's command, use the full path to the installed Scalar CLI or put the Scalar installation first in your `PATH`.

To update, run the same install command again. On Windows, close running Scalar processes first. On macOS and Linux, earlier releases remain in `~/.local/share/scalar/releases` and can be removed after upgrading.

You can download and inspect either install script before running it. The installation includes a private Node.js runtime for docs preview. Docs preview downloads its preview server separately, so its first run needs an internet connection.

### Install with npm

If you already have Node.js and npm installed, you can install the CLI globally:

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

- [auth](commands.md#auth) Manage authorization on Scalar platform
- [document](commands.md#document) Manage local openapi files
- [project](commands.md#project) Manage Scalar docs project
- [registry](commands.md#registry) Manage your Scalar registry
- [team](commands.md#team) Manage user teams

## Authentication

To use the CLI with Scalar services, see the [Authentication](authentication.md) guide.

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
      - uses: actions/checkout@v6
      - name: Use Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24
      - name: Validate OpenAPI File
        # Replace `./my-openapi-file.yaml` with the correct path and filename for your project.
        # Or: run `npx @scalar/cli init` and add the config file to your repository.
        run: npx @scalar/cli document validate docs/openapi.yaml
```
