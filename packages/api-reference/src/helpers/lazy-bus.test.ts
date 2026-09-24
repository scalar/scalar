import { afterEach, describe, expect, it, vi } from 'vitest'

import { getStickyHeaderOffset, scrollToLazy } from './lazy-bus'

// ---------------------------------------------------------------------------
// scrollToLazy — existing tests
// ---------------------------------------------------------------------------

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

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.replaceChildren()
  })

  it.each([
    { name: 'no headers', headers: [], expected: 0 },
    { name: 'a fixed header', headers: [[0, 60, 0, 800]], expected: 60 },
    {
      name: 'stacked bars in reverse DOM order',
      headers: [
        [48, 40, 0, 800],
        [0, 48, 0, 800],
      ],
      expected: 88,
    },
    { name: 'a sidebar beside the target', headers: [[0, 600, 0, 180]], expected: 0 },
    { name: 'an offscreen header', headers: [[-100, 60, 0, 800]], expected: 0 },
    { name: 'a floating bar below the top', headers: [[100, 60, 0, 800]], expected: 0 },
  ])('measures $name', ({ headers, expected }) => {
    const target = document.createElement('h2')
    document.body.append(target)
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(new DOMRect(200, 0, 400, 30))
    for (const [top, height, left, width] of headers) {
      const header = document.createElement('nav')
      header.style.position = 'fixed'
      document.body.append(header)
      vi.spyOn(header, 'getBoundingClientRect').mockReturnValue(new DOMRect(left, top, width, height))
    }
    expect(getStickyHeaderOffset(target)).toBe(expected)
  })
  it.each([false, true])('ignores theme decorations while measuring a real header (nested: %s)', (nested) => {
    const target = document.createElement('h2')
    const flare = document.createElement('div')
    flare.className = 'section-flare'
    const decoration = nested ? document.createElement('div') : flare
    if (nested) {
      flare.append(decoration)
    }
    decoration.style.position = 'fixed'
    const header = document.createElement('nav')
    header.style.position = 'fixed'
    // A non-interactive header can still obscure content and must retain its offset.
    header.style.pointerEvents = 'none'
    document.body.append(target, flare, header)
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(new DOMRect(200, 0, 400, 30))
    vi.spyOn(decoration, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 800, 600))
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 800, 60))

    expect(getStickyHeaderOffset(target)).toBe(60)
  })

  it('skips computed styles for elements that cannot cover the target', () => {
    const target = document.createElement('h2')
    const sidebar = document.createElement('aside')
    const hidden = document.createElement('div')
    document.body.append(target, sidebar, hidden)
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(new DOMRect(200, 0, 400, 30))
    vi.spyOn(sidebar, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 180, 600))
    const getComputedStyle = vi.spyOn(window, 'getComputedStyle')

    expect(getStickyHeaderOffset(target)).toBe(0)
    expect(getComputedStyle).not.toHaveBeenCalled()
  })
})
