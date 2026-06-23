<script setup lang="ts">
import { ScalarModal, type ModalState } from '@scalar/components/modal'
import { ScalarSearchInput } from '@scalar/components/search-input'
import { ScalarSearchResultList } from '@scalar/components/search-results'
import type { ModelsSectionLabel } from '@scalar/types/api-reference'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, useId, watch } from 'vue'

import { useApiReferenceI18n } from '@/features/i18n'
import { useSearchIndex } from '@/features/Search/hooks/useSearchIndex'

import SearchResult from './SearchResult.vue'

const props = defineProps<{
  modalState: ModalState
  document: OpenApiDocument | AsyncApiDocument | undefined
  eventBus: WorkspaceEventBus
  modelsSectionLabel?: ModelsSectionLabel
}>()
const { translate } = useApiReferenceI18n()

/** Base id for the search form */
const id = useId()
/** An id for the results listbox */
const listboxId = `${id}-search-result`
/** An id for the results instructions */
const instructionsId = `${id}-search-instructions`

const { query, results } = useSearchIndex(
  () => props.document,
  () => props.modelsSectionLabel,
  () => ({
    heading: translate('search.entryHeading'),
    tagGroup: translate('search.entryTagGroup'),
    webhook: translate('search.entryWebhook'),
    webhooks: translate('navigation.webhooks'),
    introduction: translate('navigation.introduction'),
  }),
)

const selectedIndex = ref<number | undefined>(undefined)

/** Clear the query value when the modal is opened */
watch(
  () => props.modalState.open,
  (open) => {
    if (open) {
      query.value = ''
    }
  },
)

/** Keyboard navigation */
const navigateSearchResults = (direction: 'up' | 'down') => {
  const offset = direction === 'up' ? -1 : 1
  const length = results.value.length

  if (typeof selectedIndex.value === 'number') {
    // Ensures we loop around the array by using the remainder
    selectedIndex.value = (selectedIndex.value + offset + length) % length
  } else {
    // If no index is selected, we select the first or last item depending on the direction

    selectedIndex.value = offset === -1 ? length - 1 : 0
  }
}

/** Handle the selection of a search result */
function handleSelect(idx: number | undefined) {
  if (typeof idx !== 'number' || !results.value[idx]) {
    return
  }

  const result = results.value[idx]
  props.modalState.hide()
  props.eventBus.emit('scroll-to:nav-item', { id: result.item.id })
}

/**
 * Active descendant id for the search input
 * NOTE: Result items MUST share this id for the aria-activedescendant attribute to work correctly
 */
const activeDescendantId = computed(() => {
  const selectedResult = results.value[selectedIndex.value ?? -1]

  return selectedResult ? `search-result-${selectedResult.item.id}` : undefined
})
</script>
<template>
  <ScalarModal
    :aria-label="translate('search.label')"
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
        :clearLabel="translate('search.clear')"
        :label="translate('search.label')"
        :placeholder="translate('search.placeholder')"
        role="combobox"
        @blur="selectedIndex = undefined"
        @keydown.down.stop.prevent="navigateSearchResults('down')"
        @keydown.enter.stop.prevent="() => handleSelect(selectedIndex)"
        @keydown.up.stop.prevent="navigateSearchResults('up')" />
    </div>
    <ScalarSearchResultList
      :id="listboxId"
      :aria-label="translate('search.results')"
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
        :modelsSectionLabel="props.modelsSectionLabel"
        :result="result"
        @click.prevent="() => handleSelect(idx)" />
    </ScalarSearchResultList>
    <div
      :id="instructionsId"
      class="ref-search-meta">
      <span
        aria-hidden="true"
        class="contents">
        <span>↑↓ {{ translate('search.navigate') }}</span>
        <span>⏎ {{ translate('search.select') }}</span>
      </span>
      <span class="sr-only">
        {{ translate('search.instructions') }}
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
