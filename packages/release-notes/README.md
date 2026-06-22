# @scalar/release-notes

Generate curated release notes from Changesets-style `CHANGELOG.md` files and write a stable `RELEASE_NOTES.json` file, with optional derived Markdown output.

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
import { createAnthropicProvider, defineReleaseNotesConfig } from '@scalar/release-notes'

export default defineReleaseNotesConfig({
  provider: createAnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-5',
  }),
  github: {
    repo: 'owner/repo',
    token: process.env.GITHUB_TOKEN,
    baseBranch: 'main',
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

JavaScript, JSON, and TypeScript config files are discovered by name. TypeScript config loading depends on your runtime being able to import `.ts` files, for example through `tsx`.

The published JSON Schema for `RELEASE_NOTES.json` is available at `@scalar/release-notes/schema`.

## Providers

Use Anthropic:

```js
import { createAnthropicProvider } from '@scalar/release-notes'

createAnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-5',
})
```

Use OpenAI:

```js
import { createOpenAIProvider } from '@scalar/release-notes'

createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4.1-mini',
})
```

Use a custom provider:

```js
export default defineReleaseNotesConfig({
  provider: {
    name: 'internal-agent',
    async generateJson({ systemPrompt, userPrompt }) {
      return callInternalAgent({ systemPrompt, userPrompt })
    },
  },
})
```

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

Regenerate Markdown from JSON without using AI:

```bash
scalar-release-notes sync-release-notes-markdown \
  --json packages/client/RELEASE_NOTES.json \
  --markdown packages/client/RELEASE_NOTES.md
```
