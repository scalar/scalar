import { describe, expect, it } from 'vitest'

import { filterItemsByTitle } from '@/features/app/hooks/use-sidebar-documents/helpers/filter-items-by-title'

type Doc = { key: string; title: string }

const docs: Doc[] = [
  { key: 'pets', title: 'Pets API' },
  { key: 'orders', title: 'Orders API' },
  { key: 'users', title: 'Users Service' },
]

describe('filter-items-by-title', () => {
  it('returns every item when the query is empty', () => {
    expect(filterItemsByTitle(docs, '')).toStrictEqual(docs)
  })

  it('filters items by title using fuzzy matching', () => {
    expect(filterItemsByTitle(docs, 'pets')).toStrictEqual([{ key: 'pets', title: 'Pets API' }])
  })

  it('tolerates small typos thanks to the fuzzy threshold', () => {
    expect(filterItemsByTitle(docs, 'ordrs')).toStrictEqual([{ key: 'orders', title: 'Orders API' }])
  })

  it('trims whitespace from the query before filtering', () => {
    expect(filterItemsByTitle(docs, '   ')).toStrictEqual(docs)
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterItemsByTitle(docs, 'billing')).toStrictEqual([])
  })

  it('preserves extra properties on filtered items', () => {
    type RichDoc = Doc & { metadata: { owner: string } }
    const rich: RichDoc[] = [{ key: 'pets', title: 'Pets API', metadata: { owner: 'alice' } }]

    expect(filterItemsByTitle(rich, 'pets')).toStrictEqual(rich)
  })
})
