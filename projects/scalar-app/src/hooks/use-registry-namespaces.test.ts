import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, isRef, nextTick, ref } from 'vue'

import { useRegistryNamespaces } from './use-registry-namespaces'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockIsLoggedIn = ref(false)
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    isLoggedIn: mockIsLoggedIn,
  }),
}))

const mockCurrentTeamSlug = computed(() => mockTeamSlugValue.value)
const mockTeamSlugValue = ref('local')
vi.mock('./use-teams', () => ({
  useTeams: () => ({
    currentTeamSlug: mockCurrentTeamSlug,
  }),
}))

/**
 * Mock vue-query so `useQuery` returns a controllable reactive data ref
 * without actually hitting the network. The `queryFn` is never executed;
 * tests drive `mockQueryData` directly.
 *
 * We also capture the options passed to `useQuery` so tests can inspect the
 * query key — this validates that the `currentTeamSlug` segment is wired correctly.
 */
const mockQueryData = ref<string[] | undefined>(undefined)
let capturedQueryOptions: Record<string, unknown> | undefined
vi.mock('@tanstack/vue-query', () => ({
  useQuery: (options: Record<string, unknown>) => {
    capturedQueryOptions = options
    return {
      data: mockQueryData,
      isLoading: computed(() => mockQueryData.value === undefined),
    }
  },
}))

vi.mock('@/helpers/query-client', () => ({
  queryClient: {},
}))

vi.mock('@/helpers/scalar-client', () => ({
  DEFAULT_REFETCH_INTERVAL: 60_000,
  scalarClient: {
    namespaces: {
      listNamespaces: vi.fn(),
    },
  },
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useRegistryNamespaces', () => {
  beforeEach(() => {
    mockQueryData.value = undefined
    mockIsLoggedIn.value = false
    mockTeamSlugValue.value = 'local'
    capturedQueryOptions = undefined
  })

  // -------------------------------------------------------------------------
  // namespaces
  // -------------------------------------------------------------------------
  describe('namespaces', () => {
    it('defaults to an empty array while loading', () => {
      const { namespaces } = useRegistryNamespaces()
      expect(namespaces.value).toEqual([])
    })

    it('returns the namespace strings when query resolves', () => {
      mockQueryData.value = ['my-namespace', 'other-namespace']

      const { namespaces } = useRegistryNamespaces()
      expect(namespaces.value).toEqual(['my-namespace', 'other-namespace'])
    })

    it('returns empty array when query data is null', () => {
      mockQueryData.value = null as unknown as undefined

      const { namespaces } = useRegistryNamespaces()
      expect(namespaces.value).toEqual([])
    })

    it('returns empty array when query data is undefined', () => {
      mockQueryData.value = undefined

      const { namespaces } = useRegistryNamespaces()
      expect(namespaces.value).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // query key — currentTeamSlug segment
  // -------------------------------------------------------------------------
  describe('query key', () => {
    it('includes currentTeamSlug as a reactive ref in the query key', () => {
      mockTeamSlugValue.value = 'acme'

      useRegistryNamespaces()

      const queryKey = capturedQueryOptions?.queryKey as unknown[]
      expect(queryKey[0]).toBe('namespaces')
      expect(isRef(queryKey[1])).toBe(true)
      expect((queryKey[1] as { value: string }).value).toBe('acme')
    })

    it('defaults the team slug to "local" when no team is active', () => {
      mockTeamSlugValue.value = 'local'

      useRegistryNamespaces()

      const queryKey = capturedQueryOptions?.queryKey as unknown[]
      expect((queryKey[1] as { value: string }).value).toBe('local')
    })
  })

  // -------------------------------------------------------------------------
  // Reactivity
  // -------------------------------------------------------------------------
  describe('reactivity', () => {
    it('updates namespaces when data changes', async () => {
      const { namespaces } = useRegistryNamespaces()
      expect(namespaces.value).toEqual([])

      mockQueryData.value = ['first-ns']
      await nextTick()
      expect(namespaces.value).toEqual(['first-ns'])

      mockQueryData.value = ['first-ns', 'second-ns']
      await nextTick()
      expect(namespaces.value).toEqual(['first-ns', 'second-ns'])

      mockQueryData.value = undefined
      await nextTick()
      expect(namespaces.value).toEqual([])
    })
  })
})
