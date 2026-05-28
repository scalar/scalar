/**
 * Client-side mounting for `<ScalarComponent renderMode="client" />`.
 *
 * Instead of a pre-rendered HTML document, the component renders an empty
 * `[data-scalar-client]` container. This module loads the Scalar standalone
 * bundle from the CDN and mounts the API reference into that container in the
 * browser.
 *
 * Most importantly, it re-mounts around Astro's view-transition events. A
 * server-rendered `<script>` runs on a hard page load but not after a
 * client-side navigation, which is why the API reference used to appear only
 * after a manual refresh on Starlight pages and other Astro sites that use
 * `<ClientRouter />`.
 */
import { DEFAULT_CDN } from '@scalar/client-side-rendering'

/** A mounted API reference, as returned by `window.Scalar.createApiReference`. */
type ScalarInstance = {
  destroy: () => void
}

type ScalarGlobal = {
  createApiReference: (element: Element, configuration: unknown) => ScalarInstance
}

/** Shared, page-wide state. */
type ClientState = {
  /** Whether the view-transition listeners have been registered. */
  initialized: boolean
  /**
   * Bumped by every `unmountAll`. A mount started before the bump belongs to
   * a page that has since been swapped away, so its (async) CDN load must not
   * create an instance once it finally resolves.
   */
  generation: number
  /** Live instances, keyed by their container element. */
  instances: Map<HTMLElement, ScalarInstance>
  /** Containers with a mount currently in flight, so it is not started twice. */
  pending: Set<HTMLElement>
  /** CDN script loads in flight (or settled), keyed by their resolved URL. */
  cdnLoads: Map<string, Promise<void>>
}

type ScalarWindow = Window & {
  Scalar?: ScalarGlobal
  __scalarAstroClient?: ClientState
}

/**
 * Read the shared state from `window`, creating it on first access.
 *
 * Astro may bundle this module into more than one page chunk, so module-level
 * variables are not guaranteed to be shared across navigations. `window` is.
 */
const getState = (): ClientState => {
  const win = window as ScalarWindow

  win.__scalarAstroClient ??= {
    initialized: false,
    generation: 0,
    instances: new Map(),
    pending: new Set(),
    cdnLoads: new Map(),
  }

  return win.__scalarAstroClient
}

/** Inject the Scalar standalone bundle, loading each CDN URL at most once. */
const loadCdn = (cdn: string): Promise<void> => {
  const { cdnLoads } = getState()
  const cached = cdnLoads.get(cdn)

  if (cached) {
    return cached
  }

  const load = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = cdn
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener(
      'error',
      () => {
        // Drop the cached failure (and the dead tag) so a later mount or
        // navigation can retry, instead of replaying this rejection forever.
        cdnLoads.delete(cdn)
        script.remove()
        reject(new Error(`[@scalar/astro] Could not load ${cdn}`))
      },
      { once: true },
    )
    document.head.appendChild(script)
  })

  cdnLoads.set(cdn, load)

  return load
}

/**
 * Resolve the global `Scalar` object, loading the requested CDN bundle.
 *
 * Always routes through `loadCdn`, which deduplicates by URL. Skipping when
 * `window.Scalar` happens to be set would make a second reference with a
 * different `data-cdn` silently reuse the first bundle.
 */
const ensureScalar = async (cdn: string): Promise<ScalarGlobal | undefined> => {
  await loadCdn(cdn)

  return (window as ScalarWindow).Scalar
}

