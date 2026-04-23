import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { useDocumentFilter } from '@/v2/features/app/hooks/use-document-filter'

type Doc = { key: string; title: string }

const docs: Doc[] = [
  { key: 'pets', title: 'Pets API' },
  { key: 'orders', title: 'Orders API' },
  { key: 'users', title: 'Users Service' },
]

describe('use-document-filter', () => {
  it('returns every item when the query is empty', () => {
    const { filteredItems } = useDocumentFilter(() => docs)

    expect(filteredItems.value).toStrictEqual(docs)
  })

  it('filters items by title using fuzzy matching', () => {
    const { query, filteredItems } = useDocumentFilter(() => docs)

    query.value = 'pets'

    expect(filteredItems.value).toStrictEqual([
      { key: 'pets', title: 'Pets API' },
    ])
  })

  it('tolerates small typos thanks to the fuzzy threshold', () => {
    const { query, filteredItems } = useDocumentFilter(() => docs)

    query.value = 'ordrs'

    expect(filteredItems.value).toStrictEqual([
      { key: 'orders', title: 'Orders API' },
    ])
  })

  it('trims whitespace from the query before filtering', () => {
    const { query, filteredItems } = useDocumentFilter(() => docs)

    query.value = '   '

    // A whitespace-only query should behave like an empty query and return
    // the full list rather than searching for spaces.
    expect(filteredItems.value).toStrictEqual(docs)
  })

  it('returns an empty array when nothing matches', () => {
    const { query, filteredItems } = useDocumentFilter(() => docs)

    query.value = 'billing'

    expect(filteredItems.value).toStrictEqual([])
  })

  it('starts hidden and toggles visibility on', () => {
    const { isVisible, toggle } = useDocumentFilter(() => docs)

    expect(isVisible.value).toBe(false)

    toggle()

    expect(isVisible.value).toBe(true)
  })

  it('clears the query when toggling from visible to hidden', () => {
    const { isVisible, query, toggle } = useDocumentFilter(() => docs)

    toggle()
    query.value = 'pets'

    toggle()

    expect(isVisible.value).toBe(false)
    expect(query.value).toBe('')
  })

  it('reset hides the input and clears the query', () => {
    const { isVisible, query, reset, toggle } = useDocumentFilter(() => docs)

    toggle()
    query.value = 'pets'

    reset()

    expect(isVisible.value).toBe(false)
    expect(query.value).toBe('')
  })

  it('reacts to changes in the source list', () => {
    const source = ref<Doc[]>([{ key: 'pets', title: 'Pets API' }])
    const { query, filteredItems } = useDocumentFilter(source)

    query.value = 'orders'
    expect(filteredItems.value).toStrictEqual([])

    source.value = [
      { key: 'pets', title: 'Pets API' },
      { key: 'orders', title: 'Orders API' },
    ]

    expect(filteredItems.value).toStrictEqual([
      { key: 'orders', title: 'Orders API' },
    ])
  })

  it('preserves extra properties on filtered items', () => {
    type RichDoc = Doc & { metadata: { owner: string } }
    const rich: RichDoc[] = [
      { key: 'pets', title: 'Pets API', metadata: { owner: 'alice' } },
    ]

    const { filteredItems } = useDocumentFilter(() => rich)

    // The hook should pass items through untouched rather than reshaping
    // them to only include the fields it indexes on.
    expect(filteredItems.value).toStrictEqual(rich)
  })
})
