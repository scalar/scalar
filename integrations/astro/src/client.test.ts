import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getStyleHref, initScalarAstro } from './client'

const STATE_KEY = '__scalarAstroState'
const DEFAULT_STYLE_HREF = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference/dist/style.css'

type RegistryEntry = { configuration: unknown; cdn: string | null }
type RegistryWindow = { __scalarAstro?: { configs?: Record<string, RegistryEntry> } }

const registerConfig = (id: string, entry: RegistryEntry) => {
  const win = window as unknown as RegistryWindow
  win.__scalarAstro ??= { configs: {} }
  win.__scalarAstro.configs ??= {}
  win.__scalarAstro.configs[id] = entry
}

const addMountElement = (id: string, configuration: object | null, cdn: string | null = null): HTMLElement => {
  const el = document.createElement('div')
  el.id = id
  el.setAttribute('data-scalar-mount', '')

  if (configuration !== null) {
    registerConfig(id, { configuration, cdn })
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

const seedLoadedCdnScript = (src: string = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference') => {
  const script = document.createElement('script')
  script.src = src
  script.dataset.scalarAstroCdn = 'true'
  script.dataset.loaded = 'true'
  document.head.appendChild(script)
}

const stubScalarGlobal = () => {
  const destroy = vi.fn()
  const createApiReference = vi.fn(() => ({ destroy }))
  ;(window as unknown as { Scalar: { createApiReference: typeof createApiReference } }).Scalar = {
    createApiReference,
  }
  // Seed a matching loaded CDN script so `ensureCdnLoaded` short-circuits via
  // the `dataset.loaded === 'true'` branch in `loadCdn`. Required because the
  // loader no longer skips just because `window.Scalar` is set — that early
  // return ignored the requested `cdn` URL and was the bug behind issue 6.
  seedLoadedCdnScript()
  return { createApiReference, destroy }
}

const resetEnvironment = () => {
  document.body.replaceChildren()
  document.head.replaceChildren()
  delete (window as unknown as Record<string, unknown>)[STATE_KEY]
  delete (window as unknown as Record<string, unknown>).Scalar
  delete (window as unknown as Record<string, unknown>).__scalarAstro
}

const tick = async () => {
  // Flush enough microtasks to cover the `await ensureStylesLoaded` and
  // `await ensureCdnLoaded` chains plus any chained `.catch(...)` handlers.
  for (let i = 0; i < 10; i++) {
    await Promise.resolve()
  }
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

  it('keeps the config registry across navigations so revisited pages still mount', async () => {
    // Astro's ClientRouter dedupes identical inline scripts during a session,
    // so a previously-visited page's registration script may not re-run on
    // revisit. The registry must persist across `astro:before-swap` for the
    // mount to find its config.
    addMountElement('a', { url: '/a.json' })

    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await tick()

    document.dispatchEvent(new Event('astro:before-swap'))

    const registry = (window as unknown as RegistryWindow).__scalarAstro?.configs ?? {}
    expect(registry.a).toEqual({ configuration: { url: '/a.json' }, cdn: null })

    document.dispatchEvent(new Event('astro:page-load'))
    await tick()

    expect(scalar.createApiReference).toHaveBeenCalledTimes(2)
  })

  it('is idempotent — calling initScalarAstro twice does not double-mount', async () => {
    addMountElement('a', { url: '/a.json' })

    initScalarAstro()
    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await tick()

    expect(scalar.createApiReference).toHaveBeenCalledTimes(1)
  })

  it('skips containers with no entry in the config registry', async () => {
    const el = document.createElement('div')
    el.id = 'a'
    el.setAttribute('data-scalar-mount', '')
    document.body.appendChild(el)

    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await tick()

    expect(scalar.createApiReference).not.toHaveBeenCalled()
  })

  it('preserves function-valued config props through the registry', async () => {
    const onLoaded = () => 'on-loaded'
    const customFetch = (request: Request) => fetch(request)
    addMountElement('a', { url: '/a.json', onLoaded, fetch: customFetch })

    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await tick()

    expect(scalar.createApiReference).toHaveBeenCalledTimes(1)
    const [, configurationPassed] = scalar.createApiReference.mock.calls[0] as [string, Record<string, unknown>]
    expect(configurationPassed.onLoaded).toBe(onLoaded)
    expect(configurationPassed.fetch).toBe(customFetch)
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
      // Make sure no script tag was created for the unsafe scheme. The
      // beforeEach seeds an unrelated default-cdn script, so check by URL
      // scheme rather than by total count.
      const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[data-scalar-astro-cdn="true"]'))
      expect(scripts.some((script) => script.src === cdn || script.getAttribute('src') === cdn)).toBe(false)
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

  it('does not leak instance state across navigations', async () => {
    initScalarAstro()

    for (let i = 0; i < 100; i++) {
      const id = `mount-${i}`
      addMountElement(id, { url: `/${i}.json` })
      document.dispatchEvent(new Event('astro:page-load'))
      await tick()
      document.dispatchEvent(new Event('astro:before-swap'))
      // Simulate the next page's swap clearing out the old container.
      document.getElementById(id)?.remove()
    }

    const state = (window as unknown as Record<string, { instances: Record<string, unknown> }>)[STATE_KEY]

    expect(Object.keys(state.instances)).toHaveLength(0)
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

  it('attaches to a still-loading same-href stylesheet instead of removing it', async () => {
    // Pre-place a Scalar-marked stylesheet that has not finished loading yet.
    // The bug was that the loader would remove this element mid-load.
    const existingLink = document.createElement('link')
    existingLink.rel = 'stylesheet'
    existingLink.href = DEFAULT_STYLE_HREF
    existingLink.dataset.scalarAstroStyle = 'true'
    document.head.appendChild(existingLink)

    ;(window as unknown as { Scalar: unknown }).Scalar = {
      createApiReference: vi.fn(() => ({ destroy: vi.fn() })),
    }

    addMountElement('a', { url: '/a.json' })
    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await Promise.resolve()

    // The pre-placed link must survive untouched.
    const links = document.querySelectorAll('link[data-scalar-astro-style="true"]')
    expect(links).toHaveLength(1)
    expect(links[0]).toBe(existingLink)

    // Once the original link's load fires, the mount can proceed.
    existingLink.dispatchEvent(new Event('load'))
    await tick()
    expect(existingLink.dataset.loaded).toBe('true')
  })

  it('replaces a Scalar stylesheet whose href no longer matches', async () => {
    const stale = document.createElement('link')
    stale.rel = 'stylesheet'
    stale.href = 'https://old.example.com/dist/style.css'
    stale.dataset.scalarAstroStyle = 'true'
    stale.dataset.loaded = 'true'
    document.head.appendChild(stale)

    addMountElement('a', { url: '/a.json' }, 'https://new.example.com/dist/api-reference.js')

    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await Promise.resolve()

    const links = document.querySelectorAll('link[data-scalar-astro-style="true"]')
    expect(links).toHaveLength(1)
    expect(links[0]).not.toBe(stale)
    expect(links[0].getAttribute('href')).toBe('https://new.example.com/dist/style.css')
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

  it('loads a distinct CDN script when a later mount requests a different cdn', async () => {
    // A previously-loaded Scalar bundle must not short-circuit a later mount
    // whose `cdn` points at a different URL. The earlier code cached a single
    // `cdnPromise` and returned early once any `window.Scalar` was set, so the
    // second `cdn` was ignored — the wrong Scalar runtime would render against
    // styles or version pins meant for the requested bundle.
    const existingScript = document.createElement('script')
    existingScript.dataset.scalarAstroCdn = 'true'
    existingScript.dataset.loaded = 'true'
    existingScript.src = 'https://cdn-a.example.com/api-reference.js'
    document.head.appendChild(existingScript)
    ;(window as unknown as { Scalar: unknown }).Scalar = {
      createApiReference: vi.fn(() => ({ destroy: vi.fn() })),
    }

    seedLoadedStylesheet('https://cdn-b.example.com/style.css')
    addMountElement('b', { url: '/b.json' }, 'https://cdn-b.example.com/api-reference.js')

    initScalarAstro()
    document.dispatchEvent(new Event('astro:page-load'))
    await tick()

    const sources = Array.from(
      document.querySelectorAll<HTMLScriptElement>('script[data-scalar-astro-cdn="true"]'),
    ).map((s) => s.src)

    expect(sources).toContain('https://cdn-a.example.com/api-reference.js')
    expect(sources).toContain('https://cdn-b.example.com/api-reference.js')
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
