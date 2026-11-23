import { readFileSync } from 'node:fs'
import { Script } from 'node:vm'

import { JSDOM } from 'jsdom'
import { describe, expect, it, vi } from 'vitest'

const script = new Script(readFileSync(new URL('./api-hosting-invite.js', import.meta.url), 'utf8'))
const seenKey = 'scalar-api-hosting-beta-prompt-seen'

const withPage = async (
  run: (page: {
    window: JSDOM['window']
    document: Document
    desktop: { matches: boolean }
    start: () => void
    flushIdle: (didTimeout?: boolean) => void
  }) => void | Promise<void>,
  path = '/pricing',
): Promise<void> => {
  const dom = new JSDOM('', { url: `https://scalar.com${path}`, runScripts: 'outside-only' })
  const { window } = dom
  const { document } = window
  const desktop = { matches: true }
  const idleCallbacks = new Map<number, IdleRequestCallback>()

  try {
    await new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }))
    vi.useFakeTimers()

    // JSDOM does not implement media queries, idle callbacks, or native dialog opening and closing.
    Object.defineProperties(window, {
      matchMedia: { value: () => desktop },
      requestIdleCallback: {
        value: (callback: IdleRequestCallback): number => {
          const handle = idleCallbacks.size + 1
          idleCallbacks.set(handle, callback)
          return handle
        },
      },
      cancelIdleCallback: { value: (handle: number): boolean => idleCallbacks.delete(handle) },
    })
    Object.defineProperties(window.HTMLDialogElement.prototype, {
      showModal: {
        value(this: HTMLDialogElement): void {
          this.open = true
        },
      },
      close: {
        value(this: HTMLDialogElement): void {
          this.open = false
          this.dispatchEvent(new window.Event('close'))
        },
      },
    })

    await run({
      window,
      document,
      desktop,
      start: (): void => {
        script.runInContext(dom.getInternalVMContext())
      },
      flushIdle: (didTimeout = false): void => {
        const callbacks = [...idleCallbacks.values()]
        idleCallbacks.clear()
        for (const callback of callbacks) {
          callback({ didTimeout, timeRemaining: () => (didTimeout ? 0 : 50) })
        }
      },
    })
  } finally {
    window.close()
    vi.useRealTimers()
  }
}

