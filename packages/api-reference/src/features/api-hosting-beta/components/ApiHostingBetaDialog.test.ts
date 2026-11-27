import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import { provideLocalization } from '@/features/localization'

import ApiHostingBetaDialog from './ApiHostingBetaDialog.vue'

enableAutoUnmount(afterEach)

/** Longer than the Join button's success check runs before the thank-you replaces the form. */
const JOINED_TIMEOUT_MS = 3000

/** Stands in for the browser's fetch, answering with `response`. */
const stubFetch = (response: () => Promise<Response>) => {
  const send = vi.fn<typeof fetch>(response)
  vi.stubGlobal('fetch', send)
  return send
}

/**
 * Opens the popup, in the reference's language when one is given. Headless UI's `Dialog` renders it
 * into a portal on `document.body`, outside the wrapper, so the helpers below query the live document.
 */
const openDialog = async ({
  integration,
  locale,
}: {
  integration?: 'fastapi' | 'docusaurus'
  locale?: string
} = {}) => {
  const wrapper = mount(
    defineComponent({
      emits: ['close'],
      setup(_, { emit }) {
        provideLocalization({ locale })
        return () => h(ApiHostingBetaDialog, { integration, onClose: () => emit('close') })
      },
    }),
    { attachTo: document.body },
  )
  await flushPromises()
  await nextTick()
  return wrapper
}

const queryDialog = (): HTMLElement | null => document.querySelector('[role="dialog"]')
const queryHeading = (): HTMLElement | null => document.querySelector('[role="dialog"] h2')
const queryEmailInput = (): HTMLInputElement => document.querySelector<HTMLInputElement>('input[type="email"]')!

describe('ApiHostingBetaDialog', () => {
  beforeEach(() => {
    // Headless UI's Dialog observes the panel size, and jsdom has no ResizeObserver
    vi.stubGlobal(
      'ResizeObserver',
      class {
        disconnect = vi.fn()
        observe = vi.fn()
        unobserve = vi.fn()
      },
    )
    // The Deploy card keeps its one-minute sign-up limit here
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.cookie = 'scalar-api-hosting-beta-prompt-seen=; Max-Age=0; Path=/'
  })

  it('shows the Deploy card, named after its heading, with focus in its email field', async () => {
    await openDialog()

    expect(queryDialog()?.getAttribute('aria-label')).toBe('Deploy your API on Scalar')
    expect(queryHeading()?.textContent?.trim()).toBe('Deploy your API on Scalar')
    expect(document.activeElement).toBe(queryEmailInput())
  })

  it('names the framework serving the reference, as the Deploy card does', async () => {
    await openDialog({ integration: 'fastapi' })

    expect(queryDialog()?.getAttribute('aria-label')).toBe('Deploy your FastAPI app on Scalar')
    expect(queryHeading()?.textContent?.trim()).toBe('Deploy your FastAPI app on Scalar')
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

  it('signs up through the Deploy card, with the framework, and says thanks', async () => {
    const send = stubFetch(async () => new Response('{"success":true}'))
    await openDialog({ integration: 'fastapi' })

    const input = queryEmailInput()
    input.value = 'ada@example.com'
    input.dispatchEvent(new Event('input'))
    document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }))
    await flushPromises()

    expect(send).toHaveBeenCalledOnce()
    expect(String(send.mock.calls[0]?.[1]?.body)).toBe(
      'userGroup=Hosting&mailingLists=&email=ada%40example.com&oss=true&framework=FastAPI',
    )
    await vi.waitFor(
      () =>
        expect(document.querySelector('[role="dialog"] [role="status"]')?.textContent).toContain(
          "Thanks! We'll be in touch!",
        ),
      { timeout: JOINED_TIMEOUT_MS },
    )
  })

  it('ends with Done, which has focus, reads out the thanks and closes the popup', async () => {
    stubFetch(async () => new Response('{"success":true}'))
    const wrapper = await openDialog()

    const input = queryEmailInput()
    input.value = 'ada@example.com'
    input.dispatchEvent(new Event('input'))
    document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }))
    await flushPromises()

    const done = await vi.waitFor(
      () => {
        const button = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')).find(
          (b) => b.textContent?.trim() === 'Done',
        )
        expect(button).toBeDefined()
        return button!
      },
      { timeout: JOINED_TIMEOUT_MS },
    )
    expect(document.activeElement).toBe(done)
    expect(document.getElementById(done.getAttribute('aria-describedby') ?? '')?.textContent?.trim()).toBe(
      "Thanks! We'll be in touch!",
    )

    done.click()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes from the card close button', async () => {
    const wrapper = await openDialog()

    document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="Close"]')?.click()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes with Escape from the email field and gives focus back to where it was', async () => {
    const before = document.createElement('button')
    document.body.append(before)
    before.focus()
    // Taken away on close, as the prompt does
    const isOpen = ref(true)
    mount(
      defineComponent({
        setup() {
          provideLocalization({})
          return () => (isOpen.value ? h(ApiHostingBetaDialog, { onClose: () => (isOpen.value = false) }) : null)
        },
      }),
      { attachTo: document.body },
    )
    await flushPromises()
    await nextTick()
    expect(document.activeElement).toBe(queryEmailInput())

    queryEmailInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    await nextTick()

    expect(queryDialog()).toBeNull()
    expect(document.activeElement).toBe(before)
    before.remove()
  })

  it('describes the email field with the card text, since focus starts there', async () => {
    await openDialog()

    const ids = queryEmailInput().getAttribute('aria-describedby')?.split(' ') ?? []
    expect(ids.map((id) => document.getElementById(id)?.textContent?.trim())).toEqual([
      'Run it on Scalar. $5 of free credits, no card.',
    ])
    // The dialog already carries the card name, so the form inside it does not repeat it
    expect(document.querySelector('[role="dialog"] form')?.hasAttribute('aria-labelledby')).toBe(false)
  })

  it('speaks the reference language and mirrors for right-to-left ones, though it renders outside it', async () => {
    await openDialog({ locale: 'ar' })

    expect(queryDialog()?.getAttribute('lang')).toBe('ar')
    expect(queryDialog()?.getAttribute('dir')).toBe('rtl')
    expect(queryDialog()?.getAttribute('aria-label')).toBe(queryHeading()?.textContent?.trim())
  })

  it('gives the portal the same valid language tag as the reference for underscore locales', async () => {
    await openDialog({ locale: 'zh_TW' })

    expect(queryDialog()?.getAttribute('lang')).toBe('zh-TW')
  })
})
