# @scalar/release-notes

## 0.2.0

### Minor Changes

- [#10129](https://github.com/scalar/scalar/pull/10129): feat: select a built-in provider by name in the config and add a pull request context switch

  `provider` now accepts `'anthropic'` or `'openai'` in addition to a custom provider object, and `model` and `apiKeyEnv` are config fields, so a config file (including `release-notes.config.json`) can pick a built-in provider without importing a factory. A `provider` value that is neither a known name nor a provider object now throws a clear error instead of failing later with `provider.generateJson is not a function`.

  A config-level `model` now reaches the provider, custom providers included, where previously only `--model` did. Set `github.pullRequestContext: false` (or pass `--no-pull-request-context`) to skip fetching pull request titles and descriptions and generate from the CHANGELOG alone. The default system prompt no longer describes a pull request context block when none was fetched.

  `model` and `apiKeyEnv` only apply to the provider their own layer of configuration selects, so settings written for one provider are never handed to another. Selecting a different provider with `--provider`, or in a config file that overrides a base config, drops the model id and API key environment variable that came with the provider it replaced. A config that names no provider counts as selecting the default one.

  The exported `PromptContext` handed to a `prompts.systemPrompt` callback gained an `includePullRequestContext` field, so a custom prompt can react to the same signal the default prompt does. `PromptContext`, the `ProviderOption` type, and the `hasBuiltInProviderApiKey` helper (the check the CLI uses to skip gracefully when a key is missing) are now exported.

  The exported `ResolvedReleaseNotesConfig` type changed shape: `provider` is now required and always a constructed provider, and `builtInProviderName` was added. Because provider resolution now happens while the config is read, `sync-release-notes-markdown` validates the `provider` field too, even though it does no AI work.

### Patch Changes

- [#10140](https://github.com/scalar/scalar/pull/10140): Replace redundant type assertions with compiler-checked annotations, typed accumulators, and existing guards across helpers, API conversion, request handling, and schema rendering.

  Narrow DOM elements and caught errors before accessing their properties. Correct header lookup to include missing values and handle them during PowerShell snippet generation.

  Validate release-note provider responses, represent unresolved references and absent groups in helper return types, and require narrowing merged object values. Preserve AsyncAPI broker credentials separately from HTTP authentication schemes.

## 0.1.9

## 0.1.8

### Patch Changes

- [#9983](https://github.com/scalar/scalar/pull/9983): Bump the `zod` catalog to `^4.4.3` so the standalone bundle ships a single `zod` instead of two (`4.3.5` from `@scalar/types` plus `4.4.3` from the `ai` / `@ai-sdk` peer). This makes `standalone.js` ~68KB raw / ~18KB gzip smaller.

## 0.1.7

### Patch Changes

- [#9941](https://github.com/scalar/scalar/pull/9941): Republish every package through npm trusted publishing. No functional changes.

## 0.1.6

## 0.1.5

## 0.1.4

### Patch Changes

- [#9719](https://github.com/scalar/scalar/pull/9719): docs: update the Scalar platform overview block in the README

## 0.1.3

### Patch Changes

- [#9710](https://github.com/scalar/scalar/pull/9710): Republish so the updated README (with the Scalar platform overview) reaches npm. Also renames the README generator metadata in package.json from `readme` to `scalarReadme`: npm treats a `readme` field as the readme text itself, so affected packages were published with a literal `[object Object]` readme on the registry instead of README.md.

## 0.1.2

## 0.1.1

### Patch Changes

- [#9566](https://github.com/scalar/scalar/pull/9566): feat: add a publishable release notes generator package.
