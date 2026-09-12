---
'@scalar/api-reference': minor
'@scalar/types': minor
'@scalar/schemas': minor
---

feat: add "Copy as Markdown for LLM" button on every operation in both Classic and Modern layouts

Clicking the brain icon copies a structured Markdown snapshot of the operation — method, path, summary, description, parameters table, request body schema, and responses — to the clipboard, ready to paste into any LLM chat.

Follow-up improvements:
- **Localized label**: button label is now routed through the localization system (`actions.copyAsMarkdownForLlm`) with translations for all 7 built-in locales (en, ar, de, es, fr, ru, zh-CN)
- **`$ref` resolution**: `operation.parameters`, `requestBody`, and each `responses` entry are now resolved via `getResolvedRef` before serialization, so documents that use shared `$ref` components render correctly instead of producing empty sections
- **Table escaping**: pipe characters (`|`) in descriptions are escaped to `\|` so they don't break Markdown table rows
- **Opt-out flag**: a new `hideCopyAsMarkdownButton: boolean` configuration option (default `false`) hides the button when set to `true`, consistent with `hideTestRequestButton`
