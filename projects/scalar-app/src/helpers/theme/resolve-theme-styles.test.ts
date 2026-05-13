import type { Theme } from '@scalar/themes'
import { describe, expect, it } from 'vitest'

import { resolveThemeStyles } from './resolve-theme-styles'

describe('resolveThemeStyles', () => {
  it('resolves a built-in theme preset', () => {
    const result = resolveThemeStyles('default', [])
    expect(result).toBeDefined()
    expect(result!.length).toBeGreaterThan(0)
  })

  it('resolves a custom theme by slug', () => {
    const customTheme: Theme = {
      slug: 'my-custom-theme',
      theme: ':root { --custom-color: red; }',
      name: 'Custom Theme',
      description: 'Custom Theme',
      uid: 'custom-theme-uid',
    }

    const result = resolveThemeStyles('my-custom-theme', [customTheme])
    expect(result).toBeDefined()
    expect(result).toContain('--custom-color: red')
  })

  it('returns undefined for an unknown theme slug', () => {
    const result = resolveThemeStyles('non-existent-theme', [])
    expect(result).toBeUndefined()
  })

  it('prefers built-in presets over custom themes with the same slug', () => {
    const customTheme: Theme = {
      slug: 'default',
      theme: ':root { --overridden: true; }',
      name: 'Override',
      description: 'Override',
      uid: 'override-uid',
    }

    const result = resolveThemeStyles('default', [customTheme])
    expect(result).toBeDefined()
    expect(result).not.toContain('--overridden: true')
  })
})
