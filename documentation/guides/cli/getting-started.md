# Scalar CLI

<div class="flex gap-2">
<a href="https://www.npmjs.com/@scalar/cli" aria-label="View @scalar/cli on NPM"><img alt="NPM Version" src="https://img.shields.io/npm/v/@scalar/cli"></a>
<a href="https://www.npmjs.com/@scalar/cli" aria-label="View NPM downloads for @scalar/cli"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@scalar/cli"></a>
<a href="https://discord.gg/scalar" aria-label="Join Scalar community on Discord"><img alt="Discord" src="https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2"></a>
</div>

Scalar CLI brings fast OpenAPI parsing and bundling to your terminal. Validate API descriptions, bundle files, lint with Spectral rules, and preview interactive API documentation with one actively maintained toolkit.

Start with the `scalar document` commands for your local OpenAPI workflow, then use the same CLI to publish documentation and manage APIs on the Scalar platform.

![The Scalar CLI validating, linting, bundling, and serving an OpenAPI document](../../assets/cli/scalar-cli.webp)

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

The input can also be a URL. See the [bundle options](commands/document.md#bundle) for controlling concurrent fetches and generating a map of resolved URLs.

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
| [`document bundle`](commands/document.md#bundle)     | Combine an API description and its external references into one file. |
| [`document validate`](commands/document.md#validate) | Check an API description against the OpenAPI Specification.           |
| [`document lint`](commands/document.md#lint)         | Apply Spectral rules to your API description.                         |
| [`document serve`](commands/document.md#serve)       | Preview an interactive API Reference.                                 |
| [`document mock`](commands/document.md#mock)         | Run a mock API server.                                                |
| [`document split`](commands/document.md#split)       | Break an API description into smaller files.                          |
| [`document join`](commands/document.md#join)         | Merge multiple API descriptions into one.                             |
| [`document format`](commands/document.md#format)     | Format an OpenAPI file.                                               |
| [`document convert`](commands/document.md#convert)   | Convert a Postman collection to an OpenAPI description.               |
| [`document markdown`](commands/document.md#markdown) | Generate Markdown from an API description.                            |
| [`document upgrade`](commands/document.md#upgrade) | Upgrade an API description to OpenAPI 3.1.                            |
| [`document share`](commands/document.md#share)       | Share an OpenAPI file.                                                |
| [`document void`](commands/document.md#void)         | Start a server that mirrors HTTP requests.                            |

Explore all document commands or get help with a specific command:

```bash
npx @scalar/cli document --help
npx @scalar/cli document bundle --help
```

## Installation

### Standalone CLI

Install the latest release without Node.js, npm, or administrator access.

macOS and Linux:

```bash
curl -fsSL https://cdn.scalar.com/cli/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://cdn.scalar.com/cli/install.ps1 | iex
```

The installers pick the archive for your platform and verify its SHA-256 checksum before installing. macOS and Linux support x64 and ARM64; Linux requires glibc. Windows supports x64 and requires `tar.exe`, included in Windows 10 version 1803 and later. Re-run the installer to upgrade.

### npm

If you already use Node.js, install the CLI globally:

```bash
npm install --global @scalar/cli
```

You can then use `scalar` in place of `npx @scalar/cli` in the examples above:

```bash
scalar document bundle openapi.yaml --output openapi.bundled.yaml
```

### Conflict: EXIST: file already exists

Git ships its own, unrelated `scalar` executable. If you never use it, replace it:

```bash
npm -g --force install @scalar/cli
```

To keep Git's `scalar`, use the `scalar-cli` alias that npm installs, or run the CLI without installing it:

```bash
npx @scalar/cli help
pnpm dlx @scalar/cli help
```

## Shell completion

Completion for Bash, Zsh, and Fish runs locally and covers commands, flags, and option values.

```bash
# Bash: then add the `source` line to ~/.bashrc
mkdir -p ~/.local/share/scalar
scalar completion bash > ~/.local/share/scalar/completion.bash
source ~/.local/share/scalar/completion.bash

# Zsh: then add `fpath=(~/.zsh/completions $fpath)` before `compinit` in ~/.zshrc
mkdir -p ~/.zsh/completions
scalar completion zsh > ~/.zsh/completions/_scalar

# Fish
mkdir -p ~/.config/fish/completions
scalar completion fish > ~/.config/fish/completions/scalar.fish
```

Completion reads the installed CLI on each Tab press, so new commands appear after an upgrade. Regenerate the script after upgrading to pick up changes to the shell adapter itself.

## AI agents

`scalar context` prints every command, argument, option, default, and choice as JSON, plus notes on running the CLI without prompts. Point an agent at it instead of having it scrape `--help`:

```bash
scalar context
```

The CLI also ships an [Agent Skill](https://agentskills.io) at `skills/scalar-cli/SKILL.md`. Copy it into your agent's skills directory:

```bash
mkdir -p .claude/skills

# npm (global install)
cp -r "$(npm root -g)/@scalar/cli/skills/scalar-cli" .claude/skills/

# Standalone CLI on macOS or Linux
cp -r "$(dirname "$(readlink "$(command -v scalar)")")/app/skills/scalar-cli" .claude/skills/
```

On Windows, the standalone CLI keeps the skill in `%LOCALAPPDATA%\Scalar\current\app\skills\scalar-cli`.

## Commands

| Group | Use it to |
| --- | --- |
| [`scalar document`](commands/document.md) | Bundle, validate, lint, format, mock, and preview API descriptions. |
| [`scalar project`](commands/project.md) | Create, preview, publish, and roll back Scalar Docs projects. |
| [`scalar registry`](commands/registry.md) | Publish and download API descriptions in the Scalar Registry. |
| [`scalar auth`](commands/auth.md) | Log in and out of Scalar. |
| [`scalar team`](commands/team.md) | List and switch between your teams. |
| [`scalar schema`](commands/schema.md) | Publish and manage shared schemas. |
| [`scalar sdk`](commands/sdk.md) | Create, build, and inspect SDKs. |
| [`scalar access-group`](commands/access-group.md) | Control who can read private docs. |

The [command reference](commands.md) lists every command and option.

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

For lint reports, baselines, and JSON output in pipelines, see [CI and scripting](ci-and-scripting.md).
