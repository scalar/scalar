import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ApiHostingBetaDialog from './ApiHostingBetaDialog.vue'

enableAutoUnmount(afterEach)

/** Longer than the button's success check runs before the thank-you replaces the form. */
const JOINED_TIMEOUT_MS = 3000

/** A fetch that answers with `response` and records what it was asked to send. */
const fetchAnswering = (response: () => Promise<Response>) => vi.fn<typeof fetch>(response)

const accepted = async (): Promise<Response> => new Response('{"success":true}')

/** The form fields the first request carried. */
const sentFields = (send: ReturnType<typeof fetchAnswering>): Record<string, string> =>
  Object.fromEntries(new URLSearchParams(String(send.mock.calls[0]?.[1]?.body)))

/**
 * Opens the popup. Headless UI's `Dialog` renders it into a portal on `document.body`, outside the
 * wrapper, so the helpers below query the live document.
 */
const openDialog = async (props: { email?: string; fetch?: typeof fetch } = {}) => {
  const wrapper = mount(ApiHostingBetaDialog, {
    attachTo: document.body,
    props: { open: true, ...props },
  })
  await flushPromises()
  await nextTick()
  return wrapper
}

const queryHeading = (): string | undefined => document.querySelector('h2')?.textContent?.trim()
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
  it('starts with focus on the heading rather than any of its controls', async () => {
    await openDialog({ email: 'ada@example.com', fetch: fetchAnswering(accepted) })

    expect(document.activeElement).toBe(document.querySelector('h2'))
  })

  it('keeps the app hotkeys from acting on the page underneath', async () => {
    const appHotkeys = vi.fn()
    window.addEventListener('keydown', appHotkeys)
    await openDialog({ email: 'ada@example.com', fetch: fetchAnswering(accepted) })

    queryEmailInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true, bubbles: true }))
    queryEmailInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    window.removeEventListener('keydown', appHotkeys)
    expect(appHotkeys.mock.calls.map(([event]) => event.key)).toEqual(['Escape'])
  })

  it('joins with the logged-in address and the framework picked, then says thanks', async () => {
    const send = fetchAnswering(accepted)
    await openDialog({ email: 'ada@example.com', fetch: send })
    expect(queryEmailInput().value).toBe('ada@example.com')

    const select = queryFrameworkSelect()
    select.value = 'Hono'
    select.dispatchEvent(new Event('change'))
    await submit()

    expect(sentFields(send)).toMatchObject({ email: 'ada@example.com', framework: 'Hono', client: 'true' })
    await vi.waitFor(() => expect(queryHeading()).toBe("You're on the list"), { timeout: JOINED_TIMEOUT_MS })
    expect(document.body.textContent).toContain("We'll be in touch at ada@example.com.")
    expect(document.activeElement).toBe(queryButton('Done'))
  })

  it('asks for a valid address before sending anything', async () => {
    const send = fetchAnswering(accepted)
    await openDialog({ fetch: send })

    await typeEmail('ada@example')
    await submit()

    expect(send).not.toHaveBeenCalled()
    expect(queryAlerts()).toContain('Enter a valid email address.')
    expect(queryEmailInput().getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(queryEmailInput())
  })

  it('sends one sign-up at a time, keeping what was sent on screen while it is out', async () => {
    let answer: (response: Response) => void = () => undefined
    const send = fetchAnswering(() => new Promise((resolve) => (answer = resolve)))
    await openDialog({ fetch: send })

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
    const send = fetchAnswering(
      async () => new Response('{"success":false,"message":"Invalid email address."}', { status: 400 }),
    )
    await openDialog({ email: 'ada@example.com', fetch: send })

    await submit()

    expect(queryAlerts()).toContain('Invalid email address.')
    expect(queryHeading()).toBe('API Hosting is coming to Scalar')

    await typeEmail('ada@example.org')

    expect(queryAlerts()).not.toContain('Invalid email address.')
  })

  it('closes from the close button and from Done', async () => {
    const wrapper = await openDialog({ email: 'ada@example.com', fetch: fetchAnswering(accepted) })

    queryButton('Close')?.click()
    expect(wrapper.emitted('close')).toHaveLength(1)

    await submit()
    await vi.waitFor(() => expect(queryButton('Done')).toBeDefined(), { timeout: JOINED_TIMEOUT_MS })
    queryButton('Done')?.click()
    expect(wrapper.emitted('close')).toHaveLength(2)
  })
})
