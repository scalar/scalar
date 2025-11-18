import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getRootDocument } from './get-root-document'

describe('getRootNode', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('regular DOM nodes', () => {
    it('returns document for elements in regular DOM', () => {
      const div = document.createElement('div')
      document.body.appendChild(div)

      const root = getRootDocument(div)

      expect(root).toBe(document)
      expect(root).toBeInstanceOf(Document)
    })

    it('returns document for text nodes in regular DOM', () => {
      const div = document.createElement('div')
      const textNode = document.createTextNode('test')
      div.appendChild(textNode)
      document.body.appendChild(div)

      const root = getRootDocument(textNode)

      expect(root).toBe(document)
      expect(root).toBeInstanceOf(Document)
    })

    it('returns document for comment nodes in regular DOM', () => {
      const div = document.createElement('div')
      const commentNode = document.createComment('test comment')
      div.appendChild(commentNode)
      document.body.appendChild(div)

      const root = getRootDocument(commentNode)

      expect(root).toBe(document)
      expect(root).toBeInstanceOf(Document)
    })

    it('returns document for nested elements in regular DOM', () => {
      const outer = document.createElement('div')
      const inner = document.createElement('span')
      const deepest = document.createElement('p')
      outer.appendChild(inner)
      inner.appendChild(deepest)
      document.body.appendChild(outer)

      const root = getRootDocument(deepest)

      expect(root).toBe(document)
      expect(root).toBeInstanceOf(Document)
    })

    it('returns document for document.body', () => {
      const root = getRootDocument(document.body)

      expect(root).toBe(document)
      expect(root).toBeInstanceOf(Document)
    })

    it('returns document for document.documentElement', () => {
      const root = getRootDocument(document.documentElement)

      expect(root).toBe(document)
      expect(root).toBeInstanceOf(Document)
    })
  })

  describe('shadow DOM nodes', () => {
    it('returns shadow root for elements inside shadow DOM', () => {
      const host = document.createElement('div')
      const shadowRoot = host.attachShadow({ mode: 'open' })
      const shadowDiv = document.createElement('div')
      shadowRoot.appendChild(shadowDiv)
      document.body.appendChild(host)

      const root = getRootDocument(shadowDiv)

      expect(root).toBe(shadowRoot)
      expect(root).toBeInstanceOf(ShadowRoot)
      expect(root).not.toBe(document)
    })

    it('returns shadow root for text nodes inside shadow DOM', () => {
      const host = document.createElement('div')
      const shadowRoot = host.attachShadow({ mode: 'open' })
      const shadowDiv = document.createElement('div')
      const textNode = document.createTextNode('shadow text')
      shadowDiv.appendChild(textNode)
      shadowRoot.appendChild(shadowDiv)
      document.body.appendChild(host)

      const root = getRootDocument(textNode)

      expect(root).toBe(shadowRoot)
      expect(root).toBeInstanceOf(ShadowRoot)
    })

    it('returns shadow root for nested elements inside shadow DOM', () => {
      const host = document.createElement('div')
      const shadowRoot = host.attachShadow({ mode: 'open' })
      const outer = document.createElement('div')
      const inner = document.createElement('span')
      const deepest = document.createElement('p')
      outer.appendChild(inner)
      inner.appendChild(deepest)
      shadowRoot.appendChild(outer)
      document.body.appendChild(host)

      const root = getRootDocument(deepest)

      expect(root).toBe(shadowRoot)
      expect(root).toBeInstanceOf(ShadowRoot)
    })

    it('returns shadow root for closed shadow DOM', () => {
      const host = document.createElement('div')
      const shadowRoot = host.attachShadow({ mode: 'closed' })
      const shadowDiv = document.createElement('div')
      shadowRoot.appendChild(shadowDiv)
      document.body.appendChild(host)

      const root = getRootDocument(shadowDiv)

      expect(root).toBe(shadowRoot)
      expect(root).toBeInstanceOf(ShadowRoot)
    })

    it('distinguishes between regular DOM and shadow DOM', () => {
      const host = document.createElement('div')
      const shadowRoot = host.attachShadow({ mode: 'open' })
      const shadowDiv = document.createElement('div')
      shadowRoot.appendChild(shadowDiv)

      const regularDiv = document.createElement('div')
      document.body.appendChild(host)
      document.body.appendChild(regularDiv)

      const shadowRootResult = getRootDocument(shadowDiv)
      const regularRootResult = getRootDocument(regularDiv)

      expect(shadowRootResult).toBe(shadowRoot)
      expect(regularRootResult).toBe(document)
      expect(shadowRootResult).not.toBe(regularRootResult)
    })
  })

  describe('nested shadow DOM', () => {
    it('returns the correct shadow root for nested shadow DOMs', () => {
      const outerHost = document.createElement('div')
      const outerShadowRoot = outerHost.attachShadow({ mode: 'open' })
      const outerDiv = document.createElement('div')
      outerShadowRoot.appendChild(outerDiv)

      const innerHost = document.createElement('div')
      const innerShadowRoot = innerHost.attachShadow({ mode: 'open' })
      const innerDiv = document.createElement('div')
      innerShadowRoot.appendChild(innerDiv)
      outerDiv.appendChild(innerHost)

      document.body.appendChild(outerHost)

      const outerRoot = getRootDocument(outerDiv)
      const innerRoot = getRootDocument(innerDiv)

      expect(outerRoot).toBe(outerShadowRoot)
      expect(innerRoot).toBe(innerShadowRoot)
      expect(outerRoot).not.toBe(innerRoot)
    })
  })

  describe('edge cases', () => {
    it('handles nodes without ownerDocument by falling back to document', () => {
      // Create a node that doesn't have ownerDocument
      const fragment = document.createDocumentFragment()
      const div = document.createElement('div')
      fragment.appendChild(div)

      // Mock getRootNode to return a DocumentFragment (which doesn't have ownerDocument)
      const originalGetRootNode = div.getRootNode
      div.getRootNode = () => fragment as any

      const root = getRootDocument(div)

      // Should fall back to global document
      expect(root).toBe(document)
      expect(root).toBeInstanceOf(Document)

      // Restore original method
      div.getRootNode = originalGetRootNode
    })

    it('handles document node itself', () => {
      const root = getRootDocument(document)

      expect(root).toBe(document)
      expect(root).toBeInstanceOf(Document)
    })

    it('handles document fragment nodes', () => {
      const fragment = document.createDocumentFragment()
      const div = document.createElement('div')
      fragment.appendChild(div)

      const root = getRootDocument(div)

      expect(root).toBe(document)
      expect(root).toBeInstanceOf(Document)
    })

    it('handles detached nodes', () => {
      const div = document.createElement('div')
      // Node is not attached to DOM

      const root = getRootDocument(div)

      expect(root).toBe(document)
      expect(root).toBeInstanceOf(Document)
    })
  })
})
