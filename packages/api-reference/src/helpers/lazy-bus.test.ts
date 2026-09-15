import { describe, expect, it, vi } from 'vitest'

import { scrollToLazy } from './lazy-bus'

describe('lazy-bus', () => {
  /**
   * A navigation tree holding one operation, so `getEntryById` answers for the
   * operation id and nothing else — the shape every anchor below has to reach.
   */
  const operationId = 'tag/pets/POST/pets'

  const navigationTree = () => {
    const entries = new Map<string, { id: string; parent?: { id: string } }>([
      ['tag/pets', { id: 'tag/pets' }],
      [operationId, { id: operationId, parent: { id: 'tag/pets' } }],
    ])

    return (id: string) => entries.get(id)
  }

  const expandedIdsFor = (anchor: string): string[] => {
    const expanded: string[] = []

    scrollToLazy(
      anchor,
      (id, value) => {
        if (value) {
          expanded.push(id)
        }
      },
      navigationTree(),
    )

    return expanded
  }

  describe('scrollToLazy', () => {
    it('expands the operation behind a request-body anchor', () => {
      expect(expandedIdsFor(`${operationId}.body.name`)).toContain(operationId)
    })

    it('expands the operation behind a callback anchor', () => {
      // The id continues past the `.responses.` marker the id parser splits on,
      // so the split alone lands on `…callbacks.onData.<url>.post`, which is not
      // a navigation entry.
      const anchor = `${operationId}.callbacks.onData.{$request.body#/url}.post.responses.200.id`

      expect(expandedIdsFor(anchor)).toContain(operationId)
    })

    it('expands the operation when a callback url expression holds a marker keyword', () => {
      // `.query.` inside the expression makes the parser split mid-expression.
      const anchor = `${operationId}.callbacks.onData.{$request.query.queryUrl}.post.body.id`

      expect(expandedIdsFor(anchor)).toContain(operationId)
    })

    it('expands the section behind a model anchor', () => {
      const getEntryById = (id: string) => (id === 'models/Planet' ? { id } : undefined)
      const expanded: string[] = []

      scrollToLazy('models/Planet.name', (id, value) => value && expanded.push(id), getEntryById)

      expect(expanded).toContain('models/Planet')
    })

    it('leaves an unresolvable anchor without expanding anything', () => {
      vi.useFakeTimers()

      expect(expandedIdsFor('nothing/here.body.name')).not.toContain(operationId)

      vi.useRealTimers()
    })
  })
})
