import { describe, expect, it } from 'vitest'

import { localeTranslations } from './translations'

describe('locales', () => {
  it('every locale defines the same exploreScalar keys as en', () => {
    const expected = Object.keys(localeTranslations.en.exploreScalar).sort()

    for (const [locale, translations] of Object.entries(localeTranslations)) {
      expect(Object.keys(translations.exploreScalar).sort(), locale).toEqual(expected)

      for (const [key, value] of Object.entries(translations.exploreScalar)) {
        expect(value, `${locale}.exploreScalar.${key}`).toMatch(/\S/)
      }
    }
  })
})
