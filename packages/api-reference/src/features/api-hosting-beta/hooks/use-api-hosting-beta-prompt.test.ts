/// <reference types="vitest/jsdom" />
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type EffectScope, type MaybeRefOrGetter, effectScope, nextTick, ref } from 'vue'

import type { ApiHostingBetaPrompt, rememberApiHostingBetaPromptSeen } from './use-api-hosting-beta-prompt'

/** Longer than the prompt waits for the reference to settle. */
const SETTLED_MS = 1600

const SEEN_KEY = 'scalar-api-hosting-beta-prompt-seen'

const scopes: EffectScope[] = []

/** Where jsdom starts, restored after tests that move the page to another address */
const START_URL = location.href

/**
 * Loads the hook as a new page load would, so what one test's page load remembers does not leak
 * into the next. Each call of the returned function mounts the prompt once more in that page load.
 */
const loadPage = async (): Promise<
  ((ready?: MaybeRefOrGetter<boolean>) => ApiHostingBetaPrompt) & {
    remember: typeof rememberApiHostingBetaPromptSeen
  }
> => {
  vi.resetModules()
  const { rememberApiHostingBetaPromptSeen: remember, useApiHostingBetaPrompt } = await import(
    './use-api-hosting-beta-prompt'
  )

  const mountPrompt = (ready?: MaybeRefOrGetter<boolean>) => {
    const scope = effectScope()
    scopes.push(scope)
    const prompt = scope.run(() => useApiHostingBetaPrompt(ready))
    if (!prompt) {
      throw new Error('The prompt did not start')
    }
    return prompt
  }
  return Object.assign(mountPrompt, { remember })
}

/** jsdom names itself in its user agent, which the prompt takes as automated too */
const JSDOM_USER_AGENT = navigator.userAgent
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

/**
 * Makes the page look driven by a person in a real browser, or automated. The test setup reports
 * `navigator.webdriver` as true and jsdom keeps its own user agent, as the `afterEach` restores.
 */
const setAutomated = (automated: boolean): void => {
  Object.defineProperty(navigator, 'webdriver', { configurable: true, get: () => automated })
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    get: () => (automated ? JSDOM_USER_AGENT : BROWSER_USER_AGENT),
  })
}

/** Whether the seen cookie is set, as another port on the same host would read it. */
const hasSeenCookie = (): boolean => document.cookie.split(';').some((cookie) => cookie.trim() === `${SEEN_KEY}=true`)

const clearSeenCookie = (): void => {
  document.cookie = `${SEEN_KEY}=; Max-Age=0; Path=/`
}

