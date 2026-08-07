<script setup lang="ts">
import { ScalarIconCaretRight } from '@scalar/icons'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  collapseTrail,
  isEllipsis,
  type Crumb,
  type EllipsisCrumb,
} from './helpers'

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

/** Whether the bar has reached its sticky offset. */
const isStuck = ref(false)

/** The reserved bar only becomes an accessible landmark once a section is pinned beneath it. */
const hasBreadcrumb = computed(() => chain.length >= 1)

/** The crumbs actually rendered: the full trail while it fits, collapsed once it does not. */
const displayCrumbs = computed<(Crumb | EllipsisCrumb)[]>(() => {
  if (!hasBreadcrumb.value) {
    return []
  }

  return overflowing.value ? collapseTrail(chain) : chain
})

/** The last crumb is the section in view, so it is shown as plain text. */
const isCurrent = (index: number) => index === displayCrumbs.value.length - 1

/** Jump to an ancestor section when its crumb is clicked. */
const onCrumbClick = (id: string) => emit('navigate', id)

/**
 * Measure the crumbs directly and flag overflow. A `flex`/`overflow: visible` row
 * does not report overflow via `scrollWidth`, so we sum the natural crumb widths
 * (`getBoundingClientRect`, so the SVG separators count too) plus the gaps between them.
 */
const measureOverflow = () => {
  const nav = navRef.value
  if (!nav) {
    return
  }

  const style = getComputedStyle(nav)
  const gap = Number.parseFloat(style.columnGap) || 0
  const available =
    nav.clientWidth -
    Number.parseFloat(style.paddingLeft) -
    Number.parseFloat(style.paddingRight)

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
let frame: number | null = null
let stickyFrame: number | null = null

/**
 * Re-decide whether the trail fits, coalescing resize bursts and chain changes into a
 * single measurement per frame so we do not thrash layout while the viewport is dragged.
 * We optimistically reset to the full trail, wait for that render, then measure — which
 * lets a widening bar re-expand a trail that was previously collapsed.
 */
const scheduleOverflowCheck = () => {
  overflowing.value = false

  if (frame !== null) {
    return
  }

  if (typeof requestAnimationFrame === 'undefined') {
    // No rAF (SSR/tests): measure directly once the reset render has flushed.
    void nextTick(measureOverflow)
    return
  }

  frame = requestAnimationFrame(() => {
    frame = null
    void nextTick(measureOverflow)
  })
}

/** Swap the separator edge when the bar pins to its sticky offset. */
const updateStickyState = () => {
  const nav = navRef.value
  if (!nav) {
    return
  }

  const stickyTop = Number.parseFloat(getComputedStyle(nav).top) || 0
  isStuck.value = nav.getBoundingClientRect().top <= stickyTop
}

const scheduleStickyCheck = () => {
  if (stickyFrame !== null) {
    return
  }

  if (typeof requestAnimationFrame === 'undefined') {
    updateStickyState()
    return
  }

  stickyFrame = requestAnimationFrame(() => {
    stickyFrame = null
    updateStickyState()
  })
}

// Re-measure when the bar (dis)appears or the layout width changes.
watch(
  navRef,
  (nav) => {
    resizeObserver?.disconnect()
    if (nav && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        scheduleOverflowCheck()
        scheduleStickyCheck()
      })
      resizeObserver.observe(nav)
      scheduleOverflowCheck()
      scheduleStickyCheck()
    }
  },
  { immediate: true },
)

// Re-measure whenever the hierarchy behind the bar changes.
watch(() => chain, scheduleOverflowCheck, { flush: 'post' })

onMounted(() => {
  window.addEventListener('scroll', scheduleStickyCheck, {
    capture: true,
    passive: true,
  })
  window.addEventListener('resize', scheduleStickyCheck, { passive: true })
  scheduleStickyCheck()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('scroll', scheduleStickyCheck, true)
  window.removeEventListener('resize', scheduleStickyCheck)
  if (frame !== null && typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(frame)
  }
  if (stickyFrame !== null && typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(stickyFrame)
  }
})
</script>

<template>
  <nav
    ref="navRef"
    :aria-hidden="!hasBreadcrumb"
    :aria-label="hasBreadcrumb ? 'Breadcrumb' : undefined"
    class="context-bar bg-b-1.5 text-c-2 sticky top-(--refs-header-height) z-10 flex items-center gap-1.5 text-sm"
    :data-stuck="isStuck || undefined">
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
 * headings. A fixed height keeps the content below from moving when the active
 * hierarchy changes and the breadcrumbs appear.
 * The bar lives inside `.narrow-references-container`, so it shares the same
 * container query the sections use to drop their inset on narrow layouts.
 */
.context-bar {
  height: 48px;
  padding-inline: 60px;
  box-shadow: inset 0 var(--scalar-border-width) 0 var(--scalar-border-color);
}
.context-bar[data-stuck] {
  box-shadow: inset 0 calc(var(--scalar-border-width) * -1) 0
    var(--scalar-border-color);
}
@container narrow-references-container (max-width: 900px) {
  .context-bar {
    padding-inline: 24px;
  }
}
</style>
