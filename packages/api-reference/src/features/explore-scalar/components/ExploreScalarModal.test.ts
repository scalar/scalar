import { useModal } from '@scalar/components/modal'
import type { ExternalUrls } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEMO_CALL_URL } from '../constants'
import ExploreScalarModal from './ExploreScalarModal.vue'

const { toastMock, uploadMock, mountCalMock } = vi.hoisted(() => ({
  toastMock: vi.fn(),
  uploadMock: vi.fn(),
  mountCalMock: vi.fn(),
}))

vi.mock('@scalar/use-toasts', () => ({
  useToasts: () => ({ toast: toastMock }),
}))

vi.mock('@/helpers/upload-temp-document', () => ({
  uploadTempDocument: uploadMock,
}))

vi.mock('../cal-embed', () => ({
  mountCalInline: mountCalMock,
}))

enableAutoUnmount(afterEach)

const externalUrls: ExternalUrls = {
  dashboardUrl: 'https://dash.acme.io',
  registryUrl: 'https://registry.acme.io',
  proxyUrl: 'https://proxy.acme.io',
  apiBaseUrl: 'https://api.acme.io',
}

const createWorkspace = (exported = '{"openapi":"3.1.0"}') =>
  ({ exportActiveDocument: vi.fn(() => exported) }) as unknown as WorkspaceStore

/** A store whose active document cannot be exported */
const createEmptyWorkspace = () => ({ exportActiveDocument: vi.fn(() => undefined) }) as unknown as WorkspaceStore

type MountOptions = {
  url?: string
  usesViewTransition?: boolean
  workspace?: WorkspaceStore
  /** The app mounts the dialog closed and opens it later; most tests start open for brevity */
  startOpen?: boolean
}

/**
 * The dialog is teleported to <body>, so everything inside it is queried through the document.
 * An explicit `url: undefined` stands for an inline document, so it must not fall back to the default.
 */
const mountModal = async (options: MountOptions = {}) => {
  const url = 'url' in options ? options.url : 'https://api.acme.io/openapi.json'
  const { usesViewTransition = false, workspace = createWorkspace(), startOpen = true } = options
  const state = useModal()
  state.open = startOpen
  mount(ExploreScalarModal, {
    attachTo: document.body,
    props: { state, externalUrls, url, workspace, usesViewTransition, morphStickers: false },
  })
  await flushPromises()
  await flushPromises()
  return state
}

const getDialog = () => {
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
  if (!dialog) {
    throw new Error('Expected the dialog to be open')
  }
  return dialog
}

const findInDialog = (selector: string, text: string) =>
  Array.from(getDialog().querySelectorAll<HTMLElement>(selector)).find((el) => el.textContent?.includes(text))

const getSignUp = () => findInDialog('a, button', 'Try it out for free')
/** The close and back circles are icon-only, so they are found by their accessible names */
const getIconButton = (label: string) =>
  Array.from(getDialog().querySelectorAll<HTMLElement>('button')).find((el) => el.getAttribute('aria-label') === label)
const getClose = () => getIconButton('Close')

const click = async (element: HTMLElement | undefined) => {
  if (!element) {
    throw new Error('Expected the element to click')
  }
  element.click()
  await flushPromises()
  await flushPromises()
}

