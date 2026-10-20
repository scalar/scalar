<script lang="ts">
/**
 * Floating search bar for ScalarVirtualText
 *
 * Provides find-in-text functionality with match navigation (next/prev)
 * and result count display.
 *
 * @example
 * <ScalarVirtualTextSearch
 *   v-model:query="searchQuery"
 *   :matchCount="searchMatches.length"
 *   :activeMatchIndex="activeMatchIndex"
 *   @next="nextMatch"
 *   @prev="prevMatch"
 *   @close="closeSearch" />
 */
export default {}
</script>
<script setup lang="ts">
import {
  ScalarIconCaretDown,
  ScalarIconCaretUp,
  ScalarIconMagnifyingGlass,
  ScalarIconX,
} from '@scalar/icons'
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{
  /** Current search query (v-model) */
  query: string
  /** Total number of matches */
  matchCount: number
  /** Zero-based index of the currently active match */
  activeMatchIndex: number
}>()

const emit = defineEmits<{
  (e: 'update:query', value: string): void
  (e: 'next'): void
  (e: 'prev'): void
  (e: 'close'): void
}>()

const searchInputRef = ref<HTMLInputElement | null>(null)

const localQuery = ref(props.query)

watch(
  () => props.query,
  (val) => {
    localQuery.value = val
  },
)

watch(localQuery, (val) => {
  emit('update:query', val)
})

/** Focus the input when mounted */
const focus = () => {
  void nextTick(() => searchInputRef.value?.focus())
}

/** Navigate on Enter / Shift+Enter inside the search input */
const handleSearchKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (e.shiftKey) emit('prev')
    else emit('next')
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
}

defineExpose({ focus })
</script>

<template>
  <div
    class="scalar-virtual-text-search bg-b-2 mt-2 mr-2 ml-auto flex h-fit w-fit items-center gap-1 overflow-visible rounded-lg px-2 py-1 shadow-md"
    @click.stop>
    <ScalarIconMagnifyingGlass
      class="text-c-3 pointer-events-none size-3.5 shrink-0" />
    <input
      ref="searchInputRef"
      v-model="localQuery"
      aria-label="Search in text"
      autocomplete="off"
      class="scalar-virtual-text-search-input text-c-1 w-36 min-w-0 appearance-none border-none bg-transparent px-1 py-0.5 text-xs outline-none"
      placeholder="Find..."
      spellcheck="false"
      type="search"
      @keydown="handleSearchKeydown" />
    <span
      v-if="localQuery"
      class="text-c-3 shrink-0 text-xs whitespace-nowrap tabular-nums">
      {{
        matchCount > 0
          ? `${activeMatchIndex + 1} of ${matchCount}`
          : 'No results'
      }}
    </span>
    <span class="bg-b-3 mx-0.5 h-3.5 w-px" />
    <button
      aria-label="Previous match"
      class="text-c-3 hover:bg-b-3 hover:text-c-1 flex size-5 items-center justify-center rounded disabled:pointer-events-none disabled:opacity-30"
      :disabled="matchCount === 0"
      title="Previous match (Shift+Enter)"
      type="button"
      @click="emit('prev')">
      <ScalarIconCaretUp class="size-3" />
    </button>
    <button
      aria-label="Next match"
      class="text-c-3 hover:bg-b-3 hover:text-c-1 flex size-5 items-center justify-center rounded disabled:pointer-events-none disabled:opacity-30"
      :disabled="matchCount === 0"
      title="Next match (Enter)"
      type="button"
      @click="emit('next')">
      <ScalarIconCaretDown class="size-3" />
    </button>
    <button
      aria-label="Close search"
      class="text-c-3 hover:bg-b-3 hover:text-c-1 flex size-5 items-center justify-center rounded"
      title="Close (Escape)"
      type="button"
      @click="emit('close')">
      <ScalarIconX class="size-3" />
    </button>
  </div>
</template>

<style scoped>
.scalar-virtual-text-search-input::-webkit-search-cancel-button {
  display: none;
}
</style>
