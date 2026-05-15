import { describe, expect, it } from 'vitest'
import { computed, ref } from 'vue'

import { useMergeDocumentFilterOutputs } from './use-merge-document-filters'
import { FILTER_NAMESPACE_ALL } from './use-registry-namespace-document-filter'

type Row = { title: string; registry?: { namespace: string } }

describe('use-merge-document-filters', () => {
  it('runs the namespace pass on the title-filtered rest list and pinned rows', () => {
    const rest: Row[] = [
      { title: 'Alpha', registry: { namespace: 'one' } },
      { title: 'Beta', registry: { namespace: 'two' } },
    ]

    const titleFilter = {
      isVisible: ref(true),
      query: ref(''),
      filteredItems: computed<Row[]>(() => [rest[1] as Row]),
      toggle: () => undefined,
      reset: () => undefined,
    }

    const namespaceFilter = {
      registryScopeLabelId: 'mock-label',
      filterNamespaceId: ref(FILTER_NAMESPACE_ALL),
      namespaceFilterSummary: computed(() => null),
      showNamespaceFilterRow: computed(() => false),
      namespaceFilterOptions: computed(() => []),
      namespaceFilterTriggerLabel: computed(() => ''),
      applyNamespaceFilter: (items: Row[]) => items.filter((row) => row.registry?.namespace === 'two'),
    }

    const { displayRestDocuments, displayPinnedDocuments } = useMergeDocumentFilterOutputs({
      titleFilter,
      namespaceFilter,
      pinned: () => [{ title: 'Pinned', registry: { namespace: 'two' } }],
      titleFilteredRest: titleFilter.filteredItems,
    })

    expect(displayRestDocuments.value).toStrictEqual([{ title: 'Beta', registry: { namespace: 'two' } }])
    expect(displayPinnedDocuments.value).toStrictEqual([{ title: 'Pinned', registry: { namespace: 'two' } }])
  })
})
