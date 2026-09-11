---
'@scalar/release-notes': minor
---

feat: select a built-in provider by name in the config and add a pull request context switch

`provider` now accepts `'anthropic'` or `'openai'` in addition to a custom provider object, and `model` and `apiKeyEnv` are config fields, so a config file (including `release-notes.config.json`) can pick a built-in provider without importing a factory. A `provider` value that is neither a known name nor a provider object now throws a clear error instead of failing later with `provider.generateJson is not a function`.

A config-level `model` now reaches the provider, custom providers included, where previously only `--model` did. Set `github.pullRequestContext: false` (or pass `--no-pull-request-context`) to skip fetching pull request titles and descriptions and generate from the CHANGELOG alone. The default system prompt no longer describes a pull request context block when none was fetched.

`model` and `apiKeyEnv` only apply to the provider their own layer of configuration selects, so settings written for one provider are never handed to another. Selecting a different provider with `--provider`, or in a config file that overrides a base config, drops the model id and API key environment variable that came with the provider it replaced. A config that names no provider counts as selecting the default one.

The exported `PromptContext` handed to a `prompts.systemPrompt` callback gained an `includePullRequestContext` field, so a custom prompt can react to the same signal the default prompt does. `PromptContext`, the `ProviderOption` type, and the `hasBuiltInProviderApiKey` helper (the check the CLI uses to skip gracefully when a key is missing) are now exported.

The exported `ResolvedReleaseNotesConfig` type changed shape: `provider` is now required and always a constructed provider, and `builtInProviderName` was added. Because provider resolution now happens while the config is read, `sync-release-notes-markdown` validates the `provider` field too, even though it does no AI work.
