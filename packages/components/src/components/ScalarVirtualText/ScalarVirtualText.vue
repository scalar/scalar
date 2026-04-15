<script lang="ts">
/**
 * Scalar Virtual Text component
 *
 * Renders large blocks of text efficiently using virtualized scrolling.
 * Only the visible lines are rendered to the DOM. Supports in-content
 * search with match highlighting and navigation (Cmd/Ctrl+F).
 *
 * @example
 * <ScalarVirtualText text="line1\nline2\nline3" :lineHeight="20" />
 *
 * @example
 * <ScalarVirtualText text="lots of text" searchable />
 */
export default {}
</script>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import ScalarVirtualTextSearch from './ScalarVirtualTextSearch.vue'

const props = withDefaults(
  defineProps<{
    /** Text to display */
    text: string
    /**
     * Height of each line
     * @default 20
     */
    lineHeight?: number
    containerClass?: string
    contentClass?: string
    lineClass?: string
    /** Enable built-in search with Cmd/Ctrl+F */
    searchable?: boolean
  }>(),
  {
    lineHeight: 20,
    containerClass: '',
    contentClass: '',
    lineClass: '',
    searchable: false,
  },
)

const containerRef = ref<HTMLElement | null>(null)
const searchRef = ref<InstanceType<typeof ScalarVirtualTextSearch> | null>(null)
const scrollPosition = ref(0)
const containerHeight = ref(0)

const searchQuery = ref('')
const searchOpen = ref(false)
const activeMatchIndex = ref(0)

/** Array of text broken into lines */
const lines = computed(() => props.text.split('\n'))
/** Total height of all lines combined */
const totalHeight = computed(() => lines.value.length * props.lineHeight)

/** Index of the first visible line */
const visibleStartIndex = computed(() =>
  Math.floor(scrollPosition.value / props.lineHeight),
)

/** Index of the last visible line */
const visibleEndIndex = computed(() =>
  Math.min(
    Math.ceil(
      (scrollPosition.value + containerHeight.value) / props.lineHeight,
    ),
    lines.value.length,
  ),
)

const BUFFER = 10

/** Index of the first rendered line (clamped, shared between slice and offset) */
const renderStartIndex = computed(() =>
  Math.max(0, visibleStartIndex.value - BUFFER),
)

/** Array of visible lines, including buffer for smooth scrolling */
const visibleLines = computed(() => {
  const end = Math.min(lines.value.length, visibleEndIndex.value + BUFFER)
  return lines.value.slice(renderStartIndex.value, end)
})

/** Pixel offset for the visible content slice */
const contentOffset = computed(() => renderStartIndex.value * props.lineHeight)

// ── Search ────────────────────────────────────────────────────────────

type SearchMatch = { line: number; start: number; end: number }

/** All matches across the full text, computed only when the query changes */
const searchMatches = computed<SearchMatch[]>(() => {
  const query = searchQuery.value
  if (!query) return []

  const lowerQuery = query.toLowerCase()
  const matches: SearchMatch[] = []

  for (let i = 0; i < lines.value.length; i++) {
    const line = lines.value[i]
    if (!line) continue
    const lowerLine = line.toLowerCase()
    let pos = 0
    while (pos < lowerLine.length) {
      const idx = lowerLine.indexOf(lowerQuery, pos)
      if (idx === -1) break
      matches.push({ line: i, start: idx, end: idx + query.length })
      pos = idx + 1
    }
  }
  return matches
})

/** Set of line indices that contain at least one match, for quick lookup */
const matchLineSet = computed(() => {
  const set = new Set<number>()
  for (const m of searchMatches.value) set.add(m.line)
  return set
})

/** Clamp active index when match count changes */
watch(
  () => searchMatches.value.length,
  (count) => {
    if (count === 0) {
      activeMatchIndex.value = 0
    } else if (activeMatchIndex.value >= count) {
      activeMatchIndex.value = count - 1
    }
  },
)

/** Scroll the container so the active match's line is visible */
const scrollToMatch = (match: SearchMatch) => {
  if (!containerRef.value) return

  const targetScroll = match.line * props.lineHeight
  const viewTop = containerRef.value.scrollTop
  const viewBottom = viewTop + containerRef.value.clientHeight

  if (targetScroll < viewTop || targetScroll + props.lineHeight > viewBottom) {
    containerRef.value.scrollTop =
      targetScroll - containerRef.value.clientHeight / 2
  }
}

const goToMatch = (index: number) => {
  const match = searchMatches.value[index]
  if (!match) return
  activeMatchIndex.value = index
  scrollToMatch(match)
}

const nextMatch = () => {
  if (searchMatches.value.length === 0) return
  goToMatch((activeMatchIndex.value + 1) % searchMatches.value.length)
}

const prevMatch = () => {
  if (searchMatches.value.length === 0) return
  goToMatch(
    (activeMatchIndex.value - 1 + searchMatches.value.length) %
      searchMatches.value.length,
  )
}

