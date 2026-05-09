import type { Theme } from '@scalar/themes'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'

import { useThemes } from './use-themes'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockToast = vi.fn()
vi.mock('@scalar/use-toasts', () => ({
  useToasts: () => ({ toast: mockToast }),
}))

const mockIsLoggedIn = ref(false)
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ isLoggedIn: mockIsLoggedIn }),
}))

const mockCurrentUser = ref<{ theme?: string } | undefined>(undefined)
vi.mock('@/hooks/use-users', () => ({
  useUsers: () => ({ currentUser: mockCurrentUser }),
}))

const mockCurrentTeam = ref<{ theme?: string } | undefined>(undefined)
vi.mock('@/hooks/use-teams', () => ({
  useTeams: () => ({ currentTeam: mockCurrentTeam }),
}))

/**
 * Mock vue-query so `useQuery` returns a controllable reactive data ref
 * without actually hitting the network. The `queryFn` is never executed;
 * tests drive `mockQueryData` directly.
 */
const mockQueryData = ref<Theme[] | undefined>(undefined)
const mockQueryError = ref<Error | null>(null)
vi.mock('@tanstack/vue-query', () => ({
  useQuery: () => ({
    data: mockQueryData,
    error: mockQueryError,
    isLoading: computed(() => mockQueryData.value === undefined),
    isError: computed(() => mockQueryError.value !== null),
  }),
}))

vi.mock('@/helpers/query-client', () => ({
  queryClient: { fetchQuery: vi.fn() },
}))

vi.mock('@/helpers/theme-styles', async () => {
  const actual = await vi.importActual<typeof import('@/helpers/theme-styles')>('../helpers/theme-styles')
  return actual
})

