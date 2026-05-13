import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, isRef, nextTick, ref } from 'vue'

import { useRegistryDocuments } from './use-registry-documents'

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
const mockQueryData = ref<Array<{ uid: string; name: string }> | undefined>(undefined)
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
    registry: {
      listAllApiDocuments: vi.fn(),
    },
  },
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const docAlpha = { uid: 'doc-alpha-uid', name: 'Alpha API' }
const docBeta = { uid: 'doc-beta-uid', name: 'Beta API' }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useRegistryDocuments', () => {
  beforeEach(() => {
    mockQueryData.value = undefined
    mockIsLoggedIn.value = false
    mockTeamSlugValue.value = 'local'
    capturedQueryOptions = undefined
  })

  // -------------------------------------------------------------------------
  // documents
  // -------------------------------------------------------------------------
  describe('documents', () => {
    it('defaults to an empty array while loading', () => {
      const { documents } = useRegistryDocuments()
      expect(documents.value).toEqual([])
    })

    it('returns the API documents array when query resolves', () => {
      mockQueryData.value = [docAlpha, docBeta]

      const { documents } = useRegistryDocuments()
      expect(documents.value).toEqual([docAlpha, docBeta])
    })

    it('returns empty array when query data is null', () => {
      mockQueryData.value = null as unknown as undefined

      const { documents } = useRegistryDocuments()
      expect(documents.value).toEqual([])
    })

    it('returns empty array when query data is undefined', () => {
      mockQueryData.value = undefined

      const { documents } = useRegistryDocuments()
      expect(documents.value).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // query key — currentTeamSlug segment
  // -------------------------------------------------------------------------
  describe('query key', () => {
    it('includes currentTeamSlug as a reactive ref in the query key', () => {
      mockTeamSlugValue.value = 'acme'

      useRegistryDocuments()

      const queryKey = capturedQueryOptions?.queryKey as unknown[]
      expect(queryKey[0]).toBe('documents')
      expect(isRef(queryKey[1])).toBe(true)
      expect((queryKey[1] as { value: string }).value).toBe('acme')
    })

    it('defaults the team slug to "local" when no team is active', () => {
      mockTeamSlugValue.value = 'local'

      useRegistryDocuments()

      const queryKey = capturedQueryOptions?.queryKey as unknown[]
      expect((queryKey[1] as { value: string }).value).toBe('local')
    })
  })

  // -------------------------------------------------------------------------
  // Reactivity
  // -------------------------------------------------------------------------
  describe('reactivity', () => {
    it('updates documents when data changes', async () => {
      const { documents } = useRegistryDocuments()
      expect(documents.value).toEqual([])

      mockQueryData.value = [docAlpha]
      await nextTick()
      expect(documents.value).toEqual([docAlpha])

      mockQueryData.value = [docAlpha, docBeta]
      await nextTick()
      expect(documents.value).toEqual([docAlpha, docBeta])

      mockQueryData.value = undefined
      await nextTick()
      expect(documents.value).toEqual([])
    })
  })
})
