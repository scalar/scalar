import { beforeEach, vi } from 'vitest'

/**
 * Monaco's theme / icon code calls `CSS.escape` (`vs/base/browser/cssValue`).
 * jsdom does not implement it, which can surface as unhandled rejections after
 * Monaco initializes asynchronously.
 *
 * Do not `vi.mock('monaco-editor')` here: `App` and `config.ts` load real
 * `monaco-editor/esm/...` contributions, which expect full `editor.api`
 * exports such as `Emitter`. A stub module breaks those imports.
 */
const cssEscapeIdent = (value: string): string => {
  let out = ''
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    const char = value[i] as string
    if (code === 0) {
      out += '\ufffd'
      continue
    }
    const isDigit = code >= 48 && code <= 57
    const isUpper = code >= 65 && code <= 90
    const isLower = code >= 97 && code <= 122
    if (isDigit || isUpper || isLower || char === '_' || char === '-') {
      out += char
    } else if (code < 128) {
      out += `\\${code.toString(16)} `
    } else {
      out += char
    }
  }
  return out
}

const ensureCssEscape = (): void => {
  const g = globalThis as typeof globalThis & { CSS?: { escape?: (value: string) => string } }
  if (typeof g.CSS?.escape === 'function') {
    return
  }
  g.CSS = { ...g.CSS, escape: cssEscapeIdent }
}

ensureCssEscape()

const createMatchMediaList = (query: string): MediaQueryList =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  }) as MediaQueryList

beforeEach(() => {
  /**
   * Monaco `StandaloneThemeService` listens to `(prefers-color-scheme: …)`
   * via `matchMedia`, which jsdom does not provide on every host object path.
   */
  globalThis.matchMedia = vi.fn((query: string) => createMatchMediaList(query))

  /**
   * Mock ResizeObserver which is used by @headlessui/vue Dialog and a few
   * other components but is not available in jsdom. Tests that need a
   * different implementation can override `globalThis.ResizeObserver`.
   *
   * @see https://github.com/jsdom/jsdom/issues/3368
   */
  globalThis.ResizeObserver = class {
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
  }

  /**
   * Mock IntersectionObserver which is used by various components but is
   * not available in jsdom.
   *
   * @see https://github.com/jsdom/jsdom/issues/2032
   */
  globalThis.IntersectionObserver = class {
    constructor(public callback: IntersectionObserverCallback) {}
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
    takeRecords = vi.fn(() => [])
    root = null
    rootMargin = ''
    thresholds = [] as number[]
  }
})
