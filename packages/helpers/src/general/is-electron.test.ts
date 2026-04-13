import { describe, expect, it } from 'vitest'

import { isElectron } from './is-electron'

describe('is-electron', () => {
  describe('isElectron', () => {
    it('returns false when electron property is not present in window', () => {
      const result = isElectron()
      expect(result).toBe(false)
    })

    it('returns true when electron property is present in window', () => {
      // Add electron property to window
      ;(window as any).electron = {}

      const result = isElectron()
      expect(result).toBe(true)

      // Clean up
      delete (window as any).electron
    })
  })
})
