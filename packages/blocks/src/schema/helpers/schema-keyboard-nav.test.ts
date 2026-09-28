import { describe, expect, it } from 'vitest'

import { handleTreeKeydown } from './schema-keyboard-nav'

describe('schema-keyboard-nav', () => {
  /**
   * Two toggles inside a delegate, plus a second delegate nested in the first,
   * which is the shape a response panel has: a schema tree beside a headers
   * group, each owning rows of its own.
   */
  const buildTree = () => {
    document.body.innerHTML = `
      <div id="outer">
        <div class="property--tree">
          <button id="a" data-schema-toggle aria-expanded="false"></button>
        </div>
        <div id="inner">
          <div class="property--tree">
            <button id="b" data-schema-toggle aria-expanded="false"></button>
          </div>
          <div class="property--tree">
            <button id="c" data-schema-toggle aria-expanded="false"></button>
          </div>
        </div>
      </div>
    `

    const byId = (id: string) => document.getElementById(id) as HTMLElement

    // jsdom reports no layout, so the visibility filter needs a stand-in.
    for (const id of ['a', 'b', 'c']) {
      Object.defineProperty(byId(id), 'offsetParent', { get: () => document.body })
    }

    return byId
  }

  /**
   * One open row with a nested row inside its panel, plus a sibling behind a
   * panel that was closed but kept as `hidden="until-found"`.
   */
  const buildNestedTree = () => {
    document.body.innerHTML = `
      <div id="root">
        <div class="property--tree">
          <button id="parent" data-schema-toggle aria-expanded="true"></button>
          <div class="property-children">
            <div class="property--tree">
              <button id="child" data-schema-toggle aria-expanded="false"></button>
            </div>
          </div>
        </div>
        <div class="property--tree">
          <button id="sibling" data-schema-toggle aria-expanded="false"></button>
          <div class="property-children" hidden="until-found">
            <div class="property--tree">
              <button id="retained" data-schema-toggle aria-expanded="false"></button>
            </div>
          </div>
        </div>
      </div>
    `

    const byId = (id: string) => document.getElementById(id) as HTMLElement

    // A retained panel keeps its descendants' layout boxes, so every toggle
    // here passes the `offsetParent` test — including the unreachable one.
    for (const id of ['parent', 'child', 'sibling', 'retained']) {
      Object.defineProperty(byId(id), 'offsetParent', { get: () => document.body })
    }

    return byId
  }

  const pressOn = (
    element: HTMLElement,
    delegate: HTMLElement,
    key: string,
    modifiers: Partial<KeyboardEventInit> = {},
  ): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifiers })
    delegate.addEventListener('keydown', handleTreeKeydown)
    element.dispatchEvent(event)
    delegate.removeEventListener('keydown', handleTreeKeydown)
    return event
  }

  it('moves focus to the next toggle inside the delegate it was bound to', () => {
    const byId = buildTree()

    pressOn(byId('b'), byId('inner'), 'ArrowDown')

    expect(document.activeElement?.id).toBe('c')
  })

  it('scopes navigation to the bound delegate rather than the whole document', () => {
    const byId = buildTree()

    // `a` sits outside `#inner`, so the last toggle of the inner delegate has
    // nowhere to go and focus stays put.
    pressOn(byId('c'), byId('inner'), 'ArrowDown')

    expect(document.activeElement?.id).not.toBe('a')
  })

  it('ignores a key an inner delegate already handled', () => {
    const byId = buildTree()

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    byId('inner').addEventListener('keydown', handleTreeKeydown)
    byId('outer').addEventListener('keydown', handleTreeKeydown)
    byId('b').dispatchEvent(event)

    // The inner delegate moved focus to `c`; the outer must not move it again.
    expect(document.activeElement?.id).toBe('c')
  })

  it('leaves keys pressed outside a toggle alone', () => {
    const byId = buildTree()
    byId('a').focus()

    const event = pressOn(byId('outer'), byId('outer'), 'ArrowDown')

    expect(event.defaultPrevented).toBe(false)
    expect(document.activeElement?.id).toBe('a')
  })

  it('moves focus to the previous toggle', () => {
    const byId = buildTree()

    pressOn(byId('c'), byId('outer'), 'ArrowUp')

    expect(document.activeElement?.id).toBe('b')
  })

  it('jumps to the first and last toggle of the delegate', () => {
    const byId = buildTree()

    pressOn(byId('c'), byId('outer'), 'Home')
    expect(document.activeElement?.id).toBe('a')

    pressOn(byId('a'), byId('outer'), 'End')
    expect(document.activeElement?.id).toBe('c')
  })

  it('stays put at either end rather than wrapping around', () => {
    const byId = buildTree()
    byId('a').focus()

    pressOn(byId('a'), byId('outer'), 'ArrowUp')

    // Wrapping would look like the list scrolled; the APG tree pattern stops.
    expect(document.activeElement?.id).toBe('a')

    byId('c').focus()
    pressOn(byId('c'), byId('outer'), 'ArrowDown')

    expect(document.activeElement?.id).toBe('c')
  })

  describe('opening and closing', () => {
    it('opens a closed row with ArrowRight', () => {
      const byId = buildNestedTree()
      const clicks: string[] = []
      byId('sibling').addEventListener('click', () => clicks.push('sibling'))

      pressOn(byId('sibling'), byId('root'), 'ArrowRight')

      // The toggle owns the state, so the key routes through its click.
      expect(clicks).toEqual(['sibling'])
    })

    it('steps into an already open row with ArrowRight', () => {
      const byId = buildNestedTree()
      const clicks: string[] = []
      byId('parent').addEventListener('click', () => clicks.push('parent'))

      pressOn(byId('parent'), byId('root'), 'ArrowRight')

      expect(document.activeElement?.id).toBe('child')
      // Pressing right on an open row must not close it again.
      expect(clicks).toEqual([])
    })

    it('closes an open row with ArrowLeft', () => {
      const byId = buildNestedTree()
      const clicks: string[] = []
      byId('parent').addEventListener('click', () => clicks.push('parent'))

      pressOn(byId('parent'), byId('root'), 'ArrowLeft')

      expect(clicks).toEqual(['parent'])
    })

    it('steps out to the owning row with ArrowLeft', () => {
      const byId = buildNestedTree()
      const clicks: string[] = []
      byId('child').addEventListener('click', () => clicks.push('child'))

      pressOn(byId('child'), byId('root'), 'ArrowLeft')

      expect(document.activeElement?.id).toBe('parent')
      expect(clicks).toEqual([])
    })
  })

  it('skips a toggle inside a panel kept for find-in-page', () => {
    const byId = buildNestedTree()

    pressOn(byId('sibling'), byId('root'), 'ArrowDown')

    // `retained` sits in a `hidden="until-found"` panel: it still reports a
    // layout box, but `focus()` on it does nothing, so arrowing there is a
    // dead end the reader cannot escape.
    expect(document.activeElement?.id).not.toBe('retained')
  })

  it('leaves a modified arrow key to the browser', () => {
    const byId = buildTree()

    for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const) {
      byId('a').focus()

      const event = pressOn(byId('a'), byId('outer'), 'ArrowDown', { [modifier]: true })

      // Shift+Arrow extends a selection, Alt/Cmd+Arrow are browser shortcuts.
      expect(event.defaultPrevented, modifier).toBe(false)
      expect(document.activeElement?.id, modifier).toBe('a')
    }
  })

  it('leaves a key it does not bind alone', () => {
    const byId = buildTree()
    byId('a').focus()

    const event = pressOn(byId('a'), byId('outer'), 'Enter')

    // Enter and Space still have to reach the button that owns them.
    expect(event.defaultPrevented).toBe(false)
  })
})