vi.mock('@/helpers/scalar-client', () => ({
  DEFAULT_REFETCH_INTERVAL: 60_000,
  scalarClient: {
    themes: {
      listThemes: vi.fn(),
      getTheme: vi.fn(),
    },
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a minimal mock WorkspaceStore with the given x-scalar-theme value */
const mockStore = (themeSlug?: string): WorkspaceStore =>
  ({
    workspace: {
      'x-scalar-theme': themeSlug,
    },
  }) as WorkspaceStore

/** A reusable custom theme fixture */
const customTheme: Theme = {
  slug: 'my-custom-theme',
  theme: ':root { --custom-color: red; }',
  name: 'Custom Theme',
  description: 'A custom theme for testing',
  uid: 'custom-theme-uid',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useThemes', () => {
  beforeEach(() => {
    mockToast.mockClear()
    mockQueryData.value = undefined
    mockQueryError.value = null
    mockCurrentUser.value = undefined
    mockCurrentTeam.value = undefined
    mockIsLoggedIn.value = false
  })

  // -------------------------------------------------------------------------
  // customThemes
  // -------------------------------------------------------------------------
  describe('customThemes', () => {
    it('defaults to an empty array while loading', () => {
      const { customThemes } = useThemes({ store: null })
      expect(customThemes.value).toEqual([])
    })

    it('returns fetched themes when the query resolves', async () => {
      const themes: Theme[] = [customTheme]
      mockQueryData.value = themes

      const { customThemes } = useThemes({ store: null })
      expect(customThemes.value).toEqual(themes)
    })
  })

  // -------------------------------------------------------------------------
  // fallbackThemeSlug
  // -------------------------------------------------------------------------
  describe('fallbackThemeSlug', () => {
    it('defaults to "default" when no user or team preference is set', () => {
      const { fallbackThemeSlug } = useThemes({ store: null })
      expect(fallbackThemeSlug.value).toBe('default')
    })

    it('uses the user theme preference when available', () => {
      mockCurrentUser.value = { theme: 'purple' }

      const { fallbackThemeSlug } = useThemes({ store: null })
      expect(fallbackThemeSlug.value).toBe('purple')
    })

    it('falls back to the team theme when no user preference is set', () => {
      mockCurrentUser.value = { theme: '' }
      mockCurrentTeam.value = { theme: 'solarized' }

      const { fallbackThemeSlug } = useThemes({ store: null })
      expect(fallbackThemeSlug.value).toBe('solarized')
    })

    it('prefers user theme over team theme', () => {
      mockCurrentUser.value = { theme: 'purple' }
      mockCurrentTeam.value = { theme: 'solarized' }

      const { fallbackThemeSlug } = useThemes({ store: null })
      expect(fallbackThemeSlug.value).toBe('purple')
    })
  })

  // -------------------------------------------------------------------------
  // CSS resolution — themeStyles & themeStyleTag
  // (ported from the old use-theme.test.ts and expanded)
  // -------------------------------------------------------------------------
  describe('themeStyles', () => {
    it('returns the default theme when store is null', () => {
      const { themeStyleTag } = useThemes({ store: null })

      expect(themeStyleTag.value).toContain('<style id="scalar-theme" data-testid="default">')
      expect(themeStyleTag.value).toContain('</style>')
    })

    it('uses the workspace theme when available', () => {
      const { themeStyleTag } = useThemes({ store: mockStore('purple') })

      expect(themeStyleTag.value).toContain('<style id="scalar-theme" data-testid="purple">')
    })

    it('uses the default theme when workspace theme is "none" and fallback does not exist', () => {
      // fallbackThemeSlug will be 'dark' (via user pref) but 'dark' is not
      // a built-in preset slug, so resolution falls through to 'default'.
      mockCurrentUser.value = { theme: 'dark' }

      const { themeStyleTag } = useThemes({ store: mockStore('none') })

      expect(themeStyleTag.value).toContain('<style id="scalar-theme" data-testid="default">')
    })

    it('resolves a custom theme when the workspace references it', () => {
      mockQueryData.value = [customTheme]

      const { themeStyleTag } = useThemes({ store: mockStore('my-custom-theme') })

      expect(themeStyleTag.value).toContain('<style id="scalar-theme" data-testid="my-custom-theme">')
      expect(themeStyleTag.value).toContain('--custom-color: red')
      expect(themeStyleTag.value).toContain('</style>')
    })

    it('reactively updates when the store changes', async () => {
      const storeRef = ref<WorkspaceStore>(mockStore('default'))

      const { themeStyleTag } = useThemes({ store: storeRef })

      const initialValue = themeStyleTag.value

      storeRef.value = mockStore('purple')
      await nextTick()

      expect(themeStyleTag.value).not.toBe(initialValue)
      expect(themeStyleTag.value).toContain('data-testid="purple"')
    })

    it('falls back to the default theme when the theme slug is not found', () => {
      const { themeStyleTag } = useThemes({ store: mockStore('non-existent-theme') })

      expect(themeStyleTag.value).toContain('<style id="scalar-theme" data-testid="default">')
      expect(themeStyleTag.value).toContain('</style>')
    })

    it('falls back to the fallback theme slug when workspace theme is not found', () => {
      // 'purple' is a real preset, so the fallback resolves successfully
      mockCurrentUser.value = { theme: 'purple' }

      const { themeStyleTag } = useThemes({ store: mockStore('non-existent-theme') })

      expect(themeStyleTag.value).toContain('data-testid="purple"')
    })

    it('uses the fallback theme when workspace theme is "none"', () => {
      mockCurrentUser.value = { theme: 'purple' }

      const { themeStyleTag } = useThemes({ store: mockStore('none') })

      expect(themeStyleTag.value).toContain('data-testid="purple"')
    })

    it('uses the fallback theme when workspace has no theme set', () => {
      mockCurrentUser.value = { theme: 'purple' }

      const { themeStyleTag } = useThemes({ store: mockStore(undefined) })

      expect(themeStyleTag.value).toContain('data-testid="purple"')
    })

    it('reactively updates when custom themes arrive', async () => {
      // Start with no custom themes — the unknown slug falls through to default
      const { themeStyleTag } = useThemes({ store: mockStore('my-custom-theme') })
      expect(themeStyleTag.value).toContain('data-testid="default"')

      // Simulate the query resolving with custom themes
      mockQueryData.value = [customTheme]
      await nextTick()

      expect(themeStyleTag.value).toContain('data-testid="my-custom-theme"')
      expect(themeStyleTag.value).toContain('--custom-color: red')
    })

    it('reactively updates when fallback theme slug changes', async () => {
      const { themeStyleTag } = useThemes({ store: mockStore('none') })

      // Default fallback
      expect(themeStyleTag.value).toContain('data-testid="default"')

      // Change user preference to a valid preset
      mockCurrentUser.value = { theme: 'purple' }
      await nextTick()

      expect(themeStyleTag.value).toContain('data-testid="purple"')
    })
  })
})
