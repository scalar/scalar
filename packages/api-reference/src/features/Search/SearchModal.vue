<script setup lang="ts">
import {
  type Icon,
  type ModalState,
  ScalarModal,
  ScalarSearchInput,
  ScalarSearchResultItem,
  ScalarSearchResultList,
} from '@scalar/components'
import type { Spec } from '@scalar/types/legacy'
import type { FuseResult } from 'fuse.js'
import { nanoid } from 'nanoid'
import { computed, ref, toRef, watch } from 'vue'

import { lazyBus } from '../../components/Content/Lazy/lazyBus'
import SidebarHttpBadge from '../../components/Sidebar/SidebarHttpBadge.vue'
import { scrollToId } from '../../helpers'
import { useSidebar } from '../../hooks'
import { type EntryType, type FuseData, useSearchIndex } from './useSearchIndex'

const props = defineProps<{
  parsedSpec: Spec
  modalState: ModalState
}>()

const specification = toRef(props, 'parsedSpec')

/** Base id for the search form */
const id = nanoid()
/** An id for the results listbox */
const listboxId = `${id}-search-result`
/** An id for the results instructions */
const instructionsId = `${id}-search-instructions`
/** Constructs and unique id for a given option */
const getOptionId = (href: string) => `${id}${href}`

const {
  resetSearch,
  fuseSearch,
  selectedSearchResult,
  searchResultsWithPlaceholderResults,
  searchText,
} = useSearchIndex({
  specification,
})

const ENTRY_ICONS: { [x in EntryType]: Icon } = {
  heading: 'DocsPage',
  model: 'Brackets',
  req: 'Terminal',
  tag: 'CodeFolder',
  webhook: 'Terminal',
}

const ENTRY_LABELS: { [x in EntryType]: string } = {
  heading: 'Document Heading',
  model: '', // The title of the entry is already :"Model"
  req: 'Request',
  tag: 'Tag',
  webhook: 'Webhook',
}

const searchModalRef = ref<HTMLElement | null>(null)

watch(
  () => props.modalState.open,
  (open) => {
    if (open) {
      resetSearch()
    }
  },
)

const { setCollapsedSidebarItem } = useSidebar()

const tagRegex = /#(tag\/[^/]*)/

// Ensure we open the section
function onSearchResultClick(entry: FuseResult<FuseData>) {
  // Determine the parent ID for sidebar navigation
  let parentId = 'models'
  const tagMatch = entry.item.href.match(tagRegex)

  if (tagMatch?.length && tagMatch.length > 1) {
    parentId = tagMatch[1]
  }
  // Expand the corresponding sidebar item
  setCollapsedSidebarItem(parentId, true)

  // Extract the target ID from the href
  const targetId = entry.item.href.replace('#', '')

  if (!document.getElementById(targetId)) {
    const unsubscribe = lazyBus.on((ev) => {
      if (ev.id === targetId) {
        scrollToId(targetId)
        unsubscribe()
        props.modalState.hide()
      }
    })
  } else {
    scrollToId(targetId)
    props.modalState.hide()
  }
}

// Scroll to the currently selected result
watch(selectedSearchResult, (index) => {
  const newResult = searchResultsWithPlaceholderResults.value[index]
  const optionId = getOptionId(newResult?.item.href)

  document.getElementById(optionId)?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
  })
})

const selectedSearchResultId = computed<string>(() => {
  const index = selectedSearchResult.value
  const result = searchResultsWithPlaceholderResults.value[index]
  return getOptionId(result?.item.href)
})

/** Keyboard navigation */
const navigateSearchResults = (direction: 'up' | 'down') => {
  const offset = direction === 'up' ? -1 : 1
  const length = searchResultsWithPlaceholderResults.value.length

  // Ensures we loop around the array by using the remainder
  const newIndex = (selectedSearchResult.value + offset + length) % length
  selectedSearchResult.value = newIndex
}

