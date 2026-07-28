<script setup lang="ts">
import { ScalarIconCaretRight } from '@scalar/icons'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { collapseTrail, isEllipsis, type Crumb } from './helpers'

const { chain } = defineProps<{
  /** Ancestor tags from root to the section currently in view (inclusive). */
  chain: Crumb[]
}>()

const emit = defineEmits<{
  navigate: [id: string]
}>()

const navRef = ref<HTMLElement | null>(null)

/**
 * Whether the full trail is wider than the bar and needs its middle collapsed.
 * Measured from the DOM so we only truncate when there genuinely is not enough
 * room — a wide bar shows the whole hierarchy.
 */
const overflowing = ref(false)

/** The crumbs actually rendered: the full trail while it fits, collapsed once it does not. */
const displayCrumbs = computed(() =>
  overflowing.value ? collapseTrail(chain) : chain,
)

/** The last crumb is the section in view, so it is shown as plain text. */
const isCurrent = (index: number) => index === displayCrumbs.value.length - 1

/** Jump to an ancestor section when its crumb is clicked. */
const onCrumbClick = (id: string) => emit('navigate', id)

/**
 * Re-decide whether the trail fits. We optimistically render it in full, measure,
 * and only collapse the middle if it overflows. Resetting first lets a widening
 * bar re-expand a trail that was previously collapsed.
 */
const updateOverflow = async () => {
  overflowing.value = false
  await nextTick()

  const nav = navRef.value
  if (!nav) {
    return
  }

  // A `flex`/`overflow: visible` row does not report overflow via scrollWidth, so
  // measure the crumbs directly: their natural widths plus the gaps between them.
  const style = getComputedStyle(nav)
  const gap = Number.parseFloat(style.columnGap) || 0
  const available =
    nav.clientWidth -
    Number.parseFloat(style.paddingLeft) -
    Number.parseFloat(style.paddingRight)

  // `getBoundingClientRect` (not `offsetWidth`) so the SVG separators are counted too.
  const children = Array.from(nav.children)
  const needed =
    children.reduce(
      (total, child) => total + child.getBoundingClientRect().width,
      0,
    ) +
    gap * Math.max(0, children.length - 1)

  overflowing.value = needed > available + 1
}

let resizeObserver: ResizeObserver | null = null

// Re-measure when the bar (dis)appears or the layout width changes.
watch(
  navRef,
  (nav) => {
    resizeObserver?.disconnect()
    if (nav && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateOverflow())
      resizeObserver.observe(nav)
      updateOverflow()
    }
  },
  { immediate: true },
)

// Re-measure whenever the hierarchy behind the bar changes.
watch(() => chain, updateOverflow, { flush: 'post' })

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <!-- Only meaningful when a section is actually nested under a parent tag -->
  <nav
    v-if="chain.length >= 2"
    ref="navRef"
    aria-label="Breadcrumb"
    class="context-bar bg-b-1 text-c-2 sticky top-(--refs-header-height) z-10 flex items-center gap-1.5 border-b text-sm">
    <template
      v-for="(crumb, index) in displayCrumbs"
      :key="isEllipsis(crumb) ? `ellipsis-${index}` : crumb.id">
      <ScalarIconCaretRight
        v-if="index > 0"
        class="text-c-3 size-2.5 shrink-0"
        weight="bold" />

      <!-- Collapsed middle of a long trail -->
      <span
        v-if="isEllipsis(crumb)"
        class="text-c-3 shrink-0"
        :title="crumb.hiddenTitles.join(' › ')">
        …
      </span>

      <!-- Current section: plain text, not a link -->
      <span
        v-else-if="isCurrent(index)"
        aria-current="page"
        class="text-c-1 shrink-0 font-medium whitespace-nowrap">
        {{ crumb.title }}
      </span>

      <!-- Ancestor: click to jump to that section -->
      <button
        v-else
        class="hover:text-c-1 shrink-0 cursor-pointer whitespace-nowrap transition-colors"
        type="button"
        @click="onCrumbClick(crumb.id)">
        {{ crumb.title }}
      </button>
    </template>
  </nav>
</template>

<style scoped>
/*
 * Match the section content inset (0 60px) so crumbs line up under the section
 * headings, with generous vertical padding so the bar does not feel cramped.
 * The bar lives inside `.narrow-references-container`, so it shares the same
 * container query the sections use to drop their inset on narrow layouts.
 */
.context-bar {
  padding: 14px 60px;
}
@container narrow-references-container (max-width: 900px) {
  .context-bar {
    padding: 12px 24px;
  }
}
</style>
