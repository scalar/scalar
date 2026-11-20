import { afterEach, describe, expect, it } from 'vitest'

import { isShadowRoot } from './is-shadow-root'

describe('is-shadow-root', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('returns true for a shadow root', () => {
    const host = document.createElement('div')
    const shadowRoot = host.attachShadow({ mode: 'open' })

    expect(isShadowRoot(shadowRoot)).toBe(true)
  })

  it('returns true for a closed shadow root', () => {
    const host = document.createElement('div')
    const shadowRoot = host.attachShadow({ mode: 'closed' })

    expect(isShadowRoot(shadowRoot)).toBe(true)
  })

  it('returns false for the document', () => {
    expect(isShadowRoot(document)).toBe(false)
  })

  it('returns false for a plain document fragment', () => {
    expect(isShadowRoot(document.createDocumentFragment())).toBe(false)
  })

  it('returns false for an element', () => {
    expect(isShadowRoot(document.createElement('div'))).toBe(false)
  })

  it('returns false for null and undefined', () => {
    expect(isShadowRoot(null)).toBe(false)
    expect(isShadowRoot(undefined)).toBe(false)
  })

  it('returns true for a shadow root from another realm', () => {
    const iframe = document.createElement('iframe')
    document.body.append(iframe)

    const otherDocument = iframe.contentDocument
    if (!otherDocument) {
      throw new Error('Expected the iframe to have a document')
    }
    const shadowRoot = otherDocument.createElement('div').attachShadow({ mode: 'open' })

    // `instanceof ShadowRoot` is false here, because the iframe has its own ShadowRoot global
    expect(shadowRoot instanceof ShadowRoot).toBe(false)
    expect(isShadowRoot(shadowRoot)).toBe(true)
  })
})
