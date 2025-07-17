import { describe, expect, it } from 'vitest'
import { isOperationDeprecated, getOperationStability, getOperationStabilityColor } from './operation-stability'

describe('operation-stability', () => {
  describe('isOperationDeprecated', () => {
    it('returns true when operation.deprecated is true', () => {
      const operation = { deprecated: true }
      expect(isOperationDeprecated(operation)).toBe(true)
    })

    it('returns true when x-scalar-stability is deprecated', () => {
      const operation = { 'x-scalar-stability': 'deprecated' }
      expect(isOperationDeprecated(operation)).toBe(true)
    })

    it('returns false when operation has no deprecated properties', () => {
      const operation = {}
      expect(isOperationDeprecated(operation)).toBe(false)
    })

    it('returns false when x-scalar-stability is not deprecated', () => {
      const operation = { 'x-scalar-stability': 'stable' }
      expect(isOperationDeprecated(operation)).toBe(false)
    })
  })

  describe('getOperationStability', () => {
    it('returns deprecated when operation.deprecated is true', () => {
      const operation = { deprecated: true }
      expect(getOperationStability(operation)).toBe('deprecated')
    })

    it('returns stable when x-scalar-stability is stable', () => {
      const operation = { 'x-scalar-stability': 'stable' }
      expect(getOperationStability(operation)).toBe('stable')
    })

    it('returns experimental when x-scalar-stability is experimental', () => {
      const operation = { 'x-scalar-stability': 'experimental' }
      expect(getOperationStability(operation)).toBe('experimental')
    })

    it('returns deprecated when x-scalar-stability is deprecated', () => {
      const operation = { 'x-scalar-stability': 'deprecated' }
      expect(getOperationStability(operation)).toBe('deprecated')
    })

    it('returns undefined when operation has no stability properties', () => {
      const operation = {}
      expect(getOperationStability(operation)).toBeUndefined()
    })

    it('prioritizes deprecated flag over x-scalar-stability', () => {
      const operation = {
        deprecated: true,
        'x-scalar-stability': 'stable',
      }
      expect(getOperationStability(operation)).toBe('deprecated')
    })
  })

  describe('getOperationStabilityColor', () => {
    it('returns text-red for deprecated operations', () => {
      const operation = { deprecated: true }
      expect(getOperationStabilityColor(operation)).toBe('text-red')
    })

    it('returns text-orange for experimental operations', () => {
      const operation = { 'x-scalar-stability': 'experimental' }
      expect(getOperationStabilityColor(operation)).toBe('text-orange')
    })

    it('returns text-green for stable operations', () => {
      const operation = { 'x-scalar-stability': 'stable' }
      expect(getOperationStabilityColor(operation)).toBe('text-green')
    })

    it('returns empty string for operations with no stability', () => {
      const operation = {}
      expect(getOperationStabilityColor(operation)).toBe('')
    })
  })
})
