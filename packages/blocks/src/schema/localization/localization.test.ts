import { createLocalization } from '@scalar/localization'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import { useLocalization } from './index'

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

describe('localization', () => {
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