/**
 * Given just a #hash-name, we grab the full URL to be explicit to
 * handle edge cases of other framework routers resetting to base URL
 * on navigation
 */
function getFullUrlFromHash(href: string) {
  const newUrl = new URL(window.location.href)

  newUrl.hash = href

  return newUrl.toString()
}
</script>
<template>
  <ScalarModal
    :state="modalState"
    variant="search"
    @keydown.down.stop.prevent="navigateSearchResults('down')"
    @keydown.enter.stop.prevent="
      onSearchResultClick(
        searchResultsWithPlaceholderResults[selectedSearchResult],
      )
    "
    @keydown.up.stop.prevent="navigateSearchResults('up')">
    <div
      ref="searchModalRef"
      aria-label="Reference Search"
      class="ref-search-container"
      role="search">
      <ScalarSearchInput
        v-model="searchText"
        :aria-activedescendant="selectedSearchResultId"
        :aria-controls="listboxId"
        :aria-describedby="instructionsId"
        @input="fuseSearch" />
    </div>
    <ScalarSearchResultList
      :id="listboxId"
      :aria-describedby="instructionsId"
      aria-label="Reference Search Results"
      class="ref-search-results custom-scroll"
      :noResults="!searchResultsWithPlaceholderResults.length">
      <ScalarSearchResultItem
        v-for="(entry, index) in searchResultsWithPlaceholderResults"
        :id="getOptionId(entry.item.href)"
        :key="entry.refIndex"
        :active="selectedSearchResult === index"
        :href="getFullUrlFromHash(entry.item.href)"
        :icon="ENTRY_ICONS[entry.item.type]"
        @click="onSearchResultClick(entry)"
        @focus="selectedSearchResult = index">
        <span
          :class="{
            deprecated: entry.item.operation?.information?.deprecated,
          }">
          <span class="sr-only">
            {{ ENTRY_LABELS[entry.item.type] }}:&nbsp;
            <template v-if="entry.item.operation?.information?.deprecated">
              (Deprecated)&nbsp;
            </template>
          </span>
          {{ entry.item.title }}
          <span class="sr-only">,</span>
        </span>
        <template
          v-if="
            (entry.item.httpVerb || entry.item.path) &&
            entry.item.path !== entry.item.title
          "
          #description>
          <span class="sr-only">Path:&nbsp;</span>
          {{ entry.item.path }}
        </template>
        <template
          v-else-if="entry.item.description"
          #description>
          <span class="sr-only">Description:&nbsp;</span>
          {{ entry.item.description }}
        </template>
        <template
          v-if="entry.item.type === 'req'"
          #addon>
          <SidebarHttpBadge
            aria-hidden="true"
            :method="entry.item.httpVerb ?? 'get'" />
          <span class="sr-only">
            HTTP Method: {{ entry.item.httpVerb ?? 'get' }},
          </span>
        </template>
      </ScalarSearchResultItem>
      <template #query>{{ searchText }}</template>
    </ScalarSearchResultList>
    <div class="ref-search-meta">
      <span>↑↓ Navigate</span>
      <span>⏎ Select</span>
    </div>
    <div
      :id="instructionsId"
      class="sr-only">
      Press up arrow / down arrow to navigate, enter to select, type to filter
      results
    </div>
  </ScalarModal>
</template>
<style scoped>
a {
  text-decoration: none;
}
.ref-search-container {
  display: flex;
  flex-direction: column;
  padding: 12px;
  padding-bottom: 0px;
}
.ref-search-results {
  padding: 12px;
}
.ref-search-meta {
  background: var(--scalar-background-3);
  padding: 6px 12px;
  font-size: var(--scalar-font-size-4);
  color: var(--scalar-color-3);
  font-weight: var(--scalar-semibold);
  display: flex;
  gap: 12px;
}
.deprecated {
  text-decoration: line-through;
}
</style>
