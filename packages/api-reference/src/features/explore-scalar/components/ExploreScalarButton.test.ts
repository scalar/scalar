import type { ExternalUrls } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type VueWrapper, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { EXPLORE_TRANSITION_NAMES, EXPLORE_VT_ATTRIBUTE } from '../constants'
import ExploreScalarButton from './ExploreScalarButton.vue'

enableAutoUnmount(afterEach)

const externalUrls: ExternalUrls = {
  dashboardUrl: 'https://dash.acme.io',
  registryUrl: 'https://registry.acme.io',
  proxyUrl: 'https://proxy.acme.io',
  apiBaseUrl: 'https://api.acme.io',
}

const workspace = { exportActiveDocument: vi.fn(() => '{"openapi":"3.1.0"}') } as unknown as WorkspaceStore

type ViewTransitionCall = {
  direction: string | null
  cardName: string
  cardExpanded: boolean
  stickerNames: string[]
  /** Whether the open dialog opted its hero stickers into the morph */
  modalStickers: boolean
}

/**
 * Stubs the View Transitions API. The callback runs on a microtask like the real thing, and every
 * call records what the card looked like when the old snapshot would have been captured.
 */
const stubViewTransition = ({ deferred = false }: { deferred?: boolean } = {}) => {
  const calls: ViewTransitionCall[] = []
  const duringUpdate: { attribute: string | null; cardExpanded: boolean; cardInstant: boolean; cardName: string }[] = []
  let finish: () => void = () => undefined

  const api = vi.fn((update: () => void | Promise<void>) => {
    const card = document.querySelector<HTMLElement>('.explore-scalar-card')
    calls.push({
      direction: document.documentElement.getAttribute(EXPLORE_VT_ATTRIBUTE),
      cardName: card?.style.viewTransitionName ?? '',
      cardExpanded: card?.hasAttribute('data-expanded') ?? false,
      stickerNames: Array.from(card?.querySelectorAll<HTMLElement>('[data-sticker]') ?? []).map(
        (el) => el.style.viewTransitionName,
      ),
      modalStickers: getDialog()?.classList.contains('explore-scalar-modal--stickers') ?? false,
    })

    const updateCallbackDone = Promise.resolve().then(async () => {
      await update()
      duringUpdate.push({
        attribute: document.documentElement.getAttribute(EXPLORE_VT_ATTRIBUTE),
        cardExpanded: card?.hasAttribute('data-expanded') ?? false,
        cardInstant: card?.hasAttribute('data-instant') ?? false,
        cardName: card?.style.viewTransitionName ?? '',
      })
    })
    const finished = deferred
      ? new Promise<void>((resolve) => {
          finish = () => resolve()
        })
      : updateCallbackDone

    return { finished, ready: updateCallbackDone, updateCallbackDone, skipTransition: vi.fn() }
  })

  Object.defineProperty(document, 'startViewTransition', { configurable: true, writable: true, value: api })

  return { api, calls, duringUpdate, finish: () => finish() }
}

const stubMatchMedia = ({ hover = true, reducedMotion = false }: { hover?: boolean; reducedMotion?: boolean } = {}) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      media: query,
      matches: query.includes('hover') ? hover : query.includes('prefers-reduced-motion') ? reducedMotion : false,
    })),
  )
}

const mountButton = async (url: string | undefined = 'https://api.acme.io/openapi.json'): Promise<VueWrapper> => {
  const wrapper = mount(ExploreScalarButton, {
    attachTo: document.body,
    props: { externalUrls, url, workspace },
  })
  // The sticker and modal chunks are dynamic imports, which take real time to transform in the test runner
  await vi.waitFor(() => {
    if (!wrapper.findComponent({ name: 'ExploreScalarModal' }).exists()) {
      throw new Error('Waiting for the lazy chunks')
    }
  })
  await flushPromises()
  return wrapper
}

const getTrigger = (wrapper: VueWrapper) => wrapper.get<HTMLButtonElement>('button[aria-haspopup="dialog"]')
const getCard = (wrapper: VueWrapper) => wrapper.get<HTMLElement>('.explore-scalar-card')
const getDialog = () => document.querySelector<HTMLElement>('[role="dialog"]')

const openDialog = async (wrapper: VueWrapper) => {
  await getTrigger(wrapper).trigger('click')
  await flushPromises()
  await flushPromises()
}

/** The close morph waits a frame before it starts, so the test waits for the dialog and the root attribute to be gone */
const waitForClose = async () => {
  await vi.waitFor(() => {
    if (getDialog() || document.documentElement.hasAttribute(EXPLORE_VT_ATTRIBUTE)) {
      throw new Error('Waiting for the dialog to close')
    }
  })
  await flushPromises()
  await flushPromises()
}