/** Mount a single container, unless it is already mounted or mounting. */
const mountContainer = (element: HTMLElement): void => {
  const state = getState()

  // Skip containers that are already mounted, or have a mount in flight. This
  // also dedupes the two `mountAll()` calls the initial page load triggers
  // (our own call in `initScalarClient`, plus `astro:page-load`).
  if (state.instances.has(element) || state.pending.has(element)) {
    return
  }

  let configuration: unknown

  try {
    configuration = JSON.parse(element.dataset.configuration || '{}')
  } catch (error) {
    // A bad configuration is left untracked, so a corrected one on a later
    // navigation still gets a chance to mount.
    console.error('[@scalar/astro] Could not parse the configuration.', error)
    return
  }

  const cdn = element.dataset.cdn || DEFAULT_CDN
  // Remember which lifecycle this mount belongs to (see `ClientState`).
  const { generation } = state

  state.pending.add(element)

  void ensureScalar(cdn)
    .then((Scalar) => {
      // Mount only if this page is still live (no view transition happened
      // while the CDN loaded) and the element is still in the document.
      if (state.generation === generation && element.isConnected && Scalar?.createApiReference) {
        state.instances.set(element, Scalar.createApiReference(element, configuration))
      }
    })
    .catch((error) => console.error('[@scalar/astro] Could not mount the API reference.', error))
    .finally(() => {
      // Release the pending slot — but only if a view transition has not
      // already cleared it, in which case the slot belongs to a newer attempt.
      if (state.generation === generation) {
        state.pending.delete(element)
      }
    })
}

/** Mount every client-rendered container currently in the document. */
const mountAll = (): void => {
  document.querySelectorAll<HTMLElement>('[data-scalar-client]').forEach(mountContainer)
}

/** Destroy every mounted instance, e.g. before Astro swaps the page out. */
const unmountAll = (): void => {
  const state = getState()

  state.instances.forEach((instance) => {
    try {
      instance.destroy()
    } catch (error) {
      console.error('[@scalar/astro] Could not destroy the API reference.', error)
    }
  })

  state.instances.clear()
  state.pending.clear()

  // Invalidate in-flight mounts: their CDN load may still resolve, but it
  // belongs to the page being swapped away. The next `astro:page-load` then
  // mounts every container afresh — including any that survive the swap via
  // `transition:persist`, which are no longer tracked as mounted.
  state.generation += 1
}

/** The `astro:before-swap` event, narrowed to the part this module uses. */
type BeforeSwapEvent = Event & { newDocument?: Document }

/**
 * Carry Scalar's stylesheet into the next page during a view transition.
 *
 * The standalone bundle injects its CSS into `<head>` once, when the CDN
 * script first runs. Astro replaces `<head>` on every navigation, which would
 * drop that `<style>` and leave the reference unstyled after a client-side
 * navigation. Cloning it into the incoming document keeps the styles in place.
 *
 * This runs on every navigation, even to pages without a reference: that
 * `<style>` is the only copy, so a page in between (an "About" page, say) has
 * to carry it along, otherwise it is gone for good once the user navigates on.
 */
const persistScalarStyles = (newDocument: Document): void => {
  document.head.querySelectorAll('style').forEach((style) => {
    // Scalar's design tokens are namespaced `--scalar-*`, which reliably
    // fingerprints the (otherwise unmarked) `<style>` the bundle injects.
    if (!style.textContent?.includes('--scalar-')) {
      return
    }

    const alreadyThere = Array.from(newDocument.head.querySelectorAll('style')).some((candidate) =>
      candidate.isEqualNode(style),
    )

    if (!alreadyThere) {
      newDocument.head.appendChild(style.cloneNode(true))
    }
  })
}

/** Persist styles and tear down instances before Astro swaps the page out. */
const handleBeforeSwap = (event: Event): void => {
  const { newDocument } = event as BeforeSwapEvent

  if (newDocument) {
    persistScalarStyles(newDocument)
  }

  unmountAll()
}

/**
 * Mount client-rendered API references and keep them working across Astro
 * view transitions. Safe to call repeatedly — the listeners register once.
 */
export const initScalarClient = (): void => {
  // Mount right away. This covers the initial page load, including sites
  // without `<ClientRouter />`, where `astro:page-load` never fires.
  mountAll()

  const state = getState()

  if (state.initialized) {
    return
  }
  state.initialized = true

  // `astro:before-swap` fires before the outgoing page is replaced, and
  // `astro:page-load` once the new page is in place — destroy, then re-mount.
  document.addEventListener('astro:before-swap', handleBeforeSwap)
  document.addEventListener('astro:page-load', mountAll)
}
