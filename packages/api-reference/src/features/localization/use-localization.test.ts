import { useLocalization as useClientLocalization } from '@scalar/api-client/features/localization'
import { loadLocale } from '@scalar/localization'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { localeTranslations } from './translations'
import { provideLocalization, resolveLocalization, useLocalization } from './use-localization'

/** Every built-in locale, so a test can warm them all before asserting synchronous output. */
const loadAllLocales = (): Promise<unknown> =>
  Promise.all(Object.keys(localeTranslations).map((locale) => loadLocale(locale)))

/**
 * Imports the reference and client localization in a fresh module graph, so no earlier test has
 * already loaded the locale under test.
 */
const importFreshLocalization = async () => {
  vi.resetModules()
  const reference = await import('./use-localization')
  const client = await import('@scalar/api-client/features/localization')

  const Consumer = defineComponent({
    setup() {
      const { translate } = reference.useLocalization()
      const { translate: translateClient } = client.useLocalization()
      return () =>
        h('p', [
          translate('search.label'),
          ' / ',
          translate('schema.required'),
          ' / ',
          translateClient('apiClient.addressBar.send'),
        ])
    },
  })
  const Provider = defineComponent({
    setup() {
      reference.provideLocalization({ locale: 'de-DE' })
      return () => h(Consumer)
    },
  })

  return { Provider }
}