describe('api-hosting-invite', () => {
  it('starts the delay only after the page finishes loading', async () => {
    await withPage(({ window, document, start, flushIdle }) => {
      Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true })
      start()
      vi.advanceTimersByTime(1500)
      flushIdle()
      expect(document.querySelector('dialog')).toBeNull()
      Object.defineProperty(document, 'readyState', { value: 'complete' })
      window.dispatchEvent(new window.Event('load'))
      vi.advanceTimersByTime(1500)
      flushIdle()
      expect(document.querySelector('dialog')?.open).toBe(true)
    })
  })

  it('waits for the loaded page and an idle moment, then remembers the invitation', async () => {
    await withPage(({ window, document, start, flushIdle }) => {
      start()
      vi.advanceTimersByTime(1499)
      flushIdle()
      expect(document.querySelector('dialog')).toBeNull()
      vi.advanceTimersByTime(1)
      expect(document.querySelector('dialog')).toBeNull()
      flushIdle()
      expect(document.querySelector('dialog')?.open).toBe(true)
      expect(document.activeElement?.id).toBe('hosting-invite-email')
      expect(window.localStorage.getItem(seenKey)).toBe('true')
    })
  })

  it.each(['/', '/products/api-hosting', '/products/api-hosting/'])('leaves %s alone', async (path) => {
    await withPage(({ window, document, start, flushIdle }) => {
      start()
      vi.advanceTimersByTime(1500)
      flushIdle()
      expect(document.querySelector('dialog')).toBeNull()
      expect(window.localStorage.getItem(seenKey)).toBeNull()
    }, path)
  })

  it.each([false, true])('stays away from an ineligible viewport (initially desktop: %s)', async (initiallyDesktop) => {
    await withPage(({ window, document, desktop, start, flushIdle }) => {
      desktop.matches = initiallyDesktop
      start()
      desktop.matches = false
      vi.advanceTimersByTime(1500)
      flushIdle()
      expect(document.querySelector('dialog')).toBeNull()
      expect(window.localStorage.getItem(seenKey)).toBeNull()
    })
  })

  it('abandons a timed-out idle callback without marking the invitation seen', async () => {
    await withPage(({ window, document, start, flushIdle }) => {
      start()
      vi.advanceTimersByTime(1500)
      flushIdle(true)
      expect(document.querySelector('dialog')).toBeNull()
      expect(window.localStorage.getItem(seenKey)).toBeNull()
    })
  })

  it.each(['keydown', 'pointerdown', 'wheel', 'scroll', 'dragenter', 'popstate'])(
    'cancels a pending invitation after %s',
    async (eventName) => {
      await withPage(({ window, document, start, flushIdle }) => {
        start()
        vi.advanceTimersByTime(1500)
        const event =
          eventName === 'keydown' ? new window.KeyboardEvent('keydown', { key: 'a' }) : new window.Event(eventName)
        window.dispatchEvent(event)
        flushIdle()
        expect(document.querySelector('dialog')).toBeNull()
        expect(window.localStorage.getItem(seenKey)).toBeNull()
      })
    },
  )

  it('does not invite someone who has already seen it or signed up', async () => {
    await withPage(({ window, document, start, flushIdle }) => {
      window.localStorage.setItem(seenKey, 'true')
      start()
      vi.advanceTimersByTime(1500)
      flushIdle()
      expect(document.querySelector('dialog')).toBeNull()
    })
  })

  it('leaves automated browsers alone', async () => {
    await withPage(({ window, document, start, flushIdle }) => {
      Object.defineProperty(window.navigator, 'webdriver', { value: true })
      start()
      vi.advanceTimersByTime(1500)
      flushIdle()
      expect(document.querySelector('dialog')).toBeNull()
      expect(window.localStorage.getItem(seenKey)).toBeNull()
    })
  })

  it('does not open over the cookie banner', async () => {
    await withPage(({ window, document, start, flushIdle }) => {
      const banner = document.createElement('div')
      banner.className = 'cky-consent-container'
      Object.defineProperty(banner, 'checkVisibility', { value: () => true })
      document.body.append(banner)
      start()
      vi.advanceTimersByTime(1500)
      flushIdle()
      expect(document.querySelector('dialog')).toBeNull()
      expect(window.localStorage.getItem(seenKey)).toBeNull()
    })
  })

  it('does not open over another dialog', async () => {
    await withPage(({ window, document, start, flushIdle }) => {
      const other = document.createElement('dialog')
      other.open = true
      Object.defineProperty(other, 'checkVisibility', { value: () => true })
      document.body.append(other)
      start()
      vi.advanceTimersByTime(1500)
      flushIdle()
      expect(document.querySelector('.hosting-invite')).toBeNull()
      expect(window.localStorage.getItem(seenKey)).toBeNull()
    })
  })

  it('does not open after the tab moves to the background', async () => {
    await withPage(({ window, document, start, flushIdle }) => {
      start()
      vi.advanceTimersByTime(1500)
      Object.defineProperty(document, 'visibilityState', { value: 'hidden' })
      flushIdle()
      expect(document.querySelector('dialog')).toBeNull()
      expect(window.localStorage.getItem(seenKey)).toBeNull()
    })
  })

  it('closes through the close button and releases scrolling', async () => {
    await withPage(({ document, start, flushIdle }) => {
      start()
      vi.advanceTimersByTime(1500)
      flushIdle()
      expect(document.documentElement.classList.contains('hosting-invite-open')).toBe(true)
      document.querySelector<HTMLButtonElement>('.hosting-invite-close')!.click()
      expect(document.querySelector('dialog')).toBeNull()
      expect(document.documentElement.classList.contains('hosting-invite-open')).toBe(false)
    })
  })

  it('moves focus to Done after a successful signup', async () => {
    await withPage(async ({ document, start, flushIdle }) => {
      start()
      vi.advanceTimersByTime(1500)
      flushIdle()
      document.querySelector('form')!.classList.add('is-done')
      await Promise.resolve()
      expect(document.querySelector<HTMLButtonElement>('.hosting-invite-done')?.hidden).toBe(false)
      expect(document.activeElement).toBe(document.querySelector('.hosting-invite-done'))
      document.querySelector<HTMLButtonElement>('.hosting-invite-done')!.click()
      expect(document.querySelector('dialog')).toBeNull()
      expect(document.documentElement.classList.contains('hosting-invite-open')).toBe(false)
    })
  })
})