const pressEscape = async () => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await waitForClose()
}

beforeEach(() => {
  /** Headless UI's Dialog observes the panel size, and jsdom has no ResizeObserver */
  globalThis.ResizeObserver = class {
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
  }
  vi.stubGlobal('open', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  Reflect.deleteProperty(document, 'startViewTransition')
  document.documentElement.removeAttribute(EXPLORE_VT_ATTRIBUTE)
})

describe('ExploreScalarButton', () => {
  it('announces a dialog popup and is described by the headline', async () => {
    const wrapper = await mountButton()
    const trigger = getTrigger(wrapper)

    // A native button, so Enter and Space activate it without extra key handling
    expect(trigger.attributes('type')).toBe('button')
    expect(trigger.text()).toBe('Explore Scalar')
    expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    expect(trigger.attributes('aria-expanded')).toBeUndefined()

    const headline = document.getElementById(trigger.attributes('aria-describedby') ?? '')
    expect(headline?.textContent?.trim()).toBe('Instantly generate SDKs, MCPs & docs for your API')
  })

  it('warms the sticker and modal chunks on mount', async () => {
    const wrapper = await mountButton()

    expect(wrapper.findAll('[data-sticker]').map((el) => el.attributes('data-sticker'))).toEqual([
      'portals',
      'sdks',
      'agent',
    ])
    // The modal chunk is mounted but closed until the trigger is activated
    expect(getDialog()).toBeNull()
  })

  it('opens the dialog on click', async () => {
    const wrapper = await mountButton()

    await openDialog(wrapper)

    const dialog = getDialog()
    expect(dialog).not.toBeNull()
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    expect(dialog?.textContent).toContain('Everything your API needs, from one OpenAPI document')
  })

  it('expands on hover after the intent delay and collapses when the pointer leaves', async () => {
    stubMatchMedia({ hover: true })
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const wrapper = await mountButton()
    const card = getCard(wrapper)

    await wrapper.get('.explore-scalar').trigger('pointerenter')
    expect(card.attributes('data-expanded')).toBeUndefined()

    vi.advanceTimersByTime(90)
    await nextTick()
    expect(card.attributes('data-expanded')).toBeDefined()

    await wrapper.get('.explore-scalar').trigger('pointerleave')
    expect(card.attributes('data-expanded')).toBeUndefined()
  })

  it('does not expand on hover for pointers that cannot hover', async () => {
    stubMatchMedia({ hover: false })
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const wrapper = await mountButton()

    await wrapper.get('.explore-scalar').trigger('pointerenter')
    vi.advanceTimersByTime(200)
    await nextTick()

    expect(getCard(wrapper).attributes('data-expanded')).toBeUndefined()
  })

  it('uses a view transition when the API is available', async () => {
    const { api, calls, duringUpdate } = stubViewTransition()
    const wrapper = await mountButton()

    await openDialog(wrapper)

    expect(api).toHaveBeenCalledOnce()
    expect(calls[0]?.direction).toBe('open')
    expect(duringUpdate[0]?.attribute).toBe('open')
    expect(document.documentElement.hasAttribute(EXPLORE_VT_ATTRIBUTE)).toBe(false)
    expect(getDialog()?.classList.contains('explore-scalar-modal--vt')).toBe(true)
  })

  it('moves the view-transition names from the card to the dialog during open and clears them after close', async () => {
    const { calls, duringUpdate } = stubViewTransition()
    const wrapper = await mountButton()
    const card = getCard(wrapper)

    await openDialog(wrapper)

    // Old snapshot: the card carries the names; new snapshot: the mounted dialog owns them
    expect(calls[0]?.cardName).toBe(EXPLORE_TRANSITION_NAMES.card)
    expect(duringUpdate[0]?.cardName).toBe('')
    expect(getDialog()).not.toBeNull()

    await pressEscape()

    expect(calls[1]?.direction).toBe('close')
    expect(duringUpdate[1]?.cardName).toBe(EXPLORE_TRANSITION_NAMES.card)
    expect(card.element.style.viewTransitionName).toBe('')
    wrapper.findAll('[data-sticker]').forEach((sticker) => {
      expect((sticker.element as HTMLElement).style.viewTransitionName).toBe('')
    })
  })

  it('pins the card expanded for the old snapshot and collapses it instantly for the new one', async () => {
    const { calls, duringUpdate } = stubViewTransition()
    const wrapper = await mountButton()
    const card = getCard(wrapper)

    await openDialog(wrapper)

    expect(calls[0]?.cardExpanded).toBe(true)
    // The unnamed card is part of the new root snapshot, so it must already be the plain bar there
    expect(duringUpdate[0]?.cardExpanded).toBe(false)
    expect(duringUpdate[0]?.cardInstant).toBe(true)
    expect(card.attributes('data-expanded')).toBeUndefined()
    expect(card.attributes('data-instant')).toBeUndefined()
    expect(getDialog()).not.toBeNull()
  })

  it('flies the stickers only when the card was already expanded', async () => {
    stubMatchMedia({ hover: true })
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { calls } = stubViewTransition()
    const wrapper = await mountButton()
    const stickerNames = () =>
      wrapper.findAll('[data-sticker]').map((el) => (el.element as HTMLElement).style.viewTransitionName)

    // A tap on a collapsed bar: the stickers are invisible, so only the card is named on both sides
    await openDialog(wrapper)
    expect(calls[0]?.cardName).toBe(EXPLORE_TRANSITION_NAMES.card)
    expect(calls[0]?.stickerNames).toEqual(['', '', ''])
    expect(getDialog()?.classList.contains('explore-scalar-modal--stickers')).toBe(false)

    // Closing always morphs into the expanded card, so the hero stickers fly back into it
    await pressEscape()
    expect(calls[1]?.direction).toBe('close')
    expect(calls[1]?.modalStickers).toBe(true)
    expect(stickerNames()).toEqual(['', '', ''])

    // A hovered (expanded) card has visible stickers, so they fly to the hero
    await wrapper.get('.explore-scalar').trigger('pointerenter')
    vi.advanceTimersByTime(90)
    await nextTick()
    await openDialog(wrapper)
    expect(calls[2]?.stickerNames).toEqual([
      EXPLORE_TRANSITION_NAMES.portals,
      EXPLORE_TRANSITION_NAMES.sdks,
      EXPLORE_TRANSITION_NAMES.agent,
    ])
    expect(getDialog()?.classList.contains('explore-scalar-modal--stickers')).toBe(true)
  })

  it('ignores a second activation while a transition is in flight', async () => {
    const { api, finish } = stubViewTransition({ deferred: true })
    const wrapper = await mountButton()
    const trigger = getTrigger(wrapper)

    await trigger.trigger('click')
    await flushPromises()
    await trigger.trigger('click')
    await flushPromises()

    expect(api).toHaveBeenCalledOnce()

    finish()
    await flushPromises()
    expect(getDialog()).not.toBeNull()
  })

  it('falls back to a plain open when startViewTransition is unavailable', async () => {
    const wrapper = await mountButton()

    await openDialog(wrapper)

    const dialog = getDialog()
    expect(dialog).not.toBeNull()
    expect(dialog?.classList.contains('explore-scalar-modal--vt')).toBe(false)
    expect(document.documentElement.hasAttribute(EXPLORE_VT_ATTRIBUTE)).toBe(false)
  })

  it('skips the view transition when reduced motion is preferred', async () => {
    const { api } = stubViewTransition()
    stubMatchMedia({ reducedMotion: true })
    const wrapper = await mountButton()

    await openDialog(wrapper)

    expect(api).not.toHaveBeenCalled()
    expect(getDialog()).not.toBeNull()
    expect(getDialog()?.classList.contains('explore-scalar-modal--vt')).toBe(false)
  })

  it('runs the close morph for Escape, the close button and a backdrop click', async () => {
    const { api, calls } = stubViewTransition()
    const wrapper = await mountButton()
    const card = getCard(wrapper)

    const expectClosedByMorph = (call: number) => {
      expect(api).toHaveBeenCalledTimes(call + 1)
      expect(calls[call]?.direction).toBe('close')
      expect(getDialog()).toBeNull()
      expect(card.element.style.viewTransitionName).toBe('')
      expect(card.attributes('data-instant')).toBeUndefined()
      expect(card.attributes('data-expanded')).toBeUndefined()
      expect(document.documentElement.hasAttribute(EXPLORE_VT_ATTRIBUTE)).toBe(false)
    }

    await openDialog(wrapper)
    await pressEscape()
    expectClosedByMorph(1)

    await openDialog(wrapper)
    const close = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')).find((button) =>
      button.textContent?.includes('Close'),
    )
    if (!close) {
      throw new Error('Expected the close button')
    }
    close.click()
    await waitForClose()
    expectClosedByMorph(3)

    await openDialog(wrapper)
    const backdrop = document.querySelector<HTMLElement>('.scalar-modal-layout')
    if (!backdrop) {
      throw new Error('Expected the modal backdrop')
    }
    backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await waitForClose()
    expectClosedByMorph(5)
  })

  it('restores focus to the trigger after closing', async () => {
    const wrapper = await mountButton()
    const trigger = getTrigger(wrapper)
    trigger.element.focus()

    await openDialog(wrapper)
    expect(document.activeElement).not.toBe(trigger.element)

    await pressEscape()

    expect(getDialog()).toBeNull()
    expect(document.activeElement).toBe(trigger.element)
  })
})
