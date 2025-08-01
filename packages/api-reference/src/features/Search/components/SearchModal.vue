<script setup lang="ts">
import {
  ScalarModal,
  ScalarSearchInput,
  ScalarSearchResultItem,
  ScalarSearchResultList,
  type ModalState,
} from '@scalar/components'
import { isDefined } from '@scalar/helpers/array/is-defined'
import { scrollToId } from '@scalar/helpers/dom/scroll-to-id'
import {
  ScalarIconBracketsCurly,
  ScalarIconTag,
  ScalarIconTerminalWindow,
  ScalarIconTextAlignLeft,
} from '@scalar/icons'
import type { ScalarIconComponent } from '@scalar/icons/types'
import { isOperationDeprecated } from '@scalar/oas-utils/helpers'
import type { FuseResult } from 'fuse.js'
import { nanoid } from 'nanoid'
import { ref, watch } from 'vue'

import { lazyBus } from '@/components/Lazy'
import { useSidebar } from '@/features/sidebar'
import SidebarHttpBadge from '@/features/sidebar/components/SidebarHttpBadge.vue'

import { useSearchIndex } from '../hooks/useSearchIndex'
import type { EntryType, FuseData } from '../types'

const props = defineProps<{
  modalState: ModalState
  hideModels: boolean
}>()

/** Base id for the search form */
const id = nanoid()
/** An id for the results listbox */
const listboxId = `${id}-search-result`
/** An id for the results instructions */
const instructionsId = `${id}-search-instructions`
/** Constructs and unique id for a given option */
const getOptionId = (href: string) => `${id}${href}`

const { items } = useSidebar()

const {
  resetSearch,
  selectedIndex,
  selectedSearchResult,
  searchResultsWithPlaceholderResults,
  query,
} = useSearchIndex(items)

const ENTRY_ICONS: { [x in EntryType]: ScalarIconComponent } = {
  heading: ScalarIconTextAlignLeft,
  model: ScalarIconBracketsCurly,
  operation: ScalarIconTerminalWindow,
  tag: ScalarIconTag,
  webhook: ScalarIconTerminalWindow,
}

const ENTRY_LABELS: { [x in EntryType]: string } = {
  heading: 'Heading',
  operation: 'Operation',
  tag: 'Tag',
  model: 'Model',
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

// TODO: Does this work with custom slugs?
const tagRegex = /#(tag\/[^/]*)/

// Ensure we open the section
function onSearchResultClick(result: FuseResult<FuseData>) {
  // Determine the parent ID for sidebar navigation
  let parentId = 'models'
  const tagMatch = result.item.href.match(tagRegex)

  if (tagMatch?.length && tagMatch.length > 1) {
    parentId = tagMatch[1]
  }
  // Expand the corresponding sidebar item
  setCollapsedSidebarItem(parentId, true)

  // Extract the target ID from the href
  const targetId = result.item.href.replace('#', '')

  if (!document.getElementById(targetId)) {
    const unsubscribe = lazyBus.on((ev) => {
      if (ev.loaded === targetId) {
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
watch(selectedIndex, (index) => {
  if (typeof index !== 'number') {
    return
  }

  const newResult = searchResultsWithPlaceholderResults.value[index]
  const optionId = getOptionId(newResult?.item.href)

  document.getElementById(optionId)?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
  })
})

/** Keyboard navigation */
const navigateSearchResults = (direction: 'up' | 'down') => {
  const offset = direction === 'up' ? -1 : 1
  const length = searchResultsWithPlaceholderResults.value.length

  if (typeof selectedIndex.value === 'number') {
    // Ensures we loop around the array by using the remainder
    const newIndex = (selectedIndex.value + offset + length) % length
    selectedIndex.value = newIndex
  } else {
    // If no index is selected, we select the first or last item depending on the direction
    selectedIndex.value = offset === -1 ? length - 1 : 0
  }
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

function onSearchResultEnter() {
  if (!isDefined(selectedIndex.value)) {
    return
  }

  const results = searchResultsWithPlaceholderResults.value

  // Prevents the user from navigating if there are no results
  if (results.length === 0) {
    return
  }

  onSearchResultClick(results[selectedIndex.value])
}
</script>
<template>
  <ScalarModal
    aria-label="Reference Search"
    :state="modalState"
    variant="search">
    <div
      ref="searchModalRef"
      class="ref-search-container"
      role="search">
      <ScalarSearchInput
        v-model="query"
        :aria-activedescendant="
          selectedSearchResult
            ? getOptionId(selectedSearchResult.item.href)
            : undefined
        "
        aria-autocomplete="list"
        :aria-controls="listboxId"
        :aria-describedby="instructionsId"
        role="combobox"
        @blur="selectedIndex = undefined"
        @keydown.down.stop.prevent="navigateSearchResults('down')"
        @keydown.enter.stop.prevent="onSearchResultEnter"
        @keydown.up.stop.prevent="navigateSearchResults('up')" />
    </div>
    <ScalarSearchResultList
      :id="listboxId"
      aria-label="Reference Search Results"
      class="ref-search-results custom-scroll"
      :noResults="!searchResultsWithPlaceholderResults.length">
      <ScalarSearchResultItem
        v-for="(result, index) in searchResultsWithPlaceholderResults"
        :id="getOptionId(result.item.href)"
        :key="result.refIndex"
        :href="getFullUrlFromHash(result.item.href)"
        :icon="ENTRY_ICONS[result.item.type]"
        :selected="selectedIndex === index"
        @click="onSearchResultClick(result)"
        @focus="selectedIndex = index">
        <span
          :class="{
            deprecated:
              'operation' in result.item.entry &&
              isOperationDeprecated(result.item.entry.operation),
          }">
          <span class="sr-only">
            {{ ENTRY_LABELS[result.item.type] }}:&nbsp;
            <template
              v-if="
                'operation' in result.item.entry &&
                isOperationDeprecated(result.item.entry.operation)
              ">
              (Deprecated)&nbsp;
            </template>
          </span>
          {{ result.item.title }}
          <span class="sr-only">,</span>
        </span>
        <template
          v-if="
            result.item.type !== 'webhook' &&
            (result.item.method || result.item.path) &&
            result.item.path !== result.item.title
          "
          #description>
          <span class="inline-flex items-center gap-1">
            <template v-if="result.item.type === 'operation'">
              <SidebarHttpBadge
                aria-hidden="true"
                :method="result.item.method ?? 'get'" />
              <span class="sr-only">
                HTTP Method: {{ result.item.method ?? 'get' }}
              </span>
            </template>
            <span class="sr-only">Path:&nbsp;</span>
            {{ result.item.path }}
          </span>
        </template>
        <template
          v-else-if="result.item.description"
          #description>
          <span class="sr-only">Description:&nbsp;</span>
          {{ result.item.description }}
        </template>
      </ScalarSearchResultItem>
      <template #query>
        {{ query }}
      </template>
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
        Press up arrow / down arrow to navigate, enter to select, type to filter
        results
      </span>
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
  padding-bottom: 0px;
}
.ref-search-results {
  padding: 0 4px 4px 4px;
}
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
.deprecated {
  text-decoration: line-through;
}
</style>
