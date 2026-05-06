/**
 * Client-side mounting logic for the Astro integration.
 *
 * Each `<ScalarComponent renderMode="client" />` renders a container marked
 * with `data-scalar-mount` and emits a per-instance inline script that
 * registers its config on `window.__scalarAstro.configs` keyed by mount id.
 * The single hoisted script in the component calls `initScalarAstro` to wire
 * up the Astro view-transition lifecycle once per page.
 */

const stateKey = '__scalarAstroState'
const STYLE_MARKER = 'data-scalar-astro-style'
const CDN_MARKER = 'data-scalar-astro-cdn'
const DEFAULT_CDN = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'
const SAFE_PROTOCOLS = new Set(['http:', 'https:'])

/**
 * Reject CDN URLs that would let untrusted config execute code via
 * `javascript:`, `data:`, or other non-http(s) schemes when assigned to
 * `<script src>`. Defense in depth — the developer controls `cdn`, but a
 * misconfiguration should fail closed rather than execute arbitrary code.
 */
const isSafeCdnUrl = (url: string): boolean => {
  try {
    return SAFE_PROTOCOLS.has(new URL(url, window.location.href).protocol)
  } catch {
    return false
  }
}

type ScalarApiReferenceInstance = {
  destroy?: () => void
}

type ScalarGlobal = {
  createApiReference?: (selector: string, configuration: unknown) => ScalarApiReferenceInstance
}

type GlobalState = {
  instances: Record<string, ScalarApiReferenceInstance | null>
  initialized: boolean
  cdnPromise: Promise<void> | null
  stylePromise: Promise<void> | null
  styleHref: string | null
}

type ClientConfigEntry = {
  configuration?: unknown
  cdn?: string | null
}

type AstroRegistry = {
  configs?: Record<string, ClientConfigEntry>
}

type ScalarWindow = typeof window & {
  Scalar?: ScalarGlobal
  [stateKey]?: GlobalState
  __scalarAstro?: AstroRegistry
}

type MountOptions = {
  selector: string
  configuration: unknown
  cdn: string | null
}

const getGlobalState = (): GlobalState => {
  const win = window as ScalarWindow
  win[stateKey] ??= {
    instances: {},
    initialized: false,
    cdnPromise: null,
    stylePromise: null,
    styleHref: null,
  }
  return win[stateKey]
}

/**
 * Resolve the stylesheet URL for a given Scalar CDN script URL.
 *
 * Exported for unit testing.
 */
export const getStyleHref = (cdn: string | null): string => {
  const cdnUrl = (cdn ?? DEFAULT_CDN).replace(/\/$/, '')

  if (/\/dist\/browser\/[^/]+\.js(?:\?.*)?$/.test(cdnUrl)) {
    return cdnUrl.replace(/\/dist\/browser\/[^/]+\.js(?:\?.*)?$/, '/dist/style.css')
  }

  if (/\.js(?:\?.*)?$/.test(cdnUrl)) {
    return cdnUrl.replace(/\/[^/]+\.js(?:\?.*)?$/, '/style.css')
  }

  if (/\/dist$/.test(cdnUrl)) {
    return `${cdnUrl}/style.css`
  }

  return `${cdnUrl}/dist/style.css`
}

const loadStylesheet = (styleHref: string): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLLinkElement>(`link[${STYLE_MARKER}="true"]`)

    if (existing?.getAttribute('href') === styleHref) {
      if (existing.dataset.loaded === 'true') {
        resolve()
        return
      }
      // Same href, still loading: attach to the in-flight element instead of
      // removing it, otherwise we orphan the partial download and race against
      // anyone else awaiting that load.
      existing.addEventListener(
        'load',
        () => {
          existing.dataset.loaded = 'true'
          resolve()
        },
        { once: true },
      )
      existing.addEventListener('error', () => reject(new Error('Failed to load Scalar CDN stylesheet')), {
        once: true,
      })
      return
    }

    // Different href: replace the previous Scalar stylesheet entirely.
    if (existing) {
      existing.remove()
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = styleHref
    link.dataset.scalarAstroStyle = 'true'
    link.addEventListener(
      'load',
      () => {
        link.dataset.loaded = 'true'
        resolve()
      },
      { once: true },
    )
    link.addEventListener('error', () => reject(new Error('Failed to load Scalar CDN stylesheet')), { once: true })
    document.head.appendChild(link)
  })

