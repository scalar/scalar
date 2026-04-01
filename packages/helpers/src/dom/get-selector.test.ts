import { afterEach, describe, expect, it } from 'vitest'

import { getSelector } from './get-selector'

describe('get-selector', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('invalid input', () => {
    it('returns null for a non-Element value', () => {
      expect(getSelector(null)).toBeNull()
    })

    it('returns null for a plain object', () => {
      // @ts-expect-error intentionally passing a non-Element
      expect(getSelector({})).toBeNull()
    })
  })

  describe('single element', () => {
    it('returns the full path for a lone child element', () => {
      const div = document.createElement('div')
      document.body.appendChild(div)

      expect(getSelector(div)).toBe('html > body > div')
    })

    it('lowercases the tag name', () => {
      const section = document.createElement('section')
      document.body.appendChild(section)

      expect(getSelector(section)).toBe('html > body > section')
    })
  })

  describe('nth-of-type disambiguation', () => {
    it('does not add nth-of-type when the element is the only sibling of its tag', () => {
      const parent = document.createElement('div')
      const child = document.createElement('span')
      parent.appendChild(child)
      document.body.appendChild(parent)

      expect(getSelector(child)).toBe('html > body > div > span')
    })

    it('does not add nth-of-type for the first of multiple same-tag siblings', () => {
      const parent = document.createElement('div')
      const first = document.createElement('span')
      const second = document.createElement('span')
      parent.appendChild(first)
      parent.appendChild(second)
      document.body.appendChild(parent)

      expect(getSelector(first)).toBe('html > body > div > span')
    })

    it('adds nth-of-type(2) for the second same-tag sibling', () => {
      const parent = document.createElement('div')
      const first = document.createElement('span')
      const second = document.createElement('span')
      parent.appendChild(first)
      parent.appendChild(second)
      document.body.appendChild(parent)

      expect(getSelector(second)).toBe('html > body > div > span:nth-of-type(2)')
    })

    it('counts only same-tag siblings — mixed tags do not interfere', () => {
      const parent = document.createElement('div')
      const p1 = document.createElement('p')
      const span = document.createElement('span')
      const p2 = document.createElement('p')
      parent.appendChild(p1)
      parent.appendChild(span)
      parent.appendChild(p2)
      document.body.appendChild(parent)

      expect(getSelector(p2)).toBe('html > body > div > p:nth-of-type(2)')
      expect(getSelector(span)).toBe('html > body > div > span')
    })

    it('handles three or more same-tag siblings', () => {
      const parent = document.createElement('ul')
      const items = Array.from({ length: 4 }, () => document.createElement('li'))
      items.forEach((li) => parent.appendChild(li))
      document.body.appendChild(parent)

      expect(getSelector(items[0] ?? null)).toBe('html > body > ul > li')
      expect(getSelector(items[1] ?? null)).toBe('html > body > ul > li:nth-of-type(2)')
      expect(getSelector(items[2] ?? null)).toBe('html > body > ul > li:nth-of-type(3)')
      expect(getSelector(items[3] ?? null)).toBe('html > body > ul > li:nth-of-type(4)')
    })
  })

  describe('nested elements', () => {
    it('builds a full ancestor path', () => {
      const section = document.createElement('section')
      const article = document.createElement('article')
      const p = document.createElement('p')
      article.appendChild(p)
      section.appendChild(article)
      document.body.appendChild(section)

      expect(getSelector(p)).toBe('html > body > section > article > p')
    })

    it('applies nth-of-type at each level independently', () => {
      const wrapper = document.createElement('div')
      const ul = document.createElement('ul')
      const li1 = document.createElement('li')
      const li2 = document.createElement('li')
      const a = document.createElement('a')
      li2.appendChild(a)
      ul.appendChild(li1)
      ul.appendChild(li2)
      wrapper.appendChild(ul)
      document.body.appendChild(wrapper)

      expect(getSelector(a)).toBe('html > body > div > ul > li:nth-of-type(2) > a')
    })

    it('disambiguates when the same tag appears at multiple nesting levels', () => {
      const outer = document.createElement('div')
      const inner = document.createElement('div')
      const span = document.createElement('span')
      inner.appendChild(span)
      outer.appendChild(inner)
      document.body.appendChild(outer)

      expect(getSelector(span)).toBe('html > body > div > div > span')
    })
  })

  describe('selector usability', () => {
    it('returned selector resolves back to the element via querySelector', () => {
      const parent = document.createElement('section')
      const child = document.createElement('button')
      parent.appendChild(child)
      document.body.appendChild(parent)

      const selector = getSelector(child)!
      expect(document.querySelector(selector)).toBe(child)
    })

    it('each sibling gets a distinct selector that resolves to its own element', () => {
      const parent = document.createElement('div')
      const spans = Array.from({ length: 3 }, () => document.createElement('span'))
      spans.forEach((s) => parent.appendChild(s))
      document.body.appendChild(parent)

      const selectors = spans.map((s) => getSelector(s)!)

      expect(new Set(selectors).size).toBe(3)

      selectors.forEach((sel, i) => {
        expect(document.querySelector(sel)).toBe(spans[i])
      })
    })

    it('selectors remain valid for deeply nested structures', () => {
      const nav = document.createElement('nav')
      const ul = document.createElement('ul')
      const li1 = document.createElement('li')
      const li2 = document.createElement('li')
      const link = document.createElement('a')
      li2.appendChild(link)
      ul.appendChild(li1)
      ul.appendChild(li2)
      nav.appendChild(ul)
      document.body.appendChild(nav)

      const selector = getSelector(link)!
      expect(document.querySelector(selector)).toBe(link)
    })
  })
})
