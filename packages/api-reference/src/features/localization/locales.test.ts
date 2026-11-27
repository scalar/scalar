import { describe, expect, it } from 'vitest'

import { localeTranslations } from './translations'

describe('locales', () => {
  it('every locale defines the same exploreScalar keys as en', async () => {
    const expected = Object.keys(localeTranslations.en.exploreScalar).sort()

    for (const [locale, source] of Object.entries(localeTranslations)) {
      const translations = typeof source === 'function' ? await source() : source

      expect(Object.keys(translations.exploreScalar).sort(), locale).toEqual(expected)

      for (const [key, value] of Object.entries(translations.exploreScalar)) {
        expect(value, `${locale}.exploreScalar.${key}`).toMatch(/\S/)
      }
    }
  })

  it('keeps English static and every other locale lazy', () => {
    for (const [locale, source] of Object.entries(localeTranslations)) {
      expect(typeof source, locale).toBe(locale === 'en' ? 'object' : 'function')
    }
  })

  it('composes the matching schema strings from @scalar/blocks into each locale', async () => {
    const german = await localeTranslations.de()

    expect(localeTranslations.en.schema.required).toBe('required')
    expect(german.schema.required).toBe('erforderlich')
    expect(german.search.label).toBe('Suchen')
  })
})
