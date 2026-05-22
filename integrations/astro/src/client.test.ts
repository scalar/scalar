// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initScalarClient } from './client'

type ScalarTestWindow = Window & {
  Scalar?: {
    createApiReference: (element: Element, configuration: unknown) => { destroy: () => void }
  }
  __scalarAstroClient?: {
    instances: Map<unknown, unknown>
    cdnLoads: Map<unknown, unknown>
  }
}

/** A reference recorded by the fake `window.Scalar.createApiReference`. */
type Created = {
  element: Element
  configuration: unknown
  destroy: ReturnType<typeof vi.fn>
}

/** Install a fake `window.Scalar` and collect every reference it creates. */
const installScalar = (): Created[] => {
  const created: Created[] = []

  ;(window as ScalarTestWindow).Scalar = {
    createApiReference: (element, configuration) => {
      const destroy = vi.fn()
      created.push({ element, configuration, destroy })
      return { destroy }
    },
  }

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

describe('client', () => {
  beforeEach(() => {
    document.body.replaceChildren()
    document.head.replaceChildren()

    const win = window as ScalarTestWindow
    delete win.Scalar
    // Reset live state between tests, but keep the (idempotent) view-transition
    // listeners registered — exactly as they stay registered on a real page.
    win.__scalarAstroClient?.instances.clear()
    win.__scalarAstroClient?.cdnLoads.clear()

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
})
