/**
 * Client-side mounting logic for the Astro integration.
 *
 * Each `<ScalarComponent renderMode="client" />` renders a container element
 * tagged with `data-scalar-mount` and a JSON-encoded `data-scalar-config`. The
 * single hoisted script in the component imports `initScalarAstro` to wire up
 * the Astro view-transition lifecycle once per page.
 */

const stateKey = '__scalarAstroState'
const STYLE_MARKER = 'data-scalar-astro-style'
const CDN_MARKER = 'data-scalar-astro-cdn'
const DEFAULT_CDN = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'

type ScalarApiReferenceInstance = {
  destroy?: () => void
}

type ScalarGlobal = {
  createApiReference?: (selector: string, configuration: unknown) => ScalarApiReferenceInstance
}

type GlobalState = {
  instances: Record<string, ScalarApiReferenceInstance | null>
  initialized: boolean
}

type ScalarWindow = typeof window & {
  Scalar?: ScalarGlobal
  [stateKey]?: GlobalState
}

type MountOptions = {
  selector: string
  configuration: unknown
  cdn: string | null
}

const getGlobalState = (): GlobalState => {
  const win = window as ScalarWindow
  win[stateKey] ??= { instances: {}, initialized: false }
  return win[stateKey] as GlobalState
}

/**
 * Resolve the stylesheet URL for a given Scalar CDN script URL.
 */
const getStyleHref = (cdn: string | null): string => {
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

const ensureStylesLoaded = async (cdn: string | null): Promise<void> => {
  const styleHref = getStyleHref(cdn)
  const existing = document.querySelector<HTMLLinkElement>(`link[${STYLE_MARKER}="true"]`)

  if (existing?.getAttribute('href') === styleHref && existing.dataset.loaded === 'true') {
    return
  }

  if (existing) {
    existing.remove()
  }

  await new Promise<void>((resolve, reject) => {
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
}

const ensureCdnLoaded = async (cdn: string | null): Promise<void> => {
  const win = window as ScalarWindow

  if (win.Scalar?.createApiReference) {
    return
  }

  await new Promise<void>((resolve, reject) => {
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
}

const readMountOptions = (container: HTMLElement): MountOptions | null => {
  if (!container.id) {
    return null
  }

  const raw = container.dataset.scalarConfig

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as { configuration?: unknown; cdn?: string | null }
    return {
      selector: `#${container.id}`,
      configuration: parsed.configuration ?? {},
      cdn: parsed.cdn ?? null,
    }
  } catch {
    return null
  }
}

const destroyInstance = (state: GlobalState, selector: string): void => {
  const instance = state.instances[selector]

  if (instance?.destroy) {
    instance.destroy()
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
