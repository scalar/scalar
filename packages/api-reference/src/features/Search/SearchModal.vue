<script setup lang="ts">
import {
  type Icon,
  type ModalState,
  ScalarModal,
  ScalarSearchInput,
  ScalarSearchResultItem,
  ScalarSearchResultList,
} from '@scalar/components'
import { smoothScroll } from '@scalar/oas-utils/helpers'
import type { Spec } from '@scalar/types/legacy'
import type { FuseResult } from 'fuse.js'
import { nextTick, ref, toRef, watch } from 'vue'

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

const searchResultRefs = ref<(typeof ScalarSearchResultItem)[]>([])
const scrollerEl = ref<typeof ScalarSearchResultList | null>(null)

const navigateSearchResults = (direction: 'up' | 'down') => {
  const offset = direction === 'up' ? -1 : 1
  const length = searchResultsWithPlaceholderResults.value.length

  // Ensures we loop around the array by using the remainder
  selectedSearchResult.value =
    (selectedSearchResult.value + offset + length) % length

  // Scroll the selected item into view
  nextTick(() => {
    // We gotta use the fistChild due to display: contents
    const element =
      searchResultRefs.value[selectedSearchResult.value].$el.firstChild

    if (element instanceof HTMLElement)
      element.scrollIntoView({
        behavior: 'smooth',
      })
  })
}

// given just a #hash-name, we grab the full URL to be explicit to
// handle edge cases of other framework routers resetting to base URL on navigation
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
    @keydown.down.stop="navigateSearchResults('down')"
    @keydown.enter.stop="
      onSearchResultClick(
        searchResultsWithPlaceholderResults[selectedSearchResult],
      )
    "
    @keydown.up.stop="navigateSearchResults('up')">
    <div
      ref="searchModalRef"
      class="ref-search-container">
      <ScalarSearchInput
        v-model="searchText"
        @input="fuseSearch" />
    </div>
    <ScalarSearchResultList
      ref="scrollerEl"
      class="ref-search-results custom-scroll"
      :noResults="!searchResultsWithPlaceholderResults.length">
      <ScalarSearchResultItem
        v-for="(entry, index) in searchResultsWithPlaceholderResults"
        :id="entry.item.href"
        :key="entry.refIndex"
        ref="searchResultRefs"
        :active="selectedSearchResult === index"
        :href="getFullUrlFromHash(entry.item.href)"
        :icon="ENTRY_ICONS[entry.item.type]"
        @click="onSearchResultClick(entry)"
        @focus="selectedSearchResult = index">
        <span
          :class="{ deprecated: entry.item.operation?.information?.deprecated }"
          >{{ entry.item.title }}</span
        >
        <template
          v-if="
            (entry.item.httpVerb || entry.item.path) &&
            entry.item.path !== entry.item.title
          "
          #description>
          {{ entry.item.path }}
        </template>
        <template
          v-else-if="entry.item.description"
          #description>
          {{ entry.item.description }}
        </template>
        <template
          v-if="entry.item.type === 'req'"
          #addon>
          <SidebarHttpBadge :method="entry.item.httpVerb ?? 'get'" />
        </template>
      </ScalarSearchResultItem>
      <template #query>{{ searchText }}</template>
    </ScalarSearchResultList>
    <div class="ref-search-meta">
      <span>↑↓ Navigate</span>
      <span>⏎ Select</span>
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
