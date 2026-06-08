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
  /**
   * CDN script loads in flight (or settled), keyed by their resolved URL. Each
   * resolves with the `Scalar` global that bundle installed (see `loadCdn`).
   */
  cdnLoads: Map<string, Promise<ScalarGlobal | undefined>>
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

/**
 * Inject the Scalar standalone bundle, loading each CDN URL at most once, and
 * resolve with the global that bundle installs.
 *
 * The global is captured synchronously inside the `load` handler — the instant
 * this bundle's script has run — rather than read back from `window.Scalar`
 * later. A page that mixes containers with distinct `data-cdn` URLs loads
 * several bundles that all claim the single `window.Scalar` global, so reading
 * it after an `await` could pick up whichever bundle happened to finish last.
 * (Distinct bundles sharing one global is inherently last-one-wins; capturing
 * here keeps the common single-CDN page correct and narrows the window for the
 * rest.)
 *
 * The cache key also includes the nonce. A strict `script-src 'nonce-...'` only
 * allows the `<script>` whose nonce matches the policy, so two mounts that want
 * the same bundle under different nonces (or one with and one without) each need
 * their own correctly-stamped tag — reusing the first load would leave the
 * second blocked.
 */
const loadCdn = (cdn: string, nonce?: string): Promise<ScalarGlobal | undefined> => {
  const { cdnLoads } = getState()
  const key = nonce ? `${cdn}\n${nonce}` : cdn
  const cached = cdnLoads.get(key)

  if (cached) {
    return cached
  }

  const load = new Promise<ScalarGlobal | undefined>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = cdn
    // Stamp the nonce so the injected bundle is allowed under a strict
    // `script-src 'nonce-...'` policy.
    if (nonce) {
      script.nonce = nonce
    }
    script.addEventListener('load', () => resolve((window as ScalarWindow).Scalar), { once: true })
    script.addEventListener(
      'error',
      () => {
        // Drop the cached failure (and the dead tag) so a later mount or
        // navigation can retry, instead of replaying this rejection forever.
        cdnLoads.delete(key)
        script.remove()
        reject(new Error(`[@scalar/astro] Could not load ${cdn}`))
      },
      { once: true },
    )
    document.head.appendChild(script)
  })

  cdnLoads.set(key, load)

  return load
}

/**
 * Ensure a `<meta property="csp-nonce">` is present in `<head>`.
 *
 * The standalone bundle reads this meta tag (it is built with `useStrictCSP`)
 * to nonce the stylesheet it injects at runtime, so a strict `style-src` lets
 * the bundle's `<style>` through. The static render path emits this tag in the
 * server-rendered HTML; in client mode we add it here instead. Astro replaces
 * `<head>` on every view transition, so this is re-checked on each mount.
 */
const ensureCspNonceMeta = (nonce: string): void => {
  const existing = document.head.querySelector('meta[property="csp-nonce"]')

  if (existing) {
    existing.setAttribute('content', nonce)
    return
  }

  const meta = document.createElement('meta')
  meta.setAttribute('property', 'csp-nonce')
  meta.setAttribute('content', nonce)
  document.head.appendChild(meta)
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
  const nonce = element.dataset.nonce
  // Remember which lifecycle this mount belongs to (see `ClientState`).
  const { generation } = state

  // Expose the nonce to the bundle before it loads, so the styles it injects at
  // runtime carry the nonce too.
  if (nonce) {
    ensureCspNonceMeta(nonce)
  }

  state.pending.add(element)

  void loadCdn(cdn, nonce)
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