const ensureStylesLoaded = async (cdn: string | null): Promise<void> => {
  const styleHref = getStyleHref(cdn)
  const state = getGlobalState()

  if (state.stylePromise && state.styleHref === styleHref) {
    await state.stylePromise
    return
  }

  // Different href requested: wait for any in-flight load to settle first so
  // we do not race against an older `<link>` element being removed.
  if (state.stylePromise) {
    try {
      await state.stylePromise
    } catch {
      // ignore — we are about to replace the stylesheet anyway
    }
  }

  state.styleHref = styleHref
  state.stylePromise = loadStylesheet(styleHref).catch((error) => {
    state.stylePromise = null
    state.styleHref = null
    throw error
  })

  await state.stylePromise
}

const loadCdn = (cdn: string | null): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[${CDN_MARKER}="true"]`)

    if (existing?.dataset.loaded === 'true') {
      resolve()
      return
    }

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Scalar CDN script')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = cdn ?? DEFAULT_CDN
    script.dataset.scalarAstroCdn = 'true'
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true'
        resolve()
      },
      { once: true },
    )
    script.addEventListener('error', () => reject(new Error('Failed to load Scalar CDN script')), { once: true })
    document.head.appendChild(script)
  })

const ensureCdnLoaded = async (cdn: string | null): Promise<void> => {
  const win = window as ScalarWindow

  if (win.Scalar?.createApiReference) {
    return
  }

  const state = getGlobalState()

  state.cdnPromise ??= loadCdn(cdn).catch((error) => {
    state.cdnPromise = null
    throw error
  })

  await state.cdnPromise
}

const readMountOptions = (container: HTMLElement): MountOptions | null => {
  if (!container.id) {
    return null
  }

  const win = window as ScalarWindow
  const entry = win.__scalarAstro?.configs?.[container.id]

  if (!entry) {
    return null
  }

  return {
    // Escape the id so element ids containing CSS metacharacters (`.`, `:`,
    // `[`, etc.) do not throw in `querySelector` or break selector-keyed state.
    selector: `#${CSS.escape(container.id)}`,
    configuration: entry.configuration ?? {},
    cdn: entry.cdn ?? null,
  }
}

const destroyInstance = (state: GlobalState, selector: string): void => {
  const instance = state.instances[selector]

  if (instance?.destroy) {
    try {
      instance.destroy()
    } catch (error) {
      console.error('[scalar/astro] failed to destroy instance', error)
    }
  }

  state.instances[selector] = null

  const container = document.querySelector(selector)

  if (container) {
    container.replaceChildren()
  }
}

const mountContainer = async (container: HTMLElement): Promise<void> => {
  const options = readMountOptions(container)

  if (!options) {
    return
  }

  const cdnUrl = options.cdn ?? DEFAULT_CDN

  if (!isSafeCdnUrl(cdnUrl)) {
    console.error(`[scalar/astro] Refusing to load CDN with unsafe URL scheme: ${cdnUrl}`)
    return
  }

  const state = getGlobalState()
  destroyInstance(state, options.selector)

  await ensureStylesLoaded(options.cdn)
  await ensureCdnLoaded(options.cdn)

  const win = window as ScalarWindow

  if (!win.Scalar?.createApiReference) {
    return
  }

  state.instances[options.selector] = win.Scalar.createApiReference(options.selector, options.configuration)
}

const mountAll = (): void => {
  const containers = document.querySelectorAll<HTMLElement>('[data-scalar-mount]')

  for (const container of containers) {
    void mountContainer(container)
  }
}

const unmountAll = (): void => {
  const state = getGlobalState()

  for (const selector of Object.keys(state.instances)) {
    destroyInstance(state, selector)
    delete state.instances[selector]
  }

  // Clear the per-instance config registry too. The new page's `is:inline`
  // registration scripts run during DOM swap (after this fires), so they
  // repopulate the registry before `astro:page-load` triggers `mountAll`.
  const win = window as ScalarWindow
  if (win.__scalarAstro) {
    win.__scalarAstro.configs = {}
  }
}

/**
 * Wire up Astro view-transition listeners that mount and unmount Scalar
 * instances around page navigations. Safe to call multiple times - listeners
 * are only attached once per page lifecycle.
 */
export const initScalarAstro = (): void => {
  const state = getGlobalState()

  if (state.initialized) {
    return
  }

  state.initialized = true

  document.addEventListener('astro:before-swap', unmountAll)
  document.addEventListener('astro:page-load', mountAll)
}
