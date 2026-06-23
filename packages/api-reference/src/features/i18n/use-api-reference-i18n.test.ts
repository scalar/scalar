import { describe, expect, it } from 'vitest'

import {
  resolveApiReferenceDirection,
  resolveApiReferenceI18n,
  resolveBuiltInLocale,
  translateApiReference,
} from './use-api-reference-i18n'

describe('use-api-reference-i18n', () => {
  it('uses English translations by default', () => {
    const i18n = resolveApiReferenceI18n()

    expect(i18n.locale).toBe('en')
    expect(i18n.direction).toBe('ltr')
    expect(translateApiReference(i18n.translations, 'operation.testRequest')).toBe('Test Request')
  })

  it('resolves built-in locales from regional locale values', () => {
    expect(resolveBuiltInLocale('ru-RU')).toBe('ru')
    expect(resolveBuiltInLocale('es_MX')).toBe('es')
    expect(resolveBuiltInLocale('zh-Hans')).toBe('zh-CN')
    expect(resolveBuiltInLocale('unknown')).toBe('en')
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

    expect(translateApiReference(i18n.translations, 'search.label')).toBe('Buscar')
    expect(translateApiReference(i18n.translations, 'operation.testRequest')).toBe('Enviar solicitud de prueba')
    expect(translateApiReference(i18n.translations, 'download.openapi')).toBe('Descargar documento OpenAPI')
  })

  it('derives RTL direction for Arabic and allows explicit overrides', () => {
    expect(resolveApiReferenceDirection({ locale: 'ar' })).toBe('rtl')
    expect(resolveApiReferenceDirection({ locale: 'ar-EG' })).toBe('rtl')
    expect(resolveApiReferenceDirection({ locale: 'ar', direction: 'ltr' })).toBe('ltr')
  })

  it('interpolates translation parameters', () => {
    const i18n = resolveApiReferenceI18n({
      translations: {
        search: {
          label: 'Search {name}',
        },
      },
    })

    expect(translateApiReference(i18n.translations, 'search.label', { name: 'API' })).toBe('Search API')
  })
})
