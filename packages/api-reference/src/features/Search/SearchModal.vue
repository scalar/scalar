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
import type { Spec } from '@scalar/types/legacy'
import type { FuseResult } from 'fuse.js'
import { nanoid } from 'nanoid'
import { ref, toRef, watch } from 'vue'

import { lazyBus } from '@/components/Content/Lazy/lazyBus'
import {
  useSearchIndex,
  type EntryType,
  type FuseData,
} from '@/features/Search/useSearchIndex'
import { useSidebar } from '@/features/sidebar'
import SidebarHttpBadge from '@/features/sidebar/components/SidebarHttpBadge.vue'

const props = defineProps<{
  parsedSpec: Spec
  modalState: ModalState
  hideModels: boolean
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
  selectedSearchIndex,
  selectedSearchResult,
  searchResultsWithPlaceholderResults,
  searchText,
} = useSearchIndex({
  specification,
  hideModels: props.hideModels,
})

const ENTRY_ICONS: { [x in EntryType]: ScalarIconComponent } = {
  heading: ScalarIconTextAlignLeft,
  model: ScalarIconBracketsCurly,
  req: ScalarIconTerminalWindow,
  tag: ScalarIconTag,
  webhook: ScalarIconTerminalWindow,
}

const ENTRY_LABELS: { [x in EntryType]: string } = {
  heading: 'Document Heading',
  req: 'Request',
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
watch(selectedSearchIndex, (index) => {
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

  if (typeof selectedSearchIndex.value === 'number') {
    // Ensures we loop around the array by using the remainder
    const newIndex = (selectedSearchIndex.value + offset + length) % length
    selectedSearchIndex.value = newIndex
  } else {
    // If no index is selected, we select the first or last item depending on the direction
    selectedSearchIndex.value = offset === -1 ? length - 1 : 0
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
  if (!isDefined(selectedSearchIndex.value)) {
    return
  }

  const results = searchResultsWithPlaceholderResults.value
  onSearchResultClick(results[selectedSearchIndex.value])
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
        v-model="searchText"
        :aria-activedescendant="
          selectedSearchResult
            ? getOptionId(selectedSearchResult.item.href)
            : undefined
        "
        aria-autocomplete="list"
        :aria-controls="listboxId"
        :aria-describedby="instructionsId"
        role="combobox"
        @blur="selectedSearchIndex = undefined"
        @input="fuseSearch"
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
        v-for="(entry, index) in searchResultsWithPlaceholderResults"
        :id="getOptionId(entry.item.href)"
        :key="entry.refIndex"
        :href="getFullUrlFromHash(entry.item.href)"
        :icon="ENTRY_ICONS[entry.item.type]"
        :selected="selectedSearchIndex === index"
        @click="onSearchResultClick(entry)"
        @focus="selectedSearchIndex = index">
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
            entry.item.type !== 'webhook' &&
            (entry.item.httpVerb || entry.item.path) &&
            entry.item.path !== entry.item.title
          "
          #description>
          <span class="inline-flex items-center gap-1">
            <template v-if="entry.item.type === 'req'">
              <SidebarHttpBadge
                aria-hidden="true"
                :method="entry.item.httpVerb ?? 'get'" />
              <span class="sr-only">
                HTTP Method: {{ entry.item.httpVerb ?? 'get' }}
              </span>
            </template>
            <span class="sr-only">Path:&nbsp;</span>
            {{ entry.item.path }}
          </span>
        </template>
        <template
          v-else-if="entry.item.description"
          #description>
          <span class="sr-only">Description:&nbsp;</span>
          {{ entry.item.description }}
        </template>
      </ScalarSearchResultItem>
      <template #query>
        {{ searchText }}
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
