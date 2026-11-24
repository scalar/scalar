import { type MaybeRefOrGetter, type Ref, onScopeDispose, readonly, ref, toValue, watch } from 'vue'

import { isLocalDevelopmentPage } from '../helpers/is-local-development-page'

/**
 * How long the reference has to sit untouched after it loads before the prompt opens, the same wait
 * the API client gives it.
 */
const OPEN_DELAY_MS = 1500

/**
 * Remembers that the prompt has been shown. The same name serves the cookie and the local storage
 * entry.
 */
const SEEN_KEY = 'scalar-api-hosting-beta-prompt-seen'

/** As long as browsers keep a cookie: they cap its lifetime at 400 days. */
const SEEN_COOKIE_MAX_AGE_S = 400 * 24 * 60 * 60

/**
 * The prompt gets one try per page load. The reference can mount it again (another document, or a
 * second reference on the page), and it must not open then, in the middle of whatever caused that.
 */
let hasTriedThisPageLoad = false

/**
 * `true` or `false` when the cookie could be read, `undefined` when the browser refused. A browser
 * that blocks cookies usually reads them as empty rather than throwing, so it says so through
 * `navigator.cookieEnabled`.
 */
const readSeenCookie = (): boolean | undefined => {
  if (!navigator.cookieEnabled) {
    return undefined
  }
  try {
    return document.cookie.split(';').some((cookie) => cookie.trim() === `${SEEN_KEY}=true`)
  } catch {
    return undefined
  }
}

/** `true` or `false` when local storage could be read, `undefined` when the browser refused. */
const readSeenStorage = (): boolean | undefined => {
  try {
    return localStorage.getItem(SEEN_KEY) === 'true'
  } catch {
    return undefined
  }
}

/**
 * Whether the prompt has been shown on this host in this browser before.
 *
 * Local storage belongs to one origin, and on localhost every port is its own origin, so a developer
 * with a few projects on different ports would see the prompt once in each. Cookies ignore the port,
 * so the cookie carries what local storage cannot. Either one saying yes is enough. Nothing in the
 * browser is shared between host names, though, so `localhost`, `127.0.0.1` and each `*.localhost`
 * name remember it separately.
 *
 * When neither can be read, that counts as yes: the prompt could not be remembered either, so it
 * would come back on every load.
 */
const hasSeenPrompt = (): boolean => {
  const cookie = readSeenCookie()
  const storage = readSeenStorage()

  if (cookie === undefined && storage === undefined) {
    return true
  }

  return cookie === true || storage === true
}

/**
 * Remembers in this browser that the prompt has been shown, or that the person has met the same
 * invitation elsewhere (the Deploy panel), so it does not open after all. Only on pages where the
 * prompt could open: anywhere else there is nothing to remember, and no cookie is left behind.
 */
export const rememberApiHostingBetaPromptSeen = (): void => {
  if (!isLocalDevelopmentPage()) {
    return
  }
  try {
    document.cookie = `${SEEN_KEY}=true; Max-Age=${SEEN_COOKIE_MAX_AGE_S}; Path=/; SameSite=Lax`
  } catch {
    // Local storage may still remember it for this port
  }
  try {
    localStorage.setItem(SEEN_KEY, 'true')
  } catch {
    // The cookie may still remember it
  }
}

/**
 * Keys that do nothing on their own, such as Command on the way to switching apps, so pressing one
 * is not someone starting to read.
 */
const MODIFIER_KEYS = new Set(['Alt', 'AltGraph', 'CapsLock', 'Control', 'Fn', 'Meta', 'Shift'])

/**
 * A browser that something is driving rather than a person: one that reports itself as automated
 * (`navigator.webdriver`), such as the end-to-end and screenshot suites, or jsdom, which does not set
 * that flag. Projects that use the reference run their unit tests in jsdom at `http://localhost:3000`,
 * and a dialog appearing partway through would break them.
 */
const isAutomated = (): boolean => navigator.webdriver === true || /\bjsdom\//.test(navigator.userAgent)

/** Another popup is on screen, such as search or the API client. */
const hasOpenDialog = (): boolean =>
  Array.from(document.querySelectorAll('dialog[open], [role="dialog"]')).some(
    (dialog) => dialog.getClientRects().length > 0,
  )

