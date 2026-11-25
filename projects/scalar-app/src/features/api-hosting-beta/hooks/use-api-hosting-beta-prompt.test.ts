import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type EffectScope, effectScope } from 'vue'

import type { ApiHostingBetaPrompt, holdApiHostingBetaPrompt } from './use-api-hosting-beta-prompt'

/** Longer than the prompt waits for the app to settle. */
const SETTLED_MS = 1600

const SEEN_KEY = 'scalar-api-hosting-beta-prompt-seen'

const scopes: EffectScope[] = []

/**
 * Loads the hook as a new page load would, so what one test's page load remembers does not leak
 * into the next. Each call of the returned function mounts the prompt once more in that page load,
 * the way the app shell does whenever a workspace loads.
 */
const loadPage = async (): Promise<(() => ApiHostingBetaPrompt) & { hold: typeof holdApiHostingBetaPrompt }> => {
  vi.resetModules()
  const { holdApiHostingBetaPrompt: hold, useApiHostingBetaPrompt } = await import('./use-api-hosting-beta-prompt')

  const mountPrompt = () => {
    const scope = effectScope()
    scopes.push(scope)
    const prompt = scope.run(() => useApiHostingBetaPrompt())
    if (!prompt) {
      throw new Error('The prompt did not start')
    }
    return prompt
  }
  return Object.assign(mountPrompt, { hold })
}

/** Sets what `navigator.webdriver` reports. The test setup reports true, as the `afterEach` restores. */
const setAutomated = (automated: boolean): void => {
  Object.defineProperty(navigator, 'webdriver', { configurable: true, get: () => automated })
}

/** A popup the app opened, which the browser reports as laid out. */
const addVisibleDialog = (): HTMLElement => {
  const dialog = document.createElement('div')
  dialog.setAttribute('role', 'dialog')
  dialog.getClientRects = () => [{}] as unknown as DOMRectList
  document.body.append(dialog)
  return dialog
}

/** Puts the page in the background or brings it back, as switching tabs or windows does. */
const setVisibility = (state: DocumentVisibilityState): void => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state)
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('use-api-hosting-beta-prompt', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    setAutomated(false)
  })

  afterEach(() => {
    for (const scope of scopes.splice(0)) {
      scope.stop()
    }
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    setAutomated(true)
    document.body.replaceChildren()
  })

  it('opens once the app has sat untouched for a moment', async () => {
    const prompt = (await loadPage())()

    vi.advanceTimersByTime(SETTLED_MS - 200)
    expect(prompt.isOpen.value).toBe(false)

    vi.advanceTimersByTime(200)
    expect(prompt.isOpen.value).toBe(true)
  })

  it('remembers the prompt as seen as soon as it opens', async () => {
    const prompt = (await loadPage())()
    vi.advanceTimersByTime(SETTLED_MS)

    expect(prompt.isOpen.value).toBe(true)
    expect(localStorage.getItem(SEEN_KEY)).toBe('true')
  })

  it('never opens in a browser where it has been seen', async () => {
    localStorage.setItem(SEEN_KEY, 'true')
    const prompt = (await loadPage())()

    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(false)
  })

  it('leaves a launch to someone who has started typing, and tries again on the next one', async () => {
    const prompt = (await loadPage())()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    vi.advanceTimersByTime(SETTLED_MS * 5)
    expect(prompt.isOpen.value).toBe(false)
    expect(localStorage.getItem(SEEN_KEY)).toBeNull()

    const nextLaunch = (await loadPage())()
    vi.advanceTimersByTime(SETTLED_MS)
    expect(nextLaunch.isOpen.value).toBe(true)
  })

  it('does not take a lone modifier key for someone starting', async () => {
    const prompt = (await loadPage())()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Meta' }))
    vi.advanceTimersByTime(SETTLED_MS)

    expect(prompt.isOpen.value).toBe(true)
  })

  it('leaves a launch to someone who has clicked', async () => {
    const prompt = (await loadPage())()

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(false)
  })

  it('leaves a launch to someone dragging a file in', async () => {
    const prompt = (await loadPage())()

    window.dispatchEvent(new Event('dragenter'))
    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(false)
  })

  it('stays out of the way of an import that starts while it waits', async () => {
    const mountPrompt = await loadPage()
    const prompt = mountPrompt()

    mountPrompt.hold()
    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(false)
    expect(localStorage.getItem(SEEN_KEY)).toBeNull()
  })

  it('closes for an import that starts while it is up', async () => {
    const mountPrompt = await loadPage()
    const prompt = mountPrompt()
    vi.advanceTimersByTime(SETTLED_MS)
    expect(prompt.isOpen.value).toBe(true)

    mountPrompt.hold()

    expect(prompt.isOpen.value).toBe(false)
  })

  it('leaves a launch alone when another popup is up', async () => {
    addVisibleDialog()
    const prompt = (await loadPage())()

    vi.advanceTimersByTime(SETTLED_MS)

    expect(prompt.isOpen.value).toBe(false)
    expect(localStorage.getItem(SEEN_KEY)).toBeNull()
  })

  it('does not try again when the app shell mounts again in the same page load', async () => {
    const mountPrompt = await loadPage()
    mountPrompt()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))

    const remounted = mountPrompt()
    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(remounted.isOpen.value).toBe(false)
  })

  it('starts the wait over when the app shell mounts again before it is up', async () => {
    const mountPrompt = await loadPage()
    mountPrompt()
    vi.advanceTimersByTime(SETTLED_MS / 2)
    scopes.shift()?.stop()

    const remounted = mountPrompt()
    vi.advanceTimersByTime(SETTLED_MS)

    expect(remounted.isOpen.value).toBe(true)
  })

  it('waits while the app is in the background', async () => {
    setVisibility('hidden')
    const prompt = (await loadPage())()

    vi.advanceTimersByTime(SETTLED_MS * 5)
    expect(prompt.isOpen.value).toBe(false)

    setVisibility('visible')
    vi.advanceTimersByTime(SETTLED_MS)
    expect(prompt.isOpen.value).toBe(true)
  })

  it('stays shut when storage cannot be read', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new DOMException('Blocked', 'SecurityError')
      },
      setItem: () => undefined,
    })
    const prompt = (await loadPage())()

    vi.advanceTimersByTime(SETTLED_MS)

    expect(prompt.isOpen.value).toBe(false)
  })

  it('opens once per page load when storage cannot be written', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('Full', 'QuotaExceededError')
      },
    })
    const mountPrompt = await loadPage()
    const prompt = mountPrompt()
    vi.advanceTimersByTime(SETTLED_MS)
    expect(prompt.isOpen.value).toBe(true)

    prompt.close()
    const remounted = mountPrompt()
    vi.advanceTimersByTime(SETTLED_MS)
    expect(remounted.isOpen.value).toBe(false)
  })

  it('never opens in a browser that reports itself as automated', async () => {
    setAutomated(true)
    const prompt = (await loadPage())()

    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(false)
  })

  it('closes on back and forward', async () => {
    const prompt = (await loadPage())()
    vi.advanceTimersByTime(SETTLED_MS)
    expect(prompt.isOpen.value).toBe(true)

    window.dispatchEvent(new PopStateEvent('popstate'))

    expect(prompt.isOpen.value).toBe(false)
  })
})
