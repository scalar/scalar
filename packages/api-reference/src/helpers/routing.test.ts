import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { createRouting, getDocumentSlugFromUrl } from './routing'

const createLocationMock = (overrides: Partial<Location> = {}): Partial<Location> => ({
  href: 'https://example.com/',
  protocol: 'https:',
  host: 'example.com',
  pathname: '/',
  search: '',
  hash: '',
  ...overrides,
})

const stubWindow = (overrides: Partial<Location> = {}, history: Partial<History> = {}) => {
  vi.stubGlobal('window', {
    location: createLocationMock(overrides) as Location,
    history: { pushState: vi.fn(), replaceState: vi.fn(), ...history } as unknown as History,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
}

describe('createRouting', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getId', () => {
    it('reads the id from the current location with hash routing', () => {
      stubWindow({ href: 'https://example.com/#tag/users', hash: '#tag/users' })
      const routing = createRouting({
        basePath: undefined,
        isMultiDocument: true,
        documentSlug: 'default',
        modelsSectionSlug: 'models',
      })

      expect(routing.getId()).toBe('tag/users')
    })

    it('prefixes the document slug in single-document mode', () => {
      stubWindow({ href: 'https://example.com/#tag/users', hash: '#tag/users' })
      const routing = createRouting({
        basePath: undefined,
        isMultiDocument: false,
        documentSlug: 'default',
        modelsSectionSlug: 'models',
      })

      expect(routing.getId()).toBe('default/tag/users')
    })

    it('reads the id from an explicit URL', () => {
      stubWindow()
      const routing = createRouting({
        basePath: '/docs',
        isMultiDocument: true,
        documentSlug: 'default',
        modelsSectionSlug: 'models',
      })

      expect(routing.getId('https://example.com/docs/default/tag/users')).toBe('default/tag/users')
    })
  })

  describe('getUrl', () => {
    it('builds a hash URL for an id', () => {
      stubWindow()
      const routing = createRouting({
        basePath: undefined,
        isMultiDocument: true,
        documentSlug: 'default',
        modelsSectionSlug: 'models',
      })

      expect(routing.getUrl('default/tag/users')?.hash).toBe('#default/tag/users')
    })

    it('returns undefined during SSR', () => {
      vi.stubGlobal('window', undefined)
      const routing = createRouting({
        basePath: undefined,
        isMultiDocument: true,
        documentSlug: 'default',
        modelsSectionSlug: 'models',
      })

      expect(routing.getUrl('default/tag/users')).toBeUndefined()
    })
  })

  describe('push and replace', () => {
    it('pushes a new history entry for an id', () => {
      const pushState = vi.fn()
      stubWindow({}, { pushState })
      const routing = createRouting({
        basePath: undefined,
        isMultiDocument: true,
        documentSlug: 'default',
        modelsSectionSlug: 'models',
      })

      const url = routing.push('default/tag/users')

      expect(url?.hash).toBe('#default/tag/users')
      expect(pushState).toHaveBeenCalledWith({}, '', url)
    })

    it('replaces the current history entry for an id', () => {
      const replaceState = vi.fn()
      stubWindow({}, { replaceState })
      const routing = createRouting({
        basePath: undefined,
        isMultiDocument: true,
        documentSlug: 'default',
        modelsSectionSlug: 'models',
      })

      const url = routing.replace('default/tag/users')

      expect(replaceState).toHaveBeenCalledWith({}, '', url?.toString())
    })
  })

  describe('redirectLegacy', () => {
    it('canonicalizes a legacy model URL', () => {
      stubWindow()
      const routing = createRouting({
        basePath: undefined,
        isMultiDocument: true,
        documentSlug: 'default',
        modelsSectionSlug: 'models',
      })

      expect(routing.redirectLegacy('https://example.com/#default/model/User')?.hash).toBe('#default/models/User')
    })

    it('returns null when there is nothing to rewrite', () => {
      stubWindow()
      const routing = createRouting({
        basePath: undefined,
        isMultiDocument: true,
        documentSlug: 'default',
        modelsSectionSlug: 'models',
      })

      expect(routing.redirectLegacy('https://example.com/#default/tag/users')).toBeNull()
    })
  })

  describe('onNavigate', () => {
    it('forwards the current id on popstate and unsubscribes', () => {
      const addEventListener = vi.fn()
      const removeEventListener = vi.fn()
      vi.stubGlobal('window', {
        location: createLocationMock({ href: 'https://example.com/#tag/users', hash: '#tag/users' }) as Location,
        addEventListener,
        removeEventListener,
      })
      const routing = createRouting({
        basePath: undefined,
        isMultiDocument: true,
        documentSlug: 'default',
        modelsSectionSlug: 'models',
      })
      const handler = vi.fn()

      const stop = routing.onNavigate(handler)
      expect(addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function))

      // Invoke the registered listener as a popstate event would.
      const listener = addEventListener.mock.calls[0]?.[1] as () => void
      listener()
      expect(handler).toHaveBeenCalledWith('tag/users')

      stop()
      expect(removeEventListener).toHaveBeenCalledWith('popstate', listener)
    })

    it('is a no-op during SSR', () => {
      vi.stubGlobal('window', undefined)
      const routing = createRouting({
        basePath: undefined,
        isMultiDocument: true,
        documentSlug: 'default',
        modelsSectionSlug: 'models',
      })

      expect(() => routing.onNavigate(vi.fn())()).not.toThrow()
    })
  })

  it('reads reactive options on each call', () => {
    stubWindow({ href: 'https://example.com/#tag/users', hash: '#tag/users' })
    const isMultiDocument = ref(true)
    const routing = createRouting({
      basePath: undefined,
      isMultiDocument,
      documentSlug: 'default',
      modelsSectionSlug: 'models',
    })

    expect(routing.getId()).toBe('tag/users')

    isMultiDocument.value = false
    expect(routing.getId()).toBe('default/tag/users')
  })
})

describe('getDocumentSlugFromUrl', () => {
  it('reads the slug from a matching base path in multi-document mode', () => {
    const slug = getDocumentSlugFromUrl('https://example.com/docs/petstore/tag/users', ['/docs'], {
      isMultiDocument: true,
      activeSlug: 'default',
    })

    expect(slug).toBe('petstore')
  })

  it('reads the slug from the hash when no base path is configured', () => {
    const slug = getDocumentSlugFromUrl('https://example.com/#petstore/tag/users', [undefined], {
      isMultiDocument: true,
      activeSlug: 'default',
    })

    expect(slug).toBe('petstore')
  })

  it('falls back to the active slug in single-document mode', () => {
    const slug = getDocumentSlugFromUrl('https://example.com/#tag/users', [undefined], {
      isMultiDocument: false,
      activeSlug: 'default',
    })

    expect(slug).toBe('default')
  })

  it('returns an empty string when the URL has no id', () => {
    const slug = getDocumentSlugFromUrl('https://example.com/', [undefined], {
      isMultiDocument: true,
      activeSlug: 'default',
    })

    expect(slug).toBe('')
  })
})
