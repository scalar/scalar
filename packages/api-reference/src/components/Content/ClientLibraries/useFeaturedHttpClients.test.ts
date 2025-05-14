import { useHttpClientStore } from '@/stores/useHttpClientStore'
import type { Plugin as Client, Target } from '@scalar/snippetz'
import { describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { useFeaturedHttpClients } from './useFeaturedHttpClients'

// Mock the store
vi.mock('@/stores/useHttpClientStore', () => ({
  useHttpClientStore: vi.fn(),
}))

describe('useFeaturedHttpClients', () => {
  const defaultStoreMock = {
    httpClient: { targetKey: 'shell' as const, clientKey: '' },
    resetState: vi.fn(),
    setHttpClient: vi.fn(),
    setDefaultHttpClient: vi.fn(),
    availableTargets: computed(() => []),
    httpClientTitle: computed(() => ''),
    targetTitle: computed(() => ''),
    clientTitle: computed(() => ''),
    availableClients: computed(() => []),
    defaultClient: computed(() => ''),
    excludedClients: ref([]),
    setExcludedClients: vi.fn(),
    getClientTitle: vi.fn(),
    getTargetTitle: vi.fn(),
    httpTargetTitle: computed(() => ''),
  }

  it('returns empty array when no targets match', () => {
    vi.mocked(useHttpClientStore).mockReturnValue(defaultStoreMock)

    const { featuredClients } = useFeaturedHttpClients()
    expect(featuredClients).toEqual([])
  })

  it('filters featured clients based on available targets', () => {
    const mockClient: Client = {
      client: 'curl',
      title: 'cURL',
      target: 'shell',
      generate: vi.fn(),
    }

    const mockTargets: Target[] = [
      {
        key: 'shell',
        title: 'Shell',
        default: 'curl',
        clients: [mockClient],
      },
      {
        key: 'python',
        title: 'Python',
        default: 'python3',
        clients: [{ client: 'python3', title: 'Python 3', target: 'python', generate: vi.fn() }],
      },
    ]

    vi.mocked(useHttpClientStore).mockReturnValue({
      ...defaultStoreMock,
      availableTargets: computed(() => mockTargets),
    })

    const { featuredClients } = useFeaturedHttpClients()
    expect(featuredClients).toEqual([
      { targetKey: 'shell', clientKey: 'curl' },
      { targetKey: 'python', clientKey: 'python3' },
    ])
  })

  it('checks if a client is featured', () => {
    const mockClient: Client = {
      client: 'curl',
      title: 'cURL',
      target: 'shell',
      generate: vi.fn(),
    }

    const mockTargets: Target[] = [
      {
        key: 'shell',
        title: 'Shell',
        default: 'curl',
        clients: [mockClient],
      },
    ]

    vi.mocked(useHttpClientStore).mockReturnValue({
      ...defaultStoreMock,
      availableTargets: computed(() => mockTargets),
    })

    const { isFeatured } = useFeaturedHttpClients()

    // Test featured client
    expect(isFeatured({ targetKey: 'shell', clientKey: 'curl' })).toBe(true)

    // Test non-featured client
    expect(isFeatured({ targetKey: 'node', clientKey: 'fetch' })).toBe(false)
  })

  it('excludes clients that are not in the target clients list', () => {
    const mockClient: Client = {
      client: 'wget',
      title: 'Wget',
      target: 'shell',
      generate: vi.fn(),
    }

    const mockTargets: Target[] = [
      {
        key: 'shell',
        title: 'Shell',
        default: 'curl',
        clients: [mockClient],
      },
    ]

    vi.mocked(useHttpClientStore).mockReturnValue({
      ...defaultStoreMock,
      availableTargets: computed(() => mockTargets),
    })

    const { featuredClients } = useFeaturedHttpClients()
    expect(featuredClients).toEqual([])
  })
})
