import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import { createLocalization } from './create-localization'

// A tiny, content-agnostic dictionary so these tests exercise the engine, not real copy.
const en = {
  common: { greeting: 'Hello' },
  schema: { save: 'Save {name}' },
}
const de = {
  common: { greeting: 'Hallo' },
  schema: { save: 'Speichern {name}' },
}
const ar = {
  common: { greeting: 'مرحبا' },
  schema: { save: 'حفظ {name}' },
}

type Translations = typeof en
type Key = 'common.greeting' | 'schema.save'

const { resolveLocalization, provideLocalization, useLocalization } = createLocalization<Translations, Key>({
  localeTranslations: { en, de, ar },
  defaultLocale: 'en',
  rtlLocales: new Set(['ar']),
})

describe('create-localization', () => {
  it('uses the default locale when none is provided', () => {
    const resolved = resolveLocalization()

    expect(resolved.locale).toBe('en')
    expect(resolved.direction).toBe('ltr')
    expect(resolved.translations.common.greeting).toBe('Hello')
  })

  it('resolves built-in locales from regional locale values', () => {
    expect(resolveLocalization({ locale: 'de-DE' }).translations.common.greeting).toBe('Hallo')
    expect(resolveLocalization({ locale: 'unknown' }).translations.common.greeting).toBe('Hello')
  })

  it('merges custom overrides on top of the built-in locale', () => {
    const resolved = resolveLocalization({
      locale: 'de',
      translations: { common: { greeting: 'Servus' } },
    })

    expect(resolved.translations.common.greeting).toBe('Servus')
    // Keys that are not overridden still come from the built-in locale.
    expect(resolved.translations.schema.save).toBe('Speichern {name}')
  })

  it('derives RTL direction and allows explicit overrides', () => {
    expect(resolveLocalization({ locale: 'ar' }).direction).toBe('rtl')
    expect(resolveLocalization({ locale: 'ar', direction: 'ltr' }).direction).toBe('ltr')
  })

  it('provides the context across components and interpolates params', () => {
    const Child = defineComponent({
      setup() {
        const { translate, direction } = useLocalization()
        return () => h('div', { 'data-direction': direction.value }, translate('schema.save', { name: 'Draft' }))
      },
    })

    const Parent = defineComponent({
      setup() {
        provideLocalization(() => ({ locale: 'de' }))
        return () => h(Child)
      },
    })

    const wrapper = mount(Parent)

    expect(wrapper.text()).toBe('Speichern Draft')
    expect(wrapper.find('div').attributes('data-direction')).toBe('ltr')
  })

  it('falls back to the key itself when a translation is missing', () => {
    const Child = defineComponent({
      setup() {
        const { translate } = useLocalization()
        // A key that does not exist in the dictionary.
        return () => h('div', translate('schema.missing' as Key))
      },
    })

    const Parent = defineComponent({
      setup() {
        provideLocalization(undefined)
        return () => h(Child)
      },
    })

    expect(mount(Parent).text()).toBe('schema.missing')
  })
})
