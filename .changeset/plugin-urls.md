---
'@scalar/api-reference': minor
'@scalar/schemas': minor
'@scalar/types': minor
---

feat: add `pluginUrls` configuration option to load API Reference plugins from URLs

Each entry must point to an ESM module that exports a plugin (the same shape as the `plugins` entries) as its default export. The standalone build (`Scalar.createApiReference`) imports the modules before the API reference mounts and registers their default exports alongside the plugins passed directly. Unlike `plugins`, the new option is JSON-serializable, so integrations that pass their configuration as JSON (for example the Docker container or Scalar for Aspire) can load plugins without replacing the whole bundle.
