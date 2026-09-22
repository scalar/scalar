import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

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

  it.each(['$&', "$'", '$`', '$1', '$$'])('preserves literal %s in repeated interpolation values', (name) => {
    const Component = defineComponent({
      setup() {
        const { translate } = provideLocalization({
          translations: { schema: { save: 'Save {name}, then reopen {name}.' } },
        })
        return () => h('div', translate('schema.save', { name }))
      },
    })

    const wrapper = mount(Component)

    expect(wrapper.text()).toBe(`Save ${name}, then reopen ${name}.`)
    wrapper.unmount()
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

  it('keeps a cached cross-package context reactive after its first consumer unmounts', async () => {
    const other = createLocalization<{ client: { send: string } }, 'client.send'>({
      localeTranslations: {
        en: { client: { send: 'Send' } },
        ar: { client: { send: 'إرسال' } },
      },
      defaultLocale: 'en',
      rtlLocales: new Set(['ar']),
    })
    const locale = ref('en')
    const consumer = ref('first')
    const contexts: ReturnType<typeof other.useLocalization>[] = []
    const Child = defineComponent({
      setup() {
        const context = other.useLocalization()
        contexts.push(context)
        return () =>
          h('button', { lang: context.locale.value, dir: context.direction.value }, context.translate('client.send'))
      },
    })
    const wrapper = mount(
      defineComponent({
        setup() {
          provideLocalization(() => ({ locale: locale.value }))
          return () => (consumer.value ? h(Child, { key: consumer.value }) : null)
        },
      }),
    )
    expect(wrapper.text()).toBe('Send')
    consumer.value = ''
    await nextTick()
    consumer.value = 'second'
    await nextTick()
    expect(contexts[0]).toBe(contexts[1])
    locale.value = 'ar'
    await nextTick()
    expect(wrapper.text()).toBe('إرسال')
    expect(wrapper.attributes('lang')).toBe('ar')
    expect(wrapper.attributes('dir')).toBe('rtl')
    wrapper.unmount()
  })

  it('merges a consumer dictionary with reactive translations from a different package', async () => {
    const other = createLocalization<{ client: { send: string; cancel: string } }, 'client.send' | 'client.cancel'>({
      localeTranslations: { en: { client: { send: 'Send', cancel: 'Cancel' } } },
      defaultLocale: 'en',
      rtlLocales: new Set(['ar']),
    })
    const overrides = ref({ client: { send: 'Senden' } })
    const contexts: ReturnType<typeof other.useLocalization>[] = []
    const Child = defineComponent({
      setup() {
        const context = other.useLocalization()
        contexts.push(context)
        return () => h('span', `${context.translate('client.send')} / ${context.translate('client.cancel')}`)
      },
    })
    const wrapper = mount(
      defineComponent({
        setup() {
          provideLocalization(() => ({
            locale: 'de',
            translations: { ...overrides.value, common: { greeting: 'Hallo' } },
          }))
          return () => h('div', [h(Child), h(Child)])
        },
      }),
    )
    expect(wrapper.findAll('span').map((span) => span.text())).toStrictEqual(['Senden / Cancel', 'Senden / Cancel'])
    expect(contexts[0]).toBe(contexts[1])
    overrides.value = { client: { send: 'Abschicken' } }
    await nextTick()
    expect(wrapper.findAll('span').map((span) => span.text())).toStrictEqual([
      'Abschicken / Cancel',
      'Abschicken / Cancel',
    ])
    wrapper.unmount()
  })
})
