# Localization

The API Reference can render its UI in different languages and writing directions. This localizes the
**interface chrome** — search, navigation, sidebar, schema labels, operation sections, response
examples, developer tools, and action buttons.

> **Note:** This does not translate the content of your OpenAPI document (summaries, descriptions,
> tags, or examples). For localized content, provide a localized OpenAPI document/source.

## Built-in locales

API Reference and API Client ship translations for the following locales. Missing keys fall back to
English (`en`).

* `en` — English
* `ru` — Russian
* `es` — Spanish
* `fr` — French
* `de` — German
* `zh-CN` — Simplified Chinese
* `ar` — Arabic (renders right-to-left by default)
* `pt` — Portuguese

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


## API Client

The embedded API Client accepts overrides under `localization.translations.apiClient`. Pass them to
API Reference alongside your reference translations; they also apply to the client opened by **Test
Request**. Updates to the reference configuration update the client labels, locale, and direction.

The API Client supports the same built-in locales listed above. Setting `localization: { locale: 'de' }`
translates both the reference and its embedded client without custom strings. Overrides merge on top
of the selected language, and regional locale values use the same fallback rules.

```javascript
{
  localization: {
    locale: 'de',
    translations: {
      operation: { testRequest: 'Anfrage testen' },
      apiClient: {
        addressBar: {
          send: 'Senden',
          sendRequest: '{method}-Anfrage an {url} senden',
        },
        requestBlock: {
          authentication: 'Authentifizierung',
          headers: 'Kopfzeilen',
          queryParameters: 'Abfrageparameter',
          requestBody: 'Anfragetext',
        },
        responseBlock: { response: 'Antwort' },
        responseEmpty: { sendRequest: 'Anfrage senden' },
        sectionFilter: { all: 'Alle', headers: 'Kopfzeilen', body: 'Inhalt' },
      },
    },
  },
}
```

Use the same `localization` object in `createApiClientModal({ options: { localization }, ... })` or the
standalone `Operation` component's `options` prop. `modal.updateOptions({ localization })` updates an
existing modal. Custom Vue hosts can call `provideLocalization` from
`@scalar/api-client/features/localization` in their setup function to localize client components in
that subtree.

`ApiClientTranslations`, exported from `@scalar/types/api-reference`, lists the available keys.
The English dictionary is in
[`packages/api-client/src/v2/features/localization/translations.ts`](../packages/api-client/src/v2/features/localization/translations.ts).
The other built-in dictionaries are in
[`packages/api-client/src/v2/features/localization/locales`](../packages/api-client/src/v2/features/localization/locales).
Preserve placeholders such as `{method}`, `{url}`, and `{name}` in translated messages. Translation
values render as text. Request URLs, HTTP methods, MIME types, credentials, and content from your API
description remain unchanged.
