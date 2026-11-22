import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'

import { provideLocalization } from '@/features/localization'

import ApiHostingBetaDialog from './ApiHostingBetaDialog.vue'

enableAutoUnmount(afterEach)

/** Longer than the button's success check runs before the thank-you replaces the form. */
const JOINED_TIMEOUT_MS = 3000

/** Stands in for the browser's fetch, answering with `response`. */
const stubFetch = (response: () => Promise<Response>) => {
  const send = vi.fn<typeof fetch>(response)
  vi.stubGlobal('fetch', send)
  return send
}

const accepted = async (): Promise<Response> => new Response('{"success":true}')

/** The form fields the first request carried. */
const sentFields = (send: ReturnType<typeof stubFetch>): Record<string, string> =>
  Object.fromEntries(new URLSearchParams(String(send.mock.calls[0]?.[1]?.body)))

/**
 * Opens the popup, in the reference's language when one is given. Headless UI's `Dialog` renders it
 * into a portal on `document.body`, outside the wrapper, so the helpers below query the live
 * document.
 */
const openDialog = async ({ framework, locale }: { framework?: string; locale?: string } = {}) => {
  const wrapper = mount(
    defineComponent({
      emits: ['close'],
      setup(_, { emit }) {
        provideLocalization({ locale })
        return () => h(ApiHostingBetaDialog, { open: true, framework, onClose: () => emit('close') })
      },
    }),
    { attachTo: document.body },
  )
  await flushPromises()
  await nextTick()
  return wrapper
}

const queryDialog = (): HTMLElement | null => document.querySelector('[role="dialog"]')
const queryHeading = (): string | undefined => document.querySelector('h2')?.textContent?.trim()
const queryStatus = (): string | undefined => document.querySelector('[role="status"]')?.textContent?.trim()
const queryEmailInput = (): HTMLInputElement => document.querySelector<HTMLInputElement>('input[type="email"]')!
const queryFrameworkSelect = (): HTMLSelectElement => document.querySelector<HTMLSelectElement>('select')!
const queryForm = (): HTMLFormElement => document.querySelector<HTMLFormElement>('form')!
const queryAlerts = (): string[] =>
  Array.from(document.querySelectorAll('[role="alert"]')).map((alert) => alert.textContent?.trim() ?? '')
const queryButton = (name: string): HTMLButtonElement | undefined =>
  Array.from(document.querySelectorAll('button')).find(
    (button) => (button.getAttribute('aria-label') ?? button.textContent?.trim()) === name,
  )

const typeEmail = async (value: string): Promise<void> => {
  const input = queryEmailInput()
  input.value = value
  input.dispatchEvent(new Event('input'))
  await nextTick()
}

const submit = async (): Promise<void> => {
  queryForm().dispatchEvent(new Event('submit', { cancelable: true }))
  await flushPromises()
}

