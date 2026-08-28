import { beforeEach, describe, expect, it } from 'vitest'

import { applyColorMode } from './color-mode'

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
})