/** What the prompt hook gives the component that shows it. */
export type ApiHostingBetaPrompt = {
  /** Whether the prompt is on screen. */
  isOpen: Readonly<Ref<boolean>>
  /** Takes the prompt down. It was remembered as seen when it opened. */
  close: () => void
}

/**
 * Opens the API Hosting beta prompt once on each local host name (every port on it) in each browser,
 * the way the API client opens it once in each browser.
 *
 * Someone reading their reference should not have a popup land on top of the page, so the prompt only
 * opens as the reference loads: once it has sat for a moment with nobody pressing a key, clicking,
 * scrolling, dragging or going back, and with no other popup up. If someone has already started by
 * then, the prompt leaves them to it until the next load. A window or tab in the background holds the
 * wait until it is looked at. It never opens in an automated browser, nor on any page but a development
 * server on this machine (`isLocalDevelopmentPage`). Where it cannot open, it adds no listeners at all.
 *
 * The reference holds the wait back with `ready` while it still has heavy work queued, such as other
 * documents to parse in the background, which would leave the popup unresponsive for a moment if it
 * opened first. The prompt listens from the start all the same, so anything done in the meantime
 * still counts as someone starting.
 *
 * It is remembered as seen the moment it opens rather than when it is closed, so a reload with the
 * prompt still up (a dev server restarting, say) does not bring it back.
 */
export const useApiHostingBetaPrompt = (ready: MaybeRefOrGetter<boolean> = true): ApiHostingBetaPrompt => {
  const isOpen = ref(false)

  let openTimer: ReturnType<typeof setTimeout> | undefined
  /** Whether the prompt is still waiting for its moment, rather than given up or open */
  let isWaiting = false

  /** Starts the wait over while the reference is in view and ready, and pauses it while it is not. */
  const restartWait = (): void => {
    clearTimeout(openTimer)
    openTimer = document.visibilityState === 'hidden' || !toValue(ready) ? undefined : setTimeout(open, OPEN_DELAY_MS)
  }

  const stopWaiting = (): void => {
    isWaiting = false
    clearTimeout(openTimer)
    window.removeEventListener('keydown', handleKeydown, true)
    window.removeEventListener('pointerdown', giveUp, true)
    window.removeEventListener('wheel', giveUp, true)
    window.removeEventListener('dragenter', giveUp, true)
    document.removeEventListener('visibilitychange', restartWait)
  }

  /** Someone has started reading, so this load is theirs. */
  const giveUp = (): void => {
    hasTriedThisPageLoad = true
    stopWaiting()
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    if (!MODIFIER_KEYS.has(event.key)) {
      giveUp()
    }
  }

  const open = (): void => {
    // Another mount took this page load's try while this one was waiting
    const hadTried = hasTriedThisPageLoad
    giveUp()
    if (hadTried || hasSeenPrompt() || hasOpenDialog()) {
      return
    }
    rememberApiHostingBetaPromptSeen()
    isOpen.value = true
  }

  const close = (): void => {
    isOpen.value = false
  }

  /**
   * Back and forward take it down, so it never lingers over the page they lead to. The browser's own
   * buttons send no key or pointer events to the page, so going back also counts as someone starting
   * while the prompt is still waiting.
   */
  const handlePopState = (): void => {
    giveUp()
    close()
  }

  // Development server checked first, so nothing else (not even storage) is read anywhere else
  if (isLocalDevelopmentPage() && !isAutomated() && !hasTriedThisPageLoad && !hasSeenPrompt()) {
    // Captured, so a control that stops its own events still counts as someone starting. Scrolling
    // is how a reference gets read, and neither a wheel nor a file dragged in from elsewhere brings
    // key or pointer events of its own.
    window.addEventListener('keydown', handleKeydown, true)
    window.addEventListener('pointerdown', giveUp, true)
    window.addEventListener('wheel', giveUp, { capture: true, passive: true })
    window.addEventListener('dragenter', giveUp, true)
    window.addEventListener('popstate', handlePopState)
    document.addEventListener('visibilitychange', restartWait)
    isWaiting = true
    restartWait()
    // The wait starts once the reference is ready, if nobody has started by then
    watch(
      () => toValue(ready),
      (isReady) => {
        if (isReady && isWaiting) {
          restartWait()
        }
      },
    )
  }

  onScopeDispose(() => {
    stopWaiting()
    window.removeEventListener('popstate', handlePopState)
  })

  return { isOpen: readonly(isOpen), close }
}
