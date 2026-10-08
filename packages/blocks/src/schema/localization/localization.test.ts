import { createLocalization } from '@scalar/localization'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import { useLocalization } from './index'
import { schemaTranslations } from './translations'

const host = createLocalization<{ apiClient: { send: string } }, 'apiClient.send'>({
  localeTranslations: { en: { apiClient: { send: 'Send' } } },
  defaultLocale: 'en',
  rtlLocales: new Set(['ar']),
})

const Label = defineComponent({
  setup() {
    const { translate } = useLocalization()
    return () => h('span', translate('schema.required'))
  },
})

const DefaultLabel = defineComponent({
  setup() {
    const { translate } = useLocalization()
    return () => h('span', translate('schema.default'))
  },
})

describe('localization', () => {
  it('includes every Traditional Chinese schema key and preserves interpolation placeholders', () => {
    const { en, 'zh-TW': dictionary } = schemaTranslations

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

  it.each(['zh-TW', 'zh-tw', 'zh_TW'])(
    'contributes Traditional Chinese schema labels beneath a client host for %s',
    (locale) => {
      const wrapper = mount(
        defineComponent({
          setup() {
            host.provideLocalization({ locale })
            return () => h(DefaultLabel)
          },
        }),
      )

      expect(wrapper.text()).toBe('預設值')
      wrapper.unmount()
    },
  )

  it('renders English without a host provider', () => {
    const wrapper = mount(Label)
    expect(wrapper.text()).toBe('required')
    wrapper.unmount()
  })

  it('contributes schema translations when the host only knows its own keys', async () => {
    const locale = ref('de')
    const wrapper = mount(
      defineComponent({
        setup() {
          host.provideLocalization(() => ({ locale: locale.value }))
          return () => h(Label)
        },
      }),
    )

    expect(wrapper.text()).toBe('erforderlich')
    locale.value = 'en'
    await nextTick()
    expect(wrapper.text()).toBe('required')
    wrapper.unmount()
  })
})
