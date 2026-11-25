import { type Ref, onScopeDispose, readonly, ref } from 'vue'

/**
 * How long the app has to sit untouched after it starts before the prompt opens. Anything the app
 * opens by itself on arrival, such as an import from a link, claims the screen in that time.
 */
const OPEN_DELAY_MS = 1500

/** Remembers, in this browser, that the prompt has been shown. */
const SEEN_STORAGE_KEY = 'scalar-api-hosting-beta-prompt-seen'

/**
 * The prompt gets one try per page load. The app shell mounts again whenever a workspace loads,
 * and the prompt must not open then, in the middle of whatever loaded it.
 */
let hasTriedThisPageLoad = false

/** Takes down every prompt that is on screen. */
const closeOpenPrompts = new Set<() => void>()

/**
 * Keeps the prompt out of the way of something the user started, such as an import from a link, a
 * dropped file or File > Open. A prompt still waiting gives up for this page load, and one already
 * on screen closes, since it would otherwise cover the import's own popup or its result.
 */
export const holdApiHostingBetaPrompt = (): void => {
  hasTriedThisPageLoad = true
  for (const close of closeOpenPrompts) {
    close()
  }
}

/**
 * Whether the prompt has been shown in this browser before. Unreadable storage counts as yes: the
 * prompt could not be remembered there either, so it would come back on every launch.
 */
const hasSeenPrompt = (): boolean => {
  try {
    return localStorage.getItem(SEEN_STORAGE_KEY) === 'true'
  } catch {
    return true
  }
}

const rememberPromptSeen = (): void => {
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, 'true')
  } catch {
    // Remembered for this page load only
  }
}

/**
 * Keys that do nothing on their own, such as Command on the way to switching apps, so pressing one
 * is not someone starting to work.
 */
const MODIFIER_KEYS = new Set(['Alt', 'AltGraph', 'CapsLock', 'Control', 'Fn', 'Meta', 'Shift'])

/** Another popup is on screen, such as the command palette or an import. */
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
 * Opens the API Hosting beta prompt once in each browser.
 *
 * The API client is somewhere people work, so the prompt only opens as the app starts: once the
 * app has sat for a moment with nobody pressing a key or clicking, and with no other popup up. If
 * someone has already started by then, the prompt leaves them to it until the next launch. A
 * window or tab in the background holds the wait until it is looked at. It never opens in a browser
 * that reports itself as automated (`navigator.webdriver`).
 *
 * It is remembered as seen the moment it opens rather than when it is closed, so a reload with the
 * prompt still up does not bring it back.
 */
export const useApiHostingBetaPrompt = (): ApiHostingBetaPrompt => {
  const isOpen = ref(false)

  let openTimer: ReturnType<typeof setTimeout> | undefined

  /** Starts the wait over while the app is in view, and pauses it while it is not. */
  const restartWait = (): void => {
    clearTimeout(openTimer)
    openTimer = document.visibilityState === 'hidden' ? undefined : setTimeout(open, OPEN_DELAY_MS)
  }

  const stopWaiting = (): void => {
    clearTimeout(openTimer)
    window.removeEventListener('keydown', handleKeydown, true)
    window.removeEventListener('pointerdown', giveUp, true)
    window.removeEventListener('dragenter', giveUp, true)
    document.removeEventListener('visibilitychange', restartWait)
  }

  /** Someone has started working, so this launch is theirs. */
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
    // Something held the prompt while this one was waiting
    const wasHeld = hasTriedThisPageLoad
    giveUp()
    if (wasHeld || hasSeenPrompt() || hasOpenDialog()) {
      return
    }
    rememberPromptSeen()
    isOpen.value = true
  }

  /*
   * A browser that reports itself as automated, as the Playwright test runner's do, is never
   * someone who can join, and the end-to-end suites would find the prompt over the page they are
   * about to click.
   */
  if (navigator.webdriver !== true && !hasTriedThisPageLoad && !hasSeenPrompt()) {
    // Captured, so a control that stops its own events still counts as someone starting. A file
    // dragged in from elsewhere brings no key or pointer events of its own.
    window.addEventListener('keydown', handleKeydown, true)
    window.addEventListener('pointerdown', giveUp, true)
    window.addEventListener('dragenter', giveUp, true)
    document.addEventListener('visibilitychange', restartWait)
    restartWait()
  }

  const close = (): void => {
    isOpen.value = false
  }

  closeOpenPrompts.add(close)

  // Back and forward take it down, so it never lingers over the page they lead to
  window.addEventListener('popstate', close)

  onScopeDispose(() => {
    stopWaiting()
    closeOpenPrompts.delete(close)
    window.removeEventListener('popstate', close)
  })

  return { isOpen: readonly(isOpen), close }
}
