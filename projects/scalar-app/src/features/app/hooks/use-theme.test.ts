import type { Theme } from '@scalar/themes'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { useTheme } from './use-theme'

describe('useTheme', () => {
  it('returns default theme when store is null', () => {
    const { themeStyleTag } = useTheme({
      store: null,
      fallbackThemeSlug: 'dark',
      customThemes: [],
    })

    expect(themeStyleTag.value).toContain('<style id="scalar-theme" data-testid="default">')
    expect(themeStyleTag.value).toContain('</style>')
  })

  it('uses workspace theme when available', () => {
    const mockStore: WorkspaceStore = {
      workspace: {
        'x-scalar-theme': 'purple',
      },
    } as WorkspaceStore

    const { themeStyleTag } = useTheme({
      store: mockStore,
      fallbackThemeSlug: 'dark',
      customThemes: [],
    })

    expect(themeStyleTag.value).toContain('<style id="scalar-theme" data-testid="purple">')
  })

  it('uses default theme when workspace theme is "none" and fallback theme does not exist', () => {
    const mockStore: WorkspaceStore = {
      workspace: {
        'x-scalar-theme': 'none',
      },
    } as WorkspaceStore

    const { themeStyleTag } = useTheme({
      store: mockStore,
      fallbackThemeSlug: 'dark',
      customThemes: [],
    })

    expect(themeStyleTag.value).toContain('<style id="scalar-theme" data-testid="default">')
  })

  it('resolves custom theme when provided', () => {
    const customTheme: Theme = {
      slug: 'my-custom-theme',
      theme: ':root { --custom-color: red; }',
      name: 'Custom Theme',
      description: 'Custom Theme',
      uid: 'custom-theme-uid',
    }

    const mockStore: WorkspaceStore = {
      workspace: {
        'x-scalar-theme': 'my-custom-theme',
      },
    } as WorkspaceStore

    const { themeStyleTag } = useTheme({
      store: mockStore,
      fallbackThemeSlug: 'dark',
      customThemes: [customTheme],
    })

    expect(themeStyleTag.value).toContain('<style id="scalar-theme" data-testid="my-custom-theme">')
    expect(themeStyleTag.value).toContain('--custom-color: red')
    expect(themeStyleTag.value).toContain('</style>')
  })

  it('reactively updates when store changes', () => {
    const mockStore = ref<WorkspaceStore>({
      workspace: {
        'x-scalar-theme': 'dark',
      },
    } as WorkspaceStore)

    const { themeStyleTag } = useTheme({
      store: mockStore,
      fallbackThemeSlug: 'default',
      customThemes: [],
    })

    const initialValue = themeStyleTag.value

    // Change the workspace theme
    mockStore.value = {
      workspace: {
        'x-scalar-theme': 'purple',
      },
    } as WorkspaceStore

    // The theme style tag is reactive and updates
    expect(themeStyleTag.value).not.toBe(initialValue)
  })

  it('falls back to default when theme is not found', () => {
    const mockStore: WorkspaceStore = {
      workspace: {
        'x-scalar-theme': 'non-existent-theme',
      },
    } as WorkspaceStore

    const { themeStyleTag } = useTheme({
      store: mockStore,
      fallbackThemeSlug: 'also-non-existent',
      customThemes: [],
    })

    // Falls back to default theme
    expect(themeStyleTag.value).toContain('<style id="scalar-theme" data-testid="default">')
    expect(themeStyleTag.value).toContain('</style>')
  })
})
