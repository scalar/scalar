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

  const pressOn = (element: HTMLElement, delegate: HTMLElement, key: string): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
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
})
