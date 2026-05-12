import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'

import { useRegistryDocuments } from './use-registry-documents'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockIsLoggedIn = ref(false)
const mockTokenData = ref<{ teamUid?: string } | null>(null)
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    isLoggedIn: mockIsLoggedIn,
    tokenData: mockTokenData,
  }),
}))

/**
 * Mock vue-query so `useQuery` returns a controllable reactive data ref
 * without actually hitting the network. The `queryFn` is never executed;
 * tests drive `mockQueryData` directly.
 *
 * We also capture the options passed to `useQuery` so tests can inspect the
 * query key — this validates that the `teamUid` segment is wired correctly.
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
    mockTokenData.value = null
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
  // query key — teamUid segment
  // -------------------------------------------------------------------------
  describe('query key', () => {
    it('includes the teamUid from tokenData in the query key', () => {
      mockTokenData.value = { teamUid: 'team-abc-123' }

      useRegistryDocuments()

      expect(capturedQueryOptions?.queryKey).toEqual(['documents', 'team-abc-123'])
    })

    it('uses undefined as the teamUid segment when tokenData is null', () => {
      mockTokenData.value = null

      useRegistryDocuments()

      expect(capturedQueryOptions?.queryKey).toEqual(['documents', undefined])
    })

    it('uses undefined as the teamUid segment when tokenData has no teamUid', () => {
      mockTokenData.value = {}

      useRegistryDocuments()

      expect(capturedQueryOptions?.queryKey).toEqual(['documents', undefined])
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
