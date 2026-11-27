# @scalar/localization

Framework-agnostic localization engine shared by the Scalar API Reference, the API Client and the schema blocks.

---

Scalar is an open-source API platform for teams who want beautiful developer interfaces without vendor lock-in.

- **[API References](https://scalar.com/products/api-references/getting-started)** — Interactive API documentation from OpenAPI and AsyncAPI specs.
- **[Developer Docs](https://scalar.com/products/docs/getting-started)** — Write in Markdown/MDX, generate API references, sync with two-way Git.
- **[SDK Generator](https://scalar.com/products/sdk-generator/getting-started)** — Type-safe SDKs and CLIs in TypeScript, Python, Go, PHP, Java, and Ruby.
- **[API Client](https://scalar.com/products/api-client/getting-started)** — Open-source, offline-first Postman alternative built on OpenAPI.

20M+ monthly npm installs · 15,500+ GitHub stars · MIT licensed · [scalar.com](https://scalar.com)

---

## Installation

```bash
npm install @scalar/localization
```

## Usage

`createLocalization` binds the engine to a set of dictionaries and returns `provideLocalization`, `useLocalization`, `resolveLocalization` and `loadLocale`. Every instance shares one injection key, so a provider created with one package's instance also serves the consumers of every other package.

```ts
import { createLocalization } from '@scalar/localization'

import { en } from './locales/en'

export const { provideLocalization, useLocalization } = createLocalization({
  localeTranslations: {
    // The default locale stays static: it renders while any other locale is loading.
    en,
    // Every other locale can be a loader, so bundlers emit it as its own chunk.
    de: () => import('./locales/de').then(({ de }) => de),
  },
  defaultLocale: 'en',
  rtlLocales: new Set(['ar', 'fa', 'he', 'ur']),
})
```

Locale values resolve in this order: exact key, case-insensitive match (`zh_tw` selects `zh-TW`), the `zh-CN` fallback for other Chinese values, the primary subtag (`de-AT` selects `de`), and finally the default locale. Custom `translations` merge on top of the built-in locale and the default fallback. `direction: 'auto'` derives right-to-left from the requested locale.

## Loading locales on demand

A locale given as a loader starts loading the first time a context resolves to it. Until it arrives, the context renders the default locale merged with any custom `translations`, then updates reactively. The text direction follows the requested locale from the first render.

Concurrent requests share a single loader call. A failed load logs a warning, keeps the default locale and is retried on the next request; it never throws into a render.

### `loadLocale`

`loadLocale(locale)` loads a locale for every registered instance at once, so one call warms the API Reference, the API Client and the schema blocks together. It never rejects and resolves immediately for the default locale.

Await it before mounting or hydrating to render a non-default locale on the first paint:

```ts
import { createApiReference, loadLocale } from '@scalar/api-reference'

const configuration = { url: '/openapi.json', localization: { locale: 'de' } }

await loadLocale(configuration.localization.locale)

createApiReference('#app', configuration)
```

Instances register when their module is evaluated, so import the packages you render before you await `loadLocale`. `@scalar/api-reference` and `@scalar/api-client/features/localization` re-export the same function. `isLocaleLoaded(locale)` reports whether every registered instance can render a locale synchronously. An instance stays registered only while something still references it, so creating one per server request does not grow the registry.

### Server rendering

Providers and consumers hold back server rendering (through Vue's `onServerPrefetch`) until the active locale has loaded, so `renderToString` produces translated markup without any host code. Before hydrating that markup in the browser, await `loadLocale` with the same locale; otherwise the client renders the English fallback first and the hydration does not match. `createApiReference` from `@scalar/api-reference` and the Nuxt integration already wait for the configured locale before they mount or hydrate.

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
