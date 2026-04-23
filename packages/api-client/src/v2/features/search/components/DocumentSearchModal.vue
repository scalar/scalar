<script setup lang="ts">
import {
  ScalarModal,
  ScalarSearchInput,
  ScalarSearchResultList,
  type ModalState,
} from '@scalar/components'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { nanoid } from 'nanoid'
import { computed, ref, watch } from 'vue'

import { useDocumentSearch } from '@/v2/features/search/hooks/use-document-search'

import SearchResult from './SearchResult.vue'

const props = defineProps<{
  /** Controls the visibility of the search modal. */
  modalState: ModalState
  /** The document whose entries should be searched. */
  document: OpenApiDocument | undefined
}>()

const emit = defineEmits<{
  /** Emitted when the user picks a result, passing the navigation id. */
  (e: 'select', id: string): void
}>()

/** Base id for the search form. */
const id = nanoid()
const listboxId = `${id}-search-result`
const instructionsId = `${id}-search-instructions`

const { query, results } = useDocumentSearch(() => props.document)

const selectedIndex = ref<number | undefined>(undefined)

/**
 * Reset the query every time the modal is opened so users always start from a
 * clean state. Matches the reference search modal behaviour.
 */
watch(
  () => props.modalState.open,
  (open) => {
    if (open) {
      query.value = ''
      selectedIndex.value = undefined
    }
  },
)

/** Keyboard navigation, wrapping around the ends of the result list. */
const navigateSearchResults = (direction: 'up' | 'down') => {
  const offset = direction === 'up' ? -1 : 1
  const length = results.value.length
  if (length === 0) {
    return
  }

  if (typeof selectedIndex.value === 'number') {
    selectedIndex.value = (selectedIndex.value + offset + length) % length
    return
  }

  selectedIndex.value = offset === -1 ? length - 1 : 0
}

function handleSelect(idx: number | undefined) {
  if (typeof idx !== 'number' || !results.value[idx]) {
    return
  }

  const result = results.value[idx]
  props.modalState.hide()
  emit('select', result.item.id)
}

/**
 * aria-activedescendant for the combobox. Each result item must render the
 * matching id for assistive tech to announce the selection correctly.
 */
const activeDescendantId = computed(() => {
  const selectedResult = results.value[selectedIndex.value ?? -1]
  return selectedResult ? `search-result-${selectedResult.item.id}` : undefined
})
</script>

<template>
  <ScalarModal
    aria-label="Document Search"
    :state="modalState"
    variant="search">
    <div
      class="mb-0 flex flex-col"
      role="search">
      <ScalarSearchInput
        v-model="query"
        :aria-activedescendant="activeDescendantId"
        aria-autocomplete="list"
        :aria-controls="listboxId"
        :aria-describedby="instructionsId"
        role="combobox"
        @blur="selectedIndex = undefined"
        @keydown.down.stop.prevent="navigateSearchResults('down')"
        @keydown.enter.stop.prevent="() => handleSelect(selectedIndex)"
        @keydown.up.stop.prevent="navigateSearchResults('up')" />
    </div>
    <ScalarSearchResultList
      :id="listboxId"
      aria-label="Document Search Results"
      class="custom-scroll px-1 pb-1"
      :noResults="!results.length">
      <template #query>
        {{ query }}
      </template>
      <SearchResult
        v-for="(result, idx) in results"
        :id="`search-result-${result.item.id}`"
        :key="result.refIndex"
        :isSelected="selectedIndex === idx"
        :result="result"
        @click.prevent="() => handleSelect(idx)" />
    </ScalarSearchResultList>
    <div
      :id="instructionsId"
      class="ref-search-meta">
      <span
        aria-hidden="true"
        class="contents">
        <span>↑↓ Navigate</span>
        <span>⏎ Select</span>
      </span>
      <span class="sr-only">
        Press up arrow / down arrow to navigate, enter to select, type to filter results
      </span>
    </div>
  </ScalarModal>
</template>

<style scoped>
.ref-search-meta {
  background: var(--scalar-background-1);
  border-bottom-left-radius: var(--scalar-radius-lg);
  border-bottom-right-radius: var(--scalar-radius-lg);
  padding: 6px 12px;
  font-size: var(--scalar-font-size-4);
  color: var(--scalar-color-3);
  font-weight: var(--scalar-semibold);
  display: flex;
  gap: 12px;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}
</style>