beforeEach(() => {
  /** Headless UI's Dialog observes the panel size, and jsdom has no ResizeObserver */
  globalThis.ResizeObserver = class {
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
  }
  vi.stubGlobal('location', { href: 'https://docs.acme.io/', origin: 'https://docs.acme.io' })
  vi.stubGlobal('open', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  // jsdom has no Web Animations API; the morph test stubs it on the prototype
  Reflect.deleteProperty(HTMLElement.prototype, 'animate')
})

describe('ExploreScalarModal', () => {
  it('names the dialog after the visible title', async () => {
    await mountModal()
    const dialog = getDialog()

    const title = document.getElementById(dialog.getAttribute('aria-labelledby') ?? '')
    expect(title?.tagName).toBe('H2')
    expect(title?.textContent?.trim()).toBe('Everything your API needs, from one OpenAPI document')
    expect(dialog.getAttribute('aria-label')).toBeNull()
  })

  it('applies the morphing class to the dialog root only when a view transition is used', async () => {
    await mountModal({ usesViewTransition: true })
    expect(getDialog().classList.contains('explore-scalar-modal--vt')).toBe(true)
  })

  it('leaves the modal animation alone without a view transition', async () => {
    await mountModal({ usesViewTransition: false })
    expect(getDialog().classList.contains('explore-scalar-modal--vt')).toBe(false)
    expect(getDialog().classList.contains('explore-scalar-modal')).toBe(true)
  })

  it('lists two feature rows', async () => {
    await mountModal()

    const rows = Array.from(getDialog().querySelectorAll('ul > li'))
    expect(rows).toHaveLength(2)
    expect(rows[0]?.textContent).toContain('SDKs & MCP servers')
    expect(rows[1]?.textContent).toContain('Docs, developer portals & registry')
  })

  it('mounts closed and opens later, the way the sidebar card renders it', async () => {
    const errors: unknown[] = []
    const onError = (event: ErrorEvent) => errors.push(event.error)
    window.addEventListener('error', onError)

    const state = await mountModal({ startOpen: false })
    expect(document.querySelector('[role="dialog"]')).toBeNull()

    state.show()
    await flushPromises()
    await flushPromises()

    window.removeEventListener('error', onError)
    expect(errors).toEqual([])
    expect(getSignUp()).toBeDefined()
  })

  it('moves to the booking step and mounts the Cal.com calendar when the demo call is chosen', async () => {
    mountCalMock.mockResolvedValue(undefined)
    await mountModal()

    await click(findInDialog('button', 'or get a demo with Marc'))

    expect(mountCalMock).toHaveBeenCalledTimes(1)
    const [element, theme] = mountCalMock.mock.calls[0] ?? []
    expect(getDialog().contains(element)).toBe(true)
    expect(theme).toBe('light')
    expect(getDialog().querySelector('h2')?.textContent).toContain('Book a demo with Marc, our CEO')
    expect(document.activeElement).toBe(getIconButton('Back'))
    expect(getSignUp()).toBeUndefined()
  })

  it('returns to the overview from the booking step', async () => {
    mountCalMock.mockResolvedValue(undefined)
    await mountModal()

    await click(findInDialog('button', 'or get a demo with Marc'))
    await click(getIconButton('Back'))

    expect(getSignUp()).toBeDefined()
    expect(getDialog().querySelector('h2')?.textContent).toContain('Everything your API needs')
  })

  it('morphs the dialog size between the steps and mounts the calendar once the size has settled', async () => {
    mountCalMock.mockResolvedValue(undefined)
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    let settle = (): void => undefined
    const finished = new Promise<void>((resolve) => {
      settle = resolve
    })
    const animate = vi.fn(() => ({ finished }))
    HTMLElement.prototype.animate = animate as unknown as HTMLElement['animate']
    await mountModal()

    await click(findInDialog('button', 'or get a demo with Marc'))

    const [keyframes] = (animate.mock.calls[0] ?? []) as unknown as [Keyframe[]]
    expect(keyframes.map((frame) => Object.keys(frame).sort())).toEqual([
      ['height', 'maxWidth', 'width'],
      ['height', 'maxWidth', 'width'],
    ])
    expect(document.activeElement).toBe(getIconButton('Back'))
    expect(mountCalMock).not.toHaveBeenCalled()

    settle()
    await flushPromises()
    expect(mountCalMock).toHaveBeenCalledTimes(1)
  })

  it('starts at the overview again after the dialog was closed on the booking step', async () => {
    mountCalMock.mockResolvedValue(undefined)
    const state = await mountModal()

    await click(findInDialog('button', 'or get a demo with Marc'))
    state.hide()
    await flushPromises()
    state.show()
    await flushPromises()
    await flushPromises()

    expect(getSignUp()).toBeDefined()
  })

  it('offers the booking page link when the calendar cannot load', async () => {
    mountCalMock.mockRejectedValue(new Error('offline'))
    await mountModal()

    await click(findInDialog('button', 'or get a demo with Marc'))

    const fallback = findInDialog('a', 'Open the booking page')
    expect(fallback?.getAttribute('href')).toBe(DEMO_CALL_URL)
    expect(fallback?.getAttribute('target')).toBe('_blank')
    expect(fallback?.getAttribute('rel')).toContain('noopener')
  })

  it('renders the sign-up call to action as a link carrying the document url', async () => {
    await mountModal()

    const signUp = getSignUp()
    expect(signUp?.tagName).toBe('A')
    expect(signUp?.getAttribute('href')).toBe(
      'https://dash.acme.io/register?url=https%3A%2F%2Fapi.acme.io%2Fopenapi.json',
    )
    expect(signUp?.getAttribute('target')).toBe('_blank')
    expect(signUp?.getAttribute('rel')).toContain('noopener')
    expect(signUp?.textContent).toContain('Opens in a new tab')
  })

  it('renders the sign-up call to action as a button for inline documents', async () => {
    await mountModal({ url: undefined })

    const signUp = getSignUp()
    expect(signUp?.tagName).toBe('BUTTON')
    expect(signUp?.getAttribute('href')).toBeNull()
    expect(signUp?.getAttribute('aria-busy')).toBe('false')
  })

  it('uploads an inline document before opening the register page', async () => {
    const tab = { opener: {}, location: { href: '' }, close: vi.fn() }
    vi.stubGlobal(
      'open',
      vi.fn(() => tab),
    )
    uploadMock.mockResolvedValue('https://tmp.acme.io/doc.json')
    const state = await mountModal({ url: undefined })

    await click(getSignUp())

    expect(uploadMock).toHaveBeenCalledWith('{"openapi":"3.1.0"}', externalUrls)
    expect(tab.location.href).toBe('https://dash.acme.io/register?url=https%3A%2F%2Ftmp.acme.io%2Fdoc.json')
    // The dialog stays open and the control keeps its element and focus for the rest of the session
    expect(state.open).toBe(true)
    expect(getSignUp()?.tagName).toBe('BUTTON')
    expect(document.activeElement).toBe(getSignUp())

    // A second click reuses the uploaded copy instead of uploading again
    await click(getSignUp())
    expect(uploadMock).toHaveBeenCalledOnce()
    expect(window.open).toHaveBeenLastCalledWith(
      'https://dash.acme.io/register?url=https%3A%2F%2Ftmp.acme.io%2Fdoc.json',
      '_blank',
      'noopener',
    )
  })

  it('renders the sign-up call to action as a link once the dialog reopens after an upload', async () => {
    vi.stubGlobal(
      'open',
      vi.fn(() => ({ opener: {}, location: { href: '' }, close: vi.fn() })),
    )
    uploadMock.mockResolvedValue('https://tmp.acme.io/doc.json')
    const state = await mountModal({ url: undefined })

    await click(getSignUp())
    state.open = false
    await flushPromises()
    state.open = true
    await flushPromises()
    await flushPromises()

    const signUp = getSignUp()
    expect(signUp?.tagName).toBe('A')
    expect(signUp?.getAttribute('href')).toBe('https://dash.acme.io/register?url=https%3A%2F%2Ftmp.acme.io%2Fdoc.json')
  })

  it('keeps the sign-up name while the upload is in progress', async () => {
    vi.stubGlobal(
      'open',
      vi.fn(() => ({ opener: {}, location: { href: '' }, close: vi.fn() })),
    )
    let finishUpload: (url: string) => void = () => undefined
    uploadMock.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          finishUpload = resolve
        }),
    )
    await mountModal({ url: undefined })

    getSignUp()?.click()
    await flushPromises()

    const busy = getSignUp()
    expect(busy?.getAttribute('aria-busy')).toBe('true')
    expect(busy?.getAttribute('aria-label')).toBe('Try it out for free')

    finishUpload('https://tmp.acme.io/doc.json')
    await flushPromises()
    await flushPromises()
    // The success animation runs for about a second; once it ends the visible label is the name again
    await vi.waitFor(
      () => {
        if (getSignUp()?.hasAttribute('aria-label')) {
          throw new Error('Waiting for the loader to settle')
        }
      },
      { timeout: 3000 },
    )
  })

  it('uploads when the document url points at localhost', async () => {
    const tab = { opener: {}, location: { href: '' }, close: vi.fn() }
    vi.stubGlobal(
      'open',
      vi.fn(() => tab),
    )
    uploadMock.mockResolvedValue('https://tmp.acme.io/doc.json')
    await mountModal({ url: 'http://localhost:3000/openapi.json' })

    expect(getSignUp()?.tagName).toBe('BUTTON')

    await click(getSignUp())

    expect(uploadMock).toHaveBeenCalledOnce()
    expect(tab.location.href).toContain('url=https%3A%2F%2Ftmp.acme.io%2Fdoc.json')
  })

  it('shows an error toast and keeps the dialog open when the export fails', async () => {
    const state = await mountModal({ url: undefined, workspace: createEmptyWorkspace() })

    await click(getSignUp())

    expect(toastMock).toHaveBeenCalledWith('Unable to export active document', 'error')
    expect(uploadMock).not.toHaveBeenCalled()
    expect(state.open).toBe(true)
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
  })

  it('focuses the sign-up call to action when opened', async () => {
    await mountModal()

    expect(document.activeElement).toBe(getSignUp())
  })

  it('closes with the close button', async () => {
    const state = await mountModal()

    await click(getClose())

    expect(state.open).toBe(false)
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('keeps the close button last in the Tab order', async () => {
    await mountModal()

    const focusable = Array.from(getDialog().querySelectorAll<HTMLElement>('a[href], button'))
    expect(
      focusable.map((el) => (el.getAttribute('aria-label') ?? el.textContent ?? '').replace(/\s+/g, ' ').trim()),
    ).toEqual(['Try it out for free Opens in a new tab', 'or get a demo with Marc', 'Close'])
    expect(focusable.at(-1)).toBe(getClose())
  })

  it('marks the feature rows as a list', async () => {
    await mountModal()

    const list = getDialog().querySelector('ul')
    expect(list?.getAttribute('role')).toBe('list')
    expect(list?.querySelectorAll(':scope > li')).toHaveLength(2)
  })
})
