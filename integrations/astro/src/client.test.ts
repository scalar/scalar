// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initScalarClient } from './client'

type ScalarTestWindow = Window & {
  Scalar?: {
    createApiReference: (element: Element, configuration: unknown) => { destroy: () => void }
  }
  __scalarAstroClient?: {
    initialized?: boolean
    instances: Map<unknown, unknown>
    pending: Set<unknown>
    cdnLoads: Map<unknown, Promise<void>>
    generation: number
  }
}

const DEFAULT_CDN = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'

/** A reference recorded by the fake `window.Scalar.createApiReference`. */
type Created = {
  element: Element
  configuration: unknown
  destroy: ReturnType<typeof vi.fn>
}

/**
 * Install a fake `window.Scalar` and collect every reference it creates.
 *
 * Also marks `cdn` as already loaded, mirroring reality: `window.Scalar` only
 * exists because its CDN script ran. Without this, `ensureScalar` would append
 * a `<script>` and wait for a `load` event that jsdom never fires.
 */
const installScalar = (cdn: string = DEFAULT_CDN): Created[] => {
  const created: Created[] = []
  const win = window as ScalarTestWindow

  win.Scalar = {
    createApiReference: (element, configuration) => {
      const destroy = vi.fn()
      created.push({ element, configuration, destroy })
      return { destroy }
    },
  }

  win.__scalarAstroClient ??= {
    instances: new Map(),
    pending: new Set(),
    cdnLoads: new Map(),
    generation: 0,
  }
  win.__scalarAstroClient.cdnLoads.set(cdn, Promise.resolve())

  return created
}

/** Add an empty client-rendered container to the page, as the component does. */
const createContainer = (configuration: unknown, cdn?: string): HTMLElement => {
  const element = document.createElement('div')
  element.setAttribute('data-scalar-client', '')
  element.dataset.configuration = JSON.stringify(configuration)

  if (cdn) {
    element.dataset.cdn = cdn
  }

  document.body.appendChild(element)

  return element
}

/** Let pending microtasks (the async CDN/mount chain) settle. */
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

/** Append a `<style>` to the current document head. */
const addHeadStyle = (css: string): void => {
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
}

/** Dispatch `astro:before-swap`, optionally carrying the incoming document. */
const dispatchBeforeSwap = (newDocument?: Document): void => {
  document.dispatchEvent(Object.assign(new Event('astro:before-swap'), { newDocument }))
}

