import type { Theme } from '@scalar/themes'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'

import { getActiveThemeStyles } from '@/helpers/theme/get-active-theme-styles'

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
vi.mock('@/hooks/use-user', () => ({
  useUser: () => ({ currentUser: mockCurrentUser }),
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

    it('returns fetched themes when the query resolves', () => {
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
  // themeStyles — verifies the hook delegates to getActiveThemeStyles and
  // wraps the result in a <style> tag. Pure resolution logic (fallback
  // chains, custom vs built-in, etc.) is covered by
  // get-active-theme-styles.test.ts.
  // -------------------------------------------------------------------------
  describe('themeStyles', () => {
    it('delegates to getActiveThemeStyles with the correct arguments', () => {
      mockCurrentUser.value = { theme: 'purple' }
      mockQueryData.value = [customTheme]

      const { themeStyles } = useThemes({ store: mockStore('my-custom-theme') })

      const expected = getActiveThemeStyles('my-custom-theme', 'purple', [customTheme])
      expect(themeStyles.value).toEqual(expected)
    })

    it('passes undefined as workspace slug when store is null', () => {
      const { themeStyles } = useThemes({ store: null })

      const expected = getActiveThemeStyles(undefined, 'default', [])
      expect(themeStyles.value).toEqual(expected)
    })

    it('passes an empty custom themes array while the query is loading', () => {
      const { themeStyles } = useThemes({ store: mockStore('default') })

      const expected = getActiveThemeStyles('default', 'default', [])
      expect(themeStyles.value).toEqual(expected)
    })
  })

  // -------------------------------------------------------------------------
  // themeStyleTag — verifies the <style> tag wrapper format
  // -------------------------------------------------------------------------
  describe('themeStyleTag', () => {
    it('wraps resolved styles in a <style> tag with the correct id and data-testid', () => {
      const { themeStyleTag } = useThemes({ store: mockStore('purple') })

      expect(themeStyleTag.value).toContain('<style id="scalar-theme" data-testid="purple">')
      expect(themeStyleTag.value).toContain('</style>')
    })

    it('includes the resolved CSS content', () => {
      mockQueryData.value = [customTheme]

      const { themeStyleTag } = useThemes({ store: mockStore('my-custom-theme') })

      expect(themeStyleTag.value).toContain('--custom-color: red')
    })
  })

  // -------------------------------------------------------------------------
  // Reactivity — the core value-add of the hook over raw helpers
  // -------------------------------------------------------------------------
  describe('reactivity', () => {
    it('updates when the store ref changes', async () => {
      const storeRef = ref<WorkspaceStore>(mockStore('default'))

      const { themeStyleTag } = useThemes({ store: storeRef })
      expect(themeStyleTag.value).toContain('data-testid="default"')

      storeRef.value = mockStore('purple')
      await nextTick()

      expect(themeStyleTag.value).toContain('data-testid="purple"')
    })

    it('updates when custom themes arrive from the query', async () => {
      const { themeStyleTag } = useThemes({ store: mockStore('my-custom-theme') })

      // Custom theme not loaded yet — falls through to default
      expect(themeStyleTag.value).toContain('data-testid="default"')

      mockQueryData.value = [customTheme]
      await nextTick()

      expect(themeStyleTag.value).toContain('data-testid="my-custom-theme"')
      expect(themeStyleTag.value).toContain('--custom-color: red')
    })

    it('updates when the fallback theme slug changes', async () => {
      const { themeStyleTag } = useThemes({ store: mockStore('none') })
      expect(themeStyleTag.value).toContain('data-testid="default"')

      mockCurrentUser.value = { theme: 'purple' }
      await nextTick()

      expect(themeStyleTag.value).toContain('data-testid="purple"')
    })
  })
})
