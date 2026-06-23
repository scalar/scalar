import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'

import { useTeams } from './use-teams'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockIsLoggedIn = ref(false)
const mockTokenData = ref<{ teamUid?: string } | undefined>(undefined)
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
 */
const mockQueryData = ref<Array<{ uid: string; slug: string; name: string }> | undefined>(undefined)
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
  DEFAULT_REFETCH_INTERVAL: 60_000,
  scalarClient: {
    teams: {
      list: vi.fn(),
    },
  },
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const teamAlpha = { uid: 'team-alpha-uid', slug: 'alpha', name: 'Team Alpha' }
const teamBeta = { uid: 'team-beta-uid', slug: 'beta', name: 'Team Beta' }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTeams', () => {
  beforeEach(() => {
    mockQueryData.value = undefined
    mockIsLoggedIn.value = false
    mockTokenData.value = undefined
  })

  // -------------------------------------------------------------------------
  // teams
  // -------------------------------------------------------------------------
  describe('teams', () => {
    it('defaults to undefined while loading', () => {
      const { teams } = useTeams()
      expect(teams.value).toBeUndefined()
    })

    it('returns the teams array when query resolves', () => {
      mockQueryData.value = [teamAlpha, teamBeta]

      const { teams } = useTeams()
      expect(teams.value).toEqual([teamAlpha, teamBeta])
    })
  })

  // -------------------------------------------------------------------------
  // currentTeam
  // -------------------------------------------------------------------------
  describe('currentTeam', () => {
    it('finds the team matching tokenData.teamUid', () => {
      mockQueryData.value = [teamAlpha, teamBeta]
      mockTokenData.value = { teamUid: 'team-beta-uid' }

      const { currentTeam } = useTeams()
      expect(currentTeam.value).toEqual(teamBeta)
    })

    it('is undefined when no team matches', () => {
      mockQueryData.value = [teamAlpha, teamBeta]
      mockTokenData.value = { teamUid: 'non-existent-uid' }

      const { currentTeam } = useTeams()
      expect(currentTeam.value).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // currentTeamSlug
  // -------------------------------------------------------------------------
  describe('currentTeamSlug', () => {
    it('defaults to "local" when no team is found', () => {
      const { currentTeamSlug } = useTeams()
      expect(currentTeamSlug.value).toBe('local')
    })

    it('returns the team slug when a matching team exists', () => {
      mockQueryData.value = [teamAlpha, teamBeta]
      mockTokenData.value = { teamUid: 'team-alpha-uid' }

      const { currentTeamSlug } = useTeams()
      expect(currentTeamSlug.value).toBe('alpha')
    })
  })

  // -------------------------------------------------------------------------
  // Reactivity
  // -------------------------------------------------------------------------
  describe('reactivity', () => {
    it('updates currentTeamSlug when tokenData changes (team switch)', async () => {
      mockQueryData.value = [teamAlpha, teamBeta]
      mockTokenData.value = { teamUid: 'team-alpha-uid' }

      const { currentTeamSlug, currentTeam } = useTeams()
      expect(currentTeamSlug.value).toBe('alpha')
      expect(currentTeam.value).toEqual(teamAlpha)

      // Simulate a team switch
      mockTokenData.value = { teamUid: 'team-beta-uid' }
      await nextTick()

      expect(currentTeamSlug.value).toBe('beta')
      expect(currentTeam.value).toEqual(teamBeta)
    })
  })
})
