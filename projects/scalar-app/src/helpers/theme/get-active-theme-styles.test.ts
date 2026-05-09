import type { Theme } from '@scalar/themes'
import { describe, expect, it } from 'vitest'

import { getActiveThemeStyles } from './get-active-theme-styles'

describe('getActiveThemeStyles', () => {
  const customTheme: Theme = {
    slug: 'my-custom-theme',
    theme: ':root { --custom-color: red; }',
    name: 'Custom Theme',
    description: 'Custom Theme',
    uid: 'custom-theme-uid',
  }

  it('resolves a built-in workspace theme', () => {
    const result = getActiveThemeStyles('purple', 'default', [])
    expect(result.themeSlug).toBe('purple')
    expect(result.themeStyles.length).toBeGreaterThan(0)
  })

  it('resolves a custom workspace theme', () => {
    const result = getActiveThemeStyles('my-custom-theme', 'default', [customTheme])
    expect(result.themeSlug).toBe('my-custom-theme')
    expect(result.themeStyles).toContain('--custom-color: red')
  })

  it('falls back to fallbackThemeSlug when workspace theme is "none"', () => {
    const result = getActiveThemeStyles('none', 'purple', [])
    expect(result.themeSlug).toBe('purple')
  })

  it('falls back to fallbackThemeSlug when workspace theme is undefined', () => {
    const result = getActiveThemeStyles(undefined, 'purple', [])
    expect(result.themeSlug).toBe('purple')
  })

  it('falls back to fallbackThemeSlug when workspace theme is not found', () => {
    const result = getActiveThemeStyles('non-existent', 'purple', [])
    expect(result.themeSlug).toBe('purple')
  })

  it('returns default theme when both workspace and fallback slugs are not found', () => {
    const result = getActiveThemeStyles('non-existent', 'also-non-existent', [])
    expect(result.themeSlug).toBe('default')
  })

  it('returns default theme when workspace is undefined and fallback is not found', () => {
    const result = getActiveThemeStyles(undefined, 'not-a-real-theme', [])
    expect(result.themeSlug).toBe('default')
  })

  it('returns default theme when workspace is "none" and fallback is not found', () => {
    const result = getActiveThemeStyles('none', 'not-a-real-theme', [])
    expect(result.themeSlug).toBe('default')
  })

  it('resolves a custom fallback theme when workspace theme is "none"', () => {
    const result = getActiveThemeStyles('none', 'my-custom-theme', [customTheme])
    expect(result.themeSlug).toBe('my-custom-theme')
    expect(result.themeStyles).toContain('--custom-color: red')
  })

  it('resolves a custom fallback theme when workspace theme is not found', () => {
    const result = getActiveThemeStyles('unknown-slug', 'my-custom-theme', [customTheme])
    expect(result.themeSlug).toBe('my-custom-theme')
    expect(result.themeStyles).toContain('--custom-color: red')
  })
})
