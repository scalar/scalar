import { describe, expect, it } from 'vitest'

import { getTagSections } from './render-tags'

describe('render-tags', () => {
  it('orders parents before children and preserves sibling order using names for identity', () => {
    const tags = [
      { name: 'invoices', parent: 'billing' },
      { name: 'users' },
      { name: 'billing', parent: 'accounts', summary: 'Shared title' },
      { name: 'accounts', summary: 'Accounts' },
      { name: 'payments', parent: 'accounts', summary: 'Shared title' },
    ]
    expect(getTagSections(tags, '3.2.1')).toStrictEqual([
      { tag: tags[1], title: 'users' },
      { tag: tags[3], title: 'Accounts' },
      { tag: tags[2], title: 'Accounts › Shared title' },
      { tag: tags[0], title: 'Accounts › Shared title › invoices' },
      { tag: tags[4], title: 'Accounts › Shared title' },
    ])
    expect(tags.map((tag) => tag.name)).toStrictEqual(['invoices', 'users', 'billing', 'accounts', 'payments'])
  })

  it('keeps missing parents, self references, cycles and their descendants flat', () => {
    const tags = [
      { name: 'before', parent: 'a' },
      { name: 'a', parent: 'b' },
      { name: 'b', parent: 'a' },
      { name: 'after', parent: 'b' },
      { name: 'self', parent: 'self' },
      { name: 'missing', parent: 'absent' },
    ]
    expect(getTagSections(tags, '3.2.1')).toStrictEqual(tags.map((tag) => ({ tag, title: tag.name })))
  })

  it('preserves ambiguous duplicate declarations', () => {
    const tags = [{ name: 'a' }, { name: 'a' }, { name: 'b', parent: 'a' }]
    expect(getTagSections(tags, '3.2.1')).toStrictEqual(tags.map((tag) => ({ tag, title: tag.name })))
  })

  it('supports deep ancestry without recursive traversal', () => {
    const tags = Array.from({ length: 1000 }, (_, index) => ({
      name: String(index),
      ...(index ? { parent: String(index - 1) } : {}),
    }))
    const sections = getTagSections([...tags].reverse(), '3.2.1')
    expect(sections.map(({ tag }) => tag.name)).toStrictEqual(tags.map((tag) => tag.name))
    expect(sections.at(-1)?.title).toBe(tags.map((tag) => tag.name).join(' › '))
  })
})