describe('client', () => {
  beforeEach(() => {
    document.body.replaceChildren()
    document.head.replaceChildren()

    const win = window as ScalarTestWindow
    delete win.Scalar
    // Reset live state between tests, but keep the (idempotent) view-transition
    // listeners registered — exactly as they stay registered on a real page.
    const state = win.__scalarAstroClient
    if (state) {
      state.instances.clear()
      state.pending.clear()
      state.cdnLoads.clear()
      state.generation = 0
    }

    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mounts a client container with the parsed configuration', async () => {
    const created = installScalar()
    const element = createContainer({ url: 'https://example.com/openapi.json' })

    initScalarClient()
    await flush()

    expect(created).toHaveLength(1)
    expect(created[0]?.element).toBe(element)
    expect(created[0]?.configuration).toEqual({ url: 'https://example.com/openapi.json' })
  })

  it('does not mount the same container twice', async () => {
    const created = installScalar()
    createContainer({ url: 'https://example.com/openapi.json' })

    initScalarClient()
    initScalarClient()
    await flush()
    document.dispatchEvent(new Event('astro:page-load'))
    await flush()

    expect(created).toHaveLength(1)
  })

  it('loads the standalone bundle from the configured CDN', async () => {
    createContainer({}, 'https://cdn.example.com/api-reference')

    initScalarClient()
    await flush()

    expect(document.head.querySelector('script')?.getAttribute('src')).toBe('https://cdn.example.com/api-reference')
  })

  it('falls back to the default CDN when none is given', async () => {
    createContainer({})

    initScalarClient()
    await flush()

    expect(document.head.querySelector('script')?.getAttribute('src')).toBe(
      'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
    )
  })

  it('loads each CDN URL only once', async () => {
    createContainer({}, 'https://cdn.example.com/api-reference')
    createContainer({}, 'https://cdn.example.com/api-reference')

    initScalarClient()
    await flush()

    expect(document.head.querySelectorAll('script')).toHaveLength(1)
  })

  it('loads a container-specific CDN even when Scalar is already defined', async () => {
    // Scalar was loaded earlier in the session from the default CDN.
    installScalar()

    // A new reference asks for its own bundle.
    createContainer({}, 'https://cdn.example.com/api-reference')

    initScalarClient()
    await flush()

    // The requested CDN is fetched instead of silently reusing the existing
    // global, which may belong to a different (older) bundle.
    const scripts = Array.from(document.head.querySelectorAll('script')).map((script) => script.getAttribute('src'))
    expect(scripts).toContain('https://cdn.example.com/api-reference')
  })

  it('mounts containers added by a client-side navigation', async () => {
    const created = installScalar()

    initScalarClient()
    await flush()
    expect(created).toHaveLength(0)

    // Astro swaps in a new page that contains a reference.
    createContainer({ url: 'https://example.com/openapi.json' })
    document.dispatchEvent(new Event('astro:page-load'))
    await flush()

    expect(created).toHaveLength(1)
  })

  it('destroys instances before Astro swaps the page out', async () => {
    const created = installScalar()
    createContainer({ url: 'https://example.com/openapi.json' })

    initScalarClient()
    await flush()
    expect(created[0]?.destroy).not.toHaveBeenCalled()

    document.dispatchEvent(new Event('astro:before-swap'))

    expect(created[0]?.destroy).toHaveBeenCalledOnce()
  })

  it('re-mounts across a full view transition', async () => {
    const created = installScalar()
    const first = createContainer({ url: 'https://example.com/first.json' })

    initScalarClient()
    await flush()

    // Navigate away: Astro destroys the old page, then swaps in the new one.
    document.dispatchEvent(new Event('astro:before-swap'))
    first.remove()
    const second = createContainer({ url: 'https://example.com/second.json' })
    document.dispatchEvent(new Event('astro:page-load'))
    await flush()

    expect(created[0]?.destroy).toHaveBeenCalledOnce()
    expect(created).toHaveLength(2)
    expect(created[1]?.element).toBe(second)
  })

  it('logs and skips a container with invalid configuration JSON', async () => {
    const created = installScalar()
    const element = document.createElement('div')
    element.setAttribute('data-scalar-client', '')
    element.dataset.configuration = '{ not json'
    document.body.appendChild(element)

    initScalarClient()
    await flush()

    expect(created).toHaveLength(0)
    expect(console.error).toHaveBeenCalled()
  })

  it("carries Scalar's stylesheet into the next page during a view transition", () => {
    addHeadStyle(':root { --scalar-background-1: #fff; }')
    const newDocument = document.implementation.createHTMLDocument()

    initScalarClient()
    dispatchBeforeSwap(newDocument)

    const carried = Array.from(newDocument.head.querySelectorAll('style'))
    expect(carried.some((style) => style.textContent?.includes('--scalar-'))).toBe(true)
  })

  it('leaves non-Scalar styles behind during a view transition', () => {
    addHeadStyle('body { margin: 0; }')
    const newDocument = document.implementation.createHTMLDocument()

    initScalarClient()
    dispatchBeforeSwap(newDocument)

    expect(newDocument.head.querySelectorAll('style')).toHaveLength(0)
  })

  it('re-mounts a container that survives a view transition', async () => {
    const created = installScalar()
    const element = createContainer({ url: 'https://example.com/openapi.json' })

    initScalarClient()
    await flush()
    expect(created).toHaveLength(1)

    // The same element survives the swap, e.g. via `transition:persist`.
    dispatchBeforeSwap()
    document.dispatchEvent(new Event('astro:page-load'))
    await flush()

    expect(created[0]?.destroy).toHaveBeenCalledOnce()
    expect(created).toHaveLength(2)
    expect(created[1]?.element).toBe(element)
  })

  it('retries a container after a failed mount attempt', async () => {
    const created = installScalar()
    const element = createContainer({ url: 'https://example.com/openapi.json' })
    // Corrupt the configuration so the first mount attempt fails.
    element.dataset.configuration = '{ not json'

    initScalarClient()
    await flush()
    expect(created).toHaveLength(0)

    // A later navigation supplies valid configuration.
    element.dataset.configuration = JSON.stringify({ url: 'https://example.com/openapi.json' })
    document.dispatchEvent(new Event('astro:page-load'))
    await flush()

    expect(created).toHaveLength(1)
  })

  it('does not mount a reference whose page was swapped away while the CDN loaded', async () => {
    // `window.Scalar` is not installed yet, so the mount waits on the CDN script.
    createContainer({ url: 'https://example.com/openapi.json' })

    initScalarClient()
    await flush()
    expect(document.head.querySelector('script')).not.toBeNull()

    // The user navigates away before the CDN finishes loading.
    dispatchBeforeSwap()

    // Only now does the CDN resolve.
    const created = installScalar()
    document.head.querySelector('script')?.dispatchEvent(new Event('load'))
    await flush()

    // The mount belonged to the page that was swapped away — no instance.
    expect(created).toHaveLength(0)
  })

  it('retries the CDN after a failed load', async () => {
    createContainer({ url: 'https://example.com/openapi.json' })

    initScalarClient()
    await flush()

    // The CDN load fails.
    document.head.querySelector('script')?.dispatchEvent(new Event('error'))
    await flush()

    // The dead tag and the cached failure are both gone.
    expect(document.head.querySelector('script')).toBeNull()

    // A later navigation can load the CDN again.
    document.dispatchEvent(new Event('astro:page-load'))
    await flush()

    expect(document.head.querySelector('script')).not.toBeNull()
  })
})
