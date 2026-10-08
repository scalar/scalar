/**
 * Cal.com inline embed for the demo call with Marc, ported from the official embed snippet.
 *
 * The snippet installs a queueing `window.Cal` stub and loads `embed.js` once; every call made
 * before the script arrives is replayed by it, so the booking can be set up right away. Only the
 * Explore Scalar dialog uses this, which means the script is never requested outside localhost.
 */

const CAL_EMBED_SCRIPT_URL = 'https://app.cal.com/embed/embed.js'
const CAL_ORIGIN = 'https://scalar.cal.com'
const CAL_NAMESPACE = '30min'
const CAL_LINK = 'marc/30min'

/** The queueing stub and, once loaded, the real embed API: both are callable and carry a queue */
type CalApi = {
  (...args: unknown[]): void
  q?: unknown[][]
  ns?: Record<string, CalApi>
  loaded?: boolean
  config?: { forwardQueryParams?: boolean }
}

declare global {
  interface Window {
    Cal?: CalApi
  }
}

/** Resolves once embed.js has loaded and rejects when the browser could not fetch it */
let scriptLoaded: Promise<void> | undefined

const loadScript = (): Promise<void> => {
  scriptLoaded ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CAL_EMBED_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      // Let a later attempt inject the script again
      scriptLoaded = undefined
      script.remove()
      reject(new Error('Failed to load the Cal.com embed'))
    }
    document.head.appendChild(script)
  })

  return scriptLoaded
}

/** True once this module installed the stub; a host page that brought its own `Cal` needs no script from us */
let installedStub = false

/** Returns the page's `Cal` stub, installing it (and requesting embed.js) on first use */
const getCal = (): CalApi => {
  if (window.Cal) {
    return window.Cal
  }

  installedStub = true

  const cal: CalApi = (...args: unknown[]): void => {
    if (!cal.loaded) {
      cal.ns = {}
      cal.q = cal.q ?? []
      // A failed load is reported to the caller of mountCalInline, which awaits the same promise
      void loadScript().catch(() => undefined)
      cal.loaded = true
    }

    if (args[0] === 'init') {
      const namespace = args[1]
      const api: CalApi = (...inner: unknown[]): void => {
        api.q?.push(inner)
      }
      api.q = api.q ?? []

      if (typeof namespace === 'string') {
        cal.ns ??= {}
        cal.ns[namespace] = cal.ns[namespace] ?? api
        cal.ns[namespace].q?.push(args)
        cal.q?.push(['initNamespace', namespace])
      } else {
        cal.q?.push(args)
      }

      return
    }

    cal.q?.push(args)
  }

  window.Cal = cal

  return cal
}

/**
 * Renders the booking calendar into `element`.
 *
 * Resolves once the embed script is available (immediately when the host page already brought
 * its own `Cal`) and rejects when the script cannot be loaded, so the caller can offer a link to
 * the booking page instead.
 */
export const mountCalInline = async (element: HTMLElement, theme: 'light' | 'dark'): Promise<void> => {
  const cal = getCal()

  cal('init', CAL_NAMESPACE, { origin: CAL_ORIGIN })
  cal.config = cal.config ?? {}
  cal.config.forwardQueryParams = true

  const namespace = cal.ns?.[CAL_NAMESPACE]
  namespace?.('inline', {
    elementOrSelector: element,
    config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true' },
    calLink: CAL_LINK,
  })
  namespace?.('ui', { hideEventTypeDetails: false, layout: 'month_view', theme })

  // Waits for the script, and requests it again after a failed attempt
  if (installedStub) {
    await loadScript()
  }
}
