import { describe, expect, it } from 'vitest'

import type { SchemaObject } from '../schemas/v3.1/strict/schema'
import { collectDynamicAnchors, isDynamicRef, pushDynamicScope, resolveDynamicRef } from './dynamic-ref'

/** Cast a plain object to a SchemaObject so tests can use the untyped 2020-12 keywords (`$defs`). */
const schema = (value: Record<string, unknown>) => value as unknown as SchemaObject

describe('dynamic-ref', () => {
  describe('isDynamicRef', () => {
    it('matches a schema carrying $dynamicRef', () => {
      expect(isDynamicRef({ $dynamicRef: '#itemType' })).toBe(true)
    })

    it('rejects schemas without a string $dynamicRef', () => {
      expect(isDynamicRef({ type: 'string' })).toBe(false)
      expect(isDynamicRef({ $dynamicRef: 42 })).toBe(false)
      expect(isDynamicRef(null)).toBe(false)
    })
  })

  describe('collectDynamicAnchors', () => {
    it('collects an anchor declared at the resource root', () => {
      const anchors = collectDynamicAnchors(schema({ $dynamicAnchor: 'category', type: 'object' }))
      expect(anchors.has('category')).toBe(true)
      expect(anchors.get('category')).toMatchObject({ type: 'object' })
    })

    it('collects anchors declared inside $defs', () => {
      const anchors = collectDynamicAnchors(
        schema({
          $defs: { itemType: { $dynamicAnchor: 'itemType', type: 'string' } },
          type: 'object',
        }),
      )
      expect(anchors.get('itemType')).toMatchObject({ type: 'string' })
    })

    it('dereferences an anchor that binds through a sibling $ref', () => {
      const anchors = collectDynamicAnchors(
        schema({
          $defs: {
            itemType: { $dynamicAnchor: 'itemType', '$ref': '#/x', '$ref-value': { type: 'string' } },
          },
        }),
      )
      expect(anchors.get('itemType')).toMatchObject({ type: 'string' })
    })

    it('collects an anchor nested under properties', () => {
      const anchors = collectDynamicAnchors(
        schema({
          $id: 'urn:wrapper',
          type: 'object',
          properties: {
            items: { type: 'array', items: { $dynamicAnchor: 'itemType', type: 'string' } },
          },
        }),
      )
      expect(anchors.get('itemType')).toMatchObject({ type: 'string' })
    })

    it('collects an anchor nested inside an allOf branch', () => {
      const anchors = collectDynamicAnchors(
        schema({
          $id: 'urn:node',
          allOf: [{ type: 'object' }, { $dynamicAnchor: 'node', properties: { value: { type: 'string' } } }],
        }),
      )
      expect(anchors.has('node')).toBe(true)
    })

    it('does not cross a nested $id resource boundary', () => {
      const anchors = collectDynamicAnchors(
        schema({
          $id: 'urn:outer',
          properties: {
            // A nested resource (`$id`) owns its anchors; they are collected when it is entered, not here.
            embedded: { $id: 'urn:inner', $dynamicAnchor: 'inner', type: 'object' },
          },
        }),
      )
      expect(anchors.has('inner')).toBe(false)
    })

    it('does not loop on a self-referential schema', () => {
      const root = schema({ $id: 'urn:cycle', type: 'object' })
      ;(root as Record<string, unknown>).properties = { self: root }
      expect(() => collectDynamicAnchors(root)).not.toThrow()
    })

    it('returns an empty map when there are no dynamic anchors', () => {
      expect(collectDynamicAnchors(schema({ type: 'object' })).size).toBe(0)
    })
  })

  describe('pushDynamicScope', () => {
    it('appends schemas that can hold a dynamic anchor', () => {
      const anchored = schema({ $dynamicAnchor: 'category' })
      const withId = schema({ $id: 'urn:a' })
      const withDefs = schema({ $defs: {} })

      expect(pushDynamicScope([], anchored)).toEqual([anchored])
      expect(pushDynamicScope([], withId)).toEqual([withId])
      expect(pushDynamicScope([], withDefs)).toEqual([withDefs])
    })

    it('leaves the scope unchanged for plain subschemas', () => {
      const scope = [schema({ $id: 'urn:a' })]
      expect(pushDynamicScope(scope, schema({ type: 'string' }))).toBe(scope)
    })

    it('does not mutate the input scope', () => {
      const scope = [schema({ $id: 'urn:a' })]
      pushDynamicScope(scope, schema({ $id: 'urn:b' }))
      expect(scope).toHaveLength(1)
    })
  })

  describe('resolveDynamicRef', () => {
    const outer = schema({ $id: 'urn:outer', $defs: { itemType: { $dynamicAnchor: 'itemType', type: 'string' } } })
    const inner = schema({ $id: 'urn:inner', $defs: { itemType: { $dynamicAnchor: 'itemType', not: {} } } })

    it('binds to the outermost matching anchor in the scope', () => {
      // Scope is outermost-first, so the outer resource wins over the inner fallback.
      expect(resolveDynamicRef('#itemType', [outer, inner])).toMatchObject({ type: 'string' })
    })

    it('falls back to an inner anchor when no outer one matches', () => {
      expect(resolveDynamicRef('#itemType', [schema({ $id: 'urn:empty' }), inner])).toMatchObject({ not: {} })
    })

    it('returns undefined when no anchor matches', () => {
      expect(resolveDynamicRef('#missing', [outer])).toBeUndefined()
    })

    it('ignores non-fragment and JSON-pointer references', () => {
      expect(resolveDynamicRef('urn:outer', [outer])).toBeUndefined()
      expect(resolveDynamicRef('#/$defs/itemType', [outer])).toBeUndefined()
    })
  })
})
