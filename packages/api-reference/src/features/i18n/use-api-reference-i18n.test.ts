import { describe, expect, it } from 'vitest'

import { resolveApiReferenceI18n } from './use-api-reference-i18n'

describe('use-api-reference-i18n', () => {
  it('uses English translations by default', () => {
    const i18n = resolveApiReferenceI18n()

    expect(i18n.locale).toBe('en')
    expect(i18n.direction).toBe('ltr')
    expect(i18n.translations.operation.testRequest).toBe('Test Request')
  })

  it('resolves built-in locales from regional locale values', () => {
    expect(resolveApiReferenceI18n({ locale: 'ru-RU' }).translations.search.label).toBe('Поиск')
    expect(resolveApiReferenceI18n({ locale: 'es_MX' }).translations.search.label).toBe('Buscar')
    expect(resolveApiReferenceI18n({ locale: 'zh-Hans' }).translations.search.label).toBe('搜索')
    expect(resolveApiReferenceI18n({ locale: 'unknown' }).translations.search.label).toBe('Search')
  })

  it('merges built-in locale translations with custom overrides', () => {
    const i18n = resolveApiReferenceI18n({
      locale: 'es',
      translations: {
        operation: {
          testRequest: 'Enviar solicitud de prueba',
        },
      },
    })

    expect(i18n.translations.search.label).toBe('Buscar')
    expect(i18n.translations.operation.testRequest).toBe('Enviar solicitud de prueba')
    expect(i18n.translations.download.openapi).toBe('Descargar documento OpenAPI')
  })

  it('derives RTL direction for Arabic and allows explicit overrides', () => {
    expect(resolveApiReferenceI18n({ locale: 'ar' }).direction).toBe('rtl')
    expect(resolveApiReferenceI18n({ locale: 'ar-EG' }).direction).toBe('rtl')
    expect(resolveApiReferenceI18n({ locale: 'ar', direction: 'ltr' }).direction).toBe('ltr')
  })
})
