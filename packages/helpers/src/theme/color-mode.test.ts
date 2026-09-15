import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { applyColorMode, getSystemColorMode } from './color-mode'

/** Stands in for `window.matchMedia`, which jsdom does not implement. */
const mockMatchMedia = (prefersDark: boolean) =>
  vi.fn().mockImplementation((query: string) => ({ matches: prefersDark && query === '(prefers-color-scheme: dark)' }))

describe('color-mode', () => {
  beforeEach(() => {
    document.body.className = ''
  })

  describe('applyColorMode', () => {
    it('adds the dark class and removes the light one', () => {
      document.body.classList.add('light-mode')

      applyColorMode('dark')

      expect(document.body.classList.contains('dark-mode')).toBe(true)
      expect(document.body.classList.contains('light-mode')).toBe(false)
    })

    it('adds the light class and removes the dark one', () => {
      document.body.classList.add('dark-mode')

      applyColorMode('light')

      expect(document.body.classList.contains('light-mode')).toBe(true)
      expect(document.body.classList.contains('dark-mode')).toBe(false)
    })

    it('never leaves both classes on the element', () => {
      document.body.classList.add('light-mode', 'dark-mode')

      applyColorMode('dark')

      expect(document.body.className).toBe('dark-mode')
    })

    it('leaves unrelated classes alone', () => {
      document.body.classList.add('scalar-app')

      applyColorMode('light')

      expect(document.body.classList.contains('scalar-app')).toBe(true)
    })

    it('applies to a given element instead of the body', () => {
      const element = document.createElement('div')

      applyColorMode('dark', element)

      expect(element.classList.contains('dark-mode')).toBe(true)
      expect(document.body.classList.contains('dark-mode')).toBe(false)
    })

    it('is idempotent', () => {
      applyColorMode('dark')
      applyColorMode('dark')

      expect(document.body.className).toBe('dark-mode')
    })
  })

  describe('getSystemColorMode', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('reports dark when the system prefers dark', () => {
      vi.stubGlobal('window', { ...window, matchMedia: mockMatchMedia(true) })

      expect(getSystemColorMode()).toBe('dark')
    })

    it('reports light when the system prefers light', () => {
      vi.stubGlobal('window', { ...window, matchMedia: mockMatchMedia(false) })

      expect(getSystemColorMode()).toBe('light')
    })

    it('reports light without a window, matching what the server renders', () => {
      vi.stubGlobal('window', undefined)

      expect(getSystemColorMode()).toBe('light')
    })
  })
})