describe('use-localization', () => {
  it('renders English until German loads, then updates reference, schema and client strings', async () => {
    const { Provider } = await importFreshLocalization()
    const wrapper = mount(Provider)

    expect(wrapper.text()).toBe('Search / required / Send')
    await vi.waitFor(() => expect(wrapper.text()).toBe('Suchen / erforderlich / Senden'))
    wrapper.unmount()
  })

  it('server-renders the loaded locale without any host code', async () => {
    const { Provider } = await importFreshLocalization()

    expect(await renderToString(createSSRApp(Provider))).toBe('<p>Suchen / erforderlich / Senden</p>')
  })

  it('localizes client consumers in every built-in reference locale and reacts to changes', async () => {
    await loadAllLocales()
    const localization = ref({ locale: 'en' })
    const expected: Record<keyof typeof localeTranslations, string> = {
      en: 'Send',
      ru: 'Отправить',
      es: 'Enviar',
      fr: 'Envoyer',
      de: 'Senden',
      'zh-CN': '发送',
      'zh-TW': '傳送',
      ar: 'إرسال',
      pt: 'Enviar',
    }
    const Consumer = defineComponent({
      setup() {
        const { translate, direction } = useClientLocalization()
        return () => h('button', { dir: direction.value }, translate('apiClient.addressBar.send'))
      },
    })
    const wrapper = mount(
      defineComponent({
        setup() {
          provideLocalization(localization)
          return () => h(Consumer)
        },
      }),
    )
    for (const locale of Object.keys(localeTranslations) as (keyof typeof localeTranslations)[]) {
      localization.value = { locale }
      await nextTick()
      expect(wrapper.text()).toBe(expected[locale])
      expect(wrapper.attributes('dir')).toBe(locale === 'ar' ? 'rtl' : 'ltr')
    }
    wrapper.unmount()
  })

  it('uses English translations by default', () => {
    const localization = resolveLocalization()

    expect(localization.locale).toBe('en')
    expect(localization.direction).toBe('ltr')
    expect(localization.translations.operation.testRequest).toBe('Test Request')
  })

  it('resolves built-in locales from regional locale values', async () => {
    await loadAllLocales()
    expect(resolveLocalization({ locale: 'ru-RU' }).translations.search.label).toBe('Поиск')
    expect(resolveLocalization({ locale: 'es_MX' }).translations.search.label).toBe('Buscar')
    expect(resolveLocalization({ locale: 'zh-Hans' }).translations.search.label).toBe('搜索')
    expect(resolveLocalization({ locale: 'unknown' }).translations.search.label).toBe('Search')
  })

  it.each(['zh-TW', 'zh-tw', 'zh_TW'])(
    'selects Traditional Chinese reference and schema labels for %s',
    async (locale) => {
      await loadLocale(locale)
      const { translations, direction } = resolveLocalization({ locale })

      expect(translations.search.label).toBe('搜尋')
      expect(translations.operation.responses).toBe('回應')
      expect(translations.developerTools.configure).toBe('設定')
      expect(translations.schema.default).toBe('預設值')
      expect(direction).toBe('ltr')
    },
  )

  it.each(['zh-Hans', 'zh-Hant', 'zh-HK', 'zh-MO'])('keeps the Simplified Chinese fallback for %s', async (locale) => {
    await loadLocale(locale)
    expect(resolveLocalization({ locale }).translations.search.label).toBe('搜索')
  })

  it('includes every Traditional Chinese reference key and preserves interpolation placeholders', async () => {
    const { en } = localeTranslations
    const dictionary = await localeTranslations['zh-TW']()

    expect(Object.keys(dictionary).sort()).toStrictEqual(Object.keys(en).sort())
    for (const group of Object.keys(en) as (keyof typeof en)[]) {
      expect(Object.keys(dictionary[group]).sort()).toStrictEqual(Object.keys(en[group]).sort())
      for (const [key, source] of Object.entries(en[group])) {
        const translated = (dictionary[group] as Record<string, string>)[key]!
        expect(translated.trim()).not.toBe('')
        expect((translated.match(/\{[^}]+\}/g) ?? []).sort()).toStrictEqual((source.match(/\{[^}]+\}/g) ?? []).sort())
      }
    }
  })

  it('merges built-in locale translations with custom overrides', async () => {
    await loadLocale('es')
    const localization = resolveLocalization({
      locale: 'es',
      translations: {
        operation: {
          testRequest: 'Enviar solicitud de prueba',
        },
      },
    })

    expect(localization.translations.search.label).toBe('Buscar')
    expect(localization.translations.operation.testRequest).toBe('Enviar solicitud de prueba')
    expect(localization.translations.download.openapi).toBe('Descargar documento OpenAPI')
  })

  it('derives RTL direction for Arabic and allows explicit overrides', () => {
    expect(resolveLocalization({ locale: 'ar' }).direction).toBe('rtl')
    expect(resolveLocalization({ locale: 'ar-EG' }).direction).toBe('rtl')
    expect(resolveLocalization({ locale: 'ar', direction: 'ltr' }).direction).toBe('ltr')
  })

  it('shares a single fallback context between components without a provider', () => {
    const contexts: ReturnType<typeof useLocalization>[] = []

    const Consumer = defineComponent({
      setup() {
        contexts.push(useLocalization())

        return () => h('span')
      },
    })

    mount(Consumer)
    mount(Consumer)

    expect(contexts).toHaveLength(2)
    expect(contexts[0]).toBe(contexts[1])
    expect(contexts[0]?.locale.value).toBe('en')
    expect(contexts[0]?.direction.value).toBe('ltr')
    expect(contexts[0]?.translate('operation.testRequest')).toBe('Test Request')
  })

  it('keeps the fallback context usable after the first consumer unmounts', () => {
    const contexts: ReturnType<typeof useLocalization>[] = []

    const Consumer = defineComponent({
      setup() {
        contexts.push(useLocalization())

        return () => h('span')
      },
    })

    const first = mount(Consumer)
    first.unmount()
    mount(Consumer)

    expect(contexts[1]?.translations.value.operation.testRequest).toBe('Test Request')
  })

  it('receives the provided context when a provider exists', async () => {
    await loadLocale('es')
    let provided: ReturnType<typeof provideLocalization> | undefined
    let injected: ReturnType<typeof useLocalization> | undefined

    const Consumer = defineComponent({
      setup() {
        injected = useLocalization()

        return () => h('span')
      },
    })

    const Provider = defineComponent({
      setup() {
        provided = provideLocalization({ locale: 'es' })

        return () => h(Consumer)
      },
    })

    mount(Provider)

    expect(injected).toBe(provided)
    expect(injected?.locale.value).toBe('es')
    expect(injected?.translate('search.label')).toBe('Buscar')
  })

  it('falls back to the key itself for missing translations', () => {
    const Consumer = defineComponent({
      setup() {
        const { translate } = useLocalization()

        return () => h('span', translate('does.not.exist' as Parameters<typeof translate>[0]))
      },
    })

    expect(mount(Consumer).text()).toBe('does.not.exist')
  })

  it('provides client overrides alongside reference strings and built-in client translations', async () => {
    await loadLocale('de')
    const Consumer = defineComponent({
      setup() {
        const { translate } = useClientLocalization()
        return () =>
          h('span', `${translate('apiClient.addressBar.send')} / ${translate('apiClient.requestBlock.headers')}`)
      },
    })
    const wrapper = mount(
      defineComponent({
        setup() {
          provideLocalization({
            locale: 'de',
            translations: {
              operation: { testRequest: 'Anfrage testen' },
              apiClient: { addressBar: { send: 'Abschicken' } },
            },
          })
          return () => h(Consumer)
        },
      }),
    )
    expect(wrapper.text()).toBe('Abschicken / Header')
    wrapper.unmount()
  })
})
