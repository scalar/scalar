# @scalar/release-notes

Generate curated release notes from Changesets-style `CHANGELOG.md` files and write a stable `RELEASE_NOTES.json` file, with optional derived Markdown output.

---

Scalar is an open-source API platform for teams who want beautiful developer interfaces without vendor lock-in.

- **[API References](https://scalar.com/products/api-references/getting-started)** — Interactive API documentation from OpenAPI and AsyncAPI specs.
- **[Developer Docs](https://scalar.com/products/docs/getting-started)** — Write in Markdown/MDX, generate API references, sync with two-way Git.
- **[SDK Generator](https://scalar.com/products/sdk-generator/getting-started)** — Type-safe SDKs and CLIs in TypeScript, Python, Go, PHP, Java, and Ruby.
- **[API Client](https://scalar.com/products/api-client/getting-started)** — Open-source, offline-first Postman alternative built on OpenAPI.

20M+ monthly npm installs · 15,500+ GitHub stars · MIT licensed · [scalar.com](https://scalar.com)

---

## Install

```bash
pnpm add -D @scalar/release-notes
```

## CLI

```bash
scalar-release-notes --all --provider anthropic --model claude-sonnet-4-5
```

For a single package without a config file:

```bash
scalar-release-notes \
  --package @example/client \
  --changelog packages/client/CHANGELOG.md \
  --output packages/client/RELEASE_NOTES.json \
  --provider openai \
  --model gpt-4.1-mini
```

## Configuration

Create `release-notes.config.mjs`:

```js
import { defineReleaseNotesConfig } from '@scalar/release-notes'

export default defineReleaseNotesConfig({
  // A built-in provider name: 'anthropic' (default) or 'openai'.
  provider: 'anthropic',
  model: 'claude-sonnet-4-5',
  // Environment variable holding the provider API key.
  // Defaults to ANTHROPIC_API_KEY or OPENAI_API_KEY.
  apiKeyEnv: 'ANTHROPIC_API_KEY',
  github: {
    repo: 'owner/repo',
    token: process.env.GITHUB_TOKEN,
    baseBranch: 'main',
    // Set to false to generate from the CHANGELOG alone, with no GitHub API calls.
    pullRequestContext: true,
  },
  products: [
    {
      slug: 'client',
      packageName: '@example/client',
      displayName: 'Example Client',
      description: 'an API client for Example',
      changelogPath: 'packages/client/CHANGELOG.md',
      outputPath: 'packages/client/RELEASE_NOTES.json',
      markdownPath: 'packages/client/RELEASE_NOTES.md',
    },
  ],
})
```

For full control over how a provider is created, pass a provider object instead of a name. See [Providers](#providers).

JavaScript, JSON, and TypeScript config files are discovered by name. TypeScript config loading depends on your runtime being able to import `.ts` files, for example through `tsx`.

The published JSON Schema for `RELEASE_NOTES.json` is available at `@scalar/release-notes/schema`.

## Pull request context

When `github.repo` is configured, every referenced pull request (`#123`) is fetched from the GitHub REST API and its title and description are fed to the provider as extra context. Turn it off to skip those calls and generate from the CHANGELOG alone:

```js
export default defineReleaseNotesConfig({
  github: {
    repo: 'owner/repo',
    pullRequestContext: false,
  },
})
```

Or per run:

```bash
scalar-release-notes --all --no-pull-request-context
```

The flag only turns pull request context off. There is no counterpart that turns it back on for a config that set `pullRequestContext: false`.

## Providers

A built-in provider is selected by name (`'anthropic'` or `'openai'`) in the config or with `--provider`, and is constructed with its defaults. Pass a provider object instead when you need control over how it is built.

`model` and `apiKeyEnv` belong to the provider their own config selects, so switching provider drops them. Passing `--provider openai` ignores the `model` and `apiKeyEnv` of a config that selects Anthropic, whether it names Anthropic or relies on the default. Pass `--model` and `--api-key-env` alongside it to set them for the new provider.

Use Anthropic:

```js
import { createAnthropicProvider, defineReleaseNotesConfig } from '@scalar/release-notes'

export default defineReleaseNotesConfig({
  provider: createAnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-5',
  }),
})
```

Use OpenAI:

```js
import { createOpenAIProvider, defineReleaseNotesConfig } from '@scalar/release-notes'

export default defineReleaseNotesConfig({
  provider: createOpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4.1-mini',
  }),
})
```

Use a custom provider:

```js
import { defineReleaseNotesConfig } from '@scalar/release-notes'

export default defineReleaseNotesConfig({
  provider: {
    name: 'internal-agent',
    async generateJson({ systemPrompt, userPrompt }) {
      return callInternalAgent({ systemPrompt, userPrompt })
    },
  },
})
```

A provider object builds itself, so the top-level `apiKeyEnv` does not apply to it. A top-level `model` still does: it is passed to `generateJson`.

The provider can return either a JSON object or a JSON string. The package validates the result before writing `RELEASE_NOTES.json`.

## GitHub Actions

Anthropic:

```yaml
- name: Generate release notes
  run: pnpm scalar-release-notes --all --provider anthropic --model claude-sonnet-4-5
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

OpenAI:

```yaml
- name: Generate release notes
  run: pnpm scalar-release-notes --all --provider openai --model gpt-4.1-mini
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Markdown Sync

Regenerate Markdown from JSON without using AI. The config file is still read and its `provider` field still validated, so an unusable `provider` value fails here too:

```bash
scalar-release-notes sync-release-notes-markdown \
  --json packages/client/RELEASE_NOTES.json \
  --markdown packages/client/RELEASE_NOTES.md
```
