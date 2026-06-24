# Localization

The API Reference can render its UI in different languages and writing directions. This localizes the
**interface chrome** — search, navigation, sidebar, schema labels, operation sections, response
examples, developer tools, and action buttons.

> **Note:** This does not translate the content of your OpenAPI document (summaries, descriptions,
> tags, or examples). For localized content, provide a localized OpenAPI document/source.

## Built-in locales

Translations ship for the following locales. English (`en`) is always used as the fallback for any
key you do not override.

* `en` — English
* `ru` — Russian
* `es` — Spanish
* `fr` — French
* `de` — German
* `zh-CN` — Simplified Chinese
* `ar` — Arabic (renders right-to-left by default)

## Configuration

Pass a `localization` object to your [API Reference configuration](configuration.md):

**Type:** `{ locale?: string, direction?: 'ltr' | 'rtl' | 'auto', translations?: object }`

**Default:** `{ locale: 'en', direction: 'ltr' }`

```javascript
{
  localization: {
    locale: 'de',
  },
}
```

### `locale`

The locale used for the built-in UI translations. Regional values are accepted and fall back to the
base language — for example `es-MX` resolves to `es`, and `zh-Hans` resolves to `zh-CN`. Unknown
locales fall back to English.

### `direction`

The text direction: `'ltr'`, `'rtl'`, or `'auto'`. With `'auto'` (or when omitted) the direction is
derived from the locale, so Arabic and other right-to-left languages render correctly without extra
configuration. Set it explicitly to override.

```javascript
{
  localization: {
    locale: 'ar',
    direction: 'auto', // renders right-to-left
  },
}
```

### `translations`

Override individual labels, or add your own language on top of a built-in locale. Values are merged
with the selected locale and the English fallback, so you only need to specify the keys you want to
change.

```javascript
{
  localization: {
    locale: 'es',
    translations: {
      operation: {
        testRequest: 'Enviar solicitud de prueba',
        responses: 'Respuestas',
      },
    },
  },
}
```
