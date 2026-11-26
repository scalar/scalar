import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref, useId } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { createLocalization } from './create-localization'
import { isLocaleLoaded, loadLocale } from './locale-registry'

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

  it.each(['zh-TW', 'zh-tw', 'ZH-tW', 'zh_TW'])(
    'selects the regional Chinese dictionary before the language fallback for %s',
    (locale) => {
      const chinese = createLocalization<Translations, Key>({
        localeTranslations: {
          en,
          'zh-CN': { common: { greeting: '你好' }, schema: { save: '保存 {name}' } },
          'zh-TW': { common: { greeting: '您好' }, schema: { save: '儲存 {name}' } },
        },
        defaultLocale: 'en',
        rtlLocales: new Set(),
      })

      const resolved = chinese.resolveLocalization({ locale })

      expect(resolved.locale).toBe(locale)
      expect(resolved.direction).toBe('ltr')
      expect(resolved.translations.schema.save).toBe('儲存 {name}')
      expect(
        chinese.resolveLocalization({ locale, translations: { common: { greeting: '自訂' } } }).translations,
      ).toStrictEqual({ common: { greeting: '自訂' }, schema: { save: '儲存 {name}' } })
    },
  )

  it.each(['zh', 'zh-CN', 'zh-cn', 'zh_Hans', 'zh-Hant', 'zh-HK', 'zh-MO', 'zh-TW'])(
    'preserves the Simplified Chinese fallback for %s when no regional dictionary matches',
    (locale) => {
      const chinese = createLocalization<Translations, Key>({
        localeTranslations: {
          en,
          'zh-CN': { common: { greeting: '你好' }, schema: { save: '保存 {name}' } },
        },
        defaultLocale: 'en',
        rtlLocales: new Set(),
      })

      expect(chinese.resolveLocalization({ locale }).translations.schema.save).toBe('保存 {name}')
    },
  )

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

  describe('lazy locales', () => {
    /** A loader that resolves only when the test says so, to observe the state in between. */
    const createDeferredLoader = <T>(value: T) => {
      let release: () => void = () => undefined
      const loader = vi.fn(
        () =>
          new Promise<T>((resolve) => {
            release = () => resolve(value)
          }),
      )

      return { loader, release: () => release() }
    }

    it('renders the default locale first and switches once the loader resolves', async () => {
      const { loader, release } = createDeferredLoader(de)
      const lazy = createLocalization<Translations, Key>({
        localeTranslations: { en, de: loader },
        defaultLocale: 'en',
        rtlLocales: new Set(),
      })
      const wrapper = mount(
        defineComponent({
          setup() {
            const { translate, locale } = lazy.provideLocalization({
              locale: 'de-AT',
              translations: { schema: { save: 'Custom {name}' } },
            })
            return () =>
              h('div', { lang: locale.value }, `${translate('common.greeting')} / ${translate('schema.save')}`)
          },
        }),
      )

      // English plus the custom translations, while the requested locale is already reported.
      expect(wrapper.text()).toBe('Hello / Custom {name}')
      expect(wrapper.attributes('lang')).toBe('de-AT')
      expect(loader).toHaveBeenCalledTimes(1)

      release()
      await flushPromises()

      expect(wrapper.text()).toBe('Hallo / Custom {name}')
      wrapper.unmount()
    })

    it('keeps the requested direction while a right-to-left locale loads', async () => {
      const { loader, release } = createDeferredLoader(ar)
      const lazy = createLocalization<Translations, Key>({
        localeTranslations: { en, ar: loader },
        defaultLocale: 'en',
        rtlLocales: new Set(['ar']),
      })

      const before = lazy.resolveLocalization({ locale: 'ar-EG' })
      expect(before.direction).toBe('rtl')
      expect(before.translations.common.greeting).toBe('Hello')

      release()
      await flushPromises()

      const after = lazy.resolveLocalization({ locale: 'ar-EG' })
      expect(after.direction).toBe('rtl')
      expect(after.translations.common.greeting).toBe('مرحبا')
      expect(lazy.resolveLocalization({ locale: 'ar', direction: 'ltr' }).direction).toBe('ltr')
    })

    it('keeps the resolution rules for lazy dictionaries', async () => {
      const lazy = createLocalization<Translations, Key>({
        localeTranslations: {
          en,
          de: async () => de,
          'zh-CN': async () => ({ common: { greeting: '你好' }, schema: { save: '保存 {name}' } }),
          'zh-TW': async () => ({ common: { greeting: '您好' }, schema: { save: '儲存 {name}' } }),
        },
        defaultLocale: 'en',
        rtlLocales: new Set(),
      })

      await Promise.all(['de-DE', 'zh_tw', 'zh-Hant', 'unknown'].map((locale) => lazy.loadLocale(locale)))

      expect(lazy.resolveLocalization({ locale: 'de-DE' }).translations.common.greeting).toBe('Hallo')
      expect(lazy.resolveLocalization({ locale: 'ZH-tW' }).translations.common.greeting).toBe('您好')
      expect(lazy.resolveLocalization({ locale: 'zh-Hant' }).translations.common.greeting).toBe('你好')
      expect(lazy.resolveLocalization({ locale: 'unknown' }).translations.common.greeting).toBe('Hello')
    })

    it('calls the loader once for concurrent requests of the same locale', async () => {
      const { loader, release } = createDeferredLoader(de)
      const lazy = createLocalization<Translations, Key>({
        localeTranslations: { en, de: loader },
        defaultLocale: 'en',
        rtlLocales: new Set(),
      })

      const first = lazy.loadLocale('de')
      const second = lazy.loadLocale('de-CH')
      lazy.resolveLocalization({ locale: 'de' })

      expect(loader).toHaveBeenCalledTimes(1)

      release()
      await Promise.all([first, second])
      await lazy.loadLocale('de')

      expect(loader).toHaveBeenCalledTimes(1)
      expect(lazy.resolveLocalization({ locale: 'de' }).translations.common.greeting).toBe('Hallo')
    })

    it('retries a failed load on the next request instead of caching the failure', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      const loader = vi
        .fn<() => Promise<Translations>>()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(de)
      const lazy = createLocalization<Translations, Key>({
        localeTranslations: { en, de: loader },
        defaultLocale: 'en',
        rtlLocales: new Set(),
        logPrefix: '[test]',
      })

      // The failure resolves (never rejects) and keeps the fallback.
      await expect(lazy.loadLocale('de')).resolves.toBeUndefined()
      expect(lazy.resolveLocalization({ locale: 'de' }).translations.common.greeting).toBe('Hello')
      expect(warn).toHaveBeenCalledWith(
        '[test] Failed to load translations for locale "de". Falling back to "en".',
        expect.any(Error),
      )

      // The resolve above already started the retry.
      await lazy.loadLocale('de')

      expect(loader).toHaveBeenCalledTimes(2)
      expect(lazy.resolveLocalization({ locale: 'de' }).translations.common.greeting).toBe('Hallo')
      warn.mockRestore()
    })

    it('does not throw into a render when a loader throws synchronously', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      const lazy = createLocalization<Translations, Key>({
        localeTranslations: {
          en,
          de: () => {
            throw new Error('Broken loader')
          },
        },
        defaultLocale: 'en',
        rtlLocales: new Set(),
      })
      const wrapper = mount(
        defineComponent({
          setup() {
            const { translate } = lazy.provideLocalization({ locale: 'de' })
            return () => h('div', translate('common.greeting'))
          },
        }),
      )
      await flushPromises()

      expect(wrapper.text()).toBe('Hello')
      expect(warn).toHaveBeenCalledOnce()
      wrapper.unmount()
      warn.mockRestore()
    })

    it('renders the final translations on the first read after loadLocale resolves', async () => {
      const reference = createLocalization<Translations, Key>({
        localeTranslations: {
          en,
          nl: vi.fn(async () => ({ common: { greeting: 'Hallo!' }, schema: { save: 'Opslaan {name}' } })),
        },
        defaultLocale: 'en',
        rtlLocales: new Set(),
      })
      const clientLoader = vi.fn(async () => ({ client: { send: 'Verzenden' } }))
      const client = createLocalization<{ client: { send: string } }, 'client.send'>({
        localeTranslations: { en: { client: { send: 'Send' } }, nl: clientLoader },
        defaultLocale: 'en',
        rtlLocales: new Set(),
      })

      expect(isLocaleLoaded('nl-BE')).toBe(false)

      // One call warms every registered instance, across packages.
      await loadLocale('nl-BE')

      expect(isLocaleLoaded('nl-BE')).toBe(true)
      expect(clientLoader).toHaveBeenCalledOnce()

      const Child = defineComponent({
        setup() {
          const { translate } = client.useLocalization()
          return () => h('span', translate('client.send'))
        },
      })
      const wrapper = mount(
        defineComponent({
          setup() {
            const { translate } = reference.provideLocalization({ locale: 'nl-BE' })
            return () => h('div', [translate('common.greeting'), ' / ', h(Child)])
          },
        }),
      )

      expect(wrapper.text()).toBe('Hallo! / Verzenden')
      wrapper.unmount()
    })

    it('loads lazy locales before rendering on the server, for providers and cross-package consumers', async () => {
      const reference = createLocalization<Translations, Key>({
        localeTranslations: { en, 'x-ssr': async () => de },
        defaultLocale: 'en',
        rtlLocales: new Set(),
      })
      const client = createLocalization<{ client: { send: string } }, 'client.send'>({
        localeTranslations: { en: { client: { send: 'Send' } }, 'x-ssr': async () => ({ client: { send: 'Senden' } }) },
        defaultLocale: 'en',
        rtlLocales: new Set(),
      })
      const Child = defineComponent({
        setup() {
          const { translate } = client.useLocalization()
          return () => h('span', translate('client.send'))
        },
      })
      const app = createSSRApp(
        defineComponent({
          setup() {
            const { translate } = reference.provideLocalization({ locale: 'x-ssr' })
            return () => h('div', [h('p', translate('common.greeting')), h(Child)])
          },
        }),
      )

      expect(await renderToString(app)).toBe('<div><p>Hallo</p><span>Senden</span></div>')
    })

    it('loads a consumer dictionary on the server when it registers after the provider loaded', async () => {
      const reference = createLocalization<Translations, Key>({
        localeTranslations: { en, 'x-late': async () => de },
        defaultLocale: 'en',
        rtlLocales: new Set(),
      })
      type LateLocalization = ReturnType<typeof createLocalization<{ client: { send: string } }, 'client.send'>>
      let late: LateLocalization | undefined
      const Child = defineComponent({
        setup() {
          const { translate } = late!.useLocalization()
          return () => h('span', translate('client.send'))
        },
      })
      const app = createSSRApp(
        defineComponent({
          setup() {
            const { translate } = reference.provideLocalization({ locale: 'x-late' })
            return () => {
              // Simulates a lazily imported package whose module evaluates after the provider loaded.
              late ??= createLocalization<{ client: { send: string } }, 'client.send'>({
                localeTranslations: {
                  en: { client: { send: 'Send' } },
                  'x-late': async () => ({ client: { send: 'Spät' } }),
                },
                defaultLocale: 'en',
                rtlLocales: new Set(),
              })
              return h('div', [h('p', translate('common.greeting')), h(Child)])
            }
          },
        }),
      )

      expect(await renderToString(app)).toBe('<div><p>Hallo</p><span>Spät</span></div>')
    })

    it('does not treat properties of Object.prototype as locales', async () => {
      const lazy = createLocalization<Translations, Key>({
        localeTranslations: { en, de: async () => de },
        defaultLocale: 'en',
        rtlLocales: new Set(),
      })

      for (const locale of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) {
        await lazy.loadLocale(locale)

        expect(lazy.resolveLocalization({ locale }).translations, locale).toEqual(en)
        expect(isLocaleLoaded(locale), locale).toBe(true)
      }
    })

    it('keeps the latest locale when an earlier one finishes loading after it', async () => {
      const german = createDeferredLoader(de)
      const arabic = createDeferredLoader(ar)
      const lazy = createLocalization<Translations, Key>({
        localeTranslations: { en, de: german.loader, ar: arabic.loader },
        defaultLocale: 'en',
        rtlLocales: new Set(['ar']),
      })
      const locale = ref('de')
      const wrapper = mount(
        defineComponent({
          setup() {
            const { translate, direction } = lazy.provideLocalization(() => ({ locale: locale.value }))
            return () => h('div', { dir: direction.value }, translate('common.greeting'))
          },
        }),
      )
      expect(wrapper.text()).toBe('Hello')

      // Switch while German is still loading, and let Arabic arrive first
      locale.value = 'ar'
      await nextTick()
      arabic.release()
      await flushPromises()
      expect(wrapper.text()).toBe('مرحبا')

      german.release()
      await flushPromises()

      expect(wrapper.text()).toBe('مرحبا')
      expect(wrapper.attributes('dir')).toBe('rtl')
      expect(german.loader).toHaveBeenCalledOnce()
      expect(arabic.loader).toHaveBeenCalledOnce()
      wrapper.unmount()
    })

    it('gives descendants the same ids whether or not the locale had to load first', async () => {
      const lazy = createLocalization<Translations, Key>({
        localeTranslations: { en, 'x-ids': async () => de },
        defaultLocale: 'en',
        rtlLocales: new Set(),
      })
      const Field = defineComponent({
        setup() {
          const id = useId()
          const { translate } = lazy.useLocalization()
          return () => h('label', { for: id }, translate('common.greeting'))
        },
      })
      const render = () =>
        renderToString(
          createSSRApp(
            defineComponent({
              setup() {
                lazy.provideLocalization({ locale: 'x-ids' })
                return () => h('div', [h(Field), h(Field)])
              },
            }),
          ),
        )

      // The first render has to wait for the locale, the second finds it loaded, like a browser that
      // preloaded it before hydrating. Vue numbers ids per async boundary, so both must agree on those.
      const cold = await render()
      const warm = await render()

      expect(cold).toContain('Hallo')
      expect(warm).toBe(cold)
    })
  })

  describe('registry', () => {
    it('forgets an instance once it has been garbage collected', async () => {
      /** Stands in for `WeakRef`, so the test can collect what it registered */
      const references: { target: object | undefined }[] = []
      class CollectableRef<T extends object> {
        private readonly entry: { target: object | undefined }
        constructor(target: T) {
          this.entry = { target }
          references.push(this.entry)
        }
        deref(): T | undefined {
          return this.entry.target as T | undefined
        }
      }
      vi.stubGlobal('WeakRef', CollectableRef)

      try {
        const loader = vi.fn(async () => de)
        // A request-scoped instance, as a server that creates one per request would make
        createLocalization<Translations, Key>({
          localeTranslations: { en, 'x-collected': loader },
          defaultLocale: 'en',
          rtlLocales: new Set(),
        })
        expect(isLocaleLoaded('x-collected')).toBe(false)

        for (const reference of references) {
          reference.target = undefined
        }

        expect(isLocaleLoaded('x-collected')).toBe(true)
        await loadLocale('x-collected')
        expect(loader).not.toHaveBeenCalled()
      } finally {
        vi.unstubAllGlobals()
      }
    })

    it('keeps an instance registered while it is in use', async () => {
      const loader = vi.fn(async () => de)
      const lazy = createLocalization<Translations, Key>({
        localeTranslations: { en, 'x-alive': loader },
        defaultLocale: 'en',
        rtlLocales: new Set(),
      })

      await loadLocale('x-alive')

      expect(loader).toHaveBeenCalledOnce()
      expect(lazy.resolveLocalization({ locale: 'x-alive' }).translations.common.greeting).toBe('Hallo')
    })
  })
})
