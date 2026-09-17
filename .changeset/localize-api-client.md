---
"@scalar/api-client": minor
"@scalar/api-reference": patch
"@scalar/types": patch
"@scalar/localization": patch
---

Support API Client UI translations through `localization.translations.apiClient`, including the client embedded in API Reference. Ship client translations for English, Russian, Spanish, French, German, Simplified Chinese, Arabic, and Portuguese to match API Reference. Preserve English fallbacks across package providers and react to locale, direction, and translation updates.

Preserve literal dollar replacement sequences such as `$&`, `$'`, and `$1` in interpolated values. This also fixes existing API Reference translations in `@scalar/localization`.
