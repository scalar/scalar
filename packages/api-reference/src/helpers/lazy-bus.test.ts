import { describe, expect, it, vi } from 'vitest'

import { getStickyHeaderOffset, scrollToElement, scrollToLazy } from './lazy-bus'

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
})

// ---------------------------------------------------------------------------
// getStickyHeaderOffset
// ---------------------------------------------------------------------------

describe('getStickyHeaderOffset', () => {
  const makeEl = (position: string, top: number, height: number): HTMLElement => {
    const el = document.createElement('div')
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ position } as CSSStyleDeclaration)
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top,
      height,
      bottom: top + height,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    return el
  }

  it('returns 0 when there are no sticky or fixed elements', () => {
    document.body.innerHTML = '<div id="plain">content</div>'
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ position: 'static' } as CSSStyleDeclaration)
    expect(getStickyHeaderOffset()).toBe(0)
  })

  it('returns the height of a single sticky header pinned at the top', () => {
    const header = document.createElement('header')
    document.body.appendChild(header)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) =>
      el === header ? ({ position: 'sticky' } as CSSStyleDeclaration) : ({ position: 'static' } as CSSStyleDeclaration),
    )
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 60,
      bottom: 60,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    expect(getStickyHeaderOffset()).toBe(60)
    document.body.removeChild(header)
  })

  it('returns the height of a fixed header pinned at the top', () => {
    const nav = document.createElement('nav')
    document.body.appendChild(nav)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) =>
      el === nav ? ({ position: 'fixed' } as CSSStyleDeclaration) : ({ position: 'static' } as CSSStyleDeclaration),
    )
    vi.spyOn(nav, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 48,
      bottom: 48,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    expect(getStickyHeaderOffset()).toBe(48)
    document.body.removeChild(nav)
  })

  it('returns the tallest header when multiple sticky elements are at the top', () => {
    const nav = document.createElement('nav')
    const tabs = document.createElement('div')
    document.body.appendChild(nav)
    document.body.appendChild(tabs)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      if (el === nav || el === tabs) return { position: 'sticky' } as CSSStyleDeclaration
      return { position: 'static' } as CSSStyleDeclaration
    })
    vi.spyOn(nav, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 48,
      bottom: 48,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    vi.spyOn(tabs, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 40,
      bottom: 40,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    expect(getStickyHeaderOffset()).toBe(48)
    document.body.removeChild(nav)
    document.body.removeChild(tabs)
  })

  it('ignores sticky elements not at the top of the viewport (top >= 4)', () => {
    const footer = document.createElement('footer')
    document.body.appendChild(footer)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) =>
      el === footer ? ({ position: 'sticky' } as CSSStyleDeclaration) : ({ position: 'static' } as CSSStyleDeclaration),
    )
    vi.spyOn(footer, 'getBoundingClientRect').mockReturnValue({
      top: 500,
      height: 60,
      bottom: 560,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    expect(getStickyHeaderOffset()).toBe(0)
    document.body.removeChild(footer)
  })
})

// ---------------------------------------------------------------------------
// scrollToElement
// ---------------------------------------------------------------------------

describe('scrollToElement', () => {
  it('calls scrollIntoView when there is no sticky header offset', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ position: 'static' } as CSSStyleDeclaration)
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: 200,
      height: 50,
      bottom: 250,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    const scrollIntoViewSpy = vi.fn()
    el.scrollIntoView = scrollIntoViewSpy
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })

    scrollToElement(el)

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({ block: 'start' })
    document.body.removeChild(el)
  })

  it('uses window.scrollTo with offset when a sticky header is present', () => {
    const header = document.createElement('header')
    const target = document.createElement('div')
    document.body.appendChild(header)
    document.body.appendChild(target)

    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) =>
      el === header ? ({ position: 'sticky' } as CSSStyleDeclaration) : ({ position: 'static' } as CSSStyleDeclaration),
    )
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 60,
      bottom: 60,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      top: 300,
      height: 50,
      bottom: 350,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true })
    const scrollToSpy = vi.fn()
    window.scrollTo = scrollToSpy

    scrollToElement(target)

    // top = 300 (getBoundingClientRect.top) + 100 (scrollY) - 60 (header height) = 340
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 340, behavior: 'instant' })
    document.body.removeChild(header)
    document.body.removeChild(target)
  })

  it('does not call scrollIntoView when a sticky header is present', () => {
    const header = document.createElement('header')
    const target = document.createElement('div')
    document.body.appendChild(header)
    document.body.appendChild(target)

    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) =>
      el === header ? ({ position: 'sticky' } as CSSStyleDeclaration) : ({ position: 'static' } as CSSStyleDeclaration),
    )
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 60,
      bottom: 60,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      top: 300,
      height: 50,
      bottom: 350,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    window.scrollTo = vi.fn()
    const scrollIntoViewSpy = vi.fn()
    target.scrollIntoView = scrollIntoViewSpy

    scrollToElement(target)

    expect(scrollIntoViewSpy).not.toHaveBeenCalled()
    document.body.removeChild(header)
    document.body.removeChild(target)
  })
})
