import { describe, expect, it } from 'vitest'

import { getRefName, getSchemaRefName } from './get-ref-name'

describe('get-ref-name', () => {
  describe('getRefName', () => {
    it('returns the last segment of a schema ref', () => {
      expect(getRefName('#/components/schemas/Planet')).toBe('Planet')
    })

    it('returns the last segment of any ref', () => {
      expect(getRefName('#/components/parameters/Planet')).toBe('Planet')
    })

    it('returns the fragment of an external ref', () => {
      expect(getRefName('./planets.yaml#/Planet')).toBe('Planet')
    })

    it('returns null for an empty ref', () => {
      expect(getRefName('')).toBe(null)
    })
  })

  describe('getSchemaRefName', () => {
    it('returns the schema name for a components.schemas ref', () => {
      expect(getSchemaRefName('#/components/schemas/Planet')).toBe('Planet')
    })

    it('decodes url-encoded schema names', () => {
      expect(getSchemaRefName('#/components/schemas/Planet%20Model')).toBe('Planet Model')
    })

    it('returns null for a parameters ref', () => {
      expect(getSchemaRefName('#/components/parameters/Planet')).toBe(null)
    })

    it('returns null for a responses ref', () => {
      expect(getSchemaRefName('#/components/responses/Planet')).toBe(null)
    })

    it('returns null for an external file ref', () => {
      expect(getSchemaRefName('./planets.yaml#/Planet')).toBe(null)
    })

    it('returns null for a nested schemas ref with extra segments', () => {
      expect(getSchemaRefName('#/components/schemas/Planet/properties/name')).toBe(null)
    })

    it('returns null for an empty ref', () => {
      expect(getSchemaRefName('')).toBe(null)
    })
  })
})
