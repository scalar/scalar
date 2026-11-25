import { afterEach, describe, expect, it } from 'vitest'

import { getActiveElement } from './get-active-element'

describe('get-active-element', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('returns the focused element in the document', () => {
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()

    expect(getActiveElement(document)).toBe(input)
  })

  it('returns the focused element inside a shadow root, not the host', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const shadowRoot = host.attachShadow({ mode: 'open' })
    const input = document.createElement('input')
    shadowRoot.append(input)
    input.focus()

    // This is the reason the helper exists
    expect(document.activeElement).toBe(host)
    expect(getActiveElement(shadowRoot)).toBe(input)
  })

  it('returns null for a shadow root that does not contain focus', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const shadowRoot = host.attachShadow({ mode: 'open' })
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()

    expect(getActiveElement(shadowRoot)).toBeNull()
  })

  it('returns null without a root', () => {
    expect(getActiveElement(undefined)).toBeNull()
    expect(getActiveElement(null)).toBeNull()
  })
})
