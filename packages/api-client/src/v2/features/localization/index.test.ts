import type { ApiReferenceLocalization } from '@scalar/types/api-reference'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import ResponseEmpty from '@/v2/blocks/response-block/components/ResponseEmpty.vue'

import { loadLocale, provideLocalization, resolveLocalization, useLocalization } from './index'
import { ar } from './locales/ar'
import { de } from './locales/de'
import { es } from './locales/es'
import { fr } from './locales/fr'
import { pt } from './locales/pt'
import { ru } from './locales/ru'
import { zhCn } from './locales/zh-cn'
import { zhTw } from './locales/zh-tw'
import { en } from './translations'

const Consumer = defineComponent({
  setup() {
    const { translate, locale, direction } = useLocalization()
    return () => h('button', { lang: locale.value, dir: direction.value }, translate('apiClient.addressBar.send'))
  },
})

describe('index', () => {
  it('renders English until a lazy locale loads, then switches without host code', async () => {
    // A fresh module graph, so no other test in this file has loaded French yet.
    vi.resetModules()
    const fresh = await import('./index')
    const FreshConsumer = defineComponent({
      setup() {
        const { translate, locale } = fresh.useLocalization()
        return () => h('button', { lang: locale.value }, translate('apiClient.addressBar.send'))
      },
    })
    const wrapper = mount(
      defineComponent({
        setup() {
          fresh.provideLocalization({ locale: 'fr-CA' })
          return () => h(FreshConsumer)
        },
      }),
    )

    expect(wrapper.text()).toBe('Send')
    expect(wrapper.attributes('lang')).toBe('fr-CA')
    await vi.waitFor(() => expect(wrapper.text()).toBe('Envoyer'))
    wrapper.unmount()
  })

  it.each(Object.entries({ en, ru, es, fr, de, 'zh-CN': zhCn, 'zh-TW': zhTw, ar, pt }))(
    'includes every client key and preserves interpolation placeholders in %s',
    (_locale, dictionary) => {
      expect(Object.keys(dictionary).sort()).toStrictEqual(Object.keys(en).sort())
      for (const group of Object.keys(en) as (keyof typeof en)[]) {
        expect(Object.keys(dictionary[group]).sort()).toStrictEqual(Object.keys(en[group]).sort())
        for (const [key, source] of Object.entries(en[group])) {
          const translated = (dictionary[group] as Record<string, string>)[key]!
          expect(translated.trim()).not.toBe('')
          expect((translated.match(/\{[^}]+\}/g) ?? []).sort()).toStrictEqual((source.match(/\{[^}]+\}/g) ?? []).sort())
        }
      }
    },
  )

  it.each([
    ['en', 'Send'],
    ['ru-RU', 'Отправить'],
    ['es_MX', 'Enviar'],
    ['fr-CA', 'Envoyer'],
    ['de-DE', 'Senden'],
    ['zh-Hans', '发送'],
    ['zh-TW', '傳送'],
    ['zh-tw', '傳送'],
    ['zh_TW', '傳送'],
    ['zh-Hant', '发送'],
    ['zh-HK', '发送'],
    ['zh-MO', '发送'],
    ['ar-EG', 'إرسال'],
    ['pt-BR', 'Enviar'],
  ])('selects built-in client translations for %s without overrides', async (locale, send) => {
    await loadLocale(locale)
    expect(resolveLocalization({ locale }).translations.apiClient.addressBar.send).toBe(send)
  })

  it('merges custom strings over the selected built-in language', async () => {
    await loadLocale('de')
    const { translations } = resolveLocalization({
      locale: 'de',
      translations: { apiClient: { addressBar: { send: 'Abschicken' } } },
    })
    expect(translations.apiClient.addressBar.send).toBe('Abschicken')
    expect(translations.apiClient.requestBlock.authentication).toBe('Authentifizierung')
  })

  it('falls back to English for omitted keys and unsupported locales', () => {
    const resolved = resolveLocalization({
      locale: 'custom',
      translations: { apiClient: { addressBar: { send: 'Dispatch' } } },
    })
    expect(resolved.translations.apiClient.addressBar.send).toBe('Dispatch')
    expect(resolved.translations.apiClient.requestBlock.headers).toBe('Headers')
    expect(resolveLocalization().translations.apiClient.addressBar.send).toBe('Send')
  })

  it('reacts to replacement of configuration and restores defaults when overrides are removed', async () => {
    await Promise.all(['de', 'zh-TW', 'ar'].map((locale) => loadLocale(locale)))
    const localization = ref<ApiReferenceLocalization>({
      locale: 'de',
      translations: { apiClient: { addressBar: { send: 'Abschicken' } } },
    })
    const wrapper = mount(
      defineComponent({
        setup() {
          provideLocalization(localization)
          return () => h(Consumer)
        },
      }),
    )
    expect(wrapper.text()).toBe('Abschicken')
    localization.value = { locale: 'de' }
    await nextTick()
    expect(wrapper.text()).toBe('Senden')
    expect(wrapper.attributes('lang')).toBe('de')
    localization.value = { locale: 'zh-TW', translations: { apiClient: { addressBar: { send: '送出' } } } }
    await nextTick()
    expect(wrapper.text()).toBe('送出')
    localization.value = { locale: 'zh-TW' }
    await nextTick()
    expect(wrapper.text()).toBe('傳送')
    expect(wrapper.attributes('lang')).toBe('zh-TW')
    expect(wrapper.attributes('dir')).toBe('ltr')
    localization.value = { locale: 'ar' }
    await nextTick()
    expect(wrapper.text()).toBe('إرسال')
    expect(wrapper.attributes('dir')).toBe('rtl')
    localization.value = { locale: 'en' }
    await nextTick()
    expect(wrapper.text()).toBe('Send')
    expect(wrapper.attributes('dir')).toBe('ltr')
    wrapper.unmount()
  })

  it('isolates independent providers and the standalone fallback', () => {
    const localized = mount(
      defineComponent({
        setup() {
          provideLocalization({ translations: { apiClient: { addressBar: { send: 'Dispatch' } } } })
          return () => h(Consumer)
        },
      }),
    )
    const standalone = mount(Consumer)
    expect(localized.text()).toBe('Dispatch')
    expect(standalone.text()).toBe('Send')
    localized.unmount()
    standalone.unmount()
  })

  it('renders translated request actions without changing the emitted action', async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          provideLocalization({ translations: { apiClient: { responseEmpty: { sendRequest: 'Enviar solicitud' } } } })
          return () => h(ResponseEmpty, { layout: 'modal', totalPerformedRequests: 0, appVersion: '1' })
        },
      }),
    )
    const empty = wrapper.findComponent(ResponseEmpty)
    const button = empty.get('button')
    expect(button.text()).toContain('Enviar solicitud')
    await button.trigger('click')
    expect(empty.emitted('sendRequest')).toStrictEqual([[]])
    wrapper.unmount()
  })

  it('interpolates user values as text', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          const { translate } = useLocalization()
          return () =>
            h(
              'span',
              translate('apiClient.addressBar.sendRequest', { method: 'POST', url: '<script>example</script>' }),
            )
        },
      }),
    )
    expect(wrapper.text()).toBe('Send POST request to <script>example</script>')
    expect(wrapper.find('script').exists()).toBe(false)
    wrapper.unmount()
  })
})
