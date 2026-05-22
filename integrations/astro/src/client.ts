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

/** Default CDN, mirroring `@scalar/client-side-rendering`. */
const DEFAULT_CDN = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'

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
  /** Live instances, keyed by their container element. */
  instances: Map<Element, ScalarInstance>
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
    instances: new Map(),
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
    script.addEventListener('error', () => reject(new Error(`[@scalar/astro] Could not load ${cdn}`)), { once: true })
    document.head.appendChild(script)
  })

  cdnLoads.set(cdn, load)

  return load
}

/** Resolve the global `Scalar` object, loading the CDN bundle if necessary. */
const ensureScalar = async (cdn: string): Promise<ScalarGlobal | undefined> => {
  if (!(window as ScalarWindow).Scalar) {
    await loadCdn(cdn)
  }

  return (window as ScalarWindow).Scalar
}

/** Mount a single container, unless it has already been mounted. */
const mountContainer = (element: HTMLElement): void => {
  // Marking the element synchronously keeps a second `mountAll()` in the same
  // tick a no-op. The initial page load triggers both our own call and
  // `astro:page-load`, and both would otherwise mount the same container.
  if (element.dataset.scalarMounted) {
    return
  }
  element.dataset.scalarMounted = 'true'

  let configuration: unknown = {}

  try {
    configuration = JSON.parse(element.dataset.configuration || '{}')
  } catch (error) {
    console.error('[@scalar/astro] Could not parse the configuration.', error)
    return
  }

  const cdn = element.dataset.cdn || DEFAULT_CDN

  ensureScalar(cdn)
    .then((Scalar) => {
      // The element may have been swapped out while the CDN was loading.
      if (Scalar?.createApiReference && element.isConnected) {
        getState().instances.set(element, Scalar.createApiReference(element, configuration))
      }
    })
    .catch((error) => console.error('[@scalar/astro] Could not mount the API reference.', error))
}

/** Mount every client-rendered container currently in the document. */
const mountAll = (): void => {
  document.querySelectorAll<HTMLElement>('[data-scalar-client]').forEach(mountContainer)
}

/** Destroy every mounted instance, e.g. before Astro swaps the page out. */
const unmountAll = (): void => {
  const { instances } = getState()

  instances.forEach((instance) => {
    try {
      instance.destroy()
    } catch (error) {
      console.error('[@scalar/astro] Could not destroy the API reference.', error)
    }
  })

  instances.clear()
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
  document.addEventListener('astro:before-swap', unmountAll)
  document.addEventListener('astro:page-load', mountAll)
}
