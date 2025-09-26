import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import type { Heading } from '@scalar/types/legacy'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, inject, ref } from 'vue'

import { useConfig } from '@/hooks/useConfig'

import { useNavState } from './useNavState'

declare global {
  interface Window {
    location: Location
  }
}

// Mock the useConfig hook
vi.mock('@/hooks/useConfig', () => ({
  useConfig: vi.fn().mockReturnValue({ value: {} }),
}))

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
    })

    navState = useNavState()
  })

  afterEach(() => {
    // Restore original window.location
    window.location = originalLocation
  })

  describe('hash management', () => {
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
  })

  describe('ID generation', () => {
    it('should generate heading ID', () => {
      const heading = {
        depth: 0,
        value: 'Test Heading',
        slug: 'test-heading',
      } satisfies Heading
      expect(navState.getHeadingId(heading)).toBe('description/test-heading')
    })
  })

  describe('custom slug generation', () => {
    beforeEach(() => {
      const mockConfig = computed(() =>
        apiReferenceConfigurationSchema.parse({
          generateHeadingSlug: vi.fn().mockReturnValue('custom-heading'),
          generateModelSlug: vi.fn().mockReturnValue('custom-model'),
          generateTagSlug: vi.fn().mockReturnValue('custom-tag'),
          generateOperationSlug: vi.fn().mockReturnValue('custom-operation'),
          generateWebhookSlug: vi.fn().mockReturnValue('custom-webhook'),
        }),
      )
      vi.mocked(useConfig).mockReturnValue(mockConfig)
      navState = useNavState()
    })

    it('should use custom heading slug generator', () => {
      const heading = {
        depth: 0,
        value: 'Test Heading',
        slug: 'test-heading',
      } satisfies Heading
      expect(navState.getHeadingId(heading)).toBe('custom-heading')
    })
  })

  describe('path routing', () => {
    it('should handle path routing ID extraction', () => {
      const mockConfig = computed(() => {
        return apiReferenceConfigurationSchema.parse({
          pathRouting: {
            basePath: '/docs',
          },
        })
      })
      vi.mocked(useConfig).mockReturnValue(mockConfig)
      navState = useNavState()

      expect(navState.getPathRoutingId('/docs/test-path')).toBe('test-path')
    })

    it('should handle path routing ID extraction with getReferenceId', () => {
      const mockConfig = computed(() => {
        return apiReferenceConfigurationSchema.parse({
          pathRouting: {
            basePath: '/docs',
          },
        })
      })
      vi.mocked(useConfig).mockReturnValue(mockConfig)
      navState = useNavState()
      window.location.pathname = '/docs/test-path'

      expect(navState.getReferenceId()).toBe('test-path')
    })
  })

  describe('getHashedUrl', () => {
    it('should generate URL with hash routing', () => {
      const mockConfig = computed(() => apiReferenceConfigurationSchema.parse({}))
      vi.mocked(useConfig).mockReturnValue(mockConfig)

      vi.mocked(inject).mockReturnValue({
        isIntersectionEnabled: ref(false),
        hash: ref(''),
        hashPrefix: ref('prefix-'),
      })
      navState = useNavState()

      const result = navState.getHashedUrl('test-hash', 'https://example.com', '?param=value')
      expect(result).toBe('https://example.com/?param=value#prefix-test-hash')
    })

    it('should generate URL with path routing', () => {
      const mockConfig = computed(() => {
        return apiReferenceConfigurationSchema.parse({
          pathRouting: {
            basePath: '/docs',
          },
        })
      })
      vi.mocked(useConfig).mockReturnValue(mockConfig)
      navState = useNavState()

      const result = navState.getHashedUrl('test-path', 'https://example.com', '?param=value')
      expect(result).toBe('https://example.com/docs/test-path?param=value')
    })

    it('should preserve search params when using path routing', () => {
      const mockConfig = computed(() => {
        return apiReferenceConfigurationSchema.parse({
          pathRouting: {
            basePath: '/docs',
          },
        })
      })
      vi.mocked(useConfig).mockReturnValue(mockConfig)
      navState = useNavState()

      const result = navState.getHashedUrl('test-path', 'https://example.com', '?param1=value1&param2=value2')
      expect(result).toBe('https://example.com/docs/test-path?param1=value1&param2=value2')
    })
  })
})