const openSearch = () => {
  searchOpen.value = true
  void nextTick(() => searchRef.value?.focus())
}

const closeSearch = () => {
  searchOpen.value = false
  searchQuery.value = ''
  activeMatchIndex.value = 0
}

/** Intercepts Cmd/Ctrl+F when searchable and the container has focus */
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.searchable) return

  const modifier = e.metaKey || e.ctrlKey
  if (modifier && e.key === 'f') {
    e.preventDefault()
    e.stopPropagation()
    openSearch()
  }
  if (e.key === 'Escape' && searchOpen.value) {
    e.preventDefault()
    closeSearch()
  }
}

/** Jump to the first match whenever the query changes */
watch(searchQuery, () => {
  activeMatchIndex.value = 0
  const first = searchMatches.value[0]
  if (first) {
    scrollToMatch(first)
  }
})

// ── Scroll / resize ───────────────────────────────────────────────────

/** Updates the scroll position when the container is scrolled */
const handleScroll = () =>
  containerRef.value && (scrollPosition.value = containerRef.value.scrollTop)

/** Updates the container height when the window is resized */
const updateContainerHeight = () =>
  containerRef.value &&
  (containerHeight.value = containerRef.value.clientHeight)

onMounted(() => {
  updateContainerHeight()
  window.addEventListener('resize', updateContainerHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateContainerHeight)
})

// ── Line rendering with highlights ────────────────────────────────────

type LineSegment = { text: string; highlight: boolean; active: boolean }

/**
 * For a given absolute line index, splits the line text into segments
 * with match highlighting metadata.
 */
const getLineSegments = (absoluteIndex: number): LineSegment[] => {
  const lineText = lines.value[absoluteIndex] ?? ''
  if (!searchQuery.value || !matchLineSet.value.has(absoluteIndex)) {
    return [{ text: lineText, highlight: false, active: false }]
  }

  const lineMatches = searchMatches.value.filter(
    (m) => m.line === absoluteIndex,
  )
  const segments: LineSegment[] = []
  let cursor = 0

  for (const match of lineMatches) {
    if (match.start > cursor) {
      segments.push({
        text: lineText.slice(cursor, match.start),
        highlight: false,
        active: false,
      })
    }

    const isActive =
      searchMatches.value.indexOf(match) === activeMatchIndex.value

    segments.push({
      text: lineText.slice(match.start, match.end),
      highlight: true,
      active: isActive,
    })
    cursor = match.end
  }

  if (cursor < lineText.length) {
    segments.push({
      text: lineText.slice(cursor),
      highlight: false,
      active: false,
    })
  }

  return segments
}

/**
 * Converts a relative visible-line index to the absolute line index
 * in the full text.
 */
const toAbsoluteIndex = (relativeIndex: number): number =>
  renderStartIndex.value + relativeIndex
</script>

<template>
  <div
    ref="containerRef"
    class="scalar-virtual-text relative overflow-auto"
    :class="containerClass"
    tabindex="0"
    @keydown="handleKeydown"
    @scroll="handleScroll">
    <!-- Search bar (floating top-right, height collapsed so it does not affect scroll) -->
    <ScalarVirtualTextSearch
      v-if="searchable && searchOpen"
      ref="searchRef"
      v-model:query="searchQuery"
      :activeMatchIndex="activeMatchIndex"
      :matchCount="searchMatches.length"
      @close="closeSearch"
      @next="nextMatch"
      @prev="prevMatch" />

    <!-- Invisible spacer that defines the full scrollable height -->
    <div :style="{ height: `${totalHeight}px` }" />
    <code
      class="scalar-virtual-text-content absolute left-0 right-0 top-0"
      :class="contentClass"
      :style="{ transform: `translateY(${contentOffset}px)` }">
      <div
        v-for="(line, index) in visibleLines"
        :key="renderStartIndex + index"
        class="scalar-virtual-text-line"
        :class="lineClass"
        :style="{
          height: `${props.lineHeight}px`,
          lineHeight: `${props.lineHeight}px`,
        }">
        <template
          v-if="searchQuery && matchLineSet.has(toAbsoluteIndex(index))">
          <template
            v-for="(segment, sIdx) in getLineSegments(toAbsoluteIndex(index))"
            :key="sIdx">
            <mark
              v-if="segment.highlight"
              class="scalar-virtual-text-highlight"
              :class="
                segment.active ? 'scalar-virtual-text-highlight-active' : ''
              ">
              {{ segment.text }}
            </mark>
            <template v-else>{{ segment.text }}</template>
          </template>
        </template>
        <template v-else>{{ line }}</template>
      </div>
    </code>
  </div>
</template>

<style scoped>
.scalar-virtual-text:focus {
  outline: none;
}

.scalar-virtual-text-highlight {
  background: var(--scalar-background-accent);
  color: inherit;
  border-radius: 2px;
  padding: 1px 0;
}

.scalar-virtual-text-highlight-active {
  background: var(--scalar-color-accent);
  color: var(--scalar-background-1);
  border-radius: 2px;
}
</style>
