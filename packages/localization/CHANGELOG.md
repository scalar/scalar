# @scalar/localization

## 0.2.1

### Patch Changes

- [#10175](https://github.com/scalar/scalar/pull/10175): Support API Client UI translations through `localization.translations.apiClient`, including the client embedded in API Reference. Ship client translations for English, Russian, Spanish, French, German, Simplified Chinese, Arabic, and Portuguese to match API Reference. Preserve English fallbacks across package providers and react to locale, direction, and translation updates.
- [#10175](https://github.com/scalar/scalar/pull/10175): Preserve literal dollar sequences in interpolated translation values, including existing API Reference translations.

## 0.2.0

### Minor Changes

- [#9675](https://github.com/scalar/scalar/pull/9675): feat: new package — a framework-agnostic localization engine shared across Scalar packages. It provides `createLocalization()`, which binds a set of translations to a Vue provide/inject context so translations can be contributed and consumed across package boundaries.
