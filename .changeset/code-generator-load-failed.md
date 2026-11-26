---
'@scalar/types': patch
'@scalar/api-reference': patch
'@scalar/api-client': patch
'@scalar/blocks': patch
---

Show a localized status line with a Retry button when a code generator fails to load

The new `operation.codeSampleLoadFailed` and `operation.codeSampleRetry` (API Reference) and `apiClient.requestCodeSnippet.loadFailed` and `apiClient.requestCodeSnippet.retry` (API Client) translations can be overridden in `localization.translations`. `CodeExample` and `createCodeExample` take them as `codeSampleLoadFailed` and `codeSampleRetryLabel`.