/** A popup the reference opened, which the browser reports as laid out. */
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
    clearSeenCookie()
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
    clearSeenCookie()
    jsdom.reconfigure({ url: START_URL })
    clearSeenCookie()
    document.body.replaceChildren()
  })

  it('opens once the reference has sat untouched for a moment', async () => {
    const prompt = (await loadPage())()

    vi.advanceTimersByTime(SETTLED_MS - 200)
    expect(prompt.isOpen.value).toBe(false)

    vi.advanceTimersByTime(200)
    expect(prompt.isOpen.value).toBe(true)
  })

  it('holds its wait while the reference is still loading, and starts it once the reference is ready', async () => {
    const ready = ref(false)
    const prompt = (await loadPage())(ready)

    vi.advanceTimersByTime(SETTLED_MS * 5)
    expect(prompt.isOpen.value).toBe(false)

    ready.value = true
    await nextTick()
    vi.advanceTimersByTime(SETTLED_MS - 200)
    expect(prompt.isOpen.value).toBe(false)

    vi.advanceTimersByTime(200)
    expect(prompt.isOpen.value).toBe(true)
  })

  it('counts someone starting to read while the reference is still loading', async () => {
    const ready = ref(false)
    const prompt = (await loadPage())(ready)

    document.body.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 120 }))
    ready.value = true
    await nextTick()
    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(false)
  })

  it('remembers the prompt as seen in a cookie and in local storage as soon as it opens', async () => {
    const prompt = (await loadPage())()
    vi.advanceTimersByTime(SETTLED_MS)

    expect(prompt.isOpen.value).toBe(true)
    expect(hasSeenCookie()).toBe(true)
    expect(localStorage.getItem(SEEN_KEY)).toBe('true')
  })

  it('never opens where the cookie says it has been seen', async () => {
    document.cookie = `${SEEN_KEY}=true; Path=/`
    const prompt = (await loadPage())()

    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(false)
  })

  it('stays shut on another port of the same host once it has opened under any path', async () => {
    jsdom.reconfigure({ url: 'http://localhost:3000/api/docs' })
    const first = (await loadPage())()
    vi.advanceTimersByTime(SETTLED_MS)
    expect(first.isOpen.value).toBe(true)

    // Another project: its own origin, so its own empty local storage, and no cookie written by hand
    jsdom.reconfigure({ url: 'http://localhost:4000/' })
    localStorage.clear()
    const second = (await loadPage())()
    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(second.isOpen.value).toBe(false)
  })

  it('never opens where local storage says it has been seen, even once the cookie is gone', async () => {
    localStorage.setItem(SEEN_KEY, 'true')
    const prompt = (await loadPage())()

    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(false)
  })

  it('stays shut once the Deploy panel has been opened, even in the same page load', async () => {
    const mountPrompt = await loadPage()
    const prompt = mountPrompt()

    mountPrompt.remember()
    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(false)
  })

  it('leaves a load to someone who has started typing, and tries again on the next one', async () => {
    const prompt = (await loadPage())()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    vi.advanceTimersByTime(SETTLED_MS * 5)
    expect(prompt.isOpen.value).toBe(false)
    expect(hasSeenCookie()).toBe(false)
    expect(localStorage.getItem(SEEN_KEY)).toBeNull()

    const nextLoad = (await loadPage())()
    vi.advanceTimersByTime(SETTLED_MS)
    expect(nextLoad.isOpen.value).toBe(true)
  })

  it('does not take a lone modifier key for someone starting', async () => {
    const prompt = (await loadPage())()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Meta' }))
    vi.advanceTimersByTime(SETTLED_MS)

    expect(prompt.isOpen.value).toBe(true)
  })

  it('leaves a load to someone who has clicked', async () => {
    const prompt = (await loadPage())()

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(false)
  })

  it('leaves a load to someone scrolling through the reference', async () => {
    const prompt = (await loadPage())()

    document.body.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 120 }))
    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(false)
  })

  it('leaves a load to someone dragging a file in', async () => {
    const prompt = (await loadPage())()

    window.dispatchEvent(new Event('dragenter'))
    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(false)
  })

  it('leaves a load alone when another popup is up', async () => {
    addVisibleDialog()
    const prompt = (await loadPage())()

    vi.advanceTimersByTime(SETTLED_MS)

    expect(prompt.isOpen.value).toBe(false)
    expect(hasSeenCookie()).toBe(false)
    expect(localStorage.getItem(SEEN_KEY)).toBeNull()
  })

  it('opens only one prompt when two are waiting in the same page load', async () => {
    const mountPrompt = await loadPage()
    const first = mountPrompt()
    const second = mountPrompt()

    vi.advanceTimersByTime(SETTLED_MS)

    expect([first.isOpen.value, second.isOpen.value].filter(Boolean)).toHaveLength(1)
  })

  it('does not try again when the reference mounts it again in the same page load', async () => {
    const mountPrompt = await loadPage()
    mountPrompt()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))

    const remounted = mountPrompt()
    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(remounted.isOpen.value).toBe(false)
  })

  it('starts the wait over when the reference mounts it again before it is up', async () => {
    const mountPrompt = await loadPage()
    mountPrompt()
    vi.advanceTimersByTime(SETTLED_MS / 2)
    scopes.shift()?.stop()

    const remounted = mountPrompt()
    vi.advanceTimersByTime(SETTLED_MS)

    expect(remounted.isOpen.value).toBe(true)
  })

  it('waits while the reference is in the background', async () => {
    setVisibility('hidden')
    const prompt = (await loadPage())()

    vi.advanceTimersByTime(SETTLED_MS * 5)
    expect(prompt.isOpen.value).toBe(false)

    setVisibility('visible')
    vi.advanceTimersByTime(SETTLED_MS)
    expect(prompt.isOpen.value).toBe(true)
  })

  it('still remembers the prompt in the cookie when local storage is blocked', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new DOMException('Blocked', 'SecurityError')
      },
      setItem: () => {
        throw new DOMException('Blocked', 'SecurityError')
      },
    })
    const mountPrompt = await loadPage()
    const prompt = mountPrompt()
    vi.advanceTimersByTime(SETTLED_MS)
    expect(prompt.isOpen.value).toBe(true)
    expect(hasSeenCookie()).toBe(true)

    const nextLoad = (await loadPage())()
    vi.advanceTimersByTime(SETTLED_MS)
    expect(nextLoad.isOpen.value).toBe(false)
  })

  it('stays shut when neither the cookie nor local storage can be read', async () => {
    vi.spyOn(document, 'cookie', 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
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

  it('opens once per page load when nothing can be written', async () => {
    vi.spyOn(document, 'cookie', 'set').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
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

  it('never opens in jsdom, which does not report itself as automated', async () => {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => JSDOM_USER_AGENT })
    const prompt = (await loadPage())()

    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(false)
  })

  it('never opens in a browser that reports itself as automated', async () => {
    setAutomated(true)
    const prompt = (await loadPage())()

    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(false)
  })

  it('leaves a load to someone going back while it waits', async () => {
    const prompt = (await loadPage())()

    window.dispatchEvent(new PopStateEvent('popstate'))
    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(false)
    expect(hasSeenCookie()).toBe(false)
  })

  // The full list of addresses lives in is-local-development-page.test.ts; these confirm the hook asks it
  it.each([
    ['opens', 'http://127.0.0.1:8000/docs', true],
    ['stays shut on a public site', 'https://docs.acme.io/', false],
    ['stays shut on a reserved name the shell counts as local', 'http://my-api.test/', false],
    ['stays shut in an app shipped in a web view', 'https://localhost/', false],
  ])('%s (%s)', async (_, url, opens) => {
    jsdom.reconfigure({ url })
    const prompt = (await loadPage())()

    vi.advanceTimersByTime(SETTLED_MS * 5)

    expect(prompt.isOpen.value).toBe(opens)
  })

  it('leaves nothing behind off this machine, even when the Deploy panel asks to remember it', async () => {
    jsdom.reconfigure({ url: 'https://docs.acme.io/' })
    const mountPrompt = await loadPage()

    mountPrompt.remember()

    expect(hasSeenCookie()).toBe(false)
    expect(localStorage.getItem(SEEN_KEY)).toBeNull()
  })

  it('remembers the prompt in local storage when the browser has cookies turned off', async () => {
    vi.spyOn(navigator, 'cookieEnabled', 'get').mockReturnValue(false)
    const prompt = (await loadPage())()
    vi.advanceTimersByTime(SETTLED_MS)
    expect(prompt.isOpen.value).toBe(true)
    expect(localStorage.getItem(SEEN_KEY)).toBe('true')

    const nextLoad = (await loadPage())()
    vi.advanceTimersByTime(SETTLED_MS)
    expect(nextLoad.isOpen.value).toBe(false)
  })

  it('stays shut when cookies are turned off and local storage is blocked', async () => {
    vi.spyOn(navigator, 'cookieEnabled', 'get').mockReturnValue(false)
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

  it('closes on back and forward', async () => {
    const prompt = (await loadPage())()
    vi.advanceTimersByTime(SETTLED_MS)
    expect(prompt.isOpen.value).toBe(true)

    window.dispatchEvent(new PopStateEvent('popstate'))

    expect(prompt.isOpen.value).toBe(false)
  })
})
