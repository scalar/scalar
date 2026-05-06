import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getStyleHref, initScalarAstro } from './client'

const STATE_KEY = '__scalarAstroState'
const DEFAULT_STYLE_HREF = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference/dist/style.css'

const addMountElement = (id: string, configuration: object | null, cdn: string | null = null): HTMLElement => {
  const el = document.createElement('div')
  el.id = id
  el.setAttribute('data-scalar-mount', '')

  if (configuration !== null) {
    el.setAttribute('data-scalar-config', JSON.stringify({ configuration, cdn }))
  }

  document.body.appendChild(el)
  return el
}

const seedLoadedStylesheet = (href: string = DEFAULT_STYLE_HREF) => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.dataset.scalarAstroStyle = 'true'
  link.dataset.loaded = 'true'
  document.head.appendChild(link)
}

const stubScalarGlobal = () => {
  const destroy = vi.fn()
  const createApiReference = vi.fn(() => ({ destroy }))
  ;(window as unknown as { Scalar: { createApiReference: typeof createApiReference } }).Scalar = {
    createApiReference,
  }
  return { createApiReference, destroy }
}

const resetEnvironment = () => {
  document.body.replaceChildren()
  document.head.replaceChildren()
  delete (window as unknown as Record<string, unknown>)[STATE_KEY]
  delete (window as unknown as Record<string, unknown>).Scalar
}

const tick = async () => {
  // A few microtask flushes cover the `await ensureStylesLoaded` + `await ensureCdnLoaded` chain.
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('initScalarAstro', () => {
  let scalar: { createApiReference: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    resetEnvironment()
    seedLoadedStylesheet()
    scalar = stubScalarGlobal()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mounts each container on astro:page-load', async () => {
    addMountElement('a', { url: '/a.json' })
    addMountElement('b', { url: '/b.json' })

    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await tick()

    expect(scalar.createApiReference).toHaveBeenCalledTimes(2)
    expect(scalar.createApiReference).toHaveBeenCalledWith('#a', { url: '/a.json' })
    expect(scalar.createApiReference).toHaveBeenCalledWith('#b', { url: '/b.json' })
  })

  it('destroys instances and clears the container on astro:before-swap', async () => {
    const container = addMountElement('a', { url: '/a.json' })

    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await tick()

    // Simulate Scalar having rendered some children into the container.
    container.appendChild(document.createElement('span'))
    expect(container.children).toHaveLength(1)

    document.dispatchEvent(new Event('astro:before-swap'))

    expect(scalar.destroy).toHaveBeenCalledOnce()
    expect(container.children).toHaveLength(0)
  })

  it('re-mounts on subsequent astro:page-load events', async () => {
    addMountElement('a', { url: '/a.json' })

    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await tick()
    document.dispatchEvent(new Event('astro:before-swap'))
    document.dispatchEvent(new Event('astro:page-load'))
    await tick()

    expect(scalar.createApiReference).toHaveBeenCalledTimes(2)
    expect(scalar.destroy).toHaveBeenCalledOnce()
  })

  it('is idempotent — calling initScalarAstro twice does not double-mount', async () => {
    addMountElement('a', { url: '/a.json' })

    initScalarAstro()
    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await tick()

    expect(scalar.createApiReference).toHaveBeenCalledTimes(1)
  })

  it('skips containers without a config attribute', async () => {
    const el = document.createElement('div')
    el.id = 'a'
    el.setAttribute('data-scalar-mount', '')
    document.body.appendChild(el)

    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await tick()

    expect(scalar.createApiReference).not.toHaveBeenCalled()
  })

  it('skips containers with malformed JSON config', async () => {
    const el = document.createElement('div')
    el.id = 'a'
    el.setAttribute('data-scalar-mount', '')
    el.setAttribute('data-scalar-config', '{not valid json')
    document.body.appendChild(el)

    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await tick()

    expect(scalar.createApiReference).not.toHaveBeenCalled()
  })

  it.each([['javascript:alert(1)'], ['data:text/javascript,alert(1)'], ['vbscript:msgbox("x")']])(
    'refuses to mount when cdn URL has unsafe scheme: %s',
    async (cdn) => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      addMountElement('a', { url: '/a.json' }, cdn)

      initScalarAstro()
      document.dispatchEvent(new Event('astro:page-load'))
      await tick()

      expect(scalar.createApiReference).not.toHaveBeenCalled()
      expect(document.querySelectorAll('script[data-scalar-astro-cdn="true"]')).toHaveLength(0)
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('unsafe URL scheme'))
    },
  )

  it('escapes container ids that contain CSS metacharacters', async () => {
    addMountElement('foo.bar:baz', { url: '/x.json' })

    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await tick()

    expect(scalar.createApiReference).toHaveBeenCalledWith(`#${CSS.escape('foo.bar:baz')}`, { url: '/x.json' })
  })

  it('keeps unmounting other instances even if one destroy throws', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    addMountElement('a', { url: '/a.json' })
    addMountElement('b', { url: '/b.json' })

    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await tick()

    // The first .destroy call throws, the second should still run.
    scalar.destroy.mockImplementationOnce(() => {
      throw new Error('boom')
    })

    document.dispatchEvent(new Event('astro:before-swap'))

    expect(scalar.destroy).toHaveBeenCalledTimes(2)
    expect(consoleSpy).toHaveBeenCalled()
  })
})

describe('CDN and stylesheet deduplication', () => {
  beforeEach(() => {
    resetEnvironment()
  })

  it('appends only one stylesheet link when many containers mount in parallel', async () => {
    // No preloaded stylesheet — the first mount drives the actual load.
    for (let i = 0; i < 5; i++) {
      addMountElement(`c${i}`, { url: '/x.json' })
    }

    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await Promise.resolve()

    expect(document.querySelectorAll('link[data-scalar-astro-style="true"]')).toHaveLength(1)
  })

  it('appends only one CDN script when many containers mount in parallel', async () => {
    // Seed the stylesheet so `ensureStylesLoaded` resolves synchronously and we
    // can observe the CDN loader behavior. `window.Scalar` stays undefined so
    // the CDN loader actually runs.
    seedLoadedStylesheet()

    for (let i = 0; i < 5; i++) {
      addMountElement(`c${i}`, { url: '/x.json' })
    }

    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await tick()

    expect(document.querySelectorAll('script[data-scalar-astro-cdn="true"]')).toHaveLength(1)
  })
})

describe('getStyleHref', () => {
  it.each([
    [
      'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
      'https://cdn.jsdelivr.net/npm/@scalar/api-reference/dist/style.css',
    ],
    [
      'https://cdn.jsdelivr.net/npm/@scalar/api-reference/dist/browser/standalone.js',
      'https://cdn.jsdelivr.net/npm/@scalar/api-reference/dist/style.css',
    ],
    ['https://example.com/foo/bar.js', 'https://example.com/foo/style.css'],
    ['https://example.com/pkg/dist', 'https://example.com/pkg/dist/style.css'],
    ['https://example.com/pkg/', 'https://example.com/pkg/dist/style.css'],
    [
      'https://cdn.jsdelivr.net/npm/@scalar/api-reference/dist/browser/standalone.js?v=1',
      'https://cdn.jsdelivr.net/npm/@scalar/api-reference/dist/style.css',
    ],
    ['https://example.com/foo/bar.js?v=2', 'https://example.com/foo/style.css'],
  ])('resolves %s to %s', (cdn, expected) => {
    expect(getStyleHref(cdn)).toBe(expected)
  })

  it('falls back to the default CDN when given null', () => {
    expect(getStyleHref(null)).toBe(DEFAULT_STYLE_HREF)
  })
})
