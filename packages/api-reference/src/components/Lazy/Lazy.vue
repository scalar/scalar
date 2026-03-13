<script lang="ts" setup>
/**
 * Lazily renders content when the element is within the viewport overscan.
 * Uses a fixed-height placeholder so layout is stable while we block during render.
 *
 * When server-side rendering, content renders immediately.
 *
 * @link https://medium.com/js-dojo/lazy-rendering-in-vue-to-improve-performance-dcccd445d5f
 */

import { useIntersectionObserver } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  getLazyPlaceholderHeight,
  requestLazyRender,
  setLazyPlaceholderHeight,
  useLazyBus,
} from '@/helpers/lazy-bus'

const { id, expanded = false } = defineProps<{
  /** Identifier for this lazy section; used for scroll-to and bus registration. */
  id: string
  /** When true, render the slot so child Lazy placeholders mount (e.g. for navigation). */
  expanded?: boolean
}>()

/** Fixed height for all placeholders so we do not measure or jump. */
const PLACEHOLDER_HEIGHT_PX = 760

/** Overscan: render items within this many pixels above and below the viewport. */
const VIEWPORT_OVERSCAN_PX = 1200
const VIEWPORT_ROOT_MARGIN = `${VIEWPORT_OVERSCAN_PX}px 0px`

const { isReady } = useLazyBus(id)
const lazyContainerRef = ref<HTMLElement | null>(null)

const placeholderHeight = ref(
  getLazyPlaceholderHeight(id) ?? PLACEHOLDER_HEIGHT_PX,
)
let contentResizeObserver: ResizeObserver | null = null

/** Once ready we always show (no eviction). Otherwise show when expanded (e.g. so child Lazy placeholders mount). */
const shouldRender = computed(() => isReady.value || expanded)

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }

  if (!('IntersectionObserver' in window)) {
    requestLazyRender(id, true)
    return
  }

  useIntersectionObserver(
    lazyContainerRef,
    ([entry]) => {
      if (entry?.isIntersecting && !isReady.value) {
        requestLazyRender(id, true)
      }
    },
    { rootMargin: VIEWPORT_ROOT_MARGIN },
  )
})

/**
 * Capture content height right before we switch to placeholder (pre-flush so content
 * is still in the DOM). Ensures we never measure the container or leave the cache stale.
 */
watch(
  () => shouldRender.value,
  (rendered, wasRendered) => {
    if (wasRendered && !rendered && lazyContainerRef.value) {
      const h = lazyContainerRef.value.offsetHeight
      if (Number.isFinite(h) && h > 0) {
        placeholderHeight.value = h
        setLazyPlaceholderHeight(id, h)
      }
    }
  },
  { flush: 'pre' },
)

/** When content is visible, set up ResizeObserver and measure. */
watch(
  () => shouldRender.value,
  (rendered) => {
    if (!rendered) {
      contentResizeObserver?.disconnect()
      contentResizeObserver = null
      return
    }
    void nextTick(() => {
      if (!lazyContainerRef.value || typeof ResizeObserver === 'undefined') {
        return
      }
      if (!contentResizeObserver) {
        contentResizeObserver = new ResizeObserver(() => {
          if (!lazyContainerRef.value) {
            return
          }
          const h = lazyContainerRef.value.offsetHeight
          if (Number.isFinite(h) && h > 0) {
            placeholderHeight.value = h
            setLazyPlaceholderHeight(id, h)
          }
        })
      }
      contentResizeObserver.observe(lazyContainerRef.value)
      const h = lazyContainerRef.value.offsetHeight
      if (Number.isFinite(h) && h > 0) {
        placeholderHeight.value = h
        setLazyPlaceholderHeight(id, h)
      }
    })
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  contentResizeObserver?.disconnect()
})
</script>
<template>
  <div
    :id="!shouldRender ? id : undefined"
    ref="lazyContainerRef"
    :data-placeholder="!shouldRender"
    data-testid="lazy-container"
    :style="{ height: shouldRender ? undefined : `${placeholderHeight}px` }">
    <slot v-if="shouldRender" />
  </div>
</template>
