import type { Heading } from '@scalar/types/legacy'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { inject, ref } from 'vue'

import { useNavState } from './useNavState'

declare global {
  interface Window {
    location: Location
  }
}

// Mock vue's inject
vi.mock('vue', () => {
  const actual = require('vue')
  return {
    ...actual,
    inject: vi.fn(),
  }
})

// Save original window.location
const originalLocation = window.location

describe('useNavState', () => {
  let navState: ReturnType<typeof useNavState>

  beforeEach(() => {
    // Mock window.location
    delete (window as any).location
    window.location = {
      ...originalLocation,
      pathname: '/',
      hash: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    }

    // Reset the mock state for each test
    vi.mocked(inject).mockReturnValue({
      isIntersectionEnabled: ref(false),
      hash: ref(''),
      hashPrefix: ref(''),
      basePath: undefined,
      generateHeadingSlug: undefined,
    })

    navState = useNavState()
  })

  afterEach(() => {
    // Restore original window.location
    window.location = originalLocation
  })

  it('should handle custom hash prefix', () => {
    vi.mocked(inject).mockReturnValue({
      isIntersectionEnabled: ref(false),
      hash: ref('test-hash'),
      hashPrefix: ref('custom-prefix-'),
    })

    const navState = useNavState()
    expect(navState.getFullHash('test')).toBe('custom-prefix-test')
  })

  it('should update hash correctly', () => {
    window.location.hash = '#test-hash'
    navState.updateHash()
    expect(navState.hash.value).toBe('test-hash')
  })

  it('should set hash prefix', () => {
    navState.setHashPrefix('prefix-')
    expect(navState.getFullHash('test')).toBe('prefix-test')
  })

  it('should get reference hash without prefix', () => {
    navState.setHashPrefix('prefix-')
    window.location.hash = '#prefix-test-hash'
    expect(navState.getReferenceId()).toBe('test-hash')
  })

  it('should generate heading ID', () => {
    const heading = {
      depth: 0,
      value: 'Test Heading',
      slug: 'test-heading',
    } satisfies Heading
    expect(navState.getHeadingId(heading)).toBe('description/test-heading')
  })

  it('should use custom heading slug generator', () => {
    const heading = {
      depth: 0,
      value: 'Test Heading',
      slug: 'test-heading',
    } satisfies Heading

    vi.mocked(inject).mockReturnValue({
      isIntersectionEnabled: ref(false),
      hash: ref(''),
      hashPrefix: ref(''),
      basePath: undefined,
      generateHeadingSlug: ref(() => 'custom-heading'),
    })
    navState = useNavState()
    expect(navState.getHeadingId(heading)).toBe('custom-heading')
  })

  it('should handle path routing ID extraction', () => {
    vi.mocked(inject).mockReturnValue({
      isIntersectionEnabled: ref(false),
      hash: ref(''),
      hashPrefix: ref(''),
      basePath: '/docs',
      generateHeadingSlug: undefined,
    })
    navState = useNavState()

    expect(navState.getPathRoutingId('/docs/test-path')).toBe('test-path')
  })

  it('should handle path routing ID extraction with getReferenceId', () => {
    vi.mocked(inject).mockReturnValue({
      isIntersectionEnabled: ref(false),
      hash: ref(''),
      hashPrefix: ref(''),
      basePath: '/docs',
      generateHeadingSlug: undefined,
    })
    navState = useNavState()
    window.location.pathname = '/docs/test-path'

    expect(navState.getReferenceId()).toBe('test-path')
  })

  it('should generate URL with hash routing', () => {
    vi.mocked(inject).mockReturnValue({
      isIntersectionEnabled: ref(false),
      hash: ref(''),
      hashPrefix: ref('prefix-'),
      basePath: undefined,
      generateHeadingSlug: undefined,
    })
    navState = useNavState()

    const result = navState.getHashedUrl('test-hash', 'https://example.com', '?param=value')
    expect(result).toBe('https://example.com/?param=value#prefix-test-hash')
  })

  it('should generate URL with path routing', () => {
    vi.mocked(inject).mockReturnValue({
      isIntersectionEnabled: ref(false),
      hash: ref(''),
      hashPrefix: ref(''),
      basePath: '/docs',
      generateHeadingSlug: undefined,
    })
    navState = useNavState()

    const result = navState.getHashedUrl('test-path', 'https://example.com', '?param=value')
    expect(result).toBe('https://example.com/docs/test-path?param=value')
  })

  it('should preserve search params when using path routing', () => {
    vi.mocked(inject).mockReturnValue({
      isIntersectionEnabled: ref(false),
      hash: ref(''),
      hashPrefix: ref(''),
      basePath: '/docs',
      generateHeadingSlug: undefined,
    })
    navState = useNavState()

    const result = navState.getHashedUrl('test-path', 'https://example.com', '?param1=value1&param2=value2')
    expect(result).toBe('https://example.com/docs/test-path?param1=value1&param2=value2')
  })
})
