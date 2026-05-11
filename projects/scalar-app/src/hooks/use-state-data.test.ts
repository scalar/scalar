import type { Team } from '@scalar/sdk/models/components'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type Ref, nextTick, ref, watch } from 'vue'

// ---------------------------------------------------------------------------
// Mocks
//
// `useStateData` watches the auth token via `useAuth().getAccessToken` and
// fans the value out into theme/user/team SDK calls. To exercise the watcher
// directly we replace the auth hook with a controllable ref-backed getter
// and stub the SDK + toasts so each test is fully deterministic.
// ---------------------------------------------------------------------------

const accessToken: Ref<string | null> = ref(null)

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    getAccessToken: () => accessToken.value,
  }),
}))

const mockToast = vi.fn()
vi.mock('@scalar/use-toasts', () => ({
  useToasts: () => ({ toast: mockToast }),
}))

const listThemes = vi.fn()
const getTheme = vi.fn()
const getCurrentUser = vi.fn()
const listTeams = vi.fn()

vi.mock('@/helpers/scalar-client', () => ({
  DEFAULT_REFETCH_INTERVAL: 60_000,
  scalarClient: {
    themes: {
      listThemes: () => listThemes(),
      getTheme: (args: { slug: string }) => getTheme(args),
    },
    authentication: {
      getCurrentUser: () => getCurrentUser(),
    },
    teams: {
      listTeams: () => listTeams(),
    },
  },
}))

import { queryClient } from '@/helpers/query-client'

import { useStateData } from './use-state-data'

const team: Team = {
  uid: 'team-uid',
  name: 'Acme',
  slug: 'acme',
  theme: 'default',
}

describe('useStateData', () => {
  beforeEach(() => {
    accessToken.value = null
    queryClient.clear()
    mockToast.mockClear()
    listThemes.mockReset().mockResolvedValue({ themes: [] })
    getTheme.mockReset().mockResolvedValue({ res: '' })
    getCurrentUser.mockReset().mockResolvedValue({ user: { theme: 'default', activeTeamId: team.uid } })
    listTeams.mockReset().mockResolvedValue({ teams: [team] })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('does not re-flash isCurrentTeamLoading on background token refreshes', async () => {
    // Reproduces the splash-screen regression: `checkRefresh` updates
    // `accessToken` on tab focus / visibilitychange, which fires the
    // watcher again. Before the fix the second fire flipped
    // `isCurrentTeamLoading` back to `true`, putting the splash screen
    // over an already-mounted workspace and short-circuiting route
    // handling for an active session.
    //
    // We assert by recording every value the ref takes after the initial
    // fetch settles - the regression flashes `true` even briefly, and
    // the watcher captures that flash regardless of fetch timing.
    const { isCurrentTeamLoading } = useStateData()

    accessToken.value = 'access-token-initial'
    await flushPromises()
    expect(isCurrentTeamLoading.value).toBe(false)

    const observedAfterInitialLoad: boolean[] = []
    const stop = watch(isCurrentTeamLoading, (value) => {
      observedAfterInitialLoad.push(value)
    })

    accessToken.value = 'access-token-refreshed'
    await flushPromises()

    accessToken.value = 'access-token-refreshed-again'
    await flushPromises()

    stop()

    // The gate must never have been raised once the workspace was
    // mounted - any `true` here is the splash flashing back up.
    expect(observedAfterInitialLoad).not.toContain(true)
    expect(isCurrentTeamLoading.value).toBe(false)
  })

  it('raises isCurrentTeamLoading on the initial authenticated load', async () => {
    // The other half of the contract: the gate must come up exactly when
    // we transition from "no token" to "token". This test ensures the
    // fix did not over-correct and silently stop gating real first
    // loads, which would let a reload onto a team workspace race the
    // user/teams fetch.
    const { isCurrentTeamLoading } = useStateData()

    expect(isCurrentTeamLoading.value).toBe(false)

    accessToken.value = 'access-token-initial'
    await nextTick()
    expect(isCurrentTeamLoading.value).toBe(true)

    await flushPromises()
    expect(isCurrentTeamLoading.value).toBe(false)
  })

  it('raises isCurrentTeamLoading again after logout and a fresh login', async () => {
    // Logging out drops the token; logging in transitions from
    // null -> truthy. That is a real "fresh authentication" event and
    // the splash gate should come back up while we re-fetch user/teams.
    const { isCurrentTeamLoading } = useStateData()

    accessToken.value = 'access-token-initial'
    await flushPromises()
    expect(isCurrentTeamLoading.value).toBe(false)

    // Real `useAuth().logout` clears the shared `queryClient` cache so
    // the next login does not satisfy the user/teams fetch from a stale
    // entry; mirror that here so the next login actually has to wait.
    accessToken.value = null
    queryClient.clear()
    await flushPromises()
    expect(isCurrentTeamLoading.value).toBe(false)

    accessToken.value = 'access-token-after-login'
    await nextTick()
    expect(isCurrentTeamLoading.value).toBe(true)

    await flushPromises()
    expect(isCurrentTeamLoading.value).toBe(false)
  })
})
