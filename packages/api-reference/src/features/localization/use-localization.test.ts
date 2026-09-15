import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import { provideLocalization, resolveLocalization, useLocalization } from './use-localization'

describe('use-localization', () => {
  it('uses English translations by default', () => {
    const localization = resolveLocalization()

    expect(localization.locale).toBe('en')
    expect(localization.direction).toBe('ltr')
    expect(localization.translations.operation.testRequest).toBe('Test Request')
  })

  it('resolves built-in locales from regional locale values', () => {
    expect(resolveLocalization({ locale: 'ru-RU' }).translations.search.label).toBe('Поиск')
    expect(resolveLocalization({ locale: 'es_MX' }).translations.search.label).toBe('Buscar')
    expect(resolveLocalization({ locale: 'zh-Hans' }).translations.search.label).toBe('搜索')
    expect(resolveLocalization({ locale: 'unknown' }).translations.search.label).toBe('Search')
  })

  it('merges built-in locale translations with custom overrides', () => {
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

  it('receives the provided context when a provider exists', () => {
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
})