describe('ApiHostingBetaDialog', () => {
  beforeEach(() => {
    // Headless UI's Dialog observes the panel size, and the card checks for reduced motion before it
    // tweens between steps; jsdom has neither
    vi.stubGlobal(
      'ResizeObserver',
      class {
        disconnect = vi.fn()
        observe = vi.fn()
        unobserve = vi.fn()
      },
    )
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }) as MediaQueryList)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is named for the beta and starts with focus on the heading rather than any of its controls', async () => {
    await openDialog()

    expect(queryDialog()?.getAttribute('aria-label')).toBe('API Hosting beta')
    expect(queryHeading()).toBe('API Hosting is coming to Scalar')
    expect(document.activeElement).toBe(document.querySelector('h2'))
  })

  it('keeps the reference hotkeys from acting on the page underneath', async () => {
    const referenceHotkeys = vi.fn()
    window.addEventListener('keydown', referenceHotkeys)
    await openDialog()

    queryEmailInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
    queryEmailInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    window.removeEventListener('keydown', referenceHotkeys)
    expect(referenceHotkeys.mock.calls.map(([event]) => event.key)).toEqual(['Escape'])
  })

  it('picks the framework serving the reference and joins with it, then says thanks', async () => {
    const send = stubFetch(accepted)
    await openDialog({ framework: 'FastAPI' })
    expect(queryFrameworkSelect().value).toBe('FastAPI')

    await typeEmail('ada@example.com')
    await submit()

    expect(sentFields(send)).toEqual({
      userGroup: 'Hosting',
      mailingLists: '',
      email: 'ada@example.com',
      oss: 'true',
      framework: 'FastAPI',
    })
    await vi.waitFor(() => expect(queryHeading()).toBe("You're on the list"), { timeout: JOINED_TIMEOUT_MS })
    expect(queryStatus()).toBe("Thanks for signing up. We'll be in touch at ada@example.com.")
    expect(document.activeElement).toBe(queryButton('Done'))
  })

  it('leaves the framework for the developer to pick when it is not one the waitlist offers', async () => {
    const send = stubFetch(accepted)
    await openDialog({ framework: 'Docusaurus' })
    expect(queryFrameworkSelect().value).toBe('')

    await typeEmail('ada@example.com')
    await submit()

    expect(sentFields(send)).not.toHaveProperty('framework')
  })

  it('asks for a valid address before sending anything', async () => {
    const send = stubFetch(accepted)
    await openDialog()

    await typeEmail('ada@example')
    await submit()

    expect(send).not.toHaveBeenCalled()
    expect(queryAlerts()).toContain('Enter a valid email address.')
    expect(queryEmailInput().getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(queryEmailInput())
  })

  it('sends one sign-up at a time, keeping what was sent on screen while it is out', async () => {
    let answer: (response: Response) => void = () => undefined
    const send = stubFetch(() => new Promise((resolve) => (answer = resolve)))
    await openDialog()

    await typeEmail('  ada@example.com ')
    await submit()
    await submit()

    expect(send).toHaveBeenCalledOnce()
    expect(sentFields(send)).toMatchObject({ email: 'ada@example.com' })
    expect(queryEmailInput().readOnly).toBe(true)
    expect(queryFrameworkSelect().disabled).toBe(true)
    expect(queryButton('Join the beta')?.getAttribute('aria-busy')).toBe('true')

    answer(new Response('{"success":true}'))
    await vi.waitFor(() => expect(queryHeading()).toBe("You're on the list"), { timeout: JOINED_TIMEOUT_MS })
  })

  it('shows why the waitlist refused until the address changes', async () => {
    stubFetch(async () => new Response('{"success":false,"message":"Invalid email address."}', { status: 400 }))
    await openDialog()

    await typeEmail('ada@example.com')
    await submit()

    expect(queryAlerts()).toContain('Invalid email address.')
    expect(queryHeading()).toBe('API Hosting is coming to Scalar')

    await typeEmail('ada@example.org')

    expect(queryAlerts()).not.toContain('Invalid email address.')
  })

  it('says when the waitlist cannot be reached', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')))
    await openDialog()

    await typeEmail('ada@example.com')
    await submit()

    expect(queryAlerts()).toContain(
      'The waitlist could not be reached. Check your connection and try again in a moment.',
    )
  })

  it('closes from the close button and from Done', async () => {
    stubFetch(accepted)
    const wrapper = await openDialog()

    queryButton('Close')?.click()
    expect(wrapper.emitted('close')).toHaveLength(1)

    await typeEmail('ada@example.com')
    await submit()
    await vi.waitFor(() => expect(queryButton('Done')).toBeDefined(), { timeout: JOINED_TIMEOUT_MS })
    queryButton('Done')?.click()
    expect(wrapper.emitted('close')).toHaveLength(2)
  })

  it('speaks the reference language and mirrors for right-to-left ones, though it renders outside it', async () => {
    await openDialog({ locale: 'ar' })

    expect(queryDialog()?.getAttribute('lang')).toBe('ar')
    expect(queryDialog()?.getAttribute('dir')).toBe('rtl')
    expect(queryDialog()?.getAttribute('aria-label')).toBe('النسخة التجريبية من API Hosting')
    expect(queryHeading()).toBe('API Hosting قادم إلى Scalar')
    expect(queryFrameworkSelect().options[queryFrameworkSelect().options.length - 1]?.textContent?.trim()).toBe('آخر')
    expect(queryFrameworkSelect().options[queryFrameworkSelect().options.length - 1]?.value).toBe('Other')
  })

  it('gives the portal the same valid language tag as the reference for underscore locales', async () => {
    await openDialog({ locale: 'zh_TW' })

    expect(queryDialog()?.getAttribute('lang')).toBe('zh-TW')
    expect(queryHeading()).toBe('API Hosting 即將登陸 Scalar')
  })

  it('places the address where each language needs it in the thank-you', async () => {
    stubFetch(accepted)
    await openDialog({ locale: 'zh-CN' })

    await typeEmail('ada@example.com')
    await submit()

    await vi.waitFor(() => expect(queryHeading()).toBe('你已加入名单'), { timeout: JOINED_TIMEOUT_MS })
    expect(queryStatus()).toBe('感谢报名，我们会通过 ada@example.com 与你联系。')
  })
})
