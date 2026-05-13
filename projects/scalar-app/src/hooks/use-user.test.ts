import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'

import { useUser } from './use-user'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockIsLoggedIn = ref(false)
const mockAccessToken = ref<string | undefined>(undefined)
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    isLoggedIn: mockIsLoggedIn,
    accessToken: mockAccessToken,
  }),
}))

/**
 * Mock vue-query so `useQuery` returns a controllable reactive data ref
 * without actually hitting the network. The `queryFn` is never executed;
 * tests drive `mockQueryData` directly.
 */
const mockQueryData = ref<{ user?: { name: string; theme: string } | null } | undefined>(undefined)
vi.mock('@tanstack/vue-query', () => ({
  useQuery: () => ({
    data: mockQueryData,
    isLoading: computed(() => mockQueryData.value === undefined),
  }),
}))

vi.mock('@/helpers/query-client', () => ({
  queryClient: {},
}))

vi.mock('@/helpers/scalar-client', () => ({
  scalarClient: {
    authentication: {
      getCurrentUser: vi.fn(),
    },
  },
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryData.value = undefined
    mockIsLoggedIn.value = false
    mockAccessToken.value = undefined
  })

  // -------------------------------------------------------------------------
  // currentUser
  // -------------------------------------------------------------------------
  describe('currentUser', () => {
    it('defaults to undefined while loading', () => {
      const { currentUser } = useUser()
      expect(currentUser.value).toBeUndefined()
    })

    it('returns the user object when query resolves', () => {
      mockQueryData.value = { user: { name: 'Test', theme: 'purple' } }

      const { currentUser } = useUser()
      expect(currentUser.value).toEqual({ name: 'Test', theme: 'purple' })
    })

    it('is undefined when query resolves with null user', () => {
      mockQueryData.value = { user: null }

      const { currentUser } = useUser()
      expect(currentUser.value).toBeUndefined()
    })

    it('is undefined when query resolves with no user field', () => {
      mockQueryData.value = {}

      const { currentUser } = useUser()
      expect(currentUser.value).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // Reactivity
  // -------------------------------------------------------------------------
  describe('reactivity', () => {
    it('updates when mockQueryData changes', async () => {
      const { currentUser } = useUser()

      mockQueryData.value = { user: { name: 'Alice', theme: 'default' } }
      await nextTick()
      expect(currentUser.value).toEqual({ name: 'Alice', theme: 'default' })

      mockQueryData.value = { user: { name: 'Bob', theme: 'solarized' } }
      await nextTick()
      expect(currentUser.value).toEqual({ name: 'Bob', theme: 'solarized' })
    })
  })
})
