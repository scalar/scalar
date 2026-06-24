import { describe, expect, it } from 'vitest'

import { resolveApiReferenceLocalization } from './use-api-reference-localization'

describe('use-api-reference-localization', () => {
  it('uses English translations by default', () => {
    const localization = resolveApiReferenceLocalization()

    expect(localization.locale).toBe('en')
    expect(localization.direction).toBe('ltr')
    expect(localization.translations.operation.testRequest).toBe('Test Request')
  })

  it('resolves built-in locales from regional locale values', () => {
    expect(resolveApiReferenceLocalization({ locale: 'ru-RU' }).translations.search.label).toBe('Поиск')
    expect(resolveApiReferenceLocalization({ locale: 'es_MX' }).translations.search.label).toBe('Buscar')
    expect(resolveApiReferenceLocalization({ locale: 'zh-Hans' }).translations.search.label).toBe('搜索')
    expect(resolveApiReferenceLocalization({ locale: 'unknown' }).translations.search.label).toBe('Search')
  })

  it('merges built-in locale translations with custom overrides', () => {
    const localization = resolveApiReferenceLocalization({
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
    expect(resolveApiReferenceLocalization({ locale: 'ar' }).direction).toBe('rtl')
    expect(resolveApiReferenceLocalization({ locale: 'ar-EG' }).direction).toBe('rtl')
    expect(resolveApiReferenceLocalization({ locale: 'ar', direction: 'ltr' }).direction).toBe('ltr')
  })
})
